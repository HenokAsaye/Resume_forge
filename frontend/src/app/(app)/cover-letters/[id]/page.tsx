import type { Metadata } from "next"
import { LetterPanel } from "./letter-panel"

export const metadata: Metadata = {
  title: "Cover letter",
}

export default async function CoverLetterPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="mx-auto w-full max-w-3xl">
      <LetterPanel id={id} />
    </div>
  )
}
