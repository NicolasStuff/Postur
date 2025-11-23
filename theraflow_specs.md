# PROJECT BLUEPRINT: "TheraFlow" - Vertical SaaS Technical Specification

## 1. PROJECT IDENTITY & STACK

**Goal:** Build a "Practice Management System" (PMS) for French holistic practitioners (Osteopaths, Naturopaths, Sophrologists) with a focus on zero-manual-entry and sleek UI.

**Tech Stack (Non-Negotiable):**

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (Strict mode)
- **Styling:** Tailwind CSS
- **UI Library:** Shadcn/UI (Radix Primitives) + Lucide React (Icons)
- **Database:** PostgreSQL (via Supabase or Neon)
- **ORM:** Prisma
- **State Management:** TanStack Query (v5) - _Critical for optimistic updates on calendar._
- **Validation:** Zod (Schema validation for forms and API)
- **Calendar Engine:** `@fullcalendar/react` (Dashboard) / Custom Grid (Public Booking)
- **PDF Generation:** `@react-pdf/renderer`

---

## 2. DESIGN SYSTEM & UI PATTERNS

The UI must inspire trust, cleanliness, and medical professionalism.

### A. Color Palette

- **Primary:** Deep Blue / Slate (Trust, Medical).
- **Secondary:** Soft Teal/Green (Holistic, Calm).
- **Backgrounds:** Pure White (`#ffffff`) for cards, Light Gray (`#f8fafc`) for app background.
- **Status Colors:**
  - _Planned:_ Blue
  - _Confirmed:_ Green
  - _Canceled:_ Muted Red
  - _No-Show:_ Dark Gray

### B. Layout Patterns

1.  **Public Layout (`/u/[slug]`):**
    - **Centered Card Pattern:** Content is contained within a max-width card centered on the screen.
    - **Split Content:** Left column = Context (Profile), Right column = Action (Booking Form).
2.  **Dashboard Layout (`/dashboard/*`):**
    - **App Shell:** Fixed Sidebar (Left) + Topbar (Breadcrumbs, User Profile).
    - **Main Content Area:** Scrollable area with padding.
3.  **Consultation Layout (`/dashboard/consultation/[id]`):**
    - **Split View (Resizable):** Using `react-resizable-panels`.
    - **Left Panel:** "Context" (Read-only history).
    - **Right Panel:** "Action" (Active note-taking, Interactive Body Chart).

---

## 3. DETAILED ROUTE SPECIFICATIONS

### A. Landing Page (Marketing)

**Route:** `/`
**Design Pattern:** Vertical Scroll Sections.
**Sections:**

1.  **Hero:** Large Value Prop + "Get Started" CTA + Floating UI Mockup (Booking Card).
2.  **Features Grid:** 3 Cols (Booking, Patient Records, Auto-Billing). Use Lucide Icons.
3.  **Vertical Specifics:** Tabs or Scroll-trigger showing specific UIs for Osteo vs Naturo.
4.  **Social Proof:** Simple card grid with testimonials.
5.  **Pricing:** 2 Cards (Monthly vs Yearly). Simple table comparison.
6.  **Footer:** Simple links, SEO optimized.

### B. Public Booking Page

**Route:** `/u/[slug]`
**User:** Patient (Unauthenticated).
**UI Components:** `Card`, `Calendar` (Custom View), `Form` (Shadcn), `Badge` (Service Type).
**Flow & Logic:**

1.  **Practitioner Context:** Fetch User Profile (Photo, Address, Map Pin).
2.  **Service Selection:** Dropdown/Radio group. Updating this triggers a refetch of availability.
3.  **Availability Grid:**
    - _Display:_ Grid of buttons (Time Slots).
    - _Logic:_ `availableSlots = generateSlots(openingHours) - existingAppointments`.
4.  **Identification:** Simple Step Form (FirstName, LastName, Email, Phone).
5.  **Confirmation:** Optimistic UI update -> Success Message.

### C. Practitioner Dashboard - Calendar

**Route:** `/dashboard/calendar`
**UI Components:** `FullCalendar`, `Sheet` (Side panel for details), `Select` (Filter by view).
**Features:**

- **View Modes:** Month / Week / Day / List.
- **Event Rendering:** Color-coded by `ServiceType` or `AppointmentStatus`.
- **Interactivity:** Click event opens a `Sheet` or `Dialog` with appointment details and quick actions ("Start Consultation", "Cancel", "No Show").

### D. Patient Database

**Route:** `/dashboard/patients`
**UI Components:** `DataTable` (TanStack Table + Shadcn).
**Columns:**

- Name (Avatar + Text)
- Contact (Phone/Email)
- Last Visit (Date sorted desc)
- Status (Active/Inactive)
- Actions (Dropdown: "View History", "New Appointment").
  **Features:**
- **Search:** Debounced search input filtering by Name/Email.
- **Pagination:** Server-side pagination.

### E. Active Consultation Mode (CORE FEATURE)

**Route:** `/dashboard/consultation/[appointmentId]`
**Design Pattern:** The "Cockpit" View.
**Layout:**

- **Left Panel (35% width):** _Patient Context._
  - Sticky Header: Patient Name, Age, Job.
  - Scrollable Timeline: Previous notes (Accordion style).
