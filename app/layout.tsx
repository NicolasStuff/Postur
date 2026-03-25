import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";
import { LocaleProvider } from "@/components/providers/LocaleProvider";
import { NextIntlClientProvider } from 'next-intl';
import { cookies } from 'next/headers';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://postur.fr'

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Postur - Logiciel de Gestion de Cabinet pour Ostéopathes',
    template: '%s | Postur',
  },
  description: 'Logiciel de gestion de cabinet pour ostéopathes avec Body Chart interactif, préparation Factur-X et réservation en ligne.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get locale from cookie set by middleware
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'fr';

  // Load messages manually since we're not using the next-intl plugin
  const messages = (await import(`@/messages/${locale}.json`)).default;

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background font-sans`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <LocaleProvider initialLocale={locale as 'fr' | 'en'}>
            <Providers>
                {children}
            </Providers>
          </LocaleProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
