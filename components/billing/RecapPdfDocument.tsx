import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer"

interface RecapPdfDocumentProps {
  locale: "fr" | "en"
  recap: {
    summary: string
    advice: string[]
    exercises: string[]
    precautions: string[]
    followUp: string
  }
  patient: {
    firstName: string
    lastName: string
  }
  practitioner: {
    name: string
    companyName?: string | null
    companyAddress?: string | null
    siret?: string | null
  }
  consultationDate: string
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
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: "#475569",
  },
  infoGrid: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  infoPanel: {
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
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  paragraph: {
    fontSize: 11,
    lineHeight: 1.6,
    color: "#334155",
  },
  listItem: {
    flexDirection: "row",
    marginBottom: 4,
  },
  bullet: {
    width: 16,
    fontSize: 11,
    color: "#64748b",
  },
  listText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 1.5,
    color: "#334155",
  },
  footer: {
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
      document: "CONSULTATION REPORT",
      title: "Consultation Report",
      patient: "Patient",
      practitioner: "Practitioner",
      date: "Consultation date",
      summary: "Summary",
      advice: "Advice",
      exercises: "Exercises",
      precautions: "Precautions",
      followUp: "Recommended follow-up",
      siret: "SIRET",
      generatedNotice: "This report was generated with AI assistance and reviewed by the practitioner.",
    }
  }

  return {
    document: "COMPTE-RENDU DE CONSULTATION",
    title: "Compte-rendu de consultation",
    patient: "Patient",
    practitioner: "Praticien",
    date: "Date de consultation",
    summary: "Résumé",
    advice: "Conseils",
    exercises: "Exercices",
    precautions: "Précautions",
    followUp: "Suivi conseillé",
    siret: "SIRET",
    generatedNotice: "Ce compte-rendu a été généré avec l'aide de l'IA et revu par le praticien.",
  }
}

export function RecapPdfDocument({
  locale,
  recap,
  patient,
  practitioner,
  consultationDate,
}: RecapPdfDocumentProps) {
  const labels = getLabels(locale)
  const companyLabel = practitioner.companyName || practitioner.name

  return (
    <Document title={labels.title}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>{labels.document}</Text>
          <Text style={styles.title}>{companyLabel}</Text>
          <Text style={styles.subtitle}>
            {labels.date}: {consultationDate}
          </Text>
        </View>

        {/* Info grid */}
        <View style={styles.infoGrid}>
          <View style={styles.infoPanel}>
            <Text style={styles.panelTitle}>{labels.patient}</Text>
            <Text style={[styles.line, styles.strong]}>
              {patient.firstName} {patient.lastName}
            </Text>
          </View>
          <View style={styles.infoPanel}>
            <Text style={styles.panelTitle}>{labels.practitioner}</Text>
            <Text style={[styles.line, styles.strong]}>{practitioner.name}</Text>
            {practitioner.companyAddress ? (
              <Text style={styles.line}>{practitioner.companyAddress}</Text>
            ) : null}
            {practitioner.siret ? (
              <Text style={styles.line}>{labels.siret}: {practitioner.siret}</Text>
            ) : null}
          </View>
        </View>

        {/* Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{labels.summary}</Text>
          <Text style={styles.paragraph}>{recap.summary}</Text>
        </View>

        {/* Advice */}
        {recap.advice.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{labels.advice}</Text>
            {recap.advice.map((item, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.listText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Exercises */}
        {recap.exercises.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{labels.exercises}</Text>
            {recap.exercises.map((item, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.listText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Precautions */}
        {recap.precautions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{labels.precautions}</Text>
            {recap.precautions.map((item, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.listText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Follow-up */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{labels.followUp}</Text>
          <Text style={styles.paragraph}>{recap.followUp}</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>{labels.generatedNotice}</Text>
        </View>
      </Page>
    </Document>
  )
}
