"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ApiError } from "@/shared/api/client"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { Skeleton } from "@/shared/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"
import {
  ChangeList,
  ExportButtons,
  readDiff,
  useResumeVersion,
} from "@/modules/optimization"
import { ParsedResume, resumeDocumentSchema } from "@/modules/resumes"

export function VersionPanel({
  resumeId,
  versionId,
}: {
  resumeId: string
  versionId: string
}) {
  const version = useResumeVersion(resumeId, versionId)

  if (version.isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-px w-full" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    )
  }

  if (version.error) {
    const notFound = version.error instanceof ApiError && version.error.isNotFound

    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>
            {notFound
              ? "This version no longer exists."
              : version.error instanceof Error
                ? version.error.message
                : "Could not load this version"}
          </AlertDescription>
        </Alert>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href={`/resumes/${resumeId}/versions`} />}
        >
          <ArrowLeft />
          Back to versions
        </Button>
      </div>
    )
  }

  const diff = readDiff(version.data.diff_json)
  const document = resumeDocumentSchema.safeParse(version.data.optimized_json)

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Link
          href={`/resumes/${resumeId}/versions`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 font-mono text-xs tracking-widest uppercase transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Versions
        </Link>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">
            Version {version.data.version_number}
          </h1>
          <ExportButtons
            resumeId={resumeId}
            versionNumber={version.data.version_number}
          />
        </div>
      </div>

      <Tabs defaultValue="changes">
        <TabsList>
          <TabsTrigger value="changes">Changes</TabsTrigger>
          <TabsTrigger value="resume">Optimized résumé</TabsTrigger>
        </TabsList>

        <TabsContent value="changes" className="pt-6">
          <ChangeList changes={diff?.sections ?? []} />
        </TabsContent>

        <TabsContent value="resume" className="pt-6">
          {document.success ? (
            <ParsedResume document={document.data} />
          ) : (
            <Alert variant="destructive">
              <AlertDescription>
                This version was stored in a shape the renderer does not
                recognise. Export it to read the full document.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
