import "server-only"
import {z} from "zod"


const envSchema = z.object({
    API_URL: z
      .url({
        protocol: /^https?$/,
        error: "API_URL is missing or invalid — it must look like http://localhost:8000",
      })
      
      .transform((url) => url.replace(/\/+$/, "")),
  })

  const parsed=envSchema.safeParse({
    API_URL:process.env.API_URL,
  })
  if (!parsed.success) {
    throw new Error(
      `Invalid environment variables:\n${z.prettifyError(parsed.error)}\n\n` +
        `Fix: copy .env.example to .env.local and fill it in, then restart the dev server.`
    )
  }

  export const env=parsed.data;