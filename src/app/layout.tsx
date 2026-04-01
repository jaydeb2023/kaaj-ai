import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const inter = Inter({ subsets: ['latin'] })

const APP_URL = 'https://sahayakai.tech'

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'Sahayak AI — সহায়ক AI | বাংলার ব্যবসার বিশ্বস্ত AI সঙ্গী',
    template: '%s | Sahayak AI',
  },
  description:
    'বাংলায় কথা বলুন, AI কাজ করবে। দোকান, ফার্মেসি, কোচিং সেন্টার, হোটেল — সব ধরনের বাংলা ব্যবসার জন্য AI এজেন্ট। Sahayak AI is the #1 Bengali AI assistant for small businesses in West Bengal and Bangladesh.',
  keywords: [
    'Bengali AI', 'বাংলা AI', 'Sahayak AI', 'সহায়ক AI',
    'Bengali chatbot', 'বাংলা chatbot', 'shop management AI',
    'দোকান ম্যানেজার AI', 'pharmacy AI Bengali', 'ফার্মেসি AI',
    'coaching management AI', 'AI for small business India',
    'West Bengal AI', 'Bangladesh AI assistant',
    'Bengali business assistant', 'AI agent Bengali',
  ],
  authors: [{ name: 'Sahayak AI', url: APP_URL }],
  creator: 'Sahayak AI',
  publisher: 'Sahayak AI',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'bn_IN',
    alternateLocale: ['en_IN', 'bn_BD'],
    url: APP_URL,
    siteName: 'Sahayak AI',
    title: 'Sahayak AI — সহায়ক AI | বাংলার ব্যবসার বিশ্বস্ত AI সঙ্গী',
    description: 'বাংলায় কথা বলুন, AI কাজ করবে। দোকান, ফার্মেসি, কোচিং — সব ব্যবসার জন্য AI এজেন্ট।',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Sahayak AI — Bengali AI Assistant for Business' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sahayak AI — সহায়ক AI',
    description: 'বাংলায় কথা বলুন, AI কাজ করবে। বাংলার ব্যবসার বিশ্বস্ত AI সঙ্গী।',
    images: ['/og-image.png'],
  },
  alternates: { canonical: APP_URL },
  icons: { icon: '/favicon.ico', apple: '/apple-touch-icon.png' },
  verification: {
    google: 'YOUR_GOOGLE_VERIFICATION_CODE',
  },
  category: 'technology',
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Sahayak AI',
  alternateName: 'সহায়ক AI',
  url: APP_URL,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description: 'AI-powered assistant for Bengali small businesses.',
  inLanguage: ['bn', 'en'],
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
  provider: { '@type': 'Organization', name: 'Sahayak AI', url: APP_URL },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body className={inter.className}>
        <Navbar />
        <main>{children}</main>
        <Footer />
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      </body>
    </html>
  )
}
