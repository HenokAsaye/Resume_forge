import type { Metadata } from "next"
import { VersionsPanel } from "./versions-panel"

export const metadata: Metadata = {
  title: "Versions",
}

export default async function VersionsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="mx-auto w-full max-w-4xl">
      <VersionsPanel resumeId={id} />
    </div>
  )
}
