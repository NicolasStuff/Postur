"use client"

import { useEffect, useRef } from "react"
import { useProductTour } from "@/lib/product-tour/use-product-tour"
import { consultationTour } from "@/lib/product-tour/tours"
import { markTourCompleted } from "@/app/actions/tours"

interface ConsultationTourProps {
  completedTours: string[]
  hasAIAccess?: boolean
}

export function ConsultationTour({
  completedTours,
  hasAIAccess = false,
}: ConsultationTourProps) {
  const hasStarted = useRef(false)

  const filteredTour = {
    ...consultationTour,
    steps: hasAIAccess
      ? consultationTour.steps
      : consultationTour.steps.filter(
          (step) =>
            step.element !== '[data-tour="ai-audio-soap"]' &&
            step.element !== '[data-tour="ai-suggestions"]'
        ),
  }

  const { startTour, isReady } = useProductTour({
    tour: filteredTour,
    onComplete: async () => {
      await markTourCompleted("consultation")
    },
  })

  useEffect(() => {
    if (
      isReady &&
      !hasStarted.current &&
      !completedTours.includes("consultation")
    ) {
      hasStarted.current = true
      const timer = setTimeout(() => {
        startTour()
      }, 1200)
      return () => clearTimeout(timer)
    }
  }, [isReady, completedTours, startTour])

  return null
}
