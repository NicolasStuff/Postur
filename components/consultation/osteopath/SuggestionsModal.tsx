"use client"

import { useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import {
  Loader2,
  RefreshCcw,
  ShieldAlert,
  Sparkles,
  WandSparkles,
} from "lucide-react"

import { generateSmartNoteSuggestions } from "@/app/actions/consultation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { bodyPartLabels } from "@/lib/bodyChartLabels"
import {
  ConsultationAIState,
  SmartNoteSuggestion,
} from "@/lib/consultation-note"
import { ConsultationEditor } from "../shared/Editor"
import { useModalEditorSync } from "../shared/useModalEditorSync"

interface SuggestionsModalProps {
  appointmentId: string
  noteText: string
  bodyChartParts: string[]
  aiState: ConsultationAIState
  smartNotesEnabled: boolean
  editorContent: unknown
  onEditorContentSync: (content: unknown) => void
  onUpdateAI: (patch: Partial<ConsultationAIState>) => void
}

function suggestionsAreEqual(
  currentSuggestions: SmartNoteSuggestion[],
  nextSuggestions: SmartNoteSuggestion[]
) {
  return JSON.stringify(currentSuggestions) === JSON.stringify(nextSuggestions)
}

export function SuggestionsModal({
  appointmentId,
  noteText,
  bodyChartParts,
  aiState,
  smartNotesEnabled,
  editorContent,
  onEditorContentSync,
  onUpdateAI,
}: SuggestionsModalProps) {
  const t = useTranslations("consultation.osteopath.ai")
  const smartNotesRef = useRef(aiState.smartNotes)
  const suggestionRequestRef = useRef(0)
  const [open, setOpen] = useState(false)
  const { modalEditorRef, handleModalEditorChange, syncAndClose } = useModalEditorSync(
    open,
    editorContent,
    onEditorContentSync
  )
  const [smartNotesLoading, setSmartNotesLoading] = useState(false)
  const [smartNotesError, setSmartNotesError] = useState<string | null>(null)
  const [editedSuggestions, setEditedSuggestions] = useState<Record<string, string>>({})

  useEffect(() => {
    smartNotesRef.current = aiState.smartNotes
  }, [aiState.smartNotes])

  const handleGenerateSmartNotes = async () => {
    if (!smartNotesEnabled) return

    const normalizedNoteText = noteText.trim()
    if (bodyChartParts.length === 0 && !normalizedNoteText) {
      setSmartNotesError(null)
      return
    }

    const requestId = suggestionRequestRef.current + 1
    suggestionRequestRef.current = requestId
    setSmartNotesError(null)
    setSmartNotesLoading(true)

    try {
      const suggestions = await generateSmartNoteSuggestions(appointmentId, {
        bodyChart: bodyChartParts,
        noteText: normalizedNoteText,
      })

      if (suggestionRequestRef.current !== requestId) return

      const dedupedSuggestions = suggestions.filter(
        (suggestion) => !normalizedNoteText.toLowerCase().includes(suggestion.text.toLowerCase())
      )

      if (!suggestionsAreEqual(smartNotesRef.current, dedupedSuggestions)) {
        onUpdateAI({ smartNotes: dedupedSuggestions })
      }

      setEditedSuggestions({})
      setSmartNotesError(null)
    } catch (error) {
      if (suggestionRequestRef.current === requestId) {
        console.error("Smart note suggestions failed:", error)
        setSmartNotesError(t("errors.suggestionsFailed"))
      }
    } finally {
      if (suggestionRequestRef.current === requestId) {
        setSmartNotesLoading(false)
      }
    }
  }


  const getSuggestionText = (suggestion: SmartNoteSuggestion) => {
    return editedSuggestions[suggestion.id] ?? suggestion.text
  }

  const handleEditSuggestion = (id: string, text: string) => {
    setEditedSuggestions((prev) => ({ ...prev, [id]: text }))
  }

  const handleInsertSuggestion = (suggestion: SmartNoteSuggestion) => {
    modalEditorRef.current?.insertText(getSuggestionText(suggestion))
  }

  if (!smartNotesEnabled) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen) {
        syncAndClose()
      }
      setOpen(nextOpen)
    }}>
      <DialogTrigger asChild>
        <Button data-tour="ai-suggestions" variant="outline" size="sm" className="h-7 text-xs gap-1.5">
          <WandSparkles className="h-3.5 w-3.5" />
          {t("tabs.suggestions")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-[95vw] h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>{t("suggestions.title")}</DialogTitle>
          <DialogDescription>{t("suggestions.description")}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden px-6 pb-4">
          {/* Header bar with body parts + generate button */}
          <div className="shrink-0 flex items-center justify-between gap-3 pb-4">
            <div className="flex flex-wrap gap-1.5">
              {bodyChartParts.length > 0 ? (
                bodyChartParts.map((part) => (
                  <Badge key={part} variant="outline" className="bg-muted text-xs">
                    {bodyPartLabels[part] ?? part}
                  </Badge>
                ))
              ) : (
                <Badge variant="outline" className="text-xs">{t("suggestions.noBodyChart")}</Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {noteText ? t("suggestions.noteDetected") : t("suggestions.noNote")}
              </Badge>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={handleGenerateSmartNotes}
              disabled={smartNotesLoading || (bodyChartParts.length === 0 && !noteText.trim())}
            >
              {smartNotesLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : aiState.smartNotes.length > 0 ? (
                <RefreshCcw className="mr-2 h-4 w-4" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {aiState.smartNotes.length > 0 ? t("suggestions.regenerate") : t("suggestions.generate")}
            </Button>
          </div>

          {smartNotesError && (
            <div className="shrink-0 mb-4 rounded-lg border border-amber-200/60 bg-amber-50/60 p-3 text-sm text-amber-800">
              {smartNotesError}
            </div>
          )}

          {/* Split view */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0 flex-1">
            {/* Left: Suggestions */}
            <ScrollArea className="rounded-xl border p-4">
              {aiState.smartNotes.length === 0 ? (
                <div className="rounded-lg border border-dashed bg-muted/50 p-6 text-center text-sm text-muted-foreground">
                  {smartNotesLoading
                    ? t("suggestions.generating")
                    : smartNotesError || t("suggestions.empty")}
                </div>
              ) : (
                <div className="space-y-3">
                  {aiState.smartNotes.map((suggestion) => (
                    <div key={suggestion.id} className="rounded-xl border bg-card p-3 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{t(`suggestions.modes.${suggestion.inputMode}`)}</Badge>
                        <Badge variant="outline">{t(`suggestions.confidence.${suggestion.confidence}`)}</Badge>
                        {suggestion.inputMode === "conflict" && (
                          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                            <ShieldAlert className="h-3 w-3" />
                            {t("suggestions.verify")}
                          </Badge>
                        )}
                      </div>
                      <Textarea
                        value={getSuggestionText(suggestion)}
                        onChange={(e) => handleEditSuggestion(suggestion.id, e.target.value)}
                        className="min-h-[60px] text-sm"
                      />
                      <p className="text-xs text-muted-foreground">{suggestion.reason}</p>
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleInsertSuggestion(suggestion)}
                        >
                          {t("suggestions.insert")}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Right: Editable notes */}
            <div className="overflow-hidden rounded-xl border flex flex-col">
              <div className="shrink-0 border-b bg-muted/50 px-3 py-2">
                <p className="text-xs font-medium text-muted-foreground">Notes actuelles</p>
              </div>
              <div className="flex-1 overflow-hidden">
                <ConsultationEditor
                  ref={modalEditorRef}
                  key={open ? "modal-suggestions-editor" : ""}
                  initialContent={editorContent}
                  onChange={handleModalEditorChange}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t px-6 py-4">
          <Button variant="outline" onClick={() => {
            syncAndClose()
            setOpen(false)
          }}>
            {t("suggestions.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
