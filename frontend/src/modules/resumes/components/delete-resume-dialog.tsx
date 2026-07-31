"use client"

import { useState, type ReactElement } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { ApiError } from "@/shared/api/client"
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog"
import { useDeleteResume } from "../api/use-resumes"

export function DeleteResumeDialog({
  id,
  name,
  trigger,
  redirectTo,
}: {
  id: string
  name: string
  trigger: ReactElement
  redirectTo?: string
}) {
  const router = useRouter()
  const remove = useDeleteResume()
  const [open, setOpen] = useState(false)

  async function onConfirm() {
    try {
      await remove.mutateAsync(id)
      setOpen(false)
      toast.success(`Deleted ${name}`)
      if (redirectTo) {
        router.push(redirectTo)
      }
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.detail : "Could not delete this résumé"
      )
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!remove.isPending) setOpen(next)
      }}
    >
      <DialogTrigger render={trigger} />

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {name}?</DialogTitle>
          <DialogDescription>
            The stored file and everything parsed from it are removed. This cannot
            be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            variant="ghost"
            disabled={remove.isPending}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={remove.isPending}
            onClick={onConfirm}
          >
            {remove.isPending && <Loader2 className="animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
