"use client"

import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { useLocale, useTranslations } from "next-intl"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Loader2,
  MessageCircle,
  RefreshCw,
  Search,
  SendHorizontal,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  fetchAdminSupportConversationMessages,
  fetchAdminSupportConversations,
  markAdminSupportConversationRead,
  sendAdminSupportConversationMessage,
  supportQueryKeys,
  updateAdminSupportConversationStatus,
} from "@/lib/support/client"
import { cn } from "@/lib/utils"

type StatusFilter = "ALL" | "OPEN" | "CLOSED"

function formatSupportDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

export function AdminConversationsPage() {
  const t = useTranslations("dashboard.adminConversations")
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const messagesContainerRef = useRef<HTMLDivElement | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL")
  const [draft, setDraft] = useState("")
  const deferredSearch = useDeferredValue(search)
  const selectedConversationId = searchParams.get("conversation")

  const conversationsQuery = useQuery({
    queryKey: supportQueryKeys.adminConversations(deferredSearch, statusFilter),
    queryFn: () =>
      fetchAdminSupportConversations({
        search: deferredSearch,
        status: statusFilter,
      }),
    refetchOnWindowFocus: false,
  })

  const conversations = useMemo(
    () => conversationsQuery.data?.conversations ?? [],
    [conversationsQuery.data?.conversations]
  )

  const messagesQuery = useQuery({
    queryKey: selectedConversationId
      ? supportQueryKeys.adminConversationMessages(selectedConversationId)
      : ["adminSupportConversationMessages", "empty"],
    queryFn: () => fetchAdminSupportConversationMessages(selectedConversationId!),
    enabled: Boolean(selectedConversationId),
    refetchOnWindowFocus: false,
  })

  const selectedConversation = useMemo(() => {
    if (messagesQuery.data?.conversation) {
      return messagesQuery.data.conversation
    }

    return (
      conversations.find(
        (conversation) => conversation.id === selectedConversationId
      ) ?? null
    )
  }, [conversations, messagesQuery.data?.conversation, selectedConversationId])

  const selectedMessages = messagesQuery.data?.messages ?? []

  const syncConversationSelection = (conversationId: string) => {
    const nextParams = new URLSearchParams(searchParams.toString())
    nextParams.set("conversation", conversationId)
    router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false })
  }

  useEffect(() => {
    if (!conversations.length) {
      return
    }

    if (
      !selectedConversationId ||
      !conversations.some((conversation) => conversation.id === selectedConversationId)
    ) {
      const nextParams = new URLSearchParams(searchParams.toString())
      nextParams.set("conversation", conversations[0].id)
      router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false })
    }
  }, [
    conversations,
    pathname,
    router,
    searchParams,
    selectedConversationId,
  ])

  useEffect(() => {
    const eventSource = new EventSource("/api/admin/support/stream")
    const handleSupportUpdated = (rawEvent: Event) => {
      const event = rawEvent as MessageEvent<string>
      const payload = JSON.parse(event.data) as { conversationId: string }

      startTransition(() => {
        void queryClient.invalidateQueries({
          queryKey: supportQueryKeys.adminConversations(
            deferredSearch,
            statusFilter
          ),
        })
        if (selectedConversationId === payload.conversationId) {
          void queryClient.invalidateQueries({
            queryKey: supportQueryKeys.adminConversationMessages(
              payload.conversationId
            ),
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
  }, [deferredSearch, queryClient, selectedConversationId, statusFilter])

  const replyMutation = useMutation({
    mutationFn: (body: string) =>
      sendAdminSupportConversationMessage(selectedConversationId!, body),
    onSuccess: async () => {
      setDraft("")

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: supportQueryKeys.adminConversations(
            deferredSearch,
            statusFilter
          ),
        }),
        selectedConversationId
          ? queryClient.invalidateQueries({
              queryKey: supportQueryKeys.adminConversationMessages(
                selectedConversationId
              ),
            })
          : Promise.resolve(),
      ])
    },
  })

  const markReadMutation = useMutation({
    mutationFn: (conversationId: string) =>
      markAdminSupportConversationRead(conversationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: supportQueryKeys.adminConversations(deferredSearch, statusFilter),
      })
    },
  })
  const isMarkingRead = markReadMutation.isPending
  const markConversationRead = markReadMutation.mutate

  const updateStatusMutation = useMutation({
    mutationFn: (status: "OPEN" | "CLOSED") =>
      updateAdminSupportConversationStatus(selectedConversationId!, status),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: supportQueryKeys.adminConversations(
            deferredSearch,
            statusFilter
          ),
        }),
        selectedConversationId
          ? queryClient.invalidateQueries({
              queryKey: supportQueryKeys.adminConversationMessages(
                selectedConversationId
              ),
            })
          : Promise.resolve(),
      ])
    },
  })

  useEffect(() => {
    if (
      !selectedConversationId ||
      !selectedConversation?.unreadForAdmin ||
      isMarkingRead
    ) {
      return
    }

    markConversationRead(selectedConversationId)
  }, [
    isMarkingRead,
    markConversationRead,
    selectedConversation?.unreadForAdmin,
    selectedConversationId,
  ])

  useEffect(() => {
    const element = messagesContainerRef.current
    if (!element) {
      return
    }

    element.scrollTo({
      top: element.scrollHeight,
      behavior: "smooth",
    })
  }, [selectedMessages.length, selectedConversationId])

  const handleReply = () => {
    const body = draft.trim()
    if (!body || !selectedConversationId || replyMutation.isPending) {
      return
    }

    replyMutation.mutate(body)
  }

  const filters: Array<{ key: StatusFilter; label: string }> = [
    { key: "ALL", label: t("filters.all") },
    { key: "OPEN", label: t("filters.open") },
    { key: "CLOSED", label: t("filters.closed") },
  ]

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
        <div className="overflow-hidden rounded-2xl border bg-card">
          <div className="border-b bg-slate-50 p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("searchPlaceholder")}
                className="pl-9"
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {filters.map((filter) => (
                <Button
                  key={filter.key}
                  type="button"
                  variant={statusFilter === filter.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(filter.key)}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="max-h-[40rem] overflow-y-auto">
            {conversationsQuery.isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="size-5 animate-spin text-slate-500" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm font-medium text-slate-900">
                  {t("emptyTitle")}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {t("emptyDescription")}
                </p>
              </div>
            ) : (
              conversations.map((conversation) => {
                const isSelected = conversation.id === selectedConversationId

                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => syncConversationSelection(conversation.id)}
                    className={cn(
                      "flex w-full flex-col gap-2 border-b px-4 py-4 text-left transition-colors",
                      isSelected
                        ? "bg-slate-950 text-white"
                        : "bg-white hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {conversation.requester.name || conversation.requester.email}
                        </p>
                        <p
                          className={cn(
                            "truncate text-xs",
                            isSelected ? "text-slate-300" : "text-slate-500"
                          )}
                        >
                          {conversation.requester.email}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {conversation.unreadForAdmin ? (
                          <span className="size-2 rounded-full bg-rose-500" />
                        ) : null}
                        <Badge
                          variant={conversation.status === "OPEN" ? "default" : "secondary"}
                          className={cn(
                            conversation.status === "OPEN"
                              ? "bg-emerald-600 text-white hover:bg-emerald-600"
                              : ""
                          )}
                        >
                          {conversation.status === "OPEN"
                            ? t("statuses.open")
                            : t("statuses.closed")}
                        </Badge>
                      </div>
                    </div>

                    {conversation.requester.companyName ? (
                      <p
                        className={cn(
                          "truncate text-xs",
                          isSelected ? "text-slate-300" : "text-slate-500"
                        )}
                      >
                        {conversation.requester.companyName}
                      </p>
                    ) : null}

                    <p
                      className={cn(
                        "line-clamp-2 text-sm",
                        isSelected ? "text-slate-200" : "text-slate-600"
                      )}
                    >
                      {conversation.lastMessagePreview}
                    </p>

                    <p
                      className={cn(
                        "text-xs",
                        isSelected ? "text-slate-300" : "text-slate-500"
                      )}
                    >
                      {formatSupportDate(conversation.lastMessageAt, locale)}
                    </p>
                  </button>
                )
              })
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border bg-card">
          {!selectedConversationId || !selectedConversation ? (
            <div className="flex h-[40rem] flex-col items-center justify-center px-6 text-center">
              <MessageCircle className="size-10 text-slate-300" />
              <p className="mt-4 text-lg font-semibold text-slate-900">
                {t("placeholderTitle")}
              </p>
              <p className="mt-2 max-w-md text-sm text-slate-500">
                {t("placeholderDescription")}
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-4 border-b bg-slate-50 px-5 py-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-slate-950">
                      {selectedConversation.requester.name ||
                        selectedConversation.requester.email}
                    </h2>
                    <Badge
                      variant={
                        selectedConversation.status === "OPEN"
                          ? "default"
                          : "secondary"
                      }
                      className={cn(
                        selectedConversation.status === "OPEN"
                          ? "bg-emerald-600 text-white hover:bg-emerald-600"
                          : ""
                      )}
                    >
                      {selectedConversation.status === "OPEN"
                        ? t("statuses.open")
                        : t("statuses.closed")}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600">
                    {selectedConversation.requester.email}
                  </p>
                  {selectedConversation.requester.companyName ? (
                    <p className="text-sm text-slate-500">
                      {selectedConversation.requester.companyName}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() =>
                      updateStatusMutation.mutate(
                        selectedConversation.status === "OPEN" ? "CLOSED" : "OPEN"
                      )
                    }
                    disabled={updateStatusMutation.isPending}
                  >
                    {updateStatusMutation.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : selectedConversation.status === "OPEN" ? (
                      <RefreshCw className="size-4" />
                    ) : (
                      <RefreshCw className="size-4" />
                    )}
                    {selectedConversation.status === "OPEN"
                      ? t("actions.close")
                      : t("actions.reopen")}
                  </Button>
                </div>
              </div>

              <div className="flex h-[40rem] flex-col">
                <div
                  ref={messagesContainerRef}
                  className="flex-1 space-y-4 overflow-y-auto bg-white px-5 py-5"
                >
                  {messagesQuery.isLoading ? (
                    <div className="flex h-full items-center justify-center">
                      <Loader2 className="size-5 animate-spin text-slate-500" />
                    </div>
                  ) : (
                    selectedMessages.map((message) => {
                      const isAdminMessage = message.authorType === "ADMIN"

                      return (
                        <div
                          key={message.id}
                          className={cn(
                            "flex",
                            isAdminMessage ? "justify-end" : "justify-start"
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-[80%] rounded-2xl px-4 py-3 shadow-sm",
                              isAdminMessage
                                ? "rounded-br-md bg-slate-950 text-white"
                                : "rounded-bl-md border border-slate-200 bg-slate-50 text-slate-950"
                            )}
                          >
                            <p className="whitespace-pre-wrap text-sm leading-6">
                              {message.body}
                            </p>
                            <p
                              className={cn(
                                "mt-2 text-[11px]",
                                isAdminMessage ? "text-slate-300" : "text-slate-500"
                              )}
                            >
                              {isAdminMessage
                                ? t("messageLabels.admin")
                                : t("messageLabels.user")}{" "}
                              · {formatSupportDate(message.createdAt, locale)}
                            </p>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                <div className="border-t bg-slate-50 p-4">
                  <Textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder={t("replyPlaceholder")}
                    rows={4}
                    className="min-h-[108px] resize-none"
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                        event.preventDefault()
                        handleReply()
                      }
                    }}
                  />
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-xs text-slate-500">{t("replyHint")}</p>
                    <Button
                      type="button"
                      onClick={handleReply}
                      disabled={!draft.trim() || replyMutation.isPending}
                      className="gap-2"
                    >
                      {replyMutation.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <SendHorizontal className="size-4" />
                      )}
                      {t("actions.reply")}
                    </Button>
                  </div>
                  {replyMutation.error ? (
                    <p className="mt-2 text-xs text-destructive">
                      {replyMutation.error instanceof Error
                        ? replyMutation.error.message
                        : t("errors.reply")}
                    </p>
                  ) : null}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
