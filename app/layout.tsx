import type { Metadata } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import './globals.css';

const display = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '600', '900'],
  style: ['normal', 'italic'],
});

const body = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600'],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.com';
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? 'Achadinhos';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — achadinhos com preço bom`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    'Seleção diária de achadinhos com o melhor preço, organizados por categoria e link direto de compra.',
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'pt_BR',
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${body.variable}`}>
      <body className="bg-paper font-body text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
