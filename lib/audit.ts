import { Prisma } from "@prisma/client"

import { prisma } from "@/lib/prisma"

type AuditClient = Prisma.TransactionClient | typeof prisma

export interface AuditEventInput {
  actorUserId: string
  targetUserId?: string | null
  domain: string
  action: string
  entityType: string
  entityId: string
  metadata?: Prisma.InputJsonValue
}

export async function recordAuditEvent(client: AuditClient, input: AuditEventInput) {
  return client.auditEvent.create({
    data: {
      actorUserId: input.actorUserId,
      targetUserId: input.targetUserId ?? null,
      domain: input.domain,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata ?? Prisma.JsonNull,
    },
  })
}

export async function recordAuditEventSafe(client: AuditClient, input: AuditEventInput) {
  try {
    await recordAuditEvent(client, input)
  } catch (error) {
    console.error("Failed to record audit event", error)
  }
}
