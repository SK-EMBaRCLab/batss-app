import { type ReactElement, useRef } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

/**
 * Asks before deleting runs. Deleting only changes the open design, so
 * closing it without saving keeps them, and the message says so.
 */
export function ConfirmDeleteRuns({
  count,
  open,
  onOpenChange,
  onConfirm
}: {
  count: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}): ReactElement {
  // Cancel has focus first, so Enter doesn't delete by accident
  const cancelButton = useRef<HTMLButtonElement>(null)
  const what = count === 1 ? 'this run' : `these ${count} runs`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent initialFocus={cancelButton} showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Delete {what}?</DialogTitle>
          <DialogDescription>
            {count === 1 ? "It's" : "They're"} removed from the design when you save. Until then,
            closing the design without saving keeps {count === 1 ? 'it' : 'them'}.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" ref={cancelButton} />}>Cancel</DialogClose>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
