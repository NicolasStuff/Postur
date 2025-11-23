"use server"

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { getErrorMessage } from "@/lib/i18n/errors";

export async function getUserProfile() {
    const session = await auth.api.getSession({
        headers: await headers()
    })
    if (!session) return null;

    return await prisma.user.findUnique({
        where: { id: session.user.id }
    })
}

export async function updateUserProfile(data: {
    companyName?: string,
    companyAddress?: string,
    siret?: string,
    slug?: string,
    practitionerType?: "OSTEOPATH",
    openingHours?: any,
    language?: string
}) {
    const session = await auth.api.getSession({
        headers: await headers()
    })
    if (!session) {
        throw new Error(await getErrorMessage("unauthorized"));
    }

    return await prisma.user.update({
        where: { id: session.user.id },
        data: data
    })
}
