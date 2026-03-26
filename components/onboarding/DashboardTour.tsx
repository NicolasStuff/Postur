"use client"

import { useEffect, useRef } from "react"
import { useProductTour } from "@/lib/product-tour/use-product-tour"
import { dashboardTour } from "@/lib/product-tour/tours"
import { markTourCompleted } from "@/app/actions/tours"

interface DashboardTourProps {
  completedTours: string[]
}

export function DashboardTour({ completedTours }: DashboardTourProps) {
  const hasStarted = useRef(false)

  const { startTour, isReady } = useProductTour({
    tour: dashboardTour,
    onComplete: async () => {
      await markTourCompleted("dashboard")
    },
  })

  useEffect(() => {
    if (
      isReady &&
      !hasStarted.current &&
      !completedTours.includes("dashboard")
    ) {
      hasStarted.current = true
      const timer = setTimeout(() => {
        startTour()
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [isReady, completedTours, startTour])

  return null
}
