"use server"

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

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
    practitionerType?: "OSTEOPATH" | "NATUROPATH" | "SOPHROLOGIST",
    openingHours?: any
}) {
    const session = await auth.api.getSession({
        headers: await headers()
    })
    if (!session) throw new Error("Unauthorized");

    return await prisma.user.update({
        where: { id: session.user.id },
        data: data
    })
}
