import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useState } from "react"

interface AITextModalProps {
  aiText: string
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

export function AiTextModal({ aiText, isOpen, setIsOpen }: AITextModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Message</DialogTitle>
        </DialogHeader>
        <ScrollArea className="mt-4 h-[200px] w-full rounded-md border p-4">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{aiText}</p>
        </ScrollArea>
        <div className="mt-4 flex justify-end">
          <Button onClick={() => setIsOpen(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
