import { Prisma, type SupportConversationStatus } from "@prisma/client"

import { recordAuditEvent, recordAuditEventSafe } from "@/lib/audit"
import { sendSupportNotificationEmail } from "@/lib/email"
import { prisma } from "@/lib/prisma"
import { enforceRateLimit } from "@/lib/rate-limit"
import {
  publishSupportEvent,
  type SupportRealtimeEvent,
} from "@/lib/support/realtime"
import type {
  AdminSupportConversationMessagesResponse,
  SupportConversationSummary,
  SupportMessageItem,
  SupportThreadMessagesResponse,
} from "@/lib/support/types"

const SUPPORT_MESSAGE_LIMIT = 4_000
const SUPPORT_MESSAGE_PREVIEW_LIMIT = 120

const requesterSelect = {
  id: true,
  name: true,
  email: true,
  companyName: true,
} satisfies Prisma.UserSelect

const conversationSummarySelect = {
  id: true,
  status: true,
  lastMessageAt: true,
  lastUserMessageAt: true,
  lastAdminMessageAt: true,
  lastReadByUserAt: true,
  lastReadByAdminAt: true,
  updatedAt: true,
  requester: {
    select: requesterSelect,
  },
  messages: {
    orderBy: {
      createdAt: "desc",
    },
    take: 1,
    select: {
      body: true,
    },
  },
} satisfies Prisma.SupportConversationSelect

const messageSelect = {
  id: true,
  conversationId: true,
  authorType: true,
  authorUserId: true,
  body: true,
  createdAt: true,
} satisfies Prisma.SupportMessageSelect

type SupportConversationRecord = Prisma.SupportConversationGetPayload<{
  select: typeof conversationSummarySelect
}>

type SupportMessageRecord = Prisma.SupportMessageGetPayload<{
  select: typeof messageSelect
}>

function normalizeMessageBody(body: string) {
  return body.trim().replace(/\r\n/g, "\n")
}

function getMessagePreview(body: string) {
  const normalized = body.replace(/\s+/g, " ").trim()
  if (normalized.length <= SUPPORT_MESSAGE_PREVIEW_LIMIT) {
    return normalized
  }

  return `${normalized.slice(0, SUPPORT_MESSAGE_PREVIEW_LIMIT - 1)}…`
}

function getUnreadForAdmin(conversation: {
  lastUserMessageAt: Date
  lastReadByAdminAt: Date | null
}) {
  return (
    !conversation.lastReadByAdminAt ||
    conversation.lastReadByAdminAt < conversation.lastUserMessageAt
  )
}

function getUnreadForUser(conversation: {
  lastAdminMessageAt: Date | null
  lastReadByUserAt: Date
}) {
  if (!conversation.lastAdminMessageAt) {
    return false
  }

  return conversation.lastReadByUserAt < conversation.lastAdminMessageAt
}

function serializeConversationSummary(
  conversation: SupportConversationRecord
): SupportConversationSummary {
  return {
    id: conversation.id,
    requester: conversation.requester,
    status: conversation.status,
    lastMessageAt: conversation.lastMessageAt.toISOString(),
    lastMessagePreview: getMessagePreview(conversation.messages[0]?.body ?? ""),
    unreadForAdmin: getUnreadForAdmin(conversation),
    unreadForUser: getUnreadForUser(conversation),
    updatedAt: conversation.updatedAt.toISOString(),
  }
}

function serializeMessage(message: SupportMessageRecord): SupportMessageItem {
  return {
    id: message.id,
    conversationId: message.conversationId,
    authorType: message.authorType,
    authorUserId: message.authorUserId,
    body: message.body,
    createdAt: message.createdAt.toISOString(),
  }
}

async function emitSupportRealtimeEvent(event: SupportRealtimeEvent) {
  try {
    await publishSupportEvent(event)
  } catch (error) {
    console.error("Failed to publish support event", error)
  }
}

