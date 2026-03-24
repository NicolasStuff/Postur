export const BILLING_PROFILE_REQUIRED_FIELDS = [
  "name",
  "practitionerType",
  "companyName",
  "companyAddress",
  "siret",
  "isVatExempt",
  "defaultVatRate",
] as const

export type BillingProfileRequiredField = (typeof BILLING_PROFILE_REQUIRED_FIELDS)[number]

export interface BillingProfileLike {
  name?: string | null
  practitionerType?: string | null
  companyName?: string | null
  companyAddress?: string | null
  siret?: string | null
  isVatExempt?: boolean | null
  defaultVatRate?: number | string | null
}

export interface BillingProfileStatus {
  ready: boolean
  missingFields: BillingProfileRequiredField[]
  issuerProfile: {
    name: string | null
    practitionerType: string | null
    companyName: string | null
    companyAddress: string | null
    siret: string | null
    isVatExempt: boolean
    defaultVatRate: number | null
  }
}

export interface InvoicePatientSnapshot {
  firstName: string
  lastName: string
  email?: string | null
  phone?: string | null
  address?: string | null
}

export interface InvoiceAmounts {
  amount: number
  subtotalAmount: number
  vatAmount: number
  vatRate: number | null
}

function toNullableString(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export function toNullableNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return null
  }

  const numericValue = typeof value === "number" ? value : Number.parseFloat(String(value))
  return Number.isFinite(numericValue) ? numericValue : null
}

export function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function getBillingProfileStatus(profile: BillingProfileLike): BillingProfileStatus {
  const normalizedProfile = {
    name: toNullableString(profile.name),
    practitionerType: toNullableString(profile.practitionerType),
    companyName: toNullableString(profile.companyName),
    companyAddress: toNullableString(profile.companyAddress),
    siret: toNullableString(profile.siret),
    isVatExempt: Boolean(profile.isVatExempt ?? true),
    defaultVatRate: toNullableNumber(profile.defaultVatRate),
  }

  const missingFields: BillingProfileRequiredField[] = []

  if (!normalizedProfile.name) missingFields.push("name")
  if (!normalizedProfile.practitionerType) missingFields.push("practitionerType")
  if (!normalizedProfile.companyName) missingFields.push("companyName")
  if (!normalizedProfile.companyAddress) missingFields.push("companyAddress")
  if (!normalizedProfile.siret) missingFields.push("siret")
  if (profile.isVatExempt === null || profile.isVatExempt === undefined) missingFields.push("isVatExempt")
  if (!normalizedProfile.isVatExempt && (!normalizedProfile.defaultVatRate || normalizedProfile.defaultVatRate <= 0)) {
    missingFields.push("defaultVatRate")
  }

  return {
    ready: missingFields.length === 0,
    missingFields,
    issuerProfile: normalizedProfile,
  }
}

export function calculateInvoiceAmounts(
  totalAmountInput: number,
  options: { isVatExempt: boolean; vatRate: number | null }
): InvoiceAmounts {
  const totalAmount = roundCurrency(totalAmountInput)

  if (options.isVatExempt || !options.vatRate || options.vatRate <= 0) {
    return {
      amount: totalAmount,
      subtotalAmount: totalAmount,
      vatAmount: 0,
      vatRate: null,
    }
  }

  const vatRate = options.vatRate
  const subtotalAmount = roundCurrency(totalAmount / (1 + vatRate / 100))
  const vatAmount = roundCurrency(totalAmount - subtotalAmount)

  return {
    amount: totalAmount,
    subtotalAmount,
    vatAmount,
    vatRate,
  }
}

export function formatVatRateLabel(vatRate: number | null) {
  if (vatRate === null || vatRate <= 0) {
    return null
  }

  return `${vatRate.toFixed(2)}%`
}

export function formatDateInputValue(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

export function parseDateInputValue(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)

  if (!match) {
    return null
  }

  const [, yearValue, monthValue, dayValue] = match
  const year = Number.parseInt(yearValue, 10)
  const month = Number.parseInt(monthValue, 10)
  const day = Number.parseInt(dayValue, 10)
  const date = new Date(year, month - 1, day)

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }

  return date
}
