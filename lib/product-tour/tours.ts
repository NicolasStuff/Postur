import type { TourConfig } from "./types"

export const dashboardTour: TourConfig = {
  id: "dashboard",
  steps: [
    {
      element: '[data-tour="nav-availability"]',
      titleKey: "dashboard.availability.title",
      descriptionKey: "dashboard.availability.description",
      side: "right",
      align: "center",
    },
    {
      element: '[data-tour="nav-services"]',
      titleKey: "dashboard.services.title",
      descriptionKey: "dashboard.services.description",
      side: "right",
      align: "center",
    },
    {
      element: '[data-tour="nav-calendar"]',
      titleKey: "dashboard.calendar.title",
      descriptionKey: "dashboard.calendar.description",
      side: "right",
      align: "center",
    },
    {
      element: '[data-tour="nav-patients"]',
      titleKey: "dashboard.patients.title",
      descriptionKey: "dashboard.patients.description",
      side: "right",
      align: "center",
    },
    {
      element: '[data-tour="nav-billing"]',
      titleKey: "dashboard.billing.title",
      descriptionKey: "dashboard.billing.description",
      side: "right",
      align: "center",
    },
    {
      element: '[data-tour="nav-settings"]',
      titleKey: "dashboard.settings.title",
      descriptionKey: "dashboard.settings.description",
      side: "right",
      align: "center",
    },
  ],
}

export const consultationTour: TourConfig = {
  id: "consultation",
  steps: [
    {
      element: '[data-tour="body-chart"]',
      titleKey: "consultation.bodyChart.title",
      descriptionKey: "consultation.bodyChart.description",
      side: "right",
      align: "center",
    },
    {
      element: '[data-tour="editor"]',
      titleKey: "consultation.editor.title",
      descriptionKey: "consultation.editor.description",
      side: "left",
      align: "center",
    },
    {
      element: '[data-tour="toolbar-guides"]',
      titleKey: "consultation.guides.title",
      descriptionKey: "consultation.guides.description",
      side: "bottom",
      align: "start",
    },
    {
      element: '[data-tour="ai-audio-soap"]',
      titleKey: "consultation.audioSoap.title",
      descriptionKey: "consultation.audioSoap.description",
      side: "bottom",
      align: "end",
    },
    {
      element: '[data-tour="ai-suggestions"]',
      titleKey: "consultation.suggestions.title",
      descriptionKey: "consultation.suggestions.description",
      side: "bottom",
      align: "end",
    },
  ],
}
