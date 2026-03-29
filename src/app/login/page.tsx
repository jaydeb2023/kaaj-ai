'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Loader2, Mail, Lock } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'login' | 'signup'>('login')

  const handleSubmit = async () => {
    if (!email || !password) { toast.error('Email ও password দিন'); return }
    setLoading(true)
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        toast.success('নিবন্ধন সম্পন্ন! Email verify করুন।')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        toast.success('স্বাগতম!')
        router.push('/dashboard')
      }
    } catch (err: any) {
      toast.error(err.message || 'সমস্যা হয়েছে')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">ক</div>
            <span className="font-extrabold text-gray-900 text-xl">Kaaj AI</span>
          </Link>
          <h1 className="mt-4 text-2xl font-extrabold text-gray-900">
            {mode === 'login' ? 'আবার স্বাগতম!' : 'নতুন অ্যাকাউন্ট'}
          </h1>
          <p className="text-gray-500 text-sm mt-1 bengali">
            {mode === 'login' ? 'আপনার অ্যাকাউন্টে প্রবেশ করুন' : 'বিনামূল্যে শুরু করুন'}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <div className="space-y-4">
            <div>
              <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-[14px] focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50"
                />
              </div>
            </div>
            <div>
              <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-[14px] focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50"
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                />
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {mode === 'login' ? 'প্রবেশ করুন' : 'নিবন্ধন করুন'}
            </button>
          </div>

          <div className="mt-5 text-center text-sm text-gray-500">
            {mode === 'login' ? (
              <>অ্যাকাউন্ট নেই? <button onClick={() => setMode('signup')} className="text-indigo-600 font-semibold hover:underline">নিবন্ধন করুন</button></>
            ) : (
              <>আগেই অ্যাকাউন্ট আছে? <button onClick={() => setMode('login')} className="text-indigo-600 font-semibold hover:underline">প্রবেশ করুন</button></>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4 bengali">
          Demo mode-এ auth ছাড়াও সব feature দেখা যাবে
        </p>
      </div>
    </div>
  )
}
