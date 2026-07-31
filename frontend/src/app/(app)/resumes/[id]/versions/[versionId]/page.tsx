import type { Metadata } from "next"
import { VersionPanel } from "./version-panel"

export const metadata: Metadata = {
  title: "Version",
}

export default async function VersionPage({
  params,
}: {
  params: Promise<{ id: string; versionId: string }>
}) {
  const { id, versionId } = await params

  return (
    <div className="mx-auto w-full max-w-4xl">
      <VersionPanel resumeId={id} versionId={versionId} />
    </div>
  )
}
