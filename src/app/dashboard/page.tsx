'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import {
  Plus, Bot, ArrowLeft, Mic, MicOff, Globe,
  Check, X, Users, TrendingUp, Zap, RefreshCw, MessageSquare
} from 'lucide-react'
import AgentRunner from '@/components/AgentRunner'
import ReportDashboard from '@/components/ReportDashboard'
import CRMDashboard from '@/components/CRMDashboard'
import toast from 'react-hot-toast'

// ── Floating Mic ──────────────────────────────────────────────
function FloatingMic({ onTranscript, lang, onLangToggle }: {
  onTranscript: (text: string) => void
  lang: 'bn-IN' | 'en-IN'
  onLangToggle: () => void
}) {
  const [listening, setListening] = useState(false)
  const recRef = useRef<any>(null)

  const toggle = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { toast.error('Voice support নেই'); return }
    if (listening) { recRef.current?.stop(); setListening(false); return }
    const r = new SR()
    recRef.current = r
    r.lang = lang; r.interimResults = false; r.continuous = false
    r.onstart  = () => setListening(true)
    r.onend    = () => setListening(false)
    r.onerror  = (e: any) => { setListening(false); if (e.error === 'not-allowed') toast.error('Microphone permission দিন') }
    r.onresult = (e: any) => {
      const text = Array.from(e.results).map((r: any) => r[0].transcript).join('')
      onTranscript(text)
      toast.success(`বললেন: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`)
    }
    r.start()
  }, [listening, lang, onTranscript])

  useEffect(() => () => { recRef.current?.abort() }, [])

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
      {/* Lang toggle pill */}
      <div style={{ display: 'flex', background: '#111827', borderRadius: '999px', padding: '3px 4px', gap: '2px', alignItems: 'center' }}>
        <Globe size={11} color="#6B7280" style={{ marginLeft: '5px' }} />
        {(['bn-IN', 'en-IN'] as const).map(l => (
          <button key={l} onClick={onLangToggle} style={{
            fontSize: '10px', fontWeight: 600, padding: '3px 10px', borderRadius: '999px', cursor: 'pointer', border: 'none', transition: 'all .15s',
            background: lang === l ? '#4F46E5' : 'transparent',
            color: lang === l ? '#fff' : '#9CA3AF',
          }}>{l === 'bn-IN' ? 'বাংলা' : 'EN'}</button>
        ))}
      </div>

      {/* Status label */}
      {listening && (
        <div style={{ background: '#EF4444', color: '#fff', fontSize: '11px', fontWeight: 600, padding: '4px 14px', borderRadius: '999px' }}>
          {lang === 'bn-IN' ? '🔴 বলুন...' : '🔴 Speak...'}
        </div>
      )}

      {/* Mic button */}
      <button onClick={toggle} style={{
        width: '60px', height: '60px', borderRadius: '50%', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: listening ? '#EF4444' : '#4F46E5',
        boxShadow: listening
          ? '0 0 0 8px rgba(239,68,68,0.15), 0 4px 20px rgba(239,68,68,0.4)'
          : '0 4px 20px rgba(79,70,229,0.5)',
        animation: listening ? 'mic-ring 1.2s ease-in-out infinite' : 'none',
        transition: 'background .2s, box-shadow .2s',
      }}>
        {listening ? <MicOff size={24} color="#fff" /> : <Mic size={24} color="#fff" />}
      </button>

      <style>{`
        @keyframes mic-ring {
          0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.3), 0 4px 20px rgba(239,68,68,0.4); }
          50%      { box-shadow: 0 0 0 14px rgba(239,68,68,0), 0 4px 20px rgba(239,68,68,0.4); }
        }
      `}</style>
    </div>
  )
}

