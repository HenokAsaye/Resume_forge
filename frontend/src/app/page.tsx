"use client"

import { usePing } from "@/hooks/use-ping"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, CheckCircle2, XCircle, Loader2 } from "lucide-react"

export default function Home() {
  const { data, isLoading, error, refetch, isFetching } = usePing()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <main className="flex flex-col items-center gap-8 max-w-md w-full">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">ResumeAI</h1>
          <p className="text-muted-foreground">
            AI-powered resume optimization to land your dream job
          </p>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : error ? (
                <XCircle className="h-4 w-4 text-destructive" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              )}
              Backend Connection
            </CardTitle>
            <CardDescription>
              Checking connection to the FastAPI backend
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-sm">
              {isLoading
                ? "Connecting..."
                : error
                  ? "Could not reach backend server"
                  : `${data?.status} - ${data?.service}`}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isFetching ? "animate-spin" : ""}`} />
              Retry
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
