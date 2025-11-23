"use server"
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { getErrorMessage } from "@/lib/i18n/errors";

export async function getAppointments(start: Date, end: Date) {
    const session = await auth.api.getSession({
        headers: await headers()
    })
    if (!session) return [];

    const appointments = await prisma.appointment.findMany({
        where: {
            userId: session.user.id,
            start: { gte: start },
            end: { lte: end }
        },
        include: {
            patient: true,
            service: true
        }
    })

    // Convert Decimal to number for client components
    return appointments.map(apt => ({
        ...apt,
        service: {
            ...apt.service,
            price: apt.service.price.toNumber()
        }
    }))
}

export async function createAppointment(data: { patientId: string, serviceId: string, start: Date, end: Date }) {
    const session = await auth.api.getSession({
        headers: await headers()
    })
    if (!session) {
        throw new Error(await getErrorMessage("unauthorized"));
    }

    return await prisma.appointment.create({
        data: {
            ...data,
            userId: session.user.id
        }
    })
}
