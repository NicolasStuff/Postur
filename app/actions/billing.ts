"use server"

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function getInvoices() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return [];

    return await prisma.invoice.findMany({
        where: { userId: session.user.id },
        include: { patient: true },
        orderBy: { date: 'desc' }
    })
}

export async function createInvoice(data: { patientId: string, amount: number }) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error("Unauthorized");

    // Generate Invoice Number (Simplified)
    const count = await prisma.invoice.count({ where: { userId: session.user.id } });
    const number = `${new Date().getFullYear()}-${(count + 1).toString().padStart(3, '0')}`;

    return await prisma.invoice.create({
        data: {
            userId: session.user.id,
            patientId: data.patientId,
            number,
            amount: data.amount,
            status: 'DRAFT'
        }
    })
}
