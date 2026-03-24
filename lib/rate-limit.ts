import { prisma } from "@/lib/prisma"

export class RateLimitExceededError extends Error {
  retryAfterSeconds: number

  constructor(message: string, retryAfterSeconds: number) {
    super(message)
    this.name = "RateLimitExceededError"
    this.retryAfterSeconds = retryAfterSeconds
  }
}

function getWindowStart(windowMs: number, now = Date.now()) {
  return new Date(Math.floor(now / windowMs) * windowMs)
}

export async function enforceRateLimit(input: {
  scope: string
  key: string
  limit: number
  windowMs: number
  message?: string
}) {
  const windowStart = getWindowStart(input.windowMs)
  const bucket = await prisma.rateLimitBucket.upsert({
    where: {
      scope_key_windowStart: {
        scope: input.scope,
        key: input.key,
        windowStart,
      },
    },
    create: {
      scope: input.scope,
      key: input.key,
      windowStart,
      count: 1,
    },
    update: {
      count: {
        increment: 1,
      },
    },
    select: {
      count: true,
    },
  })

  if (bucket.count > input.limit) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((windowStart.getTime() + input.windowMs - Date.now()) / 1000)
    )

    throw new RateLimitExceededError(
      input.message ?? "Too many requests. Please try again later.",
      retryAfterSeconds
    )
  }
}
