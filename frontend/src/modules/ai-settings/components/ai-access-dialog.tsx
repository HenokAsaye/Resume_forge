"use client"

import { useState, useSyncExternalStore } from "react"
import { Eye, EyeOff, KeyRound, Server, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import {
  clearAICredentials,
  getAICredentialsSnapshot,
  parseAICredentials,
  saveAICredentials,
  subscribeToAICredentials,
  type AIProvider,
} from "@/shared/lib/ai-credentials"
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { cn } from "@/shared/lib/utils"

const PROVIDERS: {
  value: AIProvider
  label: string
  description: string
}[] = [
  {
    value: "gemini",
    label: "Gemini",
    description: "Google AI Studio key",
  },
  {
    value: "openai",
    label: "OpenAI",
    description: "OpenAI platform key",
  },
]

function providerForKey(
  apiKey: string,
  fallback: AIProvider
): AIProvider {
  const normalized = apiKey.trim()
  if (normalized.startsWith("sk-")) {
    return "openai"
  }
  if (normalized.startsWith("AIza")) {
    return "gemini"
  }
  return fallback
}

export function AIAccessDialog() {
  const snapshot = useSyncExternalStore(
    subscribeToAICredentials,
    getAICredentialsSnapshot,
    () => ""
  )
  const credentials = parseAICredentials(snapshot)

  const [open, setOpen] = useState(false)
  const [provider, setProvider] = useState<AIProvider>("gemini")
  const [apiKey, setApiKey] = useState("")
  const [showKey, setShowKey] = useState(false)

  function onOpenChange(next: boolean) {
    if (next) {
      setProvider(credentials?.provider ?? "gemini")
      setApiKey(credentials?.apiKey ?? "")
      setShowKey(false)
    }
    setOpen(next)
  }

  function onSave() {
    if (!apiKey.trim()) {
      toast.error("Enter an API key or use the server fallback")
      return
    }

    const detectedProvider = providerForKey(apiKey, provider)
    saveAICredentials({ provider: detectedProvider, apiKey })
    setOpen(false)
    toast.success(
      `${detectedProvider === "gemini" ? "Gemini" : "OpenAI"} key ready`
    )
  }

  function onUseServer() {
    clearAICredentials()
    setApiKey("")
    setOpen(false)
    toast.success("Using server-managed AI")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="gap-2 px-2.5 sm:px-3"
            aria-label={
              credentials
                ? `Personal ${credentials.provider} key configured`
                : "Configure AI access"
            }
          />
        }
      >
        {credentials ? (
          <ShieldCheck className="text-success" />
        ) : (
          <KeyRound />
        )}
        <span className="hidden sm:inline">
          {credentials
            ? `${credentials.provider === "gemini" ? "Gemini" : "OpenAI"} key`
            : "AI access"}
        </span>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="bg-primary/10 text-primary mb-1 flex size-9 items-center justify-center rounded-xl">
            <KeyRound className="size-4" />
          </div>
          <DialogTitle>Choose how AI runs</DialogTitle>
          <DialogDescription>
            Your personal key stays in this browser tab and is sent only for
            parsing, analysis, optimization, and generation requests.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2" role="radiogroup">
            {PROVIDERS.map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={provider === option.value}
                onClick={() => setProvider(option.value)}
                className={cn(
                  "rounded-xl border p-3 text-left transition-colors",
                  provider === option.value
                    ? "border-primary bg-primary/5 ring-primary/20 ring-2"
                    : "border-border hover:bg-muted"
                )}
              >
                <span className="block text-sm font-medium">{option.label}</span>
                <span className="text-muted-foreground mt-0.5 block text-xs">
                  {option.description}
                </span>
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="personal-ai-key">
              {provider === "gemini" ? "Gemini" : "OpenAI"} API key
            </Label>
            <div className="relative">
              <Input
                id="personal-ai-key"
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(event) => {
                  const value = event.target.value
                  setApiKey(value)
                  setProvider((current) => providerForKey(value, current))
                }}
                placeholder={provider === "gemini" ? "AIza..." : "sk-..."}
                autoComplete="off"
                spellCheck={false}
                className="h-10 pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute top-1 right-1"
                onClick={() => setShowKey((visible) => !visible)}
                aria-label={showKey ? "Hide API key" : "Show API key"}
              >
                {showKey ? <EyeOff /> : <Eye />}
              </Button>
            </div>
          </div>

          <div className="bg-muted/70 flex gap-3 rounded-xl p-3">
            <Server className="text-muted-foreground mt-0.5 size-4 shrink-0" />
            <p className="text-muted-foreground text-xs leading-relaxed">
              With no personal key, the server uses Gemini first, then OpenAI.
              If neither is configured, the AI action returns a setup error.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onUseServer}>
            Use server fallback
          </Button>
          <Button onClick={onSave}>
            <ShieldCheck />
            Use personal key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
