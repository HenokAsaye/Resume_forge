import type { Metadata } from "next"
import { ResumeDetail } from "@/modules/resumes"

export const metadata: Metadata = {
  title: "Résumé",
}

export default async function ResumePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="mx-auto w-full max-w-4xl">
      <ResumeDetail id={id} />
    </div>
  )
}
