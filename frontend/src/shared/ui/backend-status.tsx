"use client"

import { usePing } from "@/shared/hooks/use-ping"
import { cn } from "@/shared/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip"

export function BackendStatus() {
  const { data, isPending, isError } = usePing()

  const label = isPending
    ? "Checking API status"
    : isError
      ? "API unreachable"
      : `API ${data?.status ?? "ok"}`

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span className="flex items-center gap-2" aria-live="polite">
            <span
              className={cn(
                "size-2 rounded-full",
                isPending && "bg-muted-foreground animate-pulse",
                isError && "bg-destructive",
                !isPending && !isError && "bg-success"
              )}
            />
            <span className="sr-only sm:not-sr-only">{label}</span>
          </span>
        }
      />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
