"use server"

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { getErrorMessage } from "@/lib/i18n/errors";

export async function getServices() {
    const session = await auth.api.getSession({
        headers: await headers()
    })
    if (!session) return [];

    const services = await prisma.service.findMany({
        where: { userId: session.user.id }
    })

    // Convert Decimal to number for client components
    return services.map(service => ({
        ...service,
        price: service.price.toNumber()
    }))
}

export async function createService(data: { name: string, duration: number, price: number }) {
    const session = await auth.api.getSession({
        headers: await headers()
    })
    if (!session) {
        throw new Error(await getErrorMessage("unauthorized"));
    }

    const service = await prisma.service.create({
        data: {
            ...data,
            userId: session.user.id
        }
    })

    return { ...service, price: service.price.toNumber() }
}
