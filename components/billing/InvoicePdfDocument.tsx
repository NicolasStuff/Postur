import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer"

interface InvoicePdfDocumentProps {
  locale: "fr" | "en"
  invoice: {
    number: string
    date: Date | string
    amount: number
    subtotalAmount: number
    vatAmount: number
    vatRate: number | null
    serviceName?: string | null
    patient: {
      firstName: string
      lastName: string
      address?: string | null
    }
    user: {
      name: string | null
      email: string
      practitionerType: string | null
      siret: string | null
      companyName: string | null
      companyAddress: string | null
      isVatExempt: boolean
    }
  }
}

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#0f172a",
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 2,
    color: "#64748b",
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: "#475569",
  },
  metadataCard: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 16,
    minWidth: 180,
  },
  metadataLabel: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 2,
    color: "#94a3b8",
    marginBottom: 4,
  },
  metadataValue: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 8,
  },
  grid: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  panel: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 16,
  },
  panelTitle: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 2,
    color: "#94a3b8",
    marginBottom: 10,
  },
  line: {
    marginBottom: 4,
    color: "#475569",
  },
  strong: {
    fontWeight: 700,
    color: "#0f172a",
  },
  tableHeader: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
    paddingVertical: 10,
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: "row",
    paddingBottom: 14,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  description: {
    flex: 1,
    paddingRight: 12,
  },
  quantity: {
    width: 70,
    textAlign: "center",
  },
  amount: {
    width: 120,
    textAlign: "right",
  },
  totals: {
    marginTop: 8,
    marginLeft: "auto",
    width: 220,
    gap: 8,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    color: "#475569",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#0f172a",
    fontSize: 15,
    fontWeight: 700,
  },
  legal: {
    marginTop: 28,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
    borderRadius: 14,
    fontSize: 10,
    color: "#475569",
  },
})

function getLabels(locale: "fr" | "en") {
  if (locale === "en") {
    return {
      document: "Invoice",
      invoiceNumber: "Invoice number",
      date: "Date",
      issuer: "Issuer",
      patient: "Patient",
      description: "Description",
      quantity: "Qty",
      amountTtc: "Amount incl. VAT",
      subtotalHt: "Subtotal excl. VAT",
      vat: "VAT",
      total: "Total",
      siret: "SIRET",
      vatNoticeExempt: "VAT not applicable, art. 293 B of the French Tax Code.",
      vatNoticeApplied: "VAT applied according to the issuer profile.",
      practitionerType:
        locale === "en" ? "Osteopath D.O." : "Ostéopathe D.O.",
    }
  }

  return {
    document: "Facture",
    invoiceNumber: "N° facture",
    date: "Date",
    issuer: "Émetteur",
    patient: "Patient",
    description: "Description",
    quantity: "Qté",
    amountTtc: "Montant TTC",
    subtotalHt: "Sous-total HT",
    vat: "TVA",
    total: "Total",
    siret: "SIRET",
    vatNoticeExempt: "TVA non applicable, art. 293 B du CGI.",
    vatNoticeApplied: "TVA appliquée selon le profil de facturation du praticien.",
    practitionerType: "Ostéopathe D.O.",
  }
}

function formatDate(date: Date | string, locale: "fr" | "en") {
  return new Date(date).toLocaleDateString(locale === "en" ? "en-GB" : "fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

function formatCurrency(value: number, locale: "fr" | "en") {
  return new Intl.NumberFormat(locale === "en" ? "en-GB" : "fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(value)
}

export function InvoicePdfDocument({ invoice, locale }: InvoicePdfDocumentProps) {
  const labels = getLabels(locale)
  const companyLabel = invoice.user.companyName || invoice.user.name || labels.practitionerType

  return (
    <Document title={invoice.number}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>{labels.document}</Text>
            <Text style={styles.title}>{companyLabel}</Text>
            {invoice.user.name && invoice.user.companyName ? (
              <Text style={styles.subtitle}>{invoice.user.name}</Text>
            ) : null}
            <Text style={styles.subtitle}>{labels.practitionerType}</Text>
          </View>

          <View style={styles.metadataCard}>
            <Text style={styles.metadataLabel}>{labels.invoiceNumber}</Text>
            <Text style={styles.metadataValue}>{invoice.number}</Text>
            <Text style={styles.subtitle}>
              {labels.date}: {formatDate(invoice.date, locale)}
            </Text>
          </View>
        </View>

        <View style={styles.grid}>
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>{labels.issuer}</Text>
            <Text style={[styles.line, styles.strong]}>{invoice.user.name || companyLabel}</Text>
            {invoice.user.companyAddress ? <Text style={styles.line}>{invoice.user.companyAddress}</Text> : null}
            <Text style={styles.line}>{invoice.user.email}</Text>
            {invoice.user.siret ? <Text style={styles.line}>{labels.siret}: {invoice.user.siret}</Text> : null}
          </View>

          <View style={styles.panel}>
            <Text style={styles.panelTitle}>{labels.patient}</Text>
            <Text style={[styles.line, styles.strong]}>
              {invoice.patient.firstName} {invoice.patient.lastName}
            </Text>
            {invoice.patient.address ? <Text style={styles.line}>{invoice.patient.address}</Text> : null}
          </View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={styles.description}>{labels.description}</Text>
          <Text style={styles.quantity}>{labels.quantity}</Text>
          <Text style={styles.amount}>{labels.amountTtc}</Text>
        </View>

        <View style={styles.tableRow}>
          <View style={styles.description}>
            <Text style={[styles.line, styles.strong]}>{invoice.serviceName || labels.document}</Text>
            <Text style={styles.line}>{labels.practitionerType}</Text>
          </View>
          <Text style={styles.quantity}>1</Text>
          <Text style={styles.amount}>{formatCurrency(invoice.amount, locale)}</Text>
        </View>

        <View style={styles.totals}>
          <View style={styles.totalsRow}>
            <Text>{labels.subtotalHt}</Text>
            <Text>{formatCurrency(invoice.subtotalAmount, locale)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text>{invoice.vatRate ? `${labels.vat} (${invoice.vatRate.toFixed(2)}%)` : labels.vat}</Text>
            <Text>{formatCurrency(invoice.vatAmount, locale)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>{labels.total}</Text>
            <Text>{formatCurrency(invoice.amount, locale)}</Text>
          </View>
        </View>

        <View style={styles.legal}>
          <Text>{invoice.user.isVatExempt ? labels.vatNoticeExempt : labels.vatNoticeApplied}</Text>
        </View>
      </Page>
    </Document>
  )
}
