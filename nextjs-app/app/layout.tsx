import type { Metadata } from 'next'
import { Inter, Outfit, Playfair_Display } from 'next/font/google'
import { AppProviders } from '@/components/providers/app-providers'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
})

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '900'],
  variable: '--font-outfit',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-playfair',
})

export const metadata: Metadata = {
  title: {
    default: 'DocuIntel — AI Contract Analysis',
    template: '%s | DocuIntel',
  },
  description: 'AI-powered contract analysis, risk assessment, redline generation, and legal workflow automation. Google & Apple sign-in, Stripe billing, MongoDB persistence.',
  keywords: ['contract analysis', 'legal AI', 'risk assessment', 'redline', 'DocuIntel', 'Next.js', 'OpenAI'],
  authors: [{ name: 'DocuIntel' }],
  openGraph: {
    title: 'DocuIntel — AI Contract Analysis Platform',
    description: 'Upload contracts, get clause-by-clause risk scores, redlines, and branded reports in under a minute.',
    type: 'website',
    locale: 'en_US',
    siteName: 'DocuIntel',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DocuIntel — AI Contract Analysis',
    description: 'Production-grade legal AI SaaS with OAuth, Stripe, and MongoDB.',
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`scroll-smooth ${inter.variable} ${outfit.variable} ${playfair.variable}`}>
      <body className="antialiased font-sans">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
