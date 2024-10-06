import { Mistral } from "@mistralai/mistralai"

export type ImageDetails = {
  activity: string
  productive: boolean
  score: number
  reason: string
  tag: string
  video_duration?: string
  video_title?: string
  warningMessage?: string
}

export const extractImageDetails = async (
  mistralApiKey: string,
  userInfo: string,
  customCategories: string[],
  existingTags: string[],
  imageUrl: string,
  additionalInstructions: string
): Promise<ImageDetails> => {
  const client = new Mistral({ apiKey: mistralApiKey })

  const chatResponse = await client.chat.complete({
    model: "pixtral-12b",
    responseFormat: { type: "json_object" },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `You are given a screenshot of the user's browser. Guess what the user is doing, decide if this is productive or not, rate it with a score from 1 to 5 and your rationale, tag the activity with an appropriate tag. If the user is watching a video, note the total duration and the title of the video.
            User information : ${userInfo || "None"}
            Classification : ${
              !customCategories || customCategories.length === 0
                ? "None, " +
                  (existingTags.length > 0
                    ? "try using one of these existing tags : [" +
                      existingTags.join(", ") +
                      "] or "
                    : "") +
                  "make up an appropriate tag"
                : "Use only these tags : " + customCategories.join(", ")
            }
            
            Return a JSON object with the following structure:
            {
              "activity": string, what the user is doing,
              "productive": boolean,
              "score": number from 1 to 5,
              "reason": string,
              "tag": string,
              "video_duration": optional string if user is watching a video. Look for a video progress bar with a timestamp like "0:00 / 10:30" or "0:00 / 01:10:40". Extract only the total duration (e.g., "10:30" and "01:10:40"),
              "video_title": optional string if user is watching a video,
              "warningMessage": optional motivational wake up message to get the user back on track instead of wasting time, make it fun, for example, point out the clickbaity title and remind me that I have fallen into the trap
            } 
            Don't include optional fields if they have invalid values.
            
            Example motivational message:
            "Hey there! Looks like you're getting distracted. Is "Top 10 ways to get rich really worth watching? Its obvious clickbait. Let's get back on track and watch something more productive!"

            Additional instructions: ${additionalInstructions || "None"}
            `
          },
          {
            type: "image_url",
            imageUrl: imageUrl
          }
        ]
      }
    ]
  })

  const rawResponse = chatResponse.choices[0].message.content
  const parsedResponse = JSON.parse(rawResponse)
  return parsedResponse as ImageDetails
}

type UserSummary = {
  summary: string
  winsOfTheDay: string[]
}

export const updateUserSummary = async (
  mistralApiKey: string,
  previousStatus: string,
  previousWinsOfTheDay: string[],
  newActivity: ImageDetails
): Promise<UserSummary> => {
  const client = new Mistral({ apiKey: mistralApiKey })

  const chatResponse = await client.chat.complete({
    model: "mistral-large-latest",
    responseFormat: { type: "json_object" },
    messages: [
      {
        role: "user",
        content: `You are an AI assistant that highlights a user's productivity. Given a user's new activity and their current status, update their browsing summary and wins of the day.

        ---
        User's previous status: ${previousStatus}
        User's previous wins of the day: ${previousWinsOfTheDay}
        ---
        User's new activity: ${JSON.stringify(newActivity, null, 2)}
        ---

        Provide an updated summary of the user's browsing status and a list of their wins for the day. Focus on valuable things they've done, like learning something new or doing something useful. Keep the tone encouraging and motivational.

        Return a JSON object with the following structure:
        {
          "summary": string (1-2 sentences summarizing the user's browsing status so far),
          "winsOfTheDay": array of short strings (each short string less than 10 words that represents a win or valuable activity, we only want a max of 3 wins)
        }`
      }
    ]
  })

  const rawResponse = chatResponse.choices[0].message.content
  return JSON.parse(rawResponse) as UserSummary
}
