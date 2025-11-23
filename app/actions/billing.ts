"use server"

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { getErrorMessage } from "@/lib/i18n/errors";

export async function getInvoices() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return [];

    const invoices = await prisma.invoice.findMany({
        where: { userId: session.user.id },
        include: { patient: true },
        orderBy: { date: 'desc' }
    })

    // Convert Decimal to number for client components
    return invoices.map(invoice => ({
        ...invoice,
        amount: invoice.amount.toNumber()
    }))
}

export async function createInvoice(data: { patientId: string, amount: number }) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        throw new Error(await getErrorMessage("unauthorized"));
    }

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

export async function updateInvoiceStatus(invoiceId: string, status: 'DRAFT' | 'SENT' | 'PAID') {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        throw new Error(await getErrorMessage("unauthorized"));
    }

    // Verify ownership
    const invoice = await prisma.invoice.findFirst({
        where: { id: invoiceId, userId: session.user.id }
    });
    if (!invoice) {
        throw new Error(await getErrorMessage("invoiceNotFound"));
    }

    return await prisma.invoice.update({
        where: { id: invoiceId },
        data: { status }
    });
}

export async function deleteInvoice(invoiceId: string) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        throw new Error(await getErrorMessage("unauthorized"));
    }

    // Verify ownership
    const invoice = await prisma.invoice.findFirst({
        where: { id: invoiceId, userId: session.user.id }
    });
    if (!invoice) {
        throw new Error(await getErrorMessage("invoiceNotFound"));
    }

    return await prisma.invoice.delete({
        where: { id: invoiceId }
    });
}

export async function getInvoiceDetails(invoiceId: string) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        throw new Error(await getErrorMessage("unauthorized"));
    }

    const invoice = await prisma.invoice.findFirst({
        where: { id: invoiceId, userId: session.user.id },
        include: {
            patient: true,
            user: {
                select: {
                    name: true,
                    email: true,
                    practitionerType: true,
                    siret: true,
                    companyName: true,
                    companyAddress: true,
                    isVatExempt: true
                }
            }
        }
    });

    if (!invoice) {
        throw new Error(await getErrorMessage("invoiceNotFound"));
    }

    return {
        ...invoice,
        amount: invoice.amount.toNumber()
    };
}
