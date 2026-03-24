import { headers } from "next/headers"

const IP_HEADER_CANDIDATES = [
  "fly-client-ip",
  "cf-connecting-ip",
  "x-real-ip",
  "x-forwarded-for",
]

export async function getRequestIp(): Promise<string> {
  const headerStore = await headers()

  for (const headerName of IP_HEADER_CANDIDATES) {
    const value = headerStore.get(headerName)
    if (!value) {
      continue
    }

    if (headerName === "x-forwarded-for") {
      const forwardedIp = value.split(",")[0]?.trim()
      if (forwardedIp) {
        return forwardedIp
      }
      continue
    }

    return value
  }

  return "unknown"
}
