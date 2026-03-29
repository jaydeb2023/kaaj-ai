import Link from 'next/link'
import { PREBUILT_AGENTS, CATEGORY_LABELS } from '@/types'
import { Plus, MessageSquare, Bot, Share2, Star, ArrowRight, TrendingUp } from 'lucide-react'

export default function DashboardPage() {
  // Static demo data — replace with Supabase queries after auth
  const myAgents = PREBUILT_AGENTS.slice(0, 4).map((a, i) => ({
    ...a,
    id: String(i),
    conversations: [48, 31, 28, 20][i],
    lastUsed: ['আজ সকাল ৯টা', 'গতকাল', '৩ দিন আগে', '১ সপ্তাহ আগে'][i],
  }))

  const metrics = [
    { icon: <Bot size={22} className="text-indigo-500" />, val: '4', label: 'আমার এজেন্ট', sub: '↑ 1 নতুন এই মাসে', color: 'bg-indigo-50' },
    { icon: <MessageSquare size={22} className="text-emerald-500" />, val: '১২৭', label: 'মোট কথোপকথন', sub: '↑ ৩৪ এই সপ্তাহে', color: 'bg-emerald-50' },
    { icon: <Share2 size={22} className="text-violet-500" />, val: '2', label: 'শেয়ার করা', sub: '৪৫ জন ব্যবহার করছে', color: 'bg-violet-50' },
    { icon: <Star size={22} className="text-amber-500" />, val: '৪.৯', label: 'Rating', sub: '১৮টি review', color: 'bg-amber-50' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">
              নমস্কার, <span className="text-indigo-600 bengali">রামপ্রসাদ</span> 👋
            </h1>
            <p className="text-gray-500 text-sm mt-1 bengali">আপনার AI এজেন্টের সারসংক্ষেপ</p>
          </div>
          <Link
            href="/agents/new"
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors"
          >
            <Plus size={16} /> নতুন এজেন্ট
          </Link>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {metrics.map(m => (
            <div key={m.label} className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className={`w-10 h-10 ${m.color} rounded-xl flex items-center justify-center mb-3`}>{m.icon}</div>
              <div className="text-2xl font-extrabold text-gray-900 bengali">{m.val}</div>
              <div className="text-[13px] text-gray-500 bengali">{m.label}</div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-1 bengali">{m.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* My Agents */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">আমার এজেন্ট সমূহ</h2>
              <Link href="/library" className="text-indigo-600 text-sm font-semibold hover:underline">Library দেখুন</Link>
            </div>
            <div className="space-y-3">
              {myAgents.map(agent => {
                const cat = CATEGORY_LABELS[agent.category]
                return (
                  <Link
                    key={agent.id}
                    href={`/agents/${agent.id}`}
                    className="flex items-center gap-4 bg-white border border-gray-200 rounded-2xl p-4 hover:border-indigo-300 hover:shadow-sm transition-all group"
                  >
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: agent.color }}>
                      {agent.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-900 text-[14px]">{agent.name_bn || agent.name}</div>
                      <div className="text-gray-400 text-[12px] bengali">শেষ ব্যবহার: {agent.lastUsed} · {agent.conversations}টি কথোপকথন</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full">Active</span>
                      <ArrowRight size={14} className="text-gray-400 group-hover:text-indigo-600 transition-colors" />
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Quick stats */}
            <div className="bg-indigo-600 rounded-2xl p-5 text-white">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={18} />
                <span className="font-bold text-sm">এই সপ্তাহ</span>
              </div>
              <div className="text-3xl font-extrabold mb-1 bengali">৩৪</div>
              <div className="text-indigo-200 text-sm bengali">টি কথোপকথন</div>
              <div className="text-indigo-300 text-xs mt-2 bengali">গত সপ্তাহের চেয়ে ↑ ১২%</div>
            </div>

            {/* Recent activity */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="font-bold text-gray-900 text-[14px] mb-4">সাম্প্রতিক কার্যক্রম</h3>
              <div className="space-y-3">
                {[
                  { icon: '🏪', text: 'দোকান ম্যানেজারে নতুন কথোপকথন', time: '২ ঘণ্টা আগে' },
                  { icon: '📚', text: 'পড়াশোনা সহায়কে study plan তৈরি', time: 'গতকাল' },
                  { icon: '🌺', text: 'পূজা অর্গানাইজার ব্যবহার হয়েছে', time: '৩ দিন আগে' },
                ].map((a, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-lg">{a.icon}</span>
                    <div>
                      <div className="text-[13px] text-gray-700 bengali">{a.text}</div>
                      <div className="text-[11px] text-gray-400 bengali">{a.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Build CTA */}
            <Link href="/agents/new" className="flex items-center justify-center gap-2 py-4 bg-gray-50 hover:bg-gray-100 border border-dashed border-gray-300 rounded-2xl text-gray-500 text-sm font-medium transition-colors">
              <Plus size={16} /> নতুন এজেন্ট তৈরি করুন
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
