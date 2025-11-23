"use server"
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function getAppointments(start: Date, end: Date) {
    const session = await auth.api.getSession({
        headers: await headers()
    })
    if (!session) return [];

    return await prisma.appointment.findMany({
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
}

export async function createAppointment(data: { patientId: string, serviceId: string, start: Date, end: Date }) {
    const session = await auth.api.getSession({
        headers: await headers()
    })
    if (!session) throw new Error("Unauthorized");

    return await prisma.appointment.create({
        data: {
            ...data,
            userId: session.user.id
        }
    })
}
