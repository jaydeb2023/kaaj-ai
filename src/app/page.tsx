'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { PREBUILT_AGENTS, CATEGORY_LABELS } from '@/types'
import { ArrowRight, Zap, Shield, Globe, MessageCircle } from 'lucide-react'

const FLIP_AGENTS = [
  {
    name: 'Dokan Manager', name_bn: 'দোকান ম্যানেজার', icon: '🏪', color: '#EEF2FF', accent: '#4F46E5',
    chat: [
      { role: 'user',      text: 'আজকে চালের বিক্রি কেমন হলো?' },
      { role: 'assistant', text: 'আজ ২৫ কেজি চাল বিক্রি হয়েছে। মোট আয় ₹১,২৫০। কালকের স্টক মাত্র ১৫ কেজি — রিঅর্ডার দেওয়া দরকার!' },
      { role: 'user',      text: 'রামবাবুর বাকি কত?' },
      { role: 'assistant', text: 'রামবাবুর বর্তমান বাকি ₹৬৫০। গত ১৫ দিন ধরে pending। একটা reminder পাঠাবো?' },
    ],
  },
  {
    name: 'Pharmacy Assistant', name_bn: 'ফার্মেসি সহায়ক', icon: '💊', color: '#E0F2FE', accent: '#0284C7',
    chat: [
      { role: 'user',      text: 'Paracetamol 500 স্টক কত আছে?' },
      { role: 'assistant', text: 'Paracetamol 500mg এখন ৮৪টি strip আছে। এই হারে চললে ৬ দিনে শেষ। আজই অর্ডার দিন!' },
      { role: 'user',      text: 'কোন ওষুধের মেয়াদ শেষ হচ্ছে?' },
      { role: 'assistant', text: '⚠️ ৩টি medicine-এর মেয়াদ আগামী ৩০ দিনে শেষ: Cough Syrup, Vitamin C, Antacid।' },
    ],
  },
  {
    name: 'Puja Organizer', name_bn: 'পূজা অর্গানাইজার', icon: '🌺', color: '#FEF3C7', accent: '#D97706',
    chat: [
      { role: 'user',      text: 'এবারের পূজার বাজেট কত হলো?' },
      { role: 'assistant', text: 'মোট বাজেট ₹২,৪০,০০০। স্পনসর থেকে ₹১,৬৫,০০০ এসেছে। বাকি ₹৭৫,০০০ pending।' },
      { role: 'user',      text: 'প্রতিমার বায়না দেওয়া হয়েছে?' },
      { role: 'assistant', text: '✅ হ্যাঁ! কুমোরটুলির রবিদাকে ₹৩৫,০০০ বায়না দেওয়া হয়েছে। আর ৪৫ দিন বাকি!' },
    ],
  },
  {
    name: 'Coaching Manager', name_bn: 'কোচিং ম্যানেজার', icon: '🏫', color: '#ECFDF5', accent: '#059669',
    chat: [
      { role: 'user',      text: 'এই মাসে কতজন ফি দেয়নি?' },
      { role: 'assistant', text: '১২ জন ছাত্র এখনো ফি দেয়নি। মোট বাকি ₹১৮,০০০। সবার অভিভাবককে reminder পাঠাবো?' },
      { role: 'user',      text: 'রিয়ার result কী?' },
      { role: 'assistant', text: 'রিয়া শেষ ৩টি test-এ পেয়েছে: ৭৮, ৮২, ৮৮। ধীরে ধীরে উন্নতি হচ্ছে!' },
    ],
  },
]

function FlipCard({ agent }: { agent: typeof FLIP_AGENTS[0] }) {
  const [flipped, setFlipped] = useState(false)
  return (
    <div className="relative h-72 cursor-pointer" style={{ perspective: '1000px' }}
      onMouseEnter={() => setFlipped(true)} onMouseLeave={() => setFlipped(false)}
      onClick={() => setFlipped(f => !f)}>
      <div className="relative w-full h-full transition-transform duration-500"
        style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
        <div className="absolute inset-0 rounded-2xl border border-gray-200 p-6 flex flex-col justify-between bg-white"
          style={{ backfaceVisibility: 'hidden', borderTop: `3px solid ${agent.accent}` }}>
          <div>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-4" style={{ background: agent.color }}>{agent.icon}</div>
            <h3 className="font-bold text-gray-900 text-lg mb-1">{agent.name}</h3>
            <p className="text-sm font-semibold bengali" style={{ color: agent.accent }}>{agent.name_bn}</p>
          </div>
          <div className="flex items-center gap-2 text-gray-400 text-xs">
            <MessageCircle size={13} /><span className="bengali">hover করুন — কথোপকথন দেখুন</span>
          </div>
        </div>
        <div className="absolute inset-0 rounded-2xl border p-4 flex flex-col bg-white overflow-hidden"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', borderTop: `3px solid ${agent.accent}`, borderColor: agent.accent }}>
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ background: agent.color }}>{agent.icon}</div>
            <span className="text-xs font-semibold text-gray-700 bengali">{agent.name_bn}</span>
          </div>
          <div className="flex-1 flex flex-col gap-2 overflow-hidden">
            {agent.chat.slice(0, 4).map((msg, i) => (
              <div key={i} className={`text-[11px] leading-relaxed px-2.5 py-1.5 rounded-xl max-w-[90%] bengali ${msg.role === 'user' ? 'self-end bg-gray-100 text-gray-700' : 'self-start text-white'}`}
                style={msg.role === 'assistant' ? { background: agent.accent } : {}}>
                {msg.text}
              </div>
            ))}
          </div>
          <Link href="/library" className="mt-2 text-center text-xs font-semibold py-1.5 rounded-lg text-white" style={{ background: agent.accent }}>
            এই agent ব্যবহার করুন →
          </Link>
        </div>
      </div>
    </div>
  )
}

