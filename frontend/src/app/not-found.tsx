import Link from "next/link"
import { Button } from "@/shared/ui/button"

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="text-muted-foreground max-w-md text-sm">
        That page does not exist or has been moved.
      </p>
      <Button render={<Link href="/" />}>Back home</Button>
    </main>
  )
}
