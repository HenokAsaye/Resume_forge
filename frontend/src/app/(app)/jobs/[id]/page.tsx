import type { Metadata } from "next"
import { JobDetail } from "@/modules/jobs"

export const metadata: Metadata = {
  title: "Job",
}

export default async function JobPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="mx-auto w-full max-w-4xl">
      <JobDetail id={id} />
    </div>
  )
}
