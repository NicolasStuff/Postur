"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import type { TourConfig } from "./types"

interface UseProductTourOptions {
  tour: TourConfig
  onComplete?: () => void | Promise<void>
}

export function useProductTour({ tour, onComplete }: UseProductTourOptions) {
  const t = useTranslations("productTour")
  const [isReady, setIsReady] = useState(false)
  const completedRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    import("driver.js").then(() => {
      if (!cancelled) setIsReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const startTour = useCallback(async () => {
    const { driver } = await import("driver.js")

    completedRef.current = false

    const steps = tour.steps
      .filter((step) => document.querySelector(step.element))
      .map((step) => ({
        element: step.element,
        popover: {
          title: t(step.titleKey),
          description: t(step.descriptionKey),
          side: step.side,
          align: step.align,
        },
      }))

    if (steps.length === 0) return

    const handleComplete = () => {
      if (completedRef.current) return
      completedRef.current = true
      onComplete?.()
    }

    const driverInstance = driver({
      showProgress: true,
      steps,
      nextBtnText: t("common.next"),
      prevBtnText: t("common.previous"),
      doneBtnText: t("common.done"),
      progressText: "{{current}} / {{total}}",
      popoverClass: "postur-tour-popover",
      overlayColor: "rgba(0, 0, 0, 0.5)",
      stagePadding: 8,
      stageRadius: 8,
      onDestroyStarted: () => {
        handleComplete()
        driverInstance.destroy()
      },
    })

    driverInstance.drive()
  }, [tour, t, onComplete])

  return { startTour, isReady }
}
