"use client"

export type MarketingEventName =
  | "page_view_public"
  | "sign_up_started"
  | "sign_up_completed"
  | "trial_started"
  | "begin_checkout"
  | "subscription_purchased"

type ConsentState = "granted" | "denied"

type AxeptioConsentModeState = {
  analytics_storage?: ConsentState
  ad_storage?: ConsentState
  ad_user_data?: ConsentState
  ad_personalization?: ConsentState
}

declare global {
  interface Window {
    _axcb?: Array<(sdk: AxeptioSdk) => void>
    axeptioSettings?: {
      clientId: string
      cookiesVersion: string
    }
    dataLayer?: Array<Record<string, unknown> | IArguments>
    gtag?: (...args: unknown[]) => void
    openAxeptioCookies?: (settings?: Record<string, unknown>) => void
    __posturGtmLoaded?: boolean
    __posturGtmId?: string
    __posturGa4Loaded?: boolean
    __posturGa4MeasurementId?: string
    __posturGa4LastPagePath?: string
    __posturAnalyticsConsentGranted?: boolean
  }
}

export interface AxeptioSdk {
  on: (eventName: string, callback: (choices: Record<string, boolean | undefined>) => void) => void
  hasAcceptedVendor: (vendor: string) => boolean
  openCookies: (settings?: Record<string, unknown>) => void
}

export function ensureMarketingDataLayer() {
  if (typeof window === "undefined") {
    return
  }

  window.dataLayer = window.dataLayer || []
  window.gtag =
    window.gtag ||
    function gtag(...args: unknown[]) {
      window.dataLayer?.push(args as unknown as IArguments)
  }
}

export function getLatestAxeptioConsentMode(): AxeptioConsentModeState | null {
  if (typeof window === "undefined" || !window.dataLayer) {
    return null
  }

  for (let index = window.dataLayer.length - 1; index >= 0; index -= 1) {
    const entry = window.dataLayer[index]

    if (
      entry &&
      !Array.isArray(entry) &&
      typeof entry === "object" &&
      "event" in entry &&
      (entry.event === "axeptio_update" || entry.event === "axeptio_update_consent") &&
      "consent_mode" in entry &&
      entry.consent_mode &&
      typeof entry.consent_mode === "object"
    ) {
      return entry.consent_mode as AxeptioConsentModeState
    }
  }

  return null
}

export function setDefaultGoogleConsent() {
  if (typeof window === "undefined") {
    return
  }

  ensureMarketingDataLayer()
  window.__posturAnalyticsConsentGranted = false
  window.gtag?.("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    wait_for_update: 500,
  })
}

export function updateGoogleConsent(options: {
  analyticsStorage: ConsentState
  adStorage: ConsentState
  adUserData: ConsentState
  adPersonalization: ConsentState
}) {
  if (typeof window === "undefined") {
    return
  }

  ensureMarketingDataLayer()
  window.__posturAnalyticsConsentGranted = options.analyticsStorage === "granted"
  window.gtag?.("consent", "update", {
    analytics_storage: options.analyticsStorage,
    ad_storage: options.adStorage,
    ad_user_data: options.adUserData,
    ad_personalization: options.adPersonalization,
  })
}

export function pushMarketingEvent(
  event: MarketingEventName,
  payload: Record<string, unknown> = {}
) {
  if (typeof window === "undefined") {
    return
  }

  ensureMarketingDataLayer()
  window.dataLayer?.push({
    event,
    ...payload,
  })
}

export function loadGoogleTagManager(gtmId: string) {
  if (typeof window === "undefined" || !gtmId) {
    return
  }

  if (window.__posturGtmLoaded && window.__posturGtmId === gtmId) {
    return
  }

  const existingScript = document.getElementById("postur-gtm-script")
  if (existingScript) {
    window.__posturGtmLoaded = true
    window.__posturGtmId = gtmId
    return
  }

  ensureMarketingDataLayer()
  window.dataLayer?.push({
    "gtm.start": Date.now(),
    event: "gtm.js",
  })

  const script = document.createElement("script")
  script.id = "postur-gtm-script"
  script.async = true
  script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`
  document.head.appendChild(script)

  window.__posturGtmLoaded = true
  window.__posturGtmId = gtmId
}

export function loadGoogleAnalytics(measurementId: string) {
  if (typeof window === "undefined" || !measurementId) {
    return
  }

  const scriptId = "postur-ga4-script"
  const existingScript = document.getElementById(scriptId)

  if (!existingScript) {
    const script = document.createElement("script")
    script.id = scriptId
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`
    document.head.appendChild(script)
  }

  if (window.__posturGa4Loaded && window.__posturGa4MeasurementId === measurementId) {
    return
  }

  ensureMarketingDataLayer()
  window.gtag?.("js", new Date())
  window.gtag?.("config", measurementId, {
    send_page_view: false,
  })

  window.__posturGa4Loaded = true
  window.__posturGa4MeasurementId = measurementId
}

export function trackGoogleAnalyticsPageView(measurementId: string, pagePath: string) {
  if (typeof window === "undefined" || !measurementId || !pagePath) {
    return
  }

  if (
    !window.__posturGa4Loaded ||
    window.__posturGa4MeasurementId !== measurementId ||
    !window.__posturAnalyticsConsentGranted
  ) {
    return
  }

  if (window.__posturGa4LastPagePath === pagePath) {
    return
  }

  window.gtag?.("event", "page_view", {
    send_to: measurementId,
    page_path: pagePath,
    page_location: window.location.href,
    page_title: document.title,
  })

  window.__posturGa4LastPagePath = pagePath
}

export function openCookiePreferences() {
  if (typeof window === "undefined") {
    return false
  }

  if (typeof window.openAxeptioCookies === "function") {
    window.openAxeptioCookies()
    return true
  }

  return false
}
