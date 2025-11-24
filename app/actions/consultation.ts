"use server"
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { getErrorMessage } from "@/lib/i18n/errors";

export async function getConsultations() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return [];

    const appointments = await prisma.appointment.findMany({
        where: {
            userId: session.user.id,
        },
        include: {
            patient: true,
            note: true,
            service: true
        },
        orderBy: { start: 'desc' }
    })

    // Convert Decimal objects to numbers for Client Components
    return appointments.map(appointment => ({
        ...appointment,
        service: appointment.service ? {
            ...appointment.service,
            price: appointment.service.price.toNumber()
        } : null
    }))
}

export async function getConsultation(appointmentId: string) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return null;

    // Ensure the appointment belongs to the user
    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId, userId: session.user.id },
        include: {
            note: true,
            patient: {
                include: { appointments: { orderBy: { start: 'desc' }, take: 5, include: { note: true, service: true } } }
            },
            user: {
                select: {
                    practitionerType: true,
                    name: true
                }
            },
            service: true
        }
    })

    if (!appointment) return null;

    // Convert Decimal objects to numbers for Client Components
    return {
        ...appointment,
        service: appointment.service ? {
            ...appointment.service,
            price: appointment.service.price.toNumber()
        } : null,
        patient: {
            ...appointment.patient,
            appointments: appointment.patient.appointments.map(apt => ({
                ...apt,
                service: apt.service ? {
                    ...apt.service,
                    price: apt.service.price.toNumber()
                } : null
            }))
        }
    }
}

export async function saveConsultationNote(appointmentId: string, content: unknown) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        throw new Error(await getErrorMessage("unauthorized"));
    }

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

export async function saveBodyChartHistory(appointmentId: string, selectedParts: string[]) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        throw new Error(await getErrorMessage("unauthorized"));
    }

    // Verify the appointment belongs to the user
    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId, userId: session.user.id },
        include: { note: true }
    });

    if (!appointment) {
        throw new Error(await getErrorMessage("appointmentNotFound"));
    }

    // Get the consultation note ID (create if doesn't exist)
    let note = appointment.note;
    if (!note) {
        note = await prisma.consultationNote.create({
            data: {
                appointmentId,
                content: {}
            }
        });
    }

    // Only save if there are changes from the last history entry
    const lastHistory = await prisma.bodyChartHistory.findFirst({
        where: { consultationNoteId: note.id },
        orderBy: { createdAt: 'desc' }
    });

    // Compare with last history entry
    const hasChanges = !lastHistory ||
        JSON.stringify(lastHistory.selectedParts.sort()) !== JSON.stringify(selectedParts.sort());

    if (hasChanges && selectedParts.length > 0) {
        return await prisma.bodyChartHistory.create({
            data: {
                consultationNoteId: note.id,
                selectedParts
            }
        });
    }

    return lastHistory;
}

export async function getBodyChartHistory(appointmentId: string) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        throw new Error(await getErrorMessage("unauthorized"));
    }

    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId, userId: session.user.id },
        include: {
            note: {
                include: {
                    bodyChartHistory: {
                        orderBy: { createdAt: 'desc' }
                    }
                }
            }
        }
    });

    return appointment?.note?.bodyChartHistory || [];
}
