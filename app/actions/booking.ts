"use server"

import { Prisma } from "@prisma/client"

import {
  BOOKING_TIMEZONE,
  generateAvailableSlots,
  getParisDateTime,
  isSlotAlignedToOpeningHours,
  isSlotInsideOpeningHours,
  parseOpeningHours,
  publicBookingSchema,
  type OpeningHoursConfig,
} from "@/lib/booking"
import { getErrorMessage } from "@/lib/i18n/errors"
import { prisma } from "@/lib/prisma"
import { enforceRateLimit } from "@/lib/rate-limit"
import { getRequestIp } from "@/lib/request"

type PractitionerType = "OSTEOPATH"

export type PublicPractitioner = {
  id: string
  name: string | null
  practitionerType: PractitionerType | null
  companyName: string | null
  companyAddress: string | null
  image: string | null
  services: Array<{
    id: string
    name: string
    duration: number
    price: number
  }>
}

export async function getPractitionerBySlug(slug: string): Promise<PublicPractitioner | null> {
  const user = await prisma.user.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      practitionerType: true,
      companyName: true,
      companyAddress: true,
      image: true,
      services: {
        select: {
          id: true,
          name: true,
          duration: true,
          price: true,
        },
      },
    },
  })

  if (!user) {
    return null
  }

  return {
    ...user,
    services: user.services.map((service) => ({
      id: service.id,
      name: service.name,
      duration: service.duration,
      price: service.price.toNumber(),
    })),
  }
}

async function getPublicBookingContext(slug: string, serviceId: string) {
  const practitioner = await prisma.user.findUnique({
    where: { slug },
    select: {
      id: true,
      openingHours: true,
      services: {
        where: { id: serviceId },
        select: {
          id: true,
          duration: true,
        },
      },
    },
  })

  if (!practitioner) {
    throw new Error(await getErrorMessage("practitionerNotFound"))
  }

  const service = practitioner.services[0]
  if (!service) {
    throw new Error(await getErrorMessage("serviceNotFound"))
  }

  return {
    practitionerId: practitioner.id,
    openingHours: parseOpeningHours(practitioner.openingHours),
    service,
  }
}

async function getAppointmentsForPublicDay(
  db: Prisma.TransactionClient | typeof prisma,
  input: { practitionerId: string; date: string }
) {
  const startOfDay = getParisDateTime(input.date, "00:00")
  const endOfDay = getParisDateTime(input.date, "23:59")

  return db.appointment.findMany({
    where: {
      userId: input.practitionerId,
      status: { not: "CANCELED" },
      start: { gte: startOfDay },
      end: { lte: endOfDay },
    },
    select: {
      start: true,
      end: true,
    },
  })
}

function validatePublicBookingSlot(input: {
  openingHours: OpeningHoursConfig
  date: string
  time: string
  duration: number
}) {
  if (getParisDateTime(input.date, input.time).getTime() <= Date.now()) {
    throw new Error("INVALID_PUBLIC_SLOT")
  }

  if (!isSlotInsideOpeningHours({
    openingHours: input.openingHours,
    date: input.date,
    time: input.time,
    durationMinutes: input.duration,
  })) {
    throw new Error("INVALID_PUBLIC_SLOT")
  }

  if (!isSlotAlignedToOpeningHours({
    openingHours: input.openingHours,
    date: input.date,
    time: input.time,
    stepMinutes: 30,
  })) {
    throw new Error("INVALID_PUBLIC_SLOT")
  }
}

export async function getPublicAvailableSlots(input: {
  slug: string
  serviceId: string
  date: string
}) {
  const ip = await getRequestIp()
  await enforceRateLimit({
    scope: "public-availability",
    key: `${ip}:${input.slug}`,
    limit: 60,
    windowMs: 15 * 60 * 1000,
    message: await getErrorMessage("tooManyRequests"),
  })

  const parsedInput = publicBookingSchema.pick({
    slug: true,
    serviceId: true,
    date: true,
  }).safeParse(input)

  if (!parsedInput.success) {
    throw new Error(await getErrorMessage("validationError"))
  }

  const context = await getPublicBookingContext(parsedInput.data.slug, parsedInput.data.serviceId)
  const appointments = await getAppointmentsForPublicDay(prisma, {
    practitionerId: context.practitionerId,
    date: parsedInput.data.date,
  })

  return {
    slots: generateAvailableSlots({
      openingHours: context.openingHours,
      date: parsedInput.data.date,
      serviceDurationMinutes: context.service.duration,
      stepMinutes: 30,
      appointments,
    }),
    timezone: BOOKING_TIMEZONE,
  }
}

export async function createPublicAppointment(data: {
  slug: string
  serviceId: string
  date: string
  time: string
  firstName: string
  lastName: string
  email: string
  phone: string
}) {
  const parsedInput = publicBookingSchema.safeParse(data)
  if (!parsedInput.success) {
    throw new Error(await getErrorMessage("validationError"))
  }

  const ip = await getRequestIp()
  await enforceRateLimit({
    scope: "public-booking-ip",
    key: `${ip}:${parsedInput.data.slug}`,
    limit: 5,
    windowMs: 60 * 60 * 1000,
    message: await getErrorMessage("tooManyRequests"),
  })
  await enforceRateLimit({
    scope: "public-booking-email",
    key: `${parsedInput.data.email.toLowerCase()}:${parsedInput.data.slug}`,
    limit: 3,
    windowMs: 60 * 60 * 1000,
    message: await getErrorMessage("tooManyRequests"),
  })

  const context = await getPublicBookingContext(parsedInput.data.slug, parsedInput.data.serviceId)

  try {
    return await prisma.$transaction(
      async (tx) => {
        validatePublicBookingSlot({
          openingHours: context.openingHours,
          date: parsedInput.data.date,
          time: parsedInput.data.time,
          duration: context.service.duration,
        })

        const start = getParisDateTime(parsedInput.data.date, parsedInput.data.time)
        const end = new Date(start.getTime() + context.service.duration * 60_000)
        const appointments = await getAppointmentsForPublicDay(tx, {
          practitionerId: context.practitionerId,
          date: parsedInput.data.date,
        })

        if (
          appointments.some((appointment) => start < appointment.end && end > appointment.start)
        ) {
          throw new Error(await getErrorMessage("slotNotAvailable"))
        }

        const patient = await tx.patient.upsert({
          where: {
            userId_email: {
              userId: context.practitionerId,
              email: parsedInput.data.email.toLowerCase(),
            },
          },
          create: {
            userId: context.practitionerId,
            firstName: parsedInput.data.firstName.trim(),
            lastName: parsedInput.data.lastName.trim(),
            email: parsedInput.data.email.toLowerCase(),
            phone: parsedInput.data.phone.trim(),
          },
          update: {},
          select: {
            id: true,
          },
        })

        return tx.appointment.create({
          data: {
            userId: context.practitionerId,
            patientId: patient.id,
            serviceId: context.service.id,
            start,
            end,
            status: "PLANNED",
          },
        })
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    )
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_PUBLIC_SLOT") {
      throw new Error(await getErrorMessage("slotNotAvailable"))
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2004" ||
        (typeof error.meta?.database_error === "string" &&
          error.meta.database_error.includes("Appointment_no_overlap")))
    ) {
      throw new Error(await getErrorMessage("slotNotAvailable"))
    }

    throw error
  }
}
