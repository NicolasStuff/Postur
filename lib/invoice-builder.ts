import { Prisma } from "@prisma/client";

import { getBillingProfileStatus as getBillingProfileStatusFromProfile } from "@/lib/billing";
import {
  buildFacturXDraftXml,
  buildStructuredInvoiceLineItem,
  getFacturXProfileForStatus,
  getFacturXReadinessStatus,
  StructuredInvoiceBuyerType,
  StructuredInvoiceLineItem,
} from "@/lib/facturx";
import { getErrorMessage } from "@/lib/i18n/errors";

export const invoiceIssuerSelect = {
  name: true,
  email: true,
  practitionerType: true,
  siret: true,
  companyName: true,
  companyAddress: true,
  isVatExempt: true,
  defaultVatRate: true,
} satisfies Prisma.UserSelect;

export type BillingUser = Prisma.UserGetPayload<{
  select: typeof invoiceIssuerSelect;
}>;

export function buildInvoiceNumber(lastSequence: number, currentDate: Date) {
  const year = currentDate.getFullYear();
  return `${year}-${String(lastSequence + 1).padStart(3, "0")}`;
}

export function extractInvoiceSequence(number: string, prefix: string) {
  if (!number.startsWith(prefix)) {
    return 0;
  }

  const sequence = Number.parseInt(number.slice(prefix.length), 10);
  return Number.isNaN(sequence) ? 0 : sequence;
}

export async function getNextInvoiceNumber(
  tx: Prisma.TransactionClient,
  userId: string,
  currentDate: Date,
) {
  const prefix = `${currentDate.getFullYear()}-`;
  const invoiceNumbers = await tx.invoice.findMany({
    where: {
      userId,
      number: {
        startsWith: prefix,
      },
    },
    select: {
      number: true,
    },
  });

  const lastSequence = invoiceNumbers.reduce(
    (maxSequence, invoice) =>
      Math.max(maxSequence, extractInvoiceSequence(invoice.number, prefix)),
    0,
  );

  return buildInvoiceNumber(lastSequence, currentDate);
}

export function serializeIssuerSnapshot(user: BillingUser) {
  return {
    name: user.name,
    email: user.email,
    practitionerType: user.practitionerType,
    siret: user.siret,
    companyName: user.companyName,
    companyAddress: user.companyAddress,
    isVatExempt: user.isVatExempt,
    defaultVatRate: user.defaultVatRate ? user.defaultVatRate.toNumber() : null,
  };
}

export async function assertBillingProfileReady(user: BillingUser) {
  const billingStatus = getBillingProfileStatusFromProfile(
    serializeIssuerSnapshot(user),
  );

  if (!billingStatus.ready) {
    throw new Error(await getErrorMessage("billingProfileIncomplete"));
  }

  return billingStatus;
}

export function buildInvoicePatientSnapshot(patient: {
  firstName: string;
  lastName: string;
  address?: string | null;
}) {
  return {
    firstName: patient.firstName,
    lastName: patient.lastName,
    address: patient.address ?? null,
  };
}

export function buildStructuredInvoiceArtifacts(input: {
  number: string;
  date: Date;
  serviceDate: Date;
  dueDate: Date;
  serviceName: string;
  buyerType?: StructuredInvoiceBuyerType;
  buyerCompanyName?: string | null;
  buyerSiren?: string | null;
  buyerVatNumber?: string | null;
  issuerSnapshot: ReturnType<typeof serializeIssuerSnapshot>;
  patientSnapshot: ReturnType<typeof buildInvoicePatientSnapshot>;
  amount: number;
  subtotalAmount: number;
  vatAmount: number;
  vatRate: number | null;
}) {
  const lineItems: StructuredInvoiceLineItem[] = [
    buildStructuredInvoiceLineItem({
      label: input.serviceName,
      amount: input.amount,
      subtotalAmount: input.subtotalAmount,
      vatRate: input.vatRate,
    }),
  ];

  const buyerType = input.buyerType ?? "INDIVIDUAL";
  const structuredInvoice = {
    number: input.number,
    date: input.date,
    serviceDate: input.serviceDate,
    dueDate: input.dueDate,
    currency: "EUR",
    paymentTerms: "Paiement comptant",
    buyerType,
    buyerCompanyName: input.buyerCompanyName,
    buyerSiren: input.buyerSiren,
    buyerVatNumber: input.buyerVatNumber,
    sellerName: input.issuerSnapshot.companyName || input.issuerSnapshot.name,
    sellerAddress: input.issuerSnapshot.companyAddress,
    sellerSiret: input.issuerSnapshot.siret,
    buyerDisplayName:
      `${input.patientSnapshot.firstName} ${input.patientSnapshot.lastName}`.trim(),
    buyerAddress: input.patientSnapshot.address,
    amount: input.amount,
    subtotalAmount: input.subtotalAmount,
    vatAmount: input.vatAmount,
    vatRate: input.vatRate,
    lineItems,
  };

  const facturXStatus = getFacturXReadinessStatus(structuredInvoice);

  return {
    currency: "EUR",
    paymentTerms: "Paiement comptant",
    buyerType,
    buyerCompanyName: input.buyerCompanyName ?? null,
    buyerSiren: input.buyerSiren ?? null,
    buyerVatNumber: input.buyerVatNumber ?? null,
    lineItems: structuredInvoice.lineItems,
    facturXStatus,
    facturXProfile: getFacturXProfileForStatus(facturXStatus),
    facturXXml: buildFacturXDraftXml(structuredInvoice),
  };
}
