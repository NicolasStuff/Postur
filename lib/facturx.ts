export type FacturXReadinessStatus = "INCOMPLETE" | "BASIC_READY" | "EN16931_CANDIDATE"
export type FacturXProfileName = "BASIC" | "EN16931"
export type StructuredInvoiceBuyerType = "INDIVIDUAL" | "BUSINESS"

export interface StructuredInvoiceLineItem {
  label: string
  quantity: number
  unitPriceInclTax: number
  unitPriceExclTax: number
  totalInclTax: number
  totalExclTax: number
  vatRate: number | null
}

export interface StructuredInvoiceInput {
  number: string
  date: Date | string
  serviceDate?: Date | string | null
  dueDate?: Date | string | null
  currency: string
  paymentTerms?: string | null
  buyerType: StructuredInvoiceBuyerType
  buyerCompanyName?: string | null
  buyerSiren?: string | null
  buyerVatNumber?: string | null
  sellerName?: string | null
  sellerAddress?: string | null
  sellerSiret?: string | null
  sellerVatNumber?: string | null
  buyerDisplayName?: string | null
  buyerAddress?: string | null
  amount: number
  subtotalAmount: number
  vatAmount: number
  vatRate: number | null
  lineItems: StructuredInvoiceLineItem[]
}

function normalizeString(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function toIsoDate(value: Date | string | null | undefined) {
  if (!value) {
    return null
  }

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.toISOString().slice(0, 10)
}

function escapeXml(value: string | null | undefined) {
  const normalized = normalizeString(value)
  if (!normalized) {
    return ""
  }

  return normalized
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
}

function hasValidLines(lineItems: StructuredInvoiceLineItem[]) {
  return lineItems.some(
    (line) =>
      normalizeString(line.label) &&
      Number.isFinite(line.quantity) &&
      line.quantity > 0 &&
      Number.isFinite(line.totalInclTax)
  )
}

export function buildStructuredInvoiceLineItem(input: {
  label: string
  amount: number
  subtotalAmount: number
  vatRate: number | null
}) {
  return {
    label: input.label.trim() || "Consultation",
    quantity: 1,
    unitPriceInclTax: input.amount,
    unitPriceExclTax: input.subtotalAmount,
    totalInclTax: input.amount,
    totalExclTax: input.subtotalAmount,
    vatRate: input.vatRate,
  } satisfies StructuredInvoiceLineItem
}

export function getFacturXReadinessStatus(input: StructuredInvoiceInput): FacturXReadinessStatus {
  const hasCoreFields =
    Boolean(normalizeString(input.number)) &&
    Boolean(toIsoDate(input.date)) &&
    Boolean(toIsoDate(input.serviceDate ?? input.date)) &&
    Boolean(normalizeString(input.currency)) &&
    Boolean(normalizeString(input.sellerName)) &&
    Boolean(normalizeString(input.sellerAddress)) &&
    hasValidLines(input.lineItems)

  if (!hasCoreFields) {
    return "INCOMPLETE"
  }

  if (
    input.buyerType === "BUSINESS" &&
    normalizeString(input.buyerCompanyName) &&
    (normalizeString(input.buyerSiren) || normalizeString(input.buyerVatNumber))
  ) {
    return "EN16931_CANDIDATE"
  }

  return "BASIC_READY"
}

export function getFacturXProfileForStatus(status: FacturXReadinessStatus): FacturXProfileName | null {
  if (status === "EN16931_CANDIDATE") {
    return "EN16931"
  }

  if (status === "BASIC_READY") {
    return "BASIC"
  }

  return null
}

export function buildFacturXDraftXml(input: StructuredInvoiceInput) {
  const readiness = getFacturXReadinessStatus(input)
  if (readiness === "INCOMPLETE") {
    return null
  }

  const issueDate = toIsoDate(input.date)
  const serviceDate = toIsoDate(input.serviceDate ?? input.date)
  const dueDate = toIsoDate(input.dueDate)
  const lineItems = input.lineItems
    .map((line, index) => {
      const lineLabel = escapeXml(line.label)
      const vatRate = line.vatRate ?? 0

      return `
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument>
        <ram:LineID>${index + 1}</ram:LineID>
      </ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct>
        <ram:Name>${lineLabel}</ram:Name>
      </ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:GrossPriceProductTradePrice>
          <ram:ChargeAmount>${line.unitPriceExclTax.toFixed(2)}</ram:ChargeAmount>
        </ram:GrossPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="C62">${line.quantity.toFixed(2)}</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>${vatRate > 0 ? "S" : "E"}</ram:CategoryCode>
          <ram:RateApplicablePercent>${vatRate.toFixed(2)}</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>${line.totalExclTax.toFixed(2)}</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>`
    })
    .join("")

  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice
  xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>${readiness === "EN16931_CANDIDATE" ? "urn:cen.eu:en16931:2017" : "urn:factur-x.eu:1p0:basic"}</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>${escapeXml(input.number)}</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">${issueDate}</udt:DateTimeString>
    </ram:IssueDateTime>
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>${lineItems}
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>${escapeXml(input.sellerName)}</ram:Name>
        <ram:PostalTradeAddress>
          <ram:LineOne>${escapeXml(input.sellerAddress)}</ram:LineOne>
        </ram:PostalTradeAddress>
        ${normalizeString(input.sellerSiret) ? `<ram:SpecifiedLegalOrganization><ram:ID schemeID="0002">${escapeXml(input.sellerSiret)}</ram:ID></ram:SpecifiedLegalOrganization>` : ""}
        ${normalizeString(input.sellerVatNumber) ? `<ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">${escapeXml(input.sellerVatNumber)}</ram:ID></ram:SpecifiedTaxRegistration>` : ""}
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>${escapeXml(input.buyerType === "BUSINESS" ? input.buyerCompanyName : input.buyerDisplayName)}</ram:Name>
        ${normalizeString(input.buyerAddress) ? `<ram:PostalTradeAddress><ram:LineOne>${escapeXml(input.buyerAddress)}</ram:LineOne></ram:PostalTradeAddress>` : ""}
        ${normalizeString(input.buyerSiren) ? `<ram:SpecifiedLegalOrganization><ram:ID schemeID="0002">${escapeXml(input.buyerSiren)}</ram:ID></ram:SpecifiedLegalOrganization>` : ""}
        ${normalizeString(input.buyerVatNumber) ? `<ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">${escapeXml(input.buyerVatNumber)}</ram:ID></ram:SpecifiedTaxRegistration>` : ""}
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeDelivery>
      <ram:ActualDeliverySupplyChainEvent>
        <ram:OccurrenceDateTime>
          <udt:DateTimeString format="102">${serviceDate}</udt:DateTimeString>
        </ram:OccurrenceDateTime>
      </ram:ActualDeliverySupplyChainEvent>
    </ram:ApplicableHeaderTradeDelivery>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>${escapeXml(input.currency || "EUR")}</ram:InvoiceCurrencyCode>
      ${dueDate ? `<ram:SpecifiedTradePaymentTerms><ram:Description>${escapeXml(input.paymentTerms || "Paiement comptant")}</ram:Description><ram:DueDateDateTime><udt:DateTimeString format="102">${dueDate}</udt:DateTimeString></ram:DueDateDateTime></ram:SpecifiedTradePaymentTerms>` : ""}
      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount>${input.vatAmount.toFixed(2)}</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:BasisAmount>${input.subtotalAmount.toFixed(2)}</ram:BasisAmount>
        <ram:CategoryCode>${(input.vatRate ?? 0) > 0 ? "S" : "E"}</ram:CategoryCode>
        <ram:RateApplicablePercent>${(input.vatRate ?? 0).toFixed(2)}</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${input.subtotalAmount.toFixed(2)}</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>${input.subtotalAmount.toFixed(2)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="${escapeXml(input.currency || "EUR")}">${input.vatAmount.toFixed(2)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${input.amount.toFixed(2)}</ram:GrandTotalAmount>
        <ram:DuePayableAmount>${input.amount.toFixed(2)}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`
}
