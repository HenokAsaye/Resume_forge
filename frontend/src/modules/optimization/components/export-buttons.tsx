"use client"

import { Download } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { exportUrl } from "../api/use-optimization"
import { exportFormats } from "../schemas/version.schema"

export function ExportButtons({
  resumeId,
  versionNumber,
}: {
  resumeId: string
  versionNumber?: number
}) {
  return (
    <div className="flex items-center gap-2">
      {exportFormats.map((format) => (
        <Button
          key={format}
          variant="outline"
          nativeButton={false}
          render={
            <a href={exportUrl(resumeId, format, versionNumber)} download />
          }
        >
          <Download />
          {format.toUpperCase()}
        </Button>
      ))}
    </div>
  )
}