export async function getSupportThreadForRequester(requesterUserId: string) {
  const conversation = await prisma.supportConversation.findUnique({
    where: {
      requesterUserId,
    },
    select: conversationSummarySelect,
  })

  return conversation ? serializeConversationSummary(conversation) : null
}

export async function getSupportMessagesForRequester(
  requesterUserId: string
): Promise<SupportThreadMessagesResponse> {
  const conversation = await prisma.supportConversation.findUnique({
    where: {
      requesterUserId,
    },
    select: {
      id: true,
      messages: {
        orderBy: {
          createdAt: "asc",
        },
        select: messageSelect,
      },
    },
  })

  return {
    conversationId: conversation?.id ?? null,
    messages: conversation?.messages.map(serializeMessage) ?? [],
  }
}

export async function listAdminSupportConversations(input: {
  search?: string
  status?: SupportConversationStatus | "ALL"
}) {
  const search = input.search?.trim()
  const conversations = await prisma.supportConversation.findMany({
    where: {
      ...(input.status && input.status !== "ALL"
        ? {
            status: input.status,
          }
        : {}),
      ...(search
        ? {
            requester: {
              OR: [
                {
                  name: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  email: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  companyName: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              ],
            },
          }
        : {}),
    },
    orderBy: {
      lastMessageAt: "desc",
    },
    select: conversationSummarySelect,
  })

  return conversations.map(serializeConversationSummary)
}

export async function getAdminSupportConversationMessages(
  conversationId: string
): Promise<AdminSupportConversationMessagesResponse | null> {
  const conversation = await prisma.supportConversation.findUnique({
    where: {
      id: conversationId,
    },
    select: {
      ...conversationSummarySelect,
      messages: {
        orderBy: {
          createdAt: "asc",
        },
        select: messageSelect,
      },
    },
  })

  if (!conversation) {
    return null
  }

  return {
    conversation: serializeConversationSummary(conversation),
    messages: conversation.messages.map(serializeMessage),
  }
}

export async function sendRequesterSupportMessage(input: {
  requesterUserId: string
  body: string
}) {
  const normalizedBody = normalizeMessageBody(input.body)
  if (!normalizedBody || normalizedBody.length > SUPPORT_MESSAGE_LIMIT) {
    throw new Error("INVALID_SUPPORT_MESSAGE")
  }

  await enforceRateLimit({
    scope: "support-message-user",
    key: input.requesterUserId,
    limit: 10,
    windowMs: 5 * 60 * 1000,
    message: "Too many support messages. Please try again shortly.",
  })

  const now = new Date()
  const result = await prisma.$transaction(async (tx) => {
    const requester = await tx.user.findUnique({
      where: {
        id: input.requesterUserId,
      },
      select: {
        ...requesterSelect,
        language: true,
      },
    })

    if (!requester) {
      throw new Error("REQUESTER_NOT_FOUND")
    }

    const existingConversation = await tx.supportConversation.findUnique({
      where: {
        requesterUserId: input.requesterUserId,
      },
      select: {
        id: true,
        status: true,
      },
    })

    const conversation = await tx.supportConversation.upsert({
      where: {
        requesterUserId: input.requesterUserId,
      },
      create: {
        requesterUserId: input.requesterUserId,
        status: "OPEN",
        lastMessageAt: now,
        lastUserMessageAt: now,
        lastReadByUserAt: now,
        closedAt: null,
      },
      update: {
        status: "OPEN",
        lastMessageAt: now,
        lastUserMessageAt: now,
        lastReadByUserAt: now,
        closedAt: null,
      },
      select: {
        id: true,
      },
    })

    const message = await tx.supportMessage.create({
      data: {
        conversationId: conversation.id,
        authorUserId: input.requesterUserId,
        authorType: "USER",
        body: normalizedBody,
      },
      select: messageSelect,
    })

    const updatedConversation = await tx.supportConversation.findUnique({
      where: {
        id: conversation.id,
      },
      select: conversationSummarySelect,
    })

    if (!updatedConversation) {
      throw new Error("SUPPORT_CONVERSATION_NOT_FOUND")
    }

    if (!existingConversation) {
      await recordAuditEvent(tx, {
        actorUserId: input.requesterUserId,
        targetUserId: input.requesterUserId,
        domain: "SUPPORT",
        action: "SUPPORT_CONVERSATION_CREATED",
        entityType: "SupportConversation",
        entityId: conversation.id,
      })
    } else if (existingConversation.status === "CLOSED") {
      await recordAuditEvent(tx, {
        actorUserId: input.requesterUserId,
        targetUserId: input.requesterUserId,
        domain: "SUPPORT",
        action: "SUPPORT_CONVERSATION_REOPENED",
        entityType: "SupportConversation",
        entityId: conversation.id,
      })
    }

    await recordAuditEvent(tx, {
      actorUserId: input.requesterUserId,
      targetUserId: input.requesterUserId,
      domain: "SUPPORT",
      action: "SUPPORT_MESSAGE_SENT",
      entityType: "SupportMessage",
      entityId: message.id,
      metadata: {
        conversationId: conversation.id,
        authorType: "USER",
      },
    })

    return {
      requester,
      message,
      conversation: updatedConversation,
    }
  })

  void emitSupportRealtimeEvent({
    conversationId: result.conversation.id,
    requesterUserId: input.requesterUserId,
    event: "message.created",
    actorType: "USER",
    updatedAt: now.toISOString(),
  })

  void sendSupportNotificationEmail({
    to:
      process.env.SUPPORT_NOTIFICATION_EMAIL ??
      "nicolas.ivorra.ni@gmail.com",
    requesterName: result.requester.name,
    requesterEmail: result.requester.email,
    requesterCompanyName: result.requester.companyName,
    messagePreview: result.message.body,
    conversationUrl: `${
      process.env.NEXT_PUBLIC_APP_URL ??
      process.env.BETTER_AUTH_URL ??
      "http://localhost:3000"
    }/dashboard/admin/conversations?conversation=${result.conversation.id}`,
    locale: result.requester.language === "en" ? "en" : "fr",
  }).catch((error) => {
    console.error("Failed to send support notification email", error)
  })

  return {
    conversation: serializeConversationSummary(result.conversation),
    message: serializeMessage(result.message),
  }
}

export async function sendAdminSupportMessage(input: {
  adminUserId: string
  conversationId: string
  body: string
}) {
  const normalizedBody = normalizeMessageBody(input.body)
  if (!normalizedBody || normalizedBody.length > SUPPORT_MESSAGE_LIMIT) {
    throw new Error("INVALID_SUPPORT_MESSAGE")
  }

  const now = new Date()
  const result = await prisma.$transaction(async (tx) => {
    const existingConversation = await tx.supportConversation.findUnique({
      where: {
        id: input.conversationId,
      },
      select: {
        id: true,
        requesterUserId: true,
        status: true,
      },
    })

    if (!existingConversation) {
      throw new Error("SUPPORT_CONVERSATION_NOT_FOUND")
    }

    await tx.supportConversation.update({
      where: {
        id: input.conversationId,
      },
      data: {
        status: "OPEN",
        closedAt: null,
        lastMessageAt: now,
        lastAdminMessageAt: now,
        lastReadByAdminAt: now,
      },
    })

    const message = await tx.supportMessage.create({
      data: {
        conversationId: input.conversationId,
        authorUserId: input.adminUserId,
        authorType: "ADMIN",
        body: normalizedBody,
      },
      select: messageSelect,
    })

    const conversation = await tx.supportConversation.findUnique({
      where: {
        id: input.conversationId,
      },
      select: conversationSummarySelect,
    })

    if (!conversation) {
      throw new Error("SUPPORT_CONVERSATION_NOT_FOUND")
    }

    if (existingConversation.status === "CLOSED") {
      await recordAuditEvent(tx, {
        actorUserId: input.adminUserId,
        targetUserId: existingConversation.requesterUserId,
        domain: "SUPPORT",
        action: "SUPPORT_CONVERSATION_REOPENED",
        entityType: "SupportConversation",
        entityId: input.conversationId,
      })
    }

    await recordAuditEvent(tx, {
      actorUserId: input.adminUserId,
      targetUserId: existingConversation.requesterUserId,
      domain: "SUPPORT",
      action: "SUPPORT_MESSAGE_SENT",
      entityType: "SupportMessage",
      entityId: message.id,
      metadata: {
        conversationId: input.conversationId,
        authorType: "ADMIN",
      },
    })

    return {
      conversation,
      message,
      requesterUserId: existingConversation.requesterUserId,
    }
  })

  void emitSupportRealtimeEvent({
    conversationId: result.conversation.id,
    requesterUserId: result.requesterUserId,
    event: "message.created",
    actorType: "ADMIN",
    updatedAt: now.toISOString(),
  })

  return {
    conversation: serializeConversationSummary(result.conversation),
    message: serializeMessage(result.message),
  }
}

export async function markRequesterSupportThreadRead(requesterUserId: string) {
  const conversation = await prisma.supportConversation.findUnique({
    where: {
      requesterUserId,
    },
    select: {
      id: true,
    },
  })

  if (!conversation) {
    return null
  }

  const updatedConversation = await prisma.supportConversation.update({
    where: {
      id: conversation.id,
    },
    data: {
      lastReadByUserAt: new Date(),
    },
    select: conversationSummarySelect,
  })

  void emitSupportRealtimeEvent({
    conversationId: updatedConversation.id,
    requesterUserId,
    event: "conversation.read",
    actorType: "USER",
    updatedAt: updatedConversation.updatedAt.toISOString(),
  })

  return serializeConversationSummary(updatedConversation)
}

export async function markAdminSupportConversationRead(
  adminUserId: string,
  conversationId: string
) {
  const updatedConversation = await prisma.supportConversation.update({
    where: {
      id: conversationId,
    },
    data: {
      lastReadByAdminAt: new Date(),
    },
    select: conversationSummarySelect,
  })

  await recordAuditEventSafe(prisma, {
    actorUserId: adminUserId,
    targetUserId: updatedConversation.requester.id,
    domain: "SUPPORT",
    action: "SUPPORT_CONVERSATION_READ",
    entityType: "SupportConversation",
    entityId: conversationId,
  })

  void emitSupportRealtimeEvent({
    conversationId: updatedConversation.id,
    requesterUserId: updatedConversation.requester.id,
    event: "conversation.read",
    actorType: "ADMIN",
    updatedAt: updatedConversation.updatedAt.toISOString(),
  })

  return serializeConversationSummary(updatedConversation)
}

export async function updateAdminSupportConversationStatus(input: {
  adminUserId: string
  conversationId: string
  status: SupportConversationStatus
}) {
  const updatedConversation = await prisma.supportConversation.update({
    where: {
      id: input.conversationId,
    },
    data: {
      status: input.status,
      closedAt: input.status === "CLOSED" ? new Date() : null,
    },
    select: conversationSummarySelect,
  })

  await recordAuditEventSafe(prisma, {
    actorUserId: input.adminUserId,
    targetUserId: updatedConversation.requester.id,
    domain: "SUPPORT",
    action:
      input.status === "CLOSED"
        ? "SUPPORT_CONVERSATION_CLOSED"
        : "SUPPORT_CONVERSATION_REOPENED",
    entityType: "SupportConversation",
    entityId: input.conversationId,
  })

  void emitSupportRealtimeEvent({
    conversationId: updatedConversation.id,
    requesterUserId: updatedConversation.requester.id,
    event: "conversation.updated",
    actorType: "ADMIN",
    updatedAt: updatedConversation.updatedAt.toISOString(),
  })

  return serializeConversationSummary(updatedConversation)
}
