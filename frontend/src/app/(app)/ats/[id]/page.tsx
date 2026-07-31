import type { Metadata } from "next"
import { ReportPanel } from "./report-panel"

export const metadata: Metadata = {
  title: "ATS report",
}

export default async function AtsReportPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="mx-auto w-full max-w-4xl">
      <ReportPanel id={id} />
    </div>
  )
}
