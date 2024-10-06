import type { PlasmoCSConfig } from "plasmo"
import { useEffect, useState } from "react"

import { AiTextModal } from "~components/ai-text-modal"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: true
}

const Modal = () => {
  const [isOpen, setIsOpen] = useState(true)
  const [aiText, setAiText] = useState("heeki")

  useEffect(() => {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === "showSpoilerModal") {
        console.log(message.text)
        setAiText(message.text)
        setIsOpen(true)
        alert(message.text)
      }
    })
  }, [])

  return <AiTextModal aiText={aiText} isOpen={isOpen} setIsOpen={setIsOpen} />
}

export default Modal

console.log("Content script loaded")
