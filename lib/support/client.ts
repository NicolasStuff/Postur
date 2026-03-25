"use client"

import type {
  AdminSupportConversationMessagesResponse,
  SupportConversationSummary,
  SupportThreadMessagesResponse,
  SupportThreadResponse,
} from "@/lib/support/types"

async function requestJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(
      typeof data?.error === "string" ? data.error : "Request failed"
    )
  }

  return data as T
}

export const supportQueryKeys = {
  thread: ["supportThread"] as const,
  threadMessages: ["supportThreadMessages"] as const,
  adminConversations: (
    search: string,
    status: "ALL" | "OPEN" | "CLOSED"
  ) => ["adminSupportConversations", search, status] as const,
  adminConversationMessages: (conversationId: string) =>
    ["adminSupportConversationMessages", conversationId] as const,
}

export function fetchSupportThread() {
  return requestJson<SupportThreadResponse>("/api/support/thread")
}

export function fetchSupportThreadMessages() {
  return requestJson<SupportThreadMessagesResponse>("/api/support/thread/messages")
}

export function sendSupportThreadMessage(body: string) {
  return requestJson<{
    conversation: SupportConversationSummary
  }>("/api/support/thread/messages", {
    method: "POST",
    body: JSON.stringify({ body }),
  })
}

export function markSupportThreadRead() {
  return requestJson<{ conversation: SupportConversationSummary | null }>(
    "/api/support/thread/read",
    {
      method: "POST",
      body: JSON.stringify({}),
    }
  )
}

export function fetchAdminSupportConversations(input: {
  search: string
  status: "ALL" | "OPEN" | "CLOSED"
}) {
  const params = new URLSearchParams()
  if (input.search) {
    params.set("q", input.search)
  }
  params.set("status", input.status)

  return requestJson<{ conversations: SupportConversationSummary[] }>(
    `/api/admin/support/conversations?${params.toString()}`
  )
}

export function fetchAdminSupportConversationMessages(conversationId: string) {
  return requestJson<AdminSupportConversationMessagesResponse>(
    `/api/admin/support/conversations/${conversationId}/messages`
  )
}

export function sendAdminSupportConversationMessage(
  conversationId: string,
  body: string
) {
  return requestJson<{
    conversation: SupportConversationSummary
  }>(`/api/admin/support/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ body }),
  })
}

export function markAdminSupportConversationRead(conversationId: string) {
  return requestJson<{ conversation: SupportConversationSummary }>(
    `/api/admin/support/conversations/${conversationId}/read`,
    {
      method: "POST",
      body: JSON.stringify({}),
    }
  )
}

export function updateAdminSupportConversationStatus(
  conversationId: string,
  status: "OPEN" | "CLOSED"
) {
  return requestJson<{ conversation: SupportConversationSummary }>(
    `/api/admin/support/conversations/${conversationId}/status`,
    {
      method: "POST",
      body: JSON.stringify({ status }),
    }
  )
}
