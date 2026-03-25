"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

import {
  AxeptioSdk,
  ensureMarketingDataLayer,
  loadGoogleTagManager,
  pushMarketingEvent,
  setDefaultGoogleConsent,
  updateGoogleConsent,
} from "@/lib/marketing"

const AXEPTIO_SCRIPT_ID = "postur-axeptio-sdk"

function injectAxeptioScript() {
  if (typeof window === "undefined") {
    return
  }

  if (document.getElementById(AXEPTIO_SCRIPT_ID)) {
    return
  }

  const clientId = process.env.NEXT_PUBLIC_AXEPTIO_CLIENT_ID
  const cookiesVersion = process.env.NEXT_PUBLIC_AXEPTIO_COOKIES_VERSION

  if (!clientId || !cookiesVersion) {
    return
  }

  window.axeptioSettings = {
    clientId,
    cookiesVersion,
  }

  const script = document.createElement("script")
  script.id = AXEPTIO_SCRIPT_ID
  script.async = true
  script.src = "https://static.axept.io/sdk.js"
  document.head.appendChild(script)
}

function syncConsentAndTracking(sdk: AxeptioSdk) {
  const analyticsVendor = process.env.NEXT_PUBLIC_AXEPTIO_GOOGLE_ANALYTICS_VENDOR
  const adsVendor = process.env.NEXT_PUBLIC_AXEPTIO_GOOGLE_ADS_VENDOR
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID

  const analyticsGranted = analyticsVendor ? sdk.hasAcceptedVendor(analyticsVendor) : false
  const adsGranted = adsVendor ? sdk.hasAcceptedVendor(adsVendor) : false

  updateGoogleConsent({
    analyticsStorage: analyticsGranted ? "granted" : "denied",
    adStorage: adsGranted ? "granted" : "denied",
    adUserData: adsGranted ? "granted" : "denied",
    adPersonalization: adsGranted ? "granted" : "denied",
  })

  if (gtmId && (analyticsGranted || adsGranted)) {
    loadGoogleTagManager(gtmId)
  }
}

export function MarketingTrackingProvider({
  surface,
  children,
}: {
  surface: "public" | "acquisition"
  children: React.ReactNode
}) {
  const pathname = usePathname()

  useEffect(() => {
    ensureMarketingDataLayer()
    setDefaultGoogleConsent()
    window._axcb = window._axcb || []
    window._axcb.push((sdk) => {
      window.openAxeptioCookies = (settings) => {
        sdk.openCookies(settings)
      }
      syncConsentAndTracking(sdk)
      sdk.on("cookies:complete", () => {
        syncConsentAndTracking(sdk)
      })
    })

    injectAxeptioScript()
  }, [])

  useEffect(() => {
    if (!pathname) {
      return
    }

    pushMarketingEvent("page_view_public", {
      surface,
      path: pathname,
    })
  }, [pathname, surface])

  return <>{children}</>
}
