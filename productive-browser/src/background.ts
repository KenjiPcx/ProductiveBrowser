import {
  extractImageDetails,
  updateUserSummary,
  type ImageDetails
} from "./agent"

console.log(
  "Live now; make now always the most precious time. Now will never come again."
)
interface CategoryTime {
  [category: string]: number
}

let startTime: number | null = null
let currentCategory: string | null = null
let categoryTimes: CategoryTime = {}
let debounceTimer: ReturnType<typeof setTimeout> | undefined
let currentProductive: boolean | null = null
let currentVideoDuration: number | null = null

chrome.storage.local.get(["categoryTimes"], (result) => {
  categoryTimes = result.categoryTimes || {}
})

const captureScreenshot = (windowId: number) => {
  chrome.tabs.captureVisibleTab(windowId, { format: "png" }, (dataUrl) => {
    processScreenshot(dataUrl)
  })
}

const debouncedCaptureScreenshot = (windowId: number) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => captureScreenshot(windowId), 5000)
}

const processScreenshot = (imageUrl: string) => {
  chrome.storage.local.get(
    [
      "mistralApiKey",
      "userInfo",
      "customCategories",
      "existingTags",
      "additionalInstructions",
      "timeSaved",
      "winsOfTheDay",
      "historyData" // Add this line
    ],
    (result) => {
      const {
        mistralApiKey,
        userInfo,
        userSummary,
        customCategories,
        existingTags,
        additionalInstructions,
        timeSaved,
        winsOfTheDay,
        historyData = [] // Add this line with a default empty array
      } = result
      if (!mistralApiKey) {
        console.error("Please set your API key in the extension settings.")
        return
      }
      extractImageDetails(
        mistralApiKey,
        userInfo,
        customCategories,
        existingTags,
        imageUrl,
        additionalInstructions
      ).then((imageDetails) => {
        console.log(
          `Extracted image details: ${JSON.stringify(imageDetails, null, 2)}`
        )
        // Add new image details to history
        const updatedHistory = [
          ...historyData,
          { ...imageDetails, timestamp: new Date().toISOString() }
        ].slice(-50) // Keep only the last 50 entries

        // Save updated history to storage
        chrome.storage.local.set({ historyData: updatedHistory })

        // Check if previous category was unproductive and if it was a video that had a duration
        handleTimeSaved(
          timeSaved || 0,
          imageDetails.productive,
          imageDetails.video_duration
        )
        // Update category times
        updateCategoryTimes(imageDetails.tag, categoryTimes)
        // Handle unproductive pages
        if (!imageDetails.productive) {
          handleUnproductivePage(imageDetails.warningMessage)
        }
        // Update user summary
        handleUpdateUserSummary(
          mistralApiKey,
          userSummary,
          winsOfTheDay,
          imageDetails
        )
      })
    }
  )
}

const handleTimeSaved = (
  timeSaved: number,
  productive: boolean,
  duration: string | null
) => {
  if (!currentProductive && currentVideoDuration) {
    timeSaved += currentVideoDuration
    chrome.storage.local.set({ timeSaved })
  }
  currentProductive = productive
  // Parse duration string to minutes
  console.log(`Duration string: ${duration}`)
  currentVideoDuration = parseDurationToMinutes(duration)
  console.log(`New video duration: ${currentVideoDuration}`)
}

// Updated function to parse duration
const parseDurationToMinutes = (duration: string): number => {
  if (!duration) return 0
  // Handle the case of "current / total" format
  if (duration.includes("/")) {
    duration = duration.split("/")[1].trim()
  }

  const parts = duration.split(":").map(Number)
  if (parts.length === 3) {
    // Format: hh:mm:ss
    return parts[0] * 60 + parts[1] + parts[2] / 60
  } else if (parts.length === 2) {
    // Format: mm:ss
    return parts[0] + parts[1] / 60
  }
  return 0 // Return 0 if the format is invalid
}

const updateCategoryTimes = (category: string, categoryTimes: CategoryTime) => {
  // Update time tracking
  const currentTime = Date.now()
  console.log(`Current time: ${currentTime}`)
  if (startTime !== null && currentCategory !== null) {
    const elapsedTime = (currentTime - startTime) / 60000 // convert to minutes
    console.log(`Elapsed time: ${elapsedTime} minutes`)
    categoryTimes[currentCategory] =
      (categoryTimes[currentCategory] || 0) + elapsedTime
    console.log(`Category times: ${JSON.stringify(categoryTimes, null, 2)}`)
  }
  startTime = currentTime
  console.log(`Start time: ${startTime}`)
  currentCategory = category
  console.log(`Current category: ${currentCategory}`)
  chrome.storage.local.set({ categoryTimes })
}

const handleUnproductivePage = (warningMessage: string) => {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {
      action: "showSpoilerModal",
      text: warningMessage
    })
  })
}

const handleUpdateUserSummary = (
  mistralApiKey: string,
  previousStatus: string,
  winsOfTheDay: string[],
  newActivity: ImageDetails
) => {
  updateUserSummary(
    mistralApiKey,
    previousStatus,
    winsOfTheDay,
    newActivity
  ).then(({ summary, winsOfTheDay }) => {
    chrome.storage.local.set({ userSummary: summary, winsOfTheDay })
  })
}

chrome.tabs.onActivated.addListener((activeInfo) => {
  console.log("Tab activated, scheduling screenshot")
  console.log(activeInfo)

  debouncedCaptureScreenshot(activeInfo.windowId)
})

// Add listener for tab updates (including refreshes)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.active) {
    console.log("Tab updated or refreshed, scheduling screenshot")
    debouncedCaptureScreenshot(tab.windowId)
  }
})

// Add listener for navigation events
chrome.webNavigation.onCompleted.addListener((details) => {
  if (details && details.frameId === 0) {
    // Main frame only
    chrome.tabs.get(details.tabId, (tab) => {
      if (tab.active) {
        console.log("Navigation completed, scheduling screenshot")
        debouncedCaptureScreenshot(tab.windowId)
      }
    })
  }
})

// Function to reset daily data
const resetDailyData = () => {
  chrome.storage.local.set(
    {
      categoryTimes: {},
      timeSaved: 0,
      winsOfTheDay: [],
      userSummary: ""
    },
    () => {
      console.log("Daily data reset completed")
    }
  )
}

// Function to create daily alarm
const createDailyAlarm = () => {
  chrome.alarms.create("dailyReset", {
    when: getNextMidnight(),
    periodInMinutes: 24 * 60 // 24 hours
  })
}

// Function to get next midnight timestamp
const getNextMidnight = (): number => {
  const now = new Date()
  const midnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1
  )
  return midnight.getTime()
}

// Listen for alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "dailyReset") {
    resetDailyData()
  }
})

// Create alarm when extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  createDailyAlarm()
})

// Ensure alarm exists when extension starts
chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.get("dailyReset", (alarm) => {
    if (!alarm) {
      createDailyAlarm()
    }
  })
})

export {}
