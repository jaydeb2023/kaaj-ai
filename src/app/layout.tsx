import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sahayak AI — সহায়ক AI | বাংলার ব্যবসার বিশ্বস্ত সঙ্গী',
  description: 'বাংলায় কথা বলুন, AI কাজ করবে। দোকান, ফার্মেসি, কোচিং সেন্টার, হোটেল — সব ব্যবসার জন্য AI এজেন্ট।',
  keywords: 'Bengali AI, বাংলা AI, Sahayak AI, সহায়ক AI, Bengali chatbot, shop management AI, দোকান ম্যানেজার',
  openGraph: {
    title: 'Sahayak AI — সহায়ক AI',
    description: 'বাংলার ব্যবসার বিশ্বস্ত সঙ্গী। বাংলায় বলুন, AI কাজ করবে।',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap" rel="stylesheet" />
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
