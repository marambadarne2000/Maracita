import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { AuthSessionBridge } from '@/components/auth-session-bridge';
import { I18nProvider } from '@/components/i18n-provider';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://maracita.awadi-mar34.workers.dev'),
  title: {
    default: 'Maracita — Smart Appointment Operations',
    template: '%s · Maracita',
  },
  description: 'A calm, intelligent workspace for service businesses to manage customers, bookings, team schedules, payments and follow-up.',
  applicationName: 'Maracita',
  keywords: ['appointment management', 'service business', 'customer management', 'scheduling', 'Maracita'],
  authors: [{ name: 'Maram Abbas' }],
  creator: 'Maram Abbas',
  openGraph: {
    type: 'website',
    title: 'Maracita — Smart Appointment Operations',
    description: 'One clear workspace for customers, bookings, payments and decisions.',
    siteName: 'Maracita',
    url: '/',
  },
  twitter: {
    card: 'summary',
    title: 'Maracita — Smart Appointment Operations',
    description: 'One clear workspace for customers, bookings, payments and decisions.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <I18nProvider><AuthSessionBridge />{children}</I18nProvider>
      </body>
    </html>
  );
}