// ── CRM Suggestion Card ───────────────────────────────────────
function CRMSuggestionCard({ suggestion, onConfirm, onDismiss }: {
  suggestion: any; onConfirm: () => void; onDismiss: () => void
}) {
  return (
    <div style={{
      position: 'fixed', bottom: '100px', right: '24px', zIndex: 49, width: '290px',
      background: '#fff', border: '2px solid #4F46E5', borderRadius: '16px', padding: '16px',
      boxShadow: '0 8px 32px rgba(79,70,229,0.18)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <div style={{ background: '#EEF2FF', borderRadius: '8px', padding: '6px', display: 'flex' }}>
          <Users size={14} color="#4F46E5" />
        </div>
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#111827' }}>CRM-এ save করবেন?</span>
        <button onClick={onDismiss} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}><X size={14} /></button>
      </div>
      <div style={{ background: '#F9FAFB', borderRadius: '10px', padding: '10px', marginBottom: '12px', fontSize: '12px', color: '#374151', lineHeight: 1.6 }}>
        {suggestion.customer_name && <div>👤 <strong>{suggestion.customer_name}</strong></div>}
        {suggestion.phone         && <div>📞 {suggestion.phone}</div>}
        {suggestion.item_name     && <div>💊 {suggestion.item_name}{suggestion.quantity ? ` × ${suggestion.quantity}` : ''}</div>}
        {suggestion.unit_price    && <div>💰 ₹{suggestion.unit_price}</div>}
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={onDismiss} style={{ flex: 1, padding: '8px', borderRadius: '10px', border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontSize: '12px', color: '#6B7280' }}>
          না থাক
        </button>
        <button onClick={onConfirm} style={{ flex: 1, padding: '8px', borderRadius: '10px', border: 'none', background: '#4F46E5', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
          <Check size={13} /> সেভ করুন
        </button>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser]                   = useState<any>(null)
  const [loading, setLoading]             = useState(true)
  const [agents, setAgents]               = useState<any[]>([])
  const [selectedAgent, setSelectedAgent] = useState<any>(null)
  const [activeTab, setActiveTab]         = useState<'chat' | 'reports' | 'crm'>('chat')
  const [micLang, setMicLang]             = useState<'bn-IN' | 'en-IN'>('bn-IN')
  const [suggestion, setSuggestion]       = useState<any>(null)
  const [crmKey, setCrmKey]               = useState(0)
  const [totalCustomers, setTotalCustomers] = useState(0)
  const [totalRevenue, setTotalRevenue]   = useState(0)

  const refreshStats = useCallback(async (uid: string) => {
    try {
      const [custRes, purchRes] = await Promise.all([
        supabase.from('crm_customers').select('*', { count: 'exact', head: true }).eq('user_id', uid),
        supabase.from('crm_purchases').select('total_amount').eq('user_id', uid),
      ])
      setTotalCustomers(custRes.count ?? 0)
      const rev = (purchRes.data || []).reduce((s: number, p: any) => s + Number(p.total_amount || 0), 0)
      setTotalRevenue(rev)
    } catch {
      setTotalCustomers(0)
      setTotalRevenue(0)
    }
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/login'); return }
      setUser(data.user)
      const { data: agentData } = await supabase.from('agents').select('*')
        .eq('user_id', data.user.id).order('created_at', { ascending: false })
      if (agentData) setAgents(agentData)
      await refreshStats(data.user.id)
      setLoading(false)
    })
  }, [router, refreshStats])

  // Voice → send to AgentRunner via custom event
  const handleMicTranscript = useCallback((text: string) => {
    window.dispatchEvent(new CustomEvent('sahayak-voice-input', { detail: { text } }))
  }, [])

  // Save suggestion to CRM
  const confirmSave = async () => {
    if (!suggestion || !user || !selectedAgent) return
    try {
      const btype = selectedAgent.category === 'health' ? 'pharmacy' : selectedAgent.category === 'education' ? 'coaching' : 'dokan'
      let customerId: string | null = null

      if (suggestion.customer_name) {
        const { data: ex } = await supabase.from('crm_customers').select('id')
          .eq('user_id', user.id).ilike('name', suggestion.customer_name).maybeSingle()
        if (ex) {
          customerId = ex.id
        } else {
          const { data: nc } = await supabase.from('crm_customers').insert({
            user_id: user.id, agent_id: selectedAgent.id, business_type: btype,
            name: suggestion.customer_name, phone: suggestion.phone || null,
          }).select().single()
          customerId = nc?.id || null
        }
      }

      if (customerId && suggestion.item_name) {
        await supabase.from('crm_purchases').insert({
          user_id: user.id, customer_id: customerId,
          purchase_date: new Date().toISOString().split('T')[0],
          item_name: suggestion.item_name,
          quantity: suggestion.quantity || 1, unit: 'pcs',
          unit_price: suggestion.unit_price || 0, paid_amount: 0,
          payment_status: 'pending', source: 'chat',
        })
      }

      toast.success('CRM-এ সেভ হয়েছে! 🎉')
      setSuggestion(null)
      setCrmKey(k => k + 1)
      await refreshStats(user.id)
    } catch { toast.error('সেভ করতে সমস্যা') }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-500 bengali text-lg animate-pulse">লোড হচ্ছে...</div>
    </div>
  )
  if (!user) return null

  const userName = user.email?.split('@')[0] || 'বন্ধু'

  // ── Agent view ───────────────────────────────────────────
  if (selectedAgent) {
    const btype = selectedAgent.category === 'health' ? 'pharmacy' : selectedAgent.category === 'education' ? 'coaching' : 'dokan'
    return (
      <div className="min-h-screen bg-gray-50 pb-28">
        <div className="max-w-7xl mx-auto px-4 py-6">

          {/* Top bar */}
          <div className="flex items-center gap-4 mb-5">
            <button onClick={() => setSelectedAgent(null)}
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-sm transition-colors">
              <ArrowLeft size={14} /> ফিরুন
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: selectedAgent.color }}>
                {selectedAgent.icon}
              </div>
              <span className="font-bold text-gray-900 bengali">{selectedAgent.name_bn || selectedAgent.name}</span>
              <span className="flex items-center gap-1 text-xs text-emerald-500">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Online
              </span>
            </div>
          </div>

          {/* Pills tabs */}
          <div className="flex gap-1 mb-5 bg-white border border-gray-200 p-1 rounded-xl w-fit shadow-sm">
            {[
              { id: 'chat',    icon: <MessageSquare size={13} />, label: 'Chat'     },
              { id: 'reports', icon: <TrendingUp size={13} />,    label: 'রিপোর্ট' },
              { id: 'crm',     icon: <Users size={13} />,         label: 'CRM'      },
            ].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id as any)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all bengali ${
                  activeTab === t.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Chat */}
          {activeTab === 'chat' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-1 space-y-4">
                <div className="bg-white rounded-2xl border border-gray-200 p-5"
                  style={{ borderTop: `3px solid ${selectedAgent.color}` }}>
                  <p className="text-gray-500 text-sm bengali leading-relaxed mb-4">{selectedAgent.description_bn || selectedAgent.description}</p>
                  <div className="space-y-2">
                    <button onClick={() => setActiveTab('crm')}
                      className="w-full text-xs font-semibold text-violet-600 border border-violet-200 rounded-lg py-2 hover:bg-violet-50 flex items-center justify-center gap-1.5 bengali">
                      <Users size={12} /> Customer CRM
                    </button>
                    <button onClick={() => setActiveTab('reports')}
                      className="w-full text-xs font-semibold text-indigo-600 border border-indigo-200 rounded-lg py-2 hover:bg-indigo-50 flex items-center justify-center gap-1.5 bengali">
                      <TrendingUp size={12} /> রিপোর্ট ও হিসাব
                    </button>
                  </div>
                </div>

                {/* Live CRM mini stats */}
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-4 text-white">
                  <div className="text-xs font-semibold text-indigo-200 mb-3 bengali">Live CRM</div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <div className="text-2xl font-extrabold">{totalCustomers}</div>
                      <div className="text-xs text-indigo-200 bengali">Customer</div>
                    </div>
                    <div>
                      <div className="text-xl font-extrabold">₹{totalRevenue > 999 ? `${(totalRevenue/1000).toFixed(1)}k` : totalRevenue}</div>
                      <div className="text-xs text-indigo-200 bengali">Revenue</div>
                    </div>
                  </div>
                  <button onClick={() => setActiveTab('crm')}
                    className="w-full text-xs font-semibold py-1.5 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors bengali">
                    CRM খুলুন →
                  </button>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                  <p className="text-xs text-amber-700 bengali leading-relaxed">
                    💡 নিচের <strong>নীল mic</strong> বাটন দিয়ে বাংলায় বলুন। AI বুঝে CRM-এ save করার পরামর্শ দেবে।
                  </p>
                </div>
              </div>

              <div className="lg:col-span-2">
                <AgentRunner agent={selectedAgent} agentId={selectedAgent.id} />
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <ReportDashboard userId={user.id} agentId={selectedAgent.id} agentName={selectedAgent.name_bn || selectedAgent.name} />
          )}

          {activeTab === 'crm' && (
            <CRMDashboard key={crmKey} userId={user.id} agentId={selectedAgent.id} businessType={btype} agentName={selectedAgent.name_bn || selectedAgent.name} />
          )}
        </div>

        <FloatingMic lang={micLang} onLangToggle={() => setMicLang(l => l === 'bn-IN' ? 'en-IN' : 'bn-IN')} onTranscript={handleMicTranscript} />
        {suggestion && <CRMSuggestionCard suggestion={suggestion} onConfirm={confirmSave} onDismiss={() => setSuggestion(null)} />}
      </div>
    )
  }

  // ── Main list ────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">
              নমস্কার, <span className="text-indigo-600 bengali">{userName}</span> 👋
            </h1>
            <p className="text-gray-500 text-sm mt-1 bengali">আপনার AI সহায়কের সারসংক্ষেপ</p>
          </div>
          <Link href="/agents/new"
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors">
            <Plus size={16} /> নতুন এজেন্ট
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: <Bot size={20} className="text-indigo-500" />,       val: String(agents.length),                 label: 'আমার এজেন্ট', bg: 'bg-indigo-50'  },
            { icon: <Users size={20} className="text-violet-500" />,     val: String(totalCustomers),                label: 'মোট Customer', bg: 'bg-violet-50'  },
            { icon: <TrendingUp size={20} className="text-emerald-500" />,val: `₹${totalRevenue.toLocaleString()}`, label: 'মোট Revenue',  bg: 'bg-emerald-50' },
            { icon: <Zap size={20} className="text-amber-500" />,        val: '100%',                                label: 'বিনামূল্যে',  bg: 'bg-amber-50'   },
          ].map(m => (
            <div key={m.label} className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className={`w-10 h-10 ${m.bg} rounded-xl flex items-center justify-center mb-3`}>{m.icon}</div>
              <div className="text-2xl font-extrabold text-gray-900">{m.val}</div>
              <div className="text-[13px] text-gray-500 bengali">{m.label}</div>
            </div>
          ))}
        </div>

        {/* Agent list */}
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 bengali">আমার এজেন্ট</h2>
              <button onClick={() => user && refreshStats(user.id)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 transition-colors">
                <RefreshCw size={12} /> Refresh
              </button>
            </div>
            <div className="space-y-3">
              {agents.map(agent => (
                <div key={agent.id}
                  onClick={() => { setSelectedAgent(agent); setActiveTab('chat') }}
                  className="flex items-center gap-4 bg-white border border-gray-200 rounded-2xl p-4 hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer group">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: agent.color }}>
                    {agent.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-900 text-[14px] bengali">{agent.name_bn || agent.name}</div>
                    <div className="text-gray-400 text-[12px] bengali line-clamp-1">{agent.description_bn || agent.description}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={e => { e.stopPropagation(); setSelectedAgent(agent); setActiveTab('crm') }}
                      className="text-xs font-semibold px-3 py-1.5 bg-violet-50 text-violet-600 rounded-full hover:bg-violet-100 transition-colors flex items-center gap-1">
                      <Users size={10} /> CRM
                    </button>
                    <button onClick={e => { e.stopPropagation(); setSelectedAgent(agent); setActiveTab('reports') }}
                      className="text-xs font-semibold px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors bengali">
                      📊 রিপোর্ট
                    </button>
                    <span className="text-xs font-semibold px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full">Active</span>
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
