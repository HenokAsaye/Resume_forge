export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div
        role="status"
        aria-label="Loading"
        className="border-muted border-t-primary size-8 animate-spin rounded-full border-2"
      />
    </div>
  )
}
