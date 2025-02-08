import '../globals.css'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

export const viewport: Viewport = {
  themeColor: '#22201C',
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  title: 'NieR: Automata - [E] Ending Mini-Game',
  description: 'A tribute to NieR: Automata, recreating the emotional [E] ending experience using React Three Fiber.',
  keywords: 'NieR, Automata, Mini-Game, React, React Three Fiber, Three.js, Tribute, [E] Ending',
  authors: [{
    name: 'kjjkjjzyayufqza',
    url: 'https://github.com/kjjkjjzyayufqza'
  }],
  icons: [
    {
      url: '/images/Ynhqza3.png',
    },
  ],
  openGraph: {
    title: 'NieR: Automata - [E] Ending Mini-Game',
    description: 'Relive the emotional [E] ending from NieR: Automata in this interactive web-based mini-game.',
    url: 'https://github.com/kjjkjjzyayufqza/nier-mini-game',
    siteName: 'NieR Automata Tribute',
    images: [
      {
        url: '/images/Ynhqza3.png',
        width: 1200,
        height: 630,
        alt: 'NieR: Automata - [E] Ending Mini-Game',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NieR: Automata - [E] Ending Mini-Game',
    description: 'An interactive tribute to NieR: Automata, recreating the emotional [E] ending experience.',
    images: ['/images/Ynhqza3.png'],
  },
};


export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: any;
}) {
  const { locale } = await params ?? {};
  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as any)) {
    // Reset to the default locale
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}