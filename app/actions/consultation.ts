"use server"
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function getConsultations() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return [];

    return await prisma.appointment.findMany({
        where: { 
            userId: session.user.id,
        },
        include: { 
            patient: true,
            note: true
        },
        orderBy: { start: 'desc' }
    })
}

export async function getConsultation(appointmentId: string) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return null;

    // Ensure the appointment belongs to the user
    return await prisma.appointment.findUnique({
        where: { id: appointmentId, userId: session.user.id },
        include: { 
            note: true, 
            patient: {
                include: { appointments: { orderBy: { start: 'desc' }, take: 5, include: { note: true } } }
            },
            user: {
                select: {
                    practitionerType: true,
                    name: true
                }
            } 
        }
    })
}

export async function saveConsultationNote(appointmentId: string, content: any) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error("Unauthorized");

    return await prisma.consultationNote.upsert({
        where: { appointmentId },
        create: {
            appointmentId,
            content
        },
        update: {
            content
        }
    })
}
