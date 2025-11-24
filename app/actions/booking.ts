"use server"
import { prisma } from "@/lib/prisma";
import { getErrorMessage } from "@/lib/i18n/errors";
import { Prisma } from "@prisma/client";

// Type pour le praticien retourné par getPractitionerBySlug
type PractitionerType = "OSTEOPATH";

export type PublicPractitioner = {
    id: string;
    name: string | null;
    practitionerType: PractitionerType | null;
    companyName: string | null;
    companyAddress: string | null;
    image: string | null;
    openingHours: Prisma.JsonValue;
    services: Array<{
        id: string;
        userId: string;
        name: string;
        duration: number;
        price: number;
        description?: string;
    }>;
};

export async function getPractitionerBySlug(slug: string): Promise<PublicPractitioner | null> {
    const user = await prisma.user.findUnique({
        where: { slug },
        select: {
            id: true,
            name: true,
            practitionerType: true,
            companyName: true,
            companyAddress: true,
            services: true,
            image: true,
            openingHours: true
        }
    })

    if (!user) return null

    return {
        ...user,
        services: user.services.map(service => ({
            ...service,
            price: service.price.toNumber()
        }))
    }
}

export async function getPublicAvailability(userId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0,0,0,0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23,59,59,999);

    return await prisma.appointment.findMany({
        where: {
            userId,
            start: { gte: startOfDay },
            end: { lte: endOfDay },
            status: { not: 'CANCELED' }
        },
        select: { start: true, end: true }
    })
}

export async function createPublicAppointment(data: {
    slug: string,
    serviceId: string,
    start: Date,
    firstName: string,
    lastName: string,
    email: string,
    phone: string
}) {
    const practitioner = await prisma.user.findUnique({ where: { slug: data.slug }, include: { services: true } });
    if (!practitioner) {
        throw new Error(await getErrorMessage("practitionerNotFound"));
    }

    const service = practitioner.services.find(s => s.id === data.serviceId);
    if (!service) {
        throw new Error(await getErrorMessage("serviceNotFound"));
    }

    // Find or create patient
    let patient = await prisma.patient.findUnique({
        where: { userId_email: { userId: practitioner.id, email: data.email } }
    });

    if (!patient) {
        patient = await prisma.patient.create({
            data: {
                userId: practitioner.id,
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone
            }
        });
    }

    const end = new Date(new Date(data.start).getTime() + service.duration * 60000);

    return await prisma.appointment.create({
        data: {
            userId: practitioner.id,
            patientId: patient.id,
            serviceId: service.id,
            start: data.start,
            end,
            status: 'PLANNED'
        }
    })
}
