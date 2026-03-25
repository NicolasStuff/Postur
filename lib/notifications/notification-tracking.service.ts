import type {
  AppointmentNotification,
  NotificationChannel,
  NotificationKind,
  NotificationProvider,
  NotificationStatus,
  Prisma,
  PrismaClient,
} from "@prisma/client"

type DbLike = Prisma.TransactionClient | PrismaClient

const TERMINAL_STATUSES = new Set<NotificationStatus>([
  "DELIVERED",
  "FAILED",
  "BOUNCED",
  "UNDELIVERABLE",
  "UNDELIVERED",
  "COMPLAINED",
  "SUPPRESSED",
])

const FAILURE_STATUSES = new Set<NotificationStatus>([
  "FAILED",
  "BOUNCED",
  "UNDELIVERABLE",
  "UNDELIVERED",
  "COMPLAINED",
  "SUPPRESSED",
])

const SENT_LIKE_STATUSES = new Set<NotificationStatus>([
  "SENT",
  "ENROUTE",
  "DELIVERED",
  "DELIVERY_DELAYED",
])

export function isTerminalNotificationStatus(status: NotificationStatus): boolean {
  return TERMINAL_STATUSES.has(status)
}

function buildTransitionPatch(params: {
  current: AppointmentNotification
  nextStatus: NotificationStatus
  eventAt: Date
  providerStatus?: string | null
  errorCode?: string | null
  errorMessage?: string | null
  providerMessageId?: string | null
}): Prisma.AppointmentNotificationUncheckedUpdateInput {
  const currentIsTerminal = isTerminalNotificationStatus(params.current.status)
  const nextIsTerminal = isTerminalNotificationStatus(params.nextStatus)
  const shouldKeepCurrentStatus = currentIsTerminal && !nextIsTerminal
  const effectiveStatus = shouldKeepCurrentStatus ? params.current.status : params.nextStatus

  const patch: Prisma.AppointmentNotificationUncheckedUpdateInput = {
    providerStatus: params.providerStatus ?? null,
    errorCode: params.errorCode ?? null,
    errorMessage: params.errorMessage ?? null,
    providerMessageId: params.providerMessageId ?? params.current.providerMessageId,
    lastEventAt: params.eventAt,
  }

  if (!shouldKeepCurrentStatus) {
    patch.status = params.nextStatus
  }

  if (SENT_LIKE_STATUSES.has(effectiveStatus) && !params.current.sentAt) {
    patch.sentAt = params.eventAt
  }

  if (effectiveStatus === "DELIVERED" && !params.current.deliveredAt) {
    patch.deliveredAt = params.eventAt
  }

  if (FAILURE_STATUSES.has(effectiveStatus) && !params.current.failedAt) {
    patch.failedAt = params.eventAt
  }

  return patch
}

export async function createNotificationAttempt(
  db: DbLike,
  params: {
    appointmentId: string
    kind: NotificationKind
    channel: NotificationChannel
    provider: NotificationProvider
    recipient: string
    status: NotificationStatus
    providerMessageId?: string | null
    providerStatus?: string | null
    errorCode?: string | null
    errorMessage?: string | null
    metadata?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput
    at?: Date
  },
): Promise<AppointmentNotification> {
  const at = params.at ?? new Date()

  return db.appointmentNotification.create({
    data: {
      appointmentId: params.appointmentId,
      kind: params.kind,
      channel: params.channel,
      provider: params.provider,
      recipient: params.recipient,
      providerMessageId: params.providerMessageId ?? null,
      status: params.status,
      providerStatus: params.providerStatus ?? null,
      errorCode: params.errorCode ?? null,
      errorMessage: params.errorMessage ?? null,
      metadata: params.metadata,
      sentAt: SENT_LIKE_STATUSES.has(params.status) ? at : null,
      deliveredAt: params.status === "DELIVERED" ? at : null,
      failedAt: FAILURE_STATUSES.has(params.status) ? at : null,
      lastEventAt: at,
    },
  })
}

export async function transitionNotificationStatus(
  db: DbLike,
  params: {
    notificationId: string
    nextStatus: NotificationStatus
    providerStatus?: string | null
    errorCode?: string | null
    errorMessage?: string | null
    providerMessageId?: string | null
    eventAt?: Date
  },
): Promise<AppointmentNotification> {
  const current = await db.appointmentNotification.findUnique({
    where: { id: params.notificationId },
  })

  if (!current) {
    throw new Error("Notification attempt not found")
  }

  const eventAt = params.eventAt ?? new Date()
  const patch = buildTransitionPatch({
    current,
    nextStatus: params.nextStatus,
    eventAt,
    providerStatus: params.providerStatus,
    errorCode: params.errorCode,
    errorMessage: params.errorMessage,
    providerMessageId: params.providerMessageId,
  })

  return db.appointmentNotification.update({
    where: { id: current.id },
    data: patch,
  })
}

export async function findNotificationByProviderMessageId(
  db: DbLike,
  params: {
    provider: NotificationProvider
    providerMessageId: string
  },
): Promise<AppointmentNotification | null> {
  return db.appointmentNotification.findFirst({
    where: {
      provider: params.provider,
      providerMessageId: params.providerMessageId,
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function recordNotificationEvent(
  db: DbLike,
  params: {
    notificationId: string
    source: NotificationProvider
    externalEventType: string
    externalStatus?: string | null
    dedupeKey: string
    payload: Prisma.InputJsonValue
    receivedAt?: Date
  },
): Promise<{ created: boolean }> {
  try {
    await db.appointmentNotificationEvent.create({
      data: {
        notificationId: params.notificationId,
        source: params.source,
        externalEventType: params.externalEventType,
        externalStatus: params.externalStatus ?? null,
        dedupeKey: params.dedupeKey,
        payload: params.payload,
        receivedAt: params.receivedAt ?? new Date(),
      },
    })
    return { created: true }
  } catch (err) {
    if (
      err instanceof Error &&
      "code" in err &&
      (err as { code?: string }).code === "P2002"
    ) {
      return { created: false }
    }
    throw err
  }
}

export function mapSmsmodeStatusToNotificationStatus(
  rawStatus: string,
): NotificationStatus {
  const normalized = rawStatus.trim().toUpperCase()
  switch (normalized) {
    case "SCHEDULED":
    case "ENROUTE":
      return "ENROUTE"
    case "DELIVERED":
      return "DELIVERED"
    case "UNDELIVERABLE":
      return "UNDELIVERABLE"
    case "UNDELIVERED":
      return "UNDELIVERED"
    default:
      return "UNKNOWN"
  }
}

export function mapResendEventToNotificationStatus(
  eventType: string,
): NotificationStatus | null {
  switch (eventType) {
    case "email.sent":
    case "email.scheduled":
      return "SENT"
    case "email.delivered":
      return "DELIVERED"
    case "email.delivery_delayed":
      return "DELIVERY_DELAYED"
    case "email.bounced":
      return "BOUNCED"
    case "email.failed":
      return "FAILED"
    case "email.complained":
      return "COMPLAINED"
    case "email.suppressed":
      return "SUPPRESSED"
    case "email.opened":
    case "email.clicked":
      return null
    default:
      return "UNKNOWN"
  }
}
