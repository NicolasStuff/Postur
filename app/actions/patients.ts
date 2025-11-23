"use server"

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { getErrorMessage } from "@/lib/i18n/errors";

export async function getPatients() {
    const session = await auth.api.getSession({
        headers: await headers()
    })
    if (!session) return [];

    return await prisma.patient.findMany({
        where: { userId: session.user.id },
        orderBy: { updatedAt: 'desc' }
    })
}

export async function createPatient(data: { firstName: string, lastName: string, email?: string, phone?: string }) {
    const session = await auth.api.getSession({
        headers: await headers()
    })
    if (!session) {
        throw new Error(await getErrorMessage("unauthorized"));
    }

    return await prisma.patient.create({
        data: {
            ...data,
            userId: session.user.id
        }
    })
}
