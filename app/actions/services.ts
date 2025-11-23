"use server"

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function getServices() {
    const session = await auth.api.getSession({
        headers: await headers()
    })
    if (!session) return [];

    return await prisma.service.findMany({
        where: { userId: session.user.id }
    })
}

export async function createService(data: { name: string, duration: number, price: number }) {
    const session = await auth.api.getSession({
        headers: await headers()
    })
    if (!session) throw new Error("Unauthorized");

    return await prisma.service.create({
        data: {
            ...data,
            userId: session.user.id
        }
    })
}
