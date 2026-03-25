const SMSMODE_API_URL = "https://rest.smsmode.com/sms/v1/messages"

export class SmsConfigurationError extends Error {
  constructor(
    message = "Service SMS non configure. Veuillez configurer SMSMODE_API_KEY.",
  ) {
    super(message)
    this.name = "SmsConfigurationError"
  }
}

export class SmsProviderError extends Error {
  statusCode: number
  errorText: string

  constructor(statusCode: number, errorText: string) {
    super(`Erreur envoi SMS: ${statusCode}`)
    this.name = "SmsProviderError"
    this.statusCode = statusCode
    this.errorText = errorText
  }
}

export function isSmsConfigurationError(
  error: unknown,
): error is SmsConfigurationError {
  return error instanceof SmsConfigurationError
}

let hasReportedMissingSmsConfig = false

function getSmsApiKeyOrThrow(): string {
  const apiKey = process.env.SMSMODE_API_KEY
  if (apiKey) return apiKey

  if (process.env.NODE_ENV === "production" && !hasReportedMissingSmsConfig) {
    console.warn("SMSMODE_API_KEY non configuree en production")
    hasReportedMissingSmsConfig = true
  }

  throw new SmsConfigurationError()
}

function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/[\s.\-()]/g, "")
  let normalized: string
  if (cleaned.startsWith("+")) normalized = cleaned.slice(1)
  else if (cleaned.startsWith("00")) normalized = cleaned.slice(2)
  else if (cleaned.startsWith("0")) normalized = `33${cleaned.slice(1)}`
  else normalized = cleaned

  const digits = normalized.replace(/\D/g, "")
  if (digits.length < 10 || digits.length > 15) {
    throw new Error(
      `Numero de telephone invalide (${digits.length} chiffres, attendu entre 10 et 15): ${phone}`,
    )
  }

  return normalized
}

export async function sendSms(params: {
  to: string
  message: string
  refClient?: string
  callbackUrlStatus?: string
}): Promise<{ providerMessageId: string | null; accepted: boolean }> {
  const apiKey = getSmsApiKeyOrThrow()

  const to = formatPhoneNumber(params.to)

  const response = await fetch(SMSMODE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Api-Key": apiKey,
    },
    body: JSON.stringify({
      recipient: { to },
      body: { text: params.message },
      ...(params.refClient ? { refClient: params.refClient } : {}),
      ...(params.callbackUrlStatus
        ? { callbackUrlStatus: params.callbackUrlStatus }
        : {}),
    }),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error")
    throw new SmsProviderError(response.status, errorText)
  }

  let providerMessageId: string | null = null
  try {
    const payload = await response.json()
    providerMessageId =
      payload?.messageId ??
      payload?.message_id ??
      payload?.id ??
      payload?.data?.messageId ??
      payload?.data?.message_id ??
      payload?.data?.id ??
      null
  } catch {
    providerMessageId = null
  }

  return { providerMessageId, accepted: true }
}
