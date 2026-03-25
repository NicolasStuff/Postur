"use client"

import {
  startTransition,
  useEffect,
  useRef,
  useState,
} from "react"
import { useLocale, useTranslations } from "next-intl"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, MessageCircle, SendHorizontal, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  fetchSupportThread,
  fetchSupportThreadMessages,
  markSupportThreadRead,
  sendSupportThreadMessage,
  supportQueryKeys,
} from "@/lib/support/client"
import { cn } from "@/lib/utils"

function formatMessageTime(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  }).format(new Date(value))
}

export function SupportChatWidget() {
  const t = useTranslations("support.widget")
  const locale = useLocale()
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState("")
  const messagesContainerRef = useRef<HTMLDivElement | null>(null)

  const threadQuery = useQuery({
    queryKey: supportQueryKeys.thread,
    queryFn: fetchSupportThread,
    refetchOnWindowFocus: false,
  })

  const messagesQuery = useQuery({
    queryKey: supportQueryKeys.threadMessages,
    queryFn: fetchSupportThreadMessages,
    enabled: isOpen,
    refetchOnWindowFocus: false,
  })

  const conversation = threadQuery.data?.conversation ?? null
  const messages = messagesQuery.data?.messages ?? []

  const sendMessageMutation = useMutation({
    mutationFn: sendSupportThreadMessage,
    onSuccess: async () => {
      setDraft("")
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: supportQueryKeys.thread }),
        queryClient.invalidateQueries({
          queryKey: supportQueryKeys.threadMessages,
        }),
      ])
    },
  })

  const markReadMutation = useMutation({
    mutationFn: markSupportThreadRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: supportQueryKeys.thread })
    },
  })
  const isMarkingRead = markReadMutation.isPending
  const markThreadRead = markReadMutation.mutate

  useEffect(() => {
    const eventSource = new EventSource("/api/support/stream")
    const handleSupportUpdated = (rawEvent: Event) => {
      const event = rawEvent as MessageEvent<string>
      const payload = JSON.parse(event.data) as { conversationId: string }

      startTransition(() => {
        void queryClient.invalidateQueries({ queryKey: supportQueryKeys.thread })
        if (!conversation || conversation.id === payload.conversationId || isOpen) {
          void queryClient.invalidateQueries({
            queryKey: supportQueryKeys.threadMessages,
          })
        }
      })
    }

    eventSource.addEventListener("support.updated", handleSupportUpdated as EventListener)

    return () => {
      eventSource.removeEventListener(
        "support.updated",
        handleSupportUpdated as EventListener
      )
      eventSource.close()
    }
  }, [conversation, isOpen, queryClient])

  useEffect(() => {
    if (!isOpen || !conversation?.unreadForUser || isMarkingRead) {
      return
    }

    markThreadRead()
  }, [conversation?.id, conversation?.unreadForUser, isMarkingRead, isOpen, markThreadRead])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const element = messagesContainerRef.current
    if (!element) {
      return
    }

    element.scrollTo({
      top: element.scrollHeight,
      behavior: "smooth",
    })
  }, [isOpen, messages.length])

  const handleSend = () => {
    const body = draft.trim()
    if (!body || sendMessageMutation.isPending) {
      return
    }

    sendMessageMutation.mutate(body)
  }

  const isLoading = threadQuery.isLoading || (isOpen && messagesQuery.isLoading)

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {isOpen ? (
        <div className="w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-slate-950 px-4 py-3 text-white">
            <div>
              <p className="text-sm font-semibold">{t("title")}</p>
              <p className="mt-1 text-xs text-slate-300">{t("subtitle")}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 text-white hover:bg-white/10 hover:text-white"
              onClick={() => setIsOpen(false)}
            >
              <X className="size-4" />
            </Button>
          </div>

          <div className="bg-slate-50 px-4 py-3">
            {isLoading ? (
              <div className="flex h-48 items-center justify-center">
                <Loader2 className="size-5 animate-spin text-slate-500" />
              </div>
            ) : (
              <>
                {conversation?.status === "CLOSED" ? (
                  <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    {t("reopenHint")}
                  </div>
                ) : null}

                <div
                  ref={messagesContainerRef}
                  className="flex max-h-[22rem] min-h-[14rem] flex-col gap-3 overflow-y-auto pr-1"
                >
                  {messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-8 text-center">
                      <p className="text-sm font-medium text-slate-900">
                        {t("emptyTitle")}
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        {t("emptyDescription")}
                      </p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isUserMessage = message.authorType === "USER"

                      return (
                        <div
                          key={message.id}
                          className={cn(
                            "flex",
                            isUserMessage ? "justify-end" : "justify-start"
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-[85%] rounded-2xl px-3 py-2 shadow-sm",
                              isUserMessage
                                ? "rounded-br-md bg-slate-950 text-white"
                                : "rounded-bl-md border border-slate-200 bg-white text-slate-900"
                            )}
                          >
                            <p className="whitespace-pre-wrap text-sm leading-6">
                              {message.body}
                            </p>
                            <p
                              className={cn(
                                "mt-2 text-[11px]",
                                isUserMessage ? "text-slate-300" : "text-slate-500"
                              )}
                            >
                              {isUserMessage
                                ? t("you")
                                : t("supportLabel")}{" "}
                              · {formatMessageTime(message.createdAt, locale)}
                            </p>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </>
            )}
          </div>

          <div className="border-t border-slate-200 bg-white p-3">
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={t("inputPlaceholder")}
              rows={3}
              className="min-h-[88px] resize-none border-slate-200"
              onKeyDown={(event) => {
                if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                  event.preventDefault()
                  handleSend()
                }
              }}
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-500">{t("hint")}</p>
              <Button
                type="button"
                onClick={handleSend}
                disabled={!draft.trim() || sendMessageMutation.isPending}
                className="gap-2 rounded-full"
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <SendHorizontal className="size-4" />
                )}
                {t("send")}
              </Button>
            </div>
            {sendMessageMutation.error ? (
              <p className="mt-2 text-xs text-destructive">
                {sendMessageMutation.error instanceof Error
                  ? sendMessageMutation.error.message
                  : t("sendError")}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="relative">
        {conversation?.unreadForUser ? (
          <Badge className="absolute -right-1 -top-1 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] text-white hover:bg-rose-500">
            {t("newBadge")}
          </Badge>
        ) : null}
        <Button
          type="button"
          size="icon"
          className="size-14 rounded-full bg-slate-950 shadow-xl hover:bg-slate-800"
          onClick={() => setIsOpen((open) => !open)}
        >
          <MessageCircle className="size-6" />
        </Button>
      </div>
    </div>
  )
}
