import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import Navbar from '@/components/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Kaaj AI — কাজ AI | Bengali AI Agent Platform',
  description: 'Create powerful AI agents in Bengali. For shop owners, students, families, and communities across West Bengal and Bangladesh.',
  keywords: 'Bengali AI, বাংলা AI, Kaaj AI, কাজ AI, Bengali chatbot, shop management AI, দোকান ম্যানেজার',
  openGraph: {
    title: 'Kaaj AI — কাজ AI',
    description: 'AI agents বাংলায়। দোকান, পড়াশোনা, পূজা, পরিবার — সব কাজে সাহায্য।',
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
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      </body>
    </html>
  )
}
