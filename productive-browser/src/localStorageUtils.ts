export const getApiKeys = () =>
  new Promise<{ mistralApiKey: string; tavilyApiKey: string }>((resolve) => {
    chrome.storage.local.get(["mistralApiKey", "tavilyApiKey"], resolve)
  })

export const getAllStates = () =>
  new Promise<{
    mistralApiKey: string
    tavilyApiKey: string
    userInfo: string
    customCategories: string[]
    existingTags: string[]
    categoryTimes: { [key: string]: number }
    timeSaved: number
    winsOfTheDay: number
  }>((resolve) => {
    chrome.storage.local.get(
      [
        "mistralApiKey",
        "tavilyApiKey",
        "userInfo",
        "customCategories",
        "existingTags",
        "categoryTimes",
        "timeSaved",
        "winsOfTheDay"
      ],
      resolve
    )
  })
