export type TourId = "dashboard" | "consultation"

export interface TourStepConfig {
  element: string
  titleKey: string
  descriptionKey: string
  side?: "top" | "bottom" | "left" | "right"
  align?: "start" | "center" | "end"
}

export interface TourConfig {
  id: TourId
  steps: TourStepConfig[]
}
