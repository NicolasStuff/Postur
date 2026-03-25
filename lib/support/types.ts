import type {
  SupportAuthorType,
  SupportConversationStatus,
} from "@prisma/client"

export interface SupportRequesterSummary {
  id: string
  name: string | null
  email: string
  companyName: string | null
}

export interface SupportConversationSummary {
  id: string
  requester: SupportRequesterSummary
  status: SupportConversationStatus
  lastMessageAt: string
  lastMessagePreview: string
  unreadForAdmin: boolean
  unreadForUser: boolean
  updatedAt: string
}

export interface SupportMessageItem {
  id: string
  conversationId: string
  authorType: SupportAuthorType
  authorUserId: string
  body: string
  createdAt: string
}

export interface SupportThreadResponse {
  conversation: SupportConversationSummary | null
}

export interface SupportThreadMessagesResponse {
  conversationId: string | null
  messages: SupportMessageItem[]
}

export interface AdminSupportConversationMessagesResponse {
  conversation: SupportConversationSummary
  messages: SupportMessageItem[]
}
