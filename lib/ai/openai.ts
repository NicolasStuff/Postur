import { z } from "zod"

import { PatientRecap, SmartNoteSuggestion, SoapDraft } from "@/lib/consultation-note"

const smartNotesSchema = z.object({
  suggestions: z.array(
    z.object({
      id: z.string().min(1),
      text: z.string().min(1),
      reason: z.string().min(1),
      confidence: z.enum(["low", "medium", "high"]),
      inputMode: z.enum(["chart-only", "notes-only", "combined", "conflict"]),
    })
  ),
})

const soapDraftSchema = z.object({
  summary: z.string().min(1),
  sections: z.array(
    z.object({
      label: z.string().min(1),
      content: z.string().min(1),
    })
  ),
})

const patientRecapSchema = z.object({
  summary: z.string().min(1),
  advice: z.array(z.string().min(1)),
  exercises: z.array(z.string().min(1)),
  precautions: z.array(z.string().min(1)),
  followUp: z.string().min(1),
})

interface OpenAIChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
}

interface SmartNoteGenerationInput {
  serviceName: string
  bodyChartLabels: string[]
  noteText: string
}

interface SoapDraftGenerationInput {
  serviceName: string
  transcript: string
  bodyChartLabels: string[]
  existingNoteText: string
}

interface PatientRecapGenerationInput {
  serviceName: string
  bodyChartLabels: string[]
  noteText: string
  soapSummary: string
}

function getOpenAIApiKey() {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set")
  }

  return apiKey
}

function extractJsonPayload(rawContent: string) {
  const fencedMatch = rawContent.match(/```json\s*([\s\S]*?)```/i)
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim()
  }

  const jsonStart = rawContent.indexOf("{")
  const jsonEnd = rawContent.lastIndexOf("}")

  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    return rawContent.slice(jsonStart, jsonEnd + 1)
  }

  return rawContent.trim()
}

async function requestStructuredJson<T>({
  model,
  schema,
  systemPrompt,
  userPrompt,
}: {
  model: string
  schema: z.ZodSchema<T>
  systemPrompt: string
  userPrompt: string
}) {
  const apiKey = getOpenAIApiKey()
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
    }),
    cache: "no-store",
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenAI generation failed: ${errorText}`)
  }

  const data = (await response.json()) as OpenAIChatCompletionResponse
  const rawContent = data.choices?.[0]?.message?.content

  if (!rawContent) {
    throw new Error("OpenAI returned an empty response")
  }

  const parsedContent = JSON.parse(extractJsonPayload(rawContent))
  return schema.parse(parsedContent)
}

export class OpenAIClinicalGenerationProvider {
  async generateSmartNotes(input: SmartNoteGenerationInput): Promise<SmartNoteSuggestion[]> {
    const result = await requestStructuredJson({
      model: "gpt-5-mini",
      schema: smartNotesSchema,
      systemPrompt: [
        "Tu es un assistant clinique pour ostéopathes.",
        "Tu proposes des formulations courtes, prudentes et directement insérables dans une note de consultation.",
        "Tu ne poses jamais de diagnostic définitif.",
        "Tu écris toujours en français.",
        "Retourne uniquement un objet JSON valide.",
      ].join(" "),
      userPrompt: [
        "Génère entre 3 et 5 suggestions de notes.",
        "Règles :",
        "- Si seules des zones du body chart sont présentes, utilise inputMode='chart-only'.",
        "- Si seule la note existante est présente, utilise inputMode='notes-only'.",
        "- Si les deux convergent, utilise inputMode='combined'.",
        "- Si les éléments se contredisent, formule la suggestion avec 'À vérifier :' et utilise inputMode='conflict'.",
        "- La propriété 'reason' doit expliquer brièvement pourquoi la suggestion est proposée.",
        "- 'confidence' doit être low, medium ou high.",
        "",
        `Prestation: ${input.serviceName}`,
        `Zones sélectionnées: ${input.bodyChartLabels.join(", ") || "Aucune"}`,
        `Note actuelle: ${input.noteText || "Aucune"}`,
      ].join("\n"),
    })

    return result.suggestions
  }

  async generateSoapDraft(input: SoapDraftGenerationInput): Promise<SoapDraft> {
    const result = await requestStructuredJson({
      model: "gpt-5.4",
      schema: soapDraftSchema,
      systemPrompt: [
        "Tu rédiges des brouillons de notes SOAP pour une séance d'ostéopathie.",
        "Tu écris en français, de façon structurée et concise.",
        "Tu n'inventes pas d'information absente du transcript.",
        "Tu peux signaler les éléments incertains avec des formulations prudentes.",
        "Retourne uniquement un objet JSON valide.",
      ].join(" "),
      userPrompt: [
        "À partir du transcript et du contexte, génère un brouillon SOAP.",
        "La réponse doit contenir :",
        "- summary: un résumé clinique court",
        "- sections: 4 sections avec les labels exacts 'Subjectif (S)', 'Objectif (O)', 'Évaluation (A)', 'Plan (P)'",
        "La section Évaluation doit rester prudente et ne pas affirmer de diagnostic définitif.",
        "",
        `Prestation: ${input.serviceName}`,
        `Zones sélectionnées: ${input.bodyChartLabels.join(", ") || "Aucune"}`,
        `Note existante: ${input.existingNoteText || "Aucune"}`,
        "Transcript :",
        input.transcript,
      ].join("\n"),
    })

    return {
      ...result,
      generatedAt: new Date().toISOString(),
      model: "gpt-5.4",
    }
  }

  async generatePatientRecap(input: PatientRecapGenerationInput): Promise<PatientRecap> {
    const result = await requestStructuredJson({
      model: "gpt-5.4",
      schema: patientRecapSchema,
      systemPrompt: [
        "Tu rédiges un compte-rendu patient post-séance pour un logiciel d'ostéopathie.",
        "Le ton doit être clair, rassurant, non alarmiste et compréhensible par un patient.",
        "Tu n'inventes ni diagnostic médical ni promesse de guérison.",
        "Tu écris toujours en français.",
        "Retourne uniquement un objet JSON valide.",
      ].join(" "),
      userPrompt: [
        "Génère un compte-rendu patient simple et actionnable.",
        "Le champ followUp doit être une phrase courte sur la suite conseillée.",
        "",
        `Prestation: ${input.serviceName}`,
        `Zones travaillées ou sensibles: ${input.bodyChartLabels.join(", ") || "Aucune"}`,
        `Résumé SOAP: ${input.soapSummary || "Aucun"}`,
        `Note clinique: ${input.noteText || "Aucune"}`,
      ].join("\n"),
    })

    return {
      ...result,
      generatedAt: new Date().toISOString(),
      model: "gpt-5.4",
    }
  }
}

export const openAIClinicalGenerationProvider = new OpenAIClinicalGenerationProvider()