- **Right Panel (65% width):** _Active Work._
  - **Tool:** Tiptap Editor (Rich text) for general notes.
  - **Tool (Osteo):** **Interactive SVG Body Chart**.
    - _Implementation:_ React Component wrapping an SVG.
    - _Logic:_ `paths` have IDs. `onClick` toggles a class (e.g., fill-red-500). State stored as array of strings `['lumbar', 'right_shoulder']`.
  - **Tool (Naturo):** Tabbed Form (Diet, Sleep, Digestion).
- **Footer Action:** Floating Action Bar with "Terminer & Facturer".

### F. Billing & Output

**Route:** Triggered via Modal or `/dashboard/billing/[id]`
**UI Components:** `Dialog`, `PDFViewer` (iframe).
**Logic:**

1.  **Generation:** Fetch Patient + Service + Practitioner Info.
2.  **Numbering:** Auto-increment sequence (Atomic transaction required).
3.  **Compliance:** Checkbox logic for "TVA non applicable".
4.  **PDF Rendering:** Use `@react-pdf/renderer` to generate a blob.
5.  **Actions:** "Send Email" (via Resend API) and "Download".

### G. Settings

**Route:** `/dashboard/settings`
**UI Components:** `Tabs` (Profile, Availability, Billing, Integrations).
**Key Forms:**

- **Availability:** JSON Editor or Week-Grid selector for `openingHours`.
- **Services:** CRUD list for Services (Name, Duration, Price).
- **Billing:** Upload Logo (Supabase Storage), Set SIRET/Address.

---

## 4. DATA MODEL (PRISMA SCHEMA REFINED)

```prisma
// (Include the Schema provided in the prompt, adding these refinements)

generator client {

provider = "prisma-client-js"

}



datasource db {

provider = "postgresql"

url = env("DATABASE_URL")

}



// --- ENUMS ---

enum Role {

USER // The Practitioner

ADMIN // SaaS Super Admin

}



enum PractitionerType {

OSTEOPATH

NATUROPATH

SOPHROLOGIST

}



enum AppointmentStatus {

PLANNED // Booked but not happened

CONFIRMED // Confirmed by practitioner (optional)

COMPLETED // Session done

CANCELED // Canceled by user or patient

NOSHOW // Patient didn't come

}



enum InvoiceStatus {

DRAFT

SENT

PAID

}



// --- MODELS ---



model User {

id String @id @default(cuid())

email String @unique

password String? // Hashed

fullName String?


// Professional Profile (Public Booking Page Info)

slug String? @unique // e.g. theraflow.com/u/jean-dupont

practitionerType PractitionerType @default(OSTEOPATH)

siret String?

companyName String?

companyAddress String?

isVatExempt Boolean @default(true) // "TVA non applicable"


// Availability Settings

openingHours Json? // { "mon": ["09:00-12:00", "14:00-18:00"] }

slotDuration Int @default(60) // minutes


// Relations

patients Patient

appointments Appointment

services Service

invoices Invoice


createdAt DateTime @default(now())

updatedAt DateTime @updatedAt

}



model Patient {

id String @id @default(cuid())

userId String // Belongs to Practitioner

user User @relation(fields: [userId], references: [id])


firstName String

lastName String

email String?

phone String?

address String?


// Logic: If patient books online, they might not have an account, just a record here.


appointments Appointment

invoices Invoice


// Medical Data (Encrypted/Sensitive)

notes String? @db.Text // General notes

medicalHistory Json? // Flexible JSON based on profession type



createdAt DateTime @default(now())

updatedAt DateTime @updatedAt



@@unique([userId, email]) // Avoid duplicate patients for same doctor

}



model Service {

id String @id @default(cuid())

userId String

user User @relation(fields: [userId], references: [id])


name String // e.g. "Consultation Adulte"

duration Int // minutes

price Decimal @db.Decimal(10, 2)


appointments Appointment

}



model Appointment {

id String @id @default(cuid())

userId String

user User @relation(fields: [userId], references: [id])


patientId String

patient Patient @relation(fields: [patientId], references: [id])


serviceId String

service Service @relation(fields: [serviceId], references: [id])


start DateTime

end DateTime

status AppointmentStatus @default(PLANNED)


// Clinical Note linked to this specific session

note ConsultationNote?



createdAt DateTime @default(now())

updatedAt DateTime @updatedAt

}



model ConsultationNote {

id String @id @default(cuid())

appointmentId String @unique

appointment Appointment @relation(fields: [appointmentId], references: [id])


content Json // Tiptap JSON content OR specific structure


createdAt DateTime @default(now())

updatedAt DateTime @updatedAt

}



model Invoice {

id String @id @default(cuid())

userId String

user User @relation(fields: [userId], references: [id])

patientId String

patient Patient @relation(fields: [patientId], references: [id])


number String // Sequential: 2024-001

date DateTime @default(now())


amount Decimal @db.Decimal(10, 2)

status InvoiceStatus @default(DRAFT)

pdfUrl String? // S3 URL


createdAt DateTime @default(now())

}

// Add indexes for performance
// @@index([userId, status]) on Appointment
// @@index([email]) on Patient
```
