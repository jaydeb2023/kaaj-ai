'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PREBUILT_AGENTS, CATEGORY_LABELS, AgentCategory } from '@/types'
import { Search, MessageSquare, ArrowRight, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useRequireAuth } from '@/lib/useRequireAuth'

const ALL_CATEGORIES: AgentCategory[] = ['business', 'education', 'festival', 'finance', 'health', 'agriculture', 'service']

function agentSlug(name: string) {
  return name.toLowerCase().replace(/[&]/g, 'and').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

function useConversationCounts() {
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: agents } = await supabase
        .from('agents')
        .select('id, name, use_count')
        .eq('is_public', true)

      if (!agents) { setLoaded(true); return }

      const { data: convs } = await supabase
        .from('conversations')
        .select('agent_id')

      const convMap: Record<string, number> = {}
      if (convs) {
        const agentIdToName: Record<string, string> = {}
        agents.forEach(a => { agentIdToName[a.id] = a.name })
        convs.forEach(c => {
          const name = agentIdToName[c.agent_id]
          if (name) convMap[name] = (convMap[name] || 0) + 1
        })
      }

      const finalMap: Record<string, number> = {}
      agents.forEach(a => {
        finalMap[a.name] = convMap[a.name] ?? a.use_count ?? 0
      })

      setCounts(finalMap)
      setLoaded(true)
    }
    load()
  }, [])

  return { counts, loaded }
}

function CountBadge({ name, counts, loaded }: { name: string; counts: Record<string, number>; loaded: boolean }) {
  if (!loaded) {
    return <span className="text-xs text-gray-300 flex items-center gap-1"><MessageSquare size={11} />...</span>
  }
  const count = counts[name] ?? 0
  if (count === 0) {
    return (
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
        ✨ New
      </span>
    )
  }
  return (
    <span className="text-xs text-gray-400 flex items-center gap-1">
      <MessageSquare size={11} />
      {count.toLocaleString()} conversations
    </span>
  )
}

export default function LibraryPage() {
  const { user, loading: authLoading } = useRequireAuth()
  const [search, setSearch]                 = useState('')
  const [activeCategory, setActiveCategory] = useState<AgentCategory | 'all'>('all')
  const { counts, loaded }                  = useConversationCounts()

  // Show loading spinner while checking auth
  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader2 size={32} className="animate-spin text-indigo-500" />
          <span className="bengali text-sm">লোড হচ্ছে...</span>
        </div>
      </div>
    )
  }

  const filtered = PREBUILT_AGENTS.filter(a => {
    const matchCat    = activeCategory === 'all' || a.category === activeCategory
    const matchSearch = !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      (a.name_bn?.includes(search)) ||
      a.description.toLowerCase().includes(search.toLowerCase()) ||
      (a.description_bn?.includes(search))
    return matchCat && matchSearch
  })

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
            Agent Library · <span className="text-indigo-600 bengali">এজেন্ট লাইব্রেরি</span>
          </h1>
          <p className="text-gray-500 bengali mb-6">
            ২৮টি ready-made এজেন্ট — ব্যবহার করুন, কাস্টমাইজ করুন, শেয়ার করুন
          </p>
          <div className="relative max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="এজেন্ট খুঁজুন... যেমন: দোকান, পড়াশোনা"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-[14px] focus:outline-none focus:border-indigo-400 bg-white bengali"
            />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* ── Category filters ───────────────────────────────────── */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-full text-[13px] font-semibold border transition-all ${
              activeCategory === 'all'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300'
            }`}
          >
            সব দেখুন
          </button>
          {ALL_CATEGORIES.map(cat => {
            const c = CATEGORY_LABELS[cat]
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-[13px] font-semibold border transition-all flex items-center gap-1.5 ${
                  activeCategory === cat
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300'
                }`}
              >
                <span>{c.icon}</span>
                <span className="bengali">{c.bn}</span>
              </button>
            )
          })}
        </div>

        <p className="text-xs text-gray-400 mb-5 bengali">
          {filtered.length}টি এজেন্ট দেখানো হচ্ছে
        </p>

        {/* ── Agent grid ─────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-4xl mb-3">🔍</div>
            <p className="bengali">কোনো এজেন্ট পাওয়া যায়নি</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((agent, i) => {
              const cat = CATEGORY_LABELS[agent.category]
              return (
                <Link
                  key={i}
                  href={`/library/${agentSlug(agent.name)}`}
                  className="group bg-white rounded-2xl border border-gray-200 p-5 hover:border-indigo-300 hover:shadow-md transition-all"
                  style={{ borderTop: `3px solid ${agent.color}` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl" style={{ background: agent.color }}>
                      {agent.icon}
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: cat.color, color: '#374151' }}>
                      <span className="bengali">{cat.bn}</span>
                    </span>
                  </div>

                  <h3 className="font-bold text-gray-900 text-[14px] mb-0.5">{agent.name}</h3>
                  {agent.name_bn && (
                    <p className="text-indigo-600 text-[12px] font-semibold mb-2 bengali">{agent.name_bn}</p>
                  )}
                  <p className="text-gray-500 text-[12px] leading-relaxed mb-4 bengali line-clamp-2">
                    {agent.description_bn || agent.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <CountBadge name={agent.name} counts={counts} loaded={loaded} />
                    <span className="text-indigo-600 text-xs font-semibold flex items-center gap-1 group-hover:gap-2 transition-all bengali">
                      চেষ্টা করুন <ArrowRight size={11} />
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* ── Build your own CTA ─────────────────────────────────── */}
        <div className="mt-12 bg-indigo-600 rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-extrabold text-white mb-2 bengali">নিজের এজেন্ট তৈরি করুন</h3>
          <p className="text-indigo-200 bengali mb-5">আপনার নিজস্ব চাহিদা অনুযায়ী কাস্টম এজেন্ট বানান — বাংলায়</p>
          <Link href="/agents/new" className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-indigo-600 font-bold rounded-xl transition-colors">
            এজেন্ট তৈরি করুন <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  )
}