function useRealStats() {
  const [stats, setStats] = useState({ agents: 0, users: 0, loaded: false })
  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch('/api/stats')
        const data = await res.json()
        setStats({ agents: data.agents || 0, users: data.users || 0, loaded: true })
      } catch {
        setStats({ agents: 0, users: 0, loaded: true })
      }
    }
    load()
  }, [])
  return stats
}

export default function HomePage() {
  const stats = useRealStats()

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-200 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">

          {/* Honest launch badge */}
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-semibold px-4 py-2 rounded-full border border-emerald-200 mb-8">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="bengali">🚀 নতুন launch  সম্পূর্ণ বিনামূল্যে </span>
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-4">
            আপনার ব্যবসার জন্য
            <span className="block text-indigo-600 bengali mt-2">AI সহায়ক, বাংলায়</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-3 bengali leading-relaxed">
            দোকান, ফার্মেসি, হোটেল, কোচিং সেন্টার — সবার জন্য।
          </p>
          <p className="text-lg text-indigo-600 font-semibold max-w-xl mx-auto mb-10 bengali">
            বাংলায় বলুন, সহায়ক কাজ করবে। কোনো coding লাগবে না।
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/agents/new"
              className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg rounded-2xl transition-colors shadow-lg shadow-indigo-100">
              বিনামূল্যে শুরু করুন <ArrowRight size={20} />
            </Link>
            <Link href="/library"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-lg rounded-2xl border border-gray-200 transition-colors">
              Library দেখুন
            </Link>
          </div>
        </div>
      </section>

      {/* ── REAL STATS ───────────────────────────────────────── */}
      <section className="bg-gray-900">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-800">
          {[
            {
              n: stats.loaded && stats.agents > 0 ? `${stats.agents}+` : '২৮+',
              l: stats.loaded && stats.agents > 0 ? 'Agents তৈরি' : 'Agent template',
              sub: 'বিভিন্ন ব্যবসার জন্য'
            },
            {
              n: stats.loaded && stats.users > 0 ? `${stats.users}+` : '🚀',
              l: stats.loaded && stats.users > 0 ? 'নিবন্ধিত user' : '  Free for Everyone',
              sub: stats.loaded && stats.users > 0 ? 'এবং বাড়ছে' : ' No signup fees, no hidden costs!'
            },
            { n: '১০০%', l: 'বাংলায়',             sub: 'সম্পূর্ণ বাংলা ভাষায়'    },
            { n: '১০০%', l: 'চিরকাল বিনামূল্যে',  sub: 'কোনো hidden charge নেই'  },
          ].map(s => (
            <div key={s.l} className="py-8 px-6 text-center">
              <div className="text-3xl font-extrabold text-white bengali">{s.n}</div>
              <div className="text-gray-400 text-sm mt-1 bengali">{s.l}</div>
              <div className="text-gray-600 text-[10px] mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FLIP CARDS ───────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-4">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">দেখুন কীভাবে কাজ করে</h2>
            <p className="text-gray-500 text-lg bengali">যেকোনো card-এ <span className="text-indigo-600 font-semibold">hover</span> করুন</p>
          </div>
          <div className="flex justify-center mb-10">
            <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 text-xs font-semibold px-4 py-2 rounded-full border border-indigo-100">
              <span className="animate-bounce">👆</span> Card-এ mouse রাখুন
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FLIP_AGENTS.map((a, i) => <FlipCard key={i} agent={a} />)}
          </div>
        </div>
      </section>

      {/* ── AGENTS GRID ──────────────────────────────────────── */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">সবচেয়ে জনপ্রিয় AI এজেন্ট</h2>
            <p className="text-gray-500 text-lg bengali">Real Bengali use cases — এখনই ব্যবহার করুন</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PREBUILT_AGENTS.filter(a => a.is_featured).map((agent, i) => {
              const cat = CATEGORY_LABELS[agent.category]
              return (
                <Link key={i} href="/library"
                  className="group bg-white rounded-2xl border border-gray-200 p-5 hover:border-indigo-300 hover:shadow-md transition-all"
                  style={{ borderTop: '3px solid #4F46E5' }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: agent.color }}>{agent.icon}</div>
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-600 bengali">{cat.bn}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-[15px] mb-0.5">{agent.name}</h3>
                  <p className="text-indigo-600 text-[13px] font-semibold mb-2 bengali">{agent.name_bn}</p>
                  <p className="text-gray-500 text-[13px] leading-relaxed mb-4 bengali line-clamp-2">{agent.description_bn}</p>
                  <div className="flex justify-end">
                    <span className="text-indigo-600 text-xs font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">চেষ্টা করুন <ArrowRight size={11} /></span>
                  </div>
                </Link>
              )
            })}
          </div>
          <div className="text-center mt-8">
            <Link href="/library" className="inline-flex items-center gap-2 px-6 py-3 border border-indigo-200 text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition-colors bengali">
              সব ২৮টি এজেন্ট দেখুন <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="bg-gray-900 py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold text-white mb-3">মাত্র ৩ ধাপে শুরু করুন</h2>
          <p className="text-gray-400 text-lg mb-12 bengali">কোনো coding জ্ঞান লাগবে না</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { n: '১', t: 'বাংলায় বর্ণনা করুন',  d: '"আমার মুদি দোকানের হিসাব রাখতে চাই" — এইটুকুই যথেষ্ট।' },
              { n: '২', t: 'AI এজেন্ট তৈরি হবে',  d: 'সহায়ক AI আপনার চাহিদা বুঝে স্বয়ংক্রিয়ভাবে কাস্টম এজেন্ট তৈরি করবে।' },
              { n: '৩', t: 'বাংলায় chat করুন',     d: 'বাংলায় লিখুন বা মাইক্রোফোনে বলুন। সে মনে রাখবে, হিসাব রাখবে, সাহায্য করবে।' },
            ].map(s => (
              <div key={s.n} className="bg-gray-800 border border-gray-700 rounded-2xl p-6 text-left">
                <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg mb-4 bengali">{s.n}</div>
                <h3 className="font-bold text-white text-[16px] mb-2 bengali">{s.t}</h3>
                <p className="text-gray-400 text-[14px] leading-relaxed bengali">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">কেন Sahayak AI বেছে নেবেন?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: <Globe className="text-indigo-600" size={24} />,  t: '১০০% বাংলায়',      d: 'সম্পূর্ণ বাংলায় কথা বলুন — এমনকি মাইক্রোফোনে। Kolkata slang থেকে literary Bangla — সব বোঝে।' },
              { icon: <Shield className="text-emerald-600" size={24} />, t: 'চিরকাল বিনামূল্যে', d: 'Core features সবসময় free। কোনো hidden charge নেই। Credit card লাগবে না।' },
              { icon: <Zap className="text-amber-600" size={24} />,     t: 'ব্যবসায়িক জ্ঞান',   d: 'প্রতিটি এজেন্টে Bengal-এর ব্যবসায়িক বাস্তবতার জ্ঞান দেওয়া আছে।' },
            ].map(f => (
              <div key={f.t} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-4 shadow-sm border border-gray-100">{f.icon}</div>
                <h3 className="font-bold text-gray-900 text-[16px] mb-2 bengali">{f.t}</h3>
                <p className="text-gray-500 text-[14px] leading-relaxed bengali">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="bg-indigo-600 py-20 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-indigo-500 text-indigo-100 text-xs font-semibold px-4 py-2 rounded-full mb-6 bengali">
            🎯  সম্পূর্ণ বিনামূল্যে
          </div>
          <h2 className="text-4xl font-extrabold text-white mb-4 bengali">আজই শুরু করুন</h2>
          <p className="text-indigo-200 text-lg mb-8 bengali">কোনো credit card লাগবে না। মাত্র ২ মিনিটে আপনার প্রথম AI এজেন্ট তৈরি করুন।</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/agents/new" className="px-8 py-4 bg-white hover:bg-gray-50 text-indigo-600 font-bold text-lg rounded-2xl transition-colors">
              বিনামূল্যে শুরু করুন →
            </Link>
            <Link href="/library" className="px-8 py-4 bg-transparent hover:bg-indigo-500 text-white font-semibold text-lg rounded-2xl border-2 border-indigo-400 transition-colors">
              Library দেখুন
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
