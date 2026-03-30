'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { Plus, MessageSquare, Bot, Share2, Star, ArrowRight } from 'lucide-react'
import AgentRunner from '@/components/AgentRunner'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [agents, setAgents] = useState<any[]>([])
  const [selectedAgent, setSelectedAgent] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.push('/login')
        return
      }
      setUser(data.user)
      const { data: agentData } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', data.user.id)
        .order('created_at', { ascending: false })
      if (agentData) setAgents(agentData)
      setLoading(false)
    })
  }, [router])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-500 bengali text-lg">লোড হচ্ছে...</div>
    </div>
  )

  if (!user) return null

  const userName = user.email?.split('@')[0] || 'বন্ধু'

  if (selectedAgent) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setSelectedAgent(null)}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm mb-6 transition-colors"
          >
            ← Dashboard এ ফিরুন
          </button>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-gray-200 p-6" style={{ borderTop: `3px solid ${selectedAgent.color}` }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-3" style={{ background: selectedAgent.color }}>
                  {selectedAgent.icon}
                </div>
                <h2 className="font-bold text-gray-900 text-lg bengali">{selectedAgent.name_bn || selectedAgent.name}</h2>
                <p className="text-gray-500 text-sm mt-2 bengali">{selectedAgent.description_bn || selectedAgent.description}</p>
              </div>
            </div>
            <div className="lg:col-span-2">
              <AgentRunner agent={selectedAgent} agentId={selectedAgent.id} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">
              নমস্কার, <span className="text-indigo-600 bengali">{userName}</span> 👋
            </h1>
            <p className="text-gray-500 text-sm mt-1 bengali">আপনার AI এজেন্টের সারসংক্ষেপ</p>
          </div>
          <Link href="/agents/new"
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors">
            <Plus size={16} /> নতুন এজেন্ট
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            { icon: <Bot size={22} className="text-indigo-500" />, val: String(agents.length), label: 'আমার এজেন্ট', color: 'bg-indigo-50' },
            { icon: <MessageSquare size={22} className="text-emerald-500" />, val: '0', label: 'কথোপকথন', color: 'bg-emerald-50' },
            { icon: <Share2 size={22} className="text-violet-500" />, val: '0', label: 'শেয়ার করা', color: 'bg-violet-50' },
            { icon: <Star size={22} className="text-amber-500" />, val: '—', label: 'Rating', color: 'bg-amber-50' },
          ].map(m => (
            <div key={m.label} className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className={`w-10 h-10 ${m.color} rounded-xl flex items-center justify-center mb-3`}>{m.icon}</div>
              <div className="text-2xl font-extrabold text-gray-900 bengali">{m.val}</div>
              <div className="text-[13px] text-gray-500 bengali">{m.label}</div>
            </div>
          ))}
        </div>

        {agents.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
            <div className="text-5xl mb-4">🤖</div>
            <h3 className="font-bold text-gray-900 text-xl mb-2 bengali">এখনও কোনো এজেন্ট নেই</h3>
            <p className="text-gray-500 text-sm bengali mb-6">আপনার প্রথম AI এজেন্ট তৈরি করুন</p>
            <Link href="/agents/new"
              className="inline-flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors">
              <Plus size={16} /> এজেন্ট তৈরি করুন →
            </Link>
          </div>
        ) : (
          <div>
            <h2 className="font-bold text-gray-900 mb-4 bengali">আমার এজেন্ট সমূহ — click করে chat করুন</h2>
            <div className="space-y-3">
              {agents.map(agent => (
                <div key={agent.id}
                  onClick={() => setSelectedAgent(agent)}
                  className="flex items-center gap-4 bg-white border border-gray-200 rounded-2xl p-4 hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer group">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: agent.color }}>
                    {agent.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-900 text-[14px] bengali">{agent.name_bn || agent.name}</div>
                    <div className="text-gray-400 text-[12px] bengali line-clamp-1">{agent.description_bn || agent.description}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full">Active</span>
                    <ArrowRight size={14} className="text-gray-400 group-hover:text-indigo-600 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
