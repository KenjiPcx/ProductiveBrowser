import type { PlasmoCSConfig } from "plasmo"
import { useEffect, useState } from "react"

import { AiTextModal } from "~components/ai-text-modal"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: true
}

const Modal = () => {
  useEffect(() => {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === "showSpoilerModal") {
        alert(message.text) // Just use this instead
      }
    })
  }, [])

  return <div></div>
}

export default Modal

console.log("Content script loaded")
