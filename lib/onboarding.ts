export interface OnboardingProfileLike {
  practitionerType?: string | null
  slug?: string | null
  companyName?: string | null
  companyAddress?: string | null
  siret?: string | null
}

export type SlugValidationError = "missing" | "invalid" | "reserved"
export type SiretValidationError = "missing" | "invalid"

export const SLUG_MIN_LENGTH = 3
export const SLUG_MAX_LENGTH = 40

const RESERVED_SLUGS = new Set([
  "apple-icon",
  "api",
  "billing",
  "checkout",
  "dashboard",
  "calendar",
  "consultations",
  "favicon",
  "faviconico",
  "forgot-password",
  "icon",
  "legal",
  "manifest",
  "manifestwebmanifest",
  "onboarding",
  "opengraph-image",
  "patients",
  "reset-password",
  "robots",
  "robotstxt",
  "settings",
  "signin",
  "signup",
  "sitemap",
  "sitemapxml",
  "twitter-image",
])

function collapseWhitespace(value: string) {
  return value.trim().replace(/\s+/g, " ")
}

export function normalizeOptionalText(value?: string | null): string | null | undefined {
  if (value === undefined) {
    return undefined
  }

  if (value === null) {
    return null
  }

  const normalized = collapseWhitespace(value)
  return normalized.length > 0 ? normalized : null
}

export function normalizeSlug(value?: string | null): string | null | undefined {
  if (value === undefined) {
    return undefined
  }

  if (value === null) {
    return null
  }

  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")

  return normalized.length > 0 ? normalized : null
}

export function normalizeSiret(value?: string | null): string | null | undefined {
  if (value === undefined) {
    return undefined
  }

  if (value === null) {
    return null
  }

  const normalized = value.replace(/\D/g, "")
  return normalized.length > 0 ? normalized : null
}

export function normalizeOnboardingProfile(profile: OnboardingProfileLike) {
  return {
    practitionerType: profile.practitionerType ?? null,
    slug: normalizeSlug(profile.slug) ?? null,
    companyName: normalizeOptionalText(profile.companyName) ?? null,
    companyAddress: normalizeOptionalText(profile.companyAddress) ?? null,
    siret: normalizeSiret(profile.siret) ?? null,
  }
}

export function isReservedSlug(slug: string) {
  return RESERVED_SLUGS.has(slug)
}

export function isValidSlug(slug: string) {
  return (
    slug.length >= SLUG_MIN_LENGTH &&
    slug.length <= SLUG_MAX_LENGTH &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
  )
}

export function isValidSiret(siret: string) {
  return /^\d{14}$/.test(siret)
}

export function getSlugValidationError(value?: string | null): SlugValidationError | null {
  const normalizedSlug = normalizeSlug(value)

  if (!normalizedSlug) {
    return "missing"
  }

  if (!isValidSlug(normalizedSlug)) {
    return "invalid"
  }

  if (isReservedSlug(normalizedSlug)) {
    return "reserved"
  }

  return null
}

export function getSiretValidationError(value?: string | null): SiretValidationError | null {
  const normalizedSiret = normalizeSiret(value)

  if (!normalizedSiret) {
    return "missing"
  }

  if (!isValidSiret(normalizedSiret)) {
    return "invalid"
  }

  return null
}

export function getMissingOnboardingFields(profile: OnboardingProfileLike) {
  const normalizedProfile = normalizeOnboardingProfile(profile)
  const missingFields: Array<keyof OnboardingProfileLike> = []

  if (!normalizedProfile.practitionerType) {
    missingFields.push("practitionerType")
  }

  if (!normalizedProfile.slug) {
    missingFields.push("slug")
  }

  if (!normalizedProfile.companyName) {
    missingFields.push("companyName")
  }

  if (!normalizedProfile.companyAddress) {
    missingFields.push("companyAddress")
  }

  if (!normalizedProfile.siret) {
    missingFields.push("siret")
  }

  return missingFields
}

export function isOnboardingComplete(profile: OnboardingProfileLike) {
  const normalizedProfile = normalizeOnboardingProfile(profile)

  return Boolean(
    normalizedProfile.practitionerType &&
      normalizedProfile.companyName &&
      normalizedProfile.companyAddress &&
      !getSlugValidationError(normalizedProfile.slug) &&
      !getSiretValidationError(normalizedProfile.siret)
  )
}

export function getPublicBookingHost() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://postur.fr"

  return appUrl
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "")
}
