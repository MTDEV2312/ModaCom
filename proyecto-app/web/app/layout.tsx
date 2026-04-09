import type { Metadata, Viewport } from 'next';
import { DM_Sans, Playfair_Display } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'MODA | Moda en Quito, Ecuador',
    template: '%s | MODA',
  },
  description: 'Descubre las últimas tendencias en moda para hombre, mujer y niños en Quito, Ecuador. Calidad premium y estilo atemporal para toda la familia.',
  keywords: ['moda', 'ropa', 'hombre', 'mujer', 'niños', 'tienda online', 'fashion', 'tendencias', 'Quito', 'Ecuador', 'USD'],
  authors: [{ name: 'MODA' }],
  creator: 'MODA',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'es_EC',
    siteName: 'MODA',
    title: 'MODA | Moda en Quito, Ecuador',
    description: 'Descubre las últimas tendencias en moda para hombre, mujer y niños en Quito, Ecuador.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MODA | Moda en Quito, Ecuador',
    description: 'Descubre las últimas tendencias en moda para hombre, mujer y niños en Quito, Ecuador.',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f3f0' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1918' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${dmSans.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased">
        <a href="#main-content" className="skip-link">
          Saltar al contenido principal
        </a>
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
