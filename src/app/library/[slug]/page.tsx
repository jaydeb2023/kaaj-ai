'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { PREBUILT_AGENTS } from '@/types'
import {
  ArrowLeft, Mic, MicOff, Send, Download, Plus, Trash2,
  Check, X, FileText, Phone, User, Calendar, Package,
  AlertTriangle, TrendingUp, DollarSign, Clock, Globe,
  ChevronDown, ChevronUp, Printer, Share2
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import toast from 'react-hot-toast'

// ── slug helper ──────────────────────────────────────────────────
function agentSlug(name: string) {
  return name.toLowerCase().replace(/[&]/g, 'and').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

// ── Voice hook ───────────────────────────────────────────────────
declare global { interface Window { SpeechRecognition: any; webkitSpeechRecognition: any } }

function useVoice(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(true)
  const [lang, setLang] = useState<'bn-IN' | 'en-IN'>('bn-IN')
  const ref = useRef<any>(null)

  useEffect(() => {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) setSupported(false)
  }, [])

  const start = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { toast.error('Browser voice support নেই'); return }
    if (ref.current) ref.current.stop()
    const r = new SR()
    ref.current = r
    r.lang = lang; r.interimResults = true; r.continuous = false
    r.onstart = () => setListening(true)
    r.onresult = (e: any) => { let t = ''; for (let i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript; onResult(t) }
    r.onerror = () => setListening(false)
    r.onend = () => setListening(false)
    r.start()
  }, [lang, onResult])

  const stop = useCallback(() => { ref.current?.stop(); setListening(false) }, [])
  useEffect(() => () => ref.current?.abort(), [])
  return { listening, supported, lang, setLang, start, stop }
}

// ── Chat component (shared across all agents) ────────────────────
function AgentChat({ agent }: { agent: any }) {
  const [messages, setMessages] = useState([{ role: 'assistant', content: `নমস্কার! আমি **${agent.name_bn || agent.name}**। ${agent.description_bn}\n\nআপনাকে কীভাবে সাহায্য করতে পারি?` }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  const voice = useVoice((t) => setInput(t))
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  const send = async (text?: string) => {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')
    const newMsgs = [...messages, { role: 'user', content: msg }]
    setMessages(newMsgs)
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMsgs, systemPrompt: agent.system_prompt })
      })
      const data = await res.json()
      setMessages([...newMsgs, { role: 'assistant', content: data.content }])
    } catch { toast.error('উত্তর পেতে সমস্যা। আবার চেষ্টা করুন।'); setMessages(newMsgs.slice(0, -1)) }
    finally { setLoading(false) }
  }

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-gray-200 overflow-hidden h-[520px]">
      <div className="bg-gray-900 px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: agent.color }}>{agent.icon}</div>
        <div>
          <div className="font-bold text-white text-[13px] bengali">{agent.name_bn || agent.name}</div>
          <div className="text-emerald-400 text-[10px] flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />AI সহায়ক · Online</div>
        </div>
        {voice.supported && (
          <div className="ml-auto flex items-center gap-1 bg-gray-800 rounded-lg p-1">
            <Globe size={11} className="text-gray-400 ml-1" />
            {(['bn-IN', 'en-IN'] as const).map(l => (
              <button key={l} onClick={() => voice.setLang(l)} className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors ${voice.lang === l ? 'bg-indigo-600 text-white' : 'text-gray-400'}`}>{l === 'bn-IN' ? 'বাং' : 'EN'}</button>
            ))}
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm mr-2 mt-1 flex-shrink-0" style={{ background: agent.color }}>{agent.icon}</div>}
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed bengali ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-gray-50 text-gray-800 border border-gray-100 rounded-bl-sm'}`}>
              {m.role === 'assistant' ? <ReactMarkdown className="prose prose-sm max-w-none">{m.content}</ReactMarkdown> : m.content}
            </div>
          </div>
        ))}
        {loading && <div className="flex justify-start"><div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm mr-2 flex-shrink-0" style={{ background: agent.color }}>{agent.icon}</div><div className="bg-gray-50 border rounded-2xl px-4 py-3"><div className="flex gap-1"><span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" /></div></div></div>}
        <div ref={endRef} />
      </div>
      <div className="p-3 border-t flex gap-2 items-end">
        {voice.supported && (
          <button onClick={voice.listening ? voice.stop : voice.start} className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${voice.listening ? 'bg-red-500 animate-pulse' : 'bg-gray-100 hover:bg-gray-200'}`}>
            {voice.listening ? <MicOff size={15} className="text-white" /> : <Mic size={15} className="text-gray-600" />}
          </button>
        )}
        <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} placeholder={voice.listening ? 'বলুন...' : 'বাংলায় লিখুন বা মাইক্রোফোনে বলুন...'} rows={1} className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-[13px] focus:outline-none focus:border-indigo-400 bengali max-h-[100px]" style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }} />
        <button onClick={() => send()} disabled={!input.trim() || loading} className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 flex items-center justify-center flex-shrink-0"><Send size={15} className="text-white" /></button>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// AGENT-SPECIFIC UI COMPONENTS
// ══════════════════════════════════════════════════════════════════

// ── 1. DOKAN MANAGER ─────────────────────────────────────────────
function DokanManagerUI() {
  const [sales, setSales] = useState([{ item: 'চাল', qty: '25 kg', price: 1250, paid: 1250 }, { item: 'ডাল', qty: '10 kg', price: 800, paid: 500 }])
  const [baki, setBaki] = useState([{ name: 'রামবাবু', amount: 650, days: 15 }, { name: 'সুমিত্রা দেবী', amount: 320, days: 7 }])
  const [stock, setStock] = useState([{ item: 'চাল', qty: 15, unit: 'kg', min: 20 }, { item: 'সর্ষের তেল', qty: 8, unit: 'L', min: 10 }])
  const [newSale, setNewSale] = useState({ item: '', qty: '', price: '', paid: '' })
  const [showBill, setShowBill] = useState(false)
  const [billItems, setBillItems] = useState<{item: string, qty: string, price: string}[]>([{ item: '', qty: '', price: '' }])

  const totalSales = sales.reduce((s, r) => s + r.price, 0)
  const totalBaki  = baki.reduce((s, r) => s + r.amount, 0)
  const totalPaid  = sales.reduce((s, r) => s + r.paid, 0)

  const addSale = () => {
    if (!newSale.item || !newSale.price) return
    setSales([...sales, { item: newSale.item, qty: newSale.qty, price: +newSale.price, paid: +newSale.paid || +newSale.price }])
    setNewSale({ item: '', qty: '', price: '', paid: '' })
    toast.success('বিক্রি যোগ হয়েছে!')
  }

  const printBill = () => {
    const total = billItems.reduce((s, i) => s + (+i.price || 0), 0)
    const w = window.open('', '_blank')!
    w.document.write(`<html><head><title>Bill</title><style>body{font-family:sans-serif;padding:20px}table{width:100%}td,th{padding:6px;border-bottom:1px solid #eee}h2{text-align:center}.total{font-weight:bold;font-size:1.2em}</style></head><body>
      <h2>🏪 দোকানের বিল</h2><p>তারিখ: ${new Date().toLocaleDateString('bn-IN')}</p>
      <table><tr><th>পণ্য</th><th>পরিমাণ</th><th>মূল্য</th></tr>
      ${billItems.map(i => `<tr><td>${i.item}</td><td>${i.qty}</td><td>₹${i.price}</td></tr>`).join('')}
      </table><p class="total">মোট: ₹${total}</p>
      <p style="text-align:center;margin-top:30px">ধন্যবাদ!</p></body></html>`)
    w.print()
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[{ label: 'আজকের বিক্রি', value: `₹${totalSales.toLocaleString()}`, icon: '📈', color: 'bg-green-50 border-green-200' },
          { label: 'মোট পাওনা', value: `₹${(totalSales - totalPaid).toLocaleString()}`, icon: '💰', color: 'bg-yellow-50 border-yellow-200' },
          { label: 'বাকি', value: `₹${totalBaki.toLocaleString()}`, icon: '⚠️', color: 'bg-red-50 border-red-200' }].map(s => (
          <div key={s.label} className={`${s.color} border rounded-xl p-3 text-center`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="font-bold text-gray-900 text-lg">{s.value}</div>
            <div className="text-xs text-gray-500 bengali">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Add sale */}
      <div className="bg-white border rounded-xl p-4">
        <h3 className="font-bold text-gray-800 mb-3 bengali flex items-center gap-2">➕ নতুন বিক্রি যোগ করুন</h3>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <input className="border rounded-lg px-3 py-2 text-sm bengali" placeholder="পণ্যের নাম" value={newSale.item} onChange={e => setNewSale({ ...newSale, item: e.target.value })} />
          <input className="border rounded-lg px-3 py-2 text-sm bengali" placeholder="পরিমাণ (যেমন: 5 kg)" value={newSale.qty} onChange={e => setNewSale({ ...newSale, qty: e.target.value })} />
          <input className="border rounded-lg px-3 py-2 text-sm" placeholder="মোট মূল্য (₹)" type="number" value={newSale.price} onChange={e => setNewSale({ ...newSale, price: e.target.value })} />
          <input className="border rounded-lg px-3 py-2 text-sm" placeholder="পরিশোধিত (₹)" type="number" value={newSale.paid} onChange={e => setNewSale({ ...newSale, paid: e.target.value })} />
        </div>
        <button onClick={addSale} className="w-full bg-indigo-600 text-white rounded-lg py-2 text-sm font-bold bengali hover:bg-indigo-700">যোগ করুন</button>
      </div>

      {/* Today's sales */}
      <div className="bg-white border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800 bengali">📋 আজকের বিক্রির তালিকা</h3>
          <button onClick={() => setShowBill(!showBill)} className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg font-bold bengali border border-indigo-200">🧾 বিল তৈরি করুন</button>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="text-xs text-gray-500 border-b"><th className="text-left pb-2 bengali">পণ্য</th><th className="text-left pb-2 bengali">পরিমাণ</th><th className="text-right pb-2 bengali">মূল্য</th><th className="text-right pb-2 bengali">বাকি</th></tr></thead>
          <tbody>{sales.map((s, i) => (
            <tr key={i} className="border-b border-gray-50">
              <td className="py-2 bengali font-medium">{s.item}</td>
              <td className="py-2 text-gray-500 bengali">{s.qty}</td>
              <td className="py-2 text-right">₹{s.price}</td>
              <td className={`py-2 text-right font-bold ${s.price - s.paid > 0 ? 'text-red-500' : 'text-green-600'}`}>{s.price - s.paid > 0 ? `₹${s.price - s.paid}` : '✓'}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      {/* Bill maker */}
      {showBill && (
        <div className="bg-white border border-indigo-200 rounded-xl p-4">
          <h3 className="font-bold text-gray-800 mb-3 bengali">🧾 বিল তৈরি করুন</h3>
          {billItems.map((item, i) => (
            <div key={i} className="grid grid-cols-3 gap-2 mb-2">
              <input className="border rounded-lg px-3 py-2 text-sm bengali col-span-1" placeholder="পণ্য" value={item.item} onChange={e => { const b = [...billItems]; b[i].item = e.target.value; setBillItems(b) }} />
              <input className="border rounded-lg px-3 py-2 text-sm bengali" placeholder="পরিমাণ" value={item.qty} onChange={e => { const b = [...billItems]; b[i].qty = e.target.value; setBillItems(b) }} />
              <input className="border rounded-lg px-3 py-2 text-sm" placeholder="₹ মূল্য" value={item.price} onChange={e => { const b = [...billItems]; b[i].price = e.target.value; setBillItems(b) }} />
            </div>
          ))}
          <div className="flex gap-2 mt-2">
            <button onClick={() => setBillItems([...billItems, { item: '', qty: '', price: '' }])} className="flex-1 border border-dashed border-gray-300 rounded-lg py-2 text-sm text-gray-500 bengali">+ পণ্য যোগ</button>
            <button onClick={printBill} className="flex-1 bg-green-600 text-white rounded-lg py-2 text-sm font-bold bengali flex items-center justify-center gap-2"><Printer size={14} />প্রিন্ট / ডাউনলোড</button>
          </div>
          <div className="mt-3 text-right font-bold text-lg bengali">মোট: ₹{billItems.reduce((s, i) => s + (+i.price || 0), 0)}</div>
        </div>
      )}

      {/* Baki list */}
      <div className="bg-white border rounded-xl p-4">
        <h3 className="font-bold text-gray-800 mb-3 bengali">⚠️ বাকির তালিকা</h3>
        <div className="space-y-2">
          {baki.map((b, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
              <div>
                <div className="font-bold text-gray-800 bengali">{b.name}</div>
                <div className="text-xs text-gray-500 bengali">{b.days} দিন ধরে বাকি</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-red-600 text-lg">₹{b.amount}</div>
                <button onClick={() => { setBaki(baki.filter((_, j) => j !== i)); toast.success('পরিশোধ হিসাবে চিহ্নিত!') }} className="text-xs text-green-600 font-bold bengali">✓ পরিশোধ</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Low stock alert */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
        <h3 className="font-bold text-orange-800 mb-2 bengali flex items-center gap-2"><AlertTriangle size={15} />কম স্টক সতর্কতা</h3>
        {stock.filter(s => s.qty < s.min).map((s, i) => (
          <div key={i} className="flex justify-between text-sm py-1 bengali"><span className="text-orange-800">{s.item}</span><span className="font-bold text-orange-700">{s.qty} {s.unit} বাকি (minimum: {s.min})</span></div>
        ))}
      </div>
    </div>
  )
}

// ── 2. PHARMACY ASSISTANT ────────────────────────────────────────
function PharmacyUI() {
  const [medicines, setMedicines] = useState([
    { name: 'Paracetamol 500mg', stock: 84, unit: 'strip', expiry: '2026-08', minStock: 50, price: 12 },
    { name: 'Amoxicillin 250mg', stock: 23, unit: 'strip', expiry: '2025-12', minStock: 30, price: 45 },
    { name: 'Antacid Syrup', stock: 12, unit: 'bottle', expiry: '2025-11', minStock: 15, price: 55 },
    { name: 'Vitamin C 500mg', stock: 60, unit: 'strip', expiry: '2026-03', minStock: 40, price: 18 },
  ])
  const [newMed, setNewMed] = useState({ name: '', stock: '', unit: 'strip', expiry: '', price: '' })
  const [showBill, setShowBill] = useState(false)
  const [billMeds, setBillMeds] = useState<{name: string, qty: string, price: string}[]>([{ name: '', qty: '', price: '' }])

  const now = new Date()
  const expiringSoon = medicines.filter(m => {
    const exp = new Date(m.expiry + '-01')
    const diff = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)
    return diff < 3
  })
  const lowStock = medicines.filter(m => m.stock < m.minStock)

  const addMed = () => {
    if (!newMed.name) return
    setMedicines([...medicines, { name: newMed.name, stock: +newMed.stock, unit: newMed.unit, expiry: newMed.expiry, minStock: 20, price: +newMed.price }])
    setNewMed({ name: '', stock: '', unit: 'strip', expiry: '', price: '' })
    toast.success('ওষুধ যোগ হয়েছে!')
  }

  const printBill = () => {
    const total = billMeds.reduce((s, m) => s + (+m.price || 0), 0)
    const w = window.open('', '_blank')!
    w.document.write(`<html><head><title>Medicine Bill</title><style>body{font-family:sans-serif;padding:20px;max-width:400px}h2{text-align:center}table{width:100%}td,th{padding:6px;border-bottom:1px solid #eee}tfoot td{font-weight:bold}</style></head><body>
      <h2>💊 ওষুধের বিল</h2><p>তারিখ: ${new Date().toLocaleDateString('bn-IN')}</p><hr/>
      <table><thead><tr><th>ওষুধ</th><th>পরিমাণ</th><th>মূল্য</th></tr></thead><tbody>
      ${billMeds.map(m => `<tr><td>${m.name}</td><td>${m.qty}</td><td>₹${m.price}</td></tr>`).join('')}
      </tbody><tfoot><tr><td colspan="2">মোট</td><td>₹${total}</td></tr></tfoot></table>
      <p style="text-align:center;margin-top:20px;font-size:12px">সুস্থ থাকুন!</p></body></html>`)
    w.print()
  }

  return (
    <div className="space-y-4">
      {/* Alerts */}
      {(expiringSoon.length > 0 || lowStock.length > 0) && (
        <div className="grid grid-cols-1 gap-3">
          {expiringSoon.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <h4 className="font-bold text-red-800 bengali flex items-center gap-2 mb-2"><AlertTriangle size={14} />মেয়াদ শেষ হচ্ছে</h4>
              {expiringSoon.map((m, i) => <div key={i} className="text-sm text-red-700 bengali">• {m.name} — মেয়াদ: {m.expiry}</div>)}
            </div>
          )}
          {lowStock.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
              <h4 className="font-bold text-yellow-800 bengali flex items-center gap-2 mb-2"><Package size={14} />কম স্টক</h4>
              {lowStock.map((m, i) => <div key={i} className="text-sm text-yellow-700 bengali">• {m.name} — মাত্র {m.stock} {m.unit}</div>)}
            </div>
          )}
        </div>
      )}

      {/* Quick bill */}
      <div className="bg-white border rounded-xl p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-gray-800 bengali">💊 ওষুধের স্টক</h3>
          <button onClick={() => setShowBill(!showBill)} className="text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-lg font-bold bengali border border-green-200">🧾 বিল করুন</button>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="text-xs text-gray-500 border-b"><th className="text-left pb-2 bengali">ওষুধ</th><th className="text-right pb-2 bengali">স্টক</th><th className="text-right pb-2 bengali">মেয়াদ</th><th className="text-right pb-2 bengali">দাম</th></tr></thead>
          <tbody>{medicines.map((m, i) => (
            <tr key={i} className={`border-b border-gray-50 ${m.stock < m.minStock ? 'bg-yellow-50' : ''}`}>
              <td className="py-2 font-medium text-xs">{m.name}</td>
              <td className={`py-2 text-right font-bold text-xs ${m.stock < m.minStock ? 'text-red-600' : 'text-green-600'}`}>{m.stock} {m.unit}</td>
              <td className={`py-2 text-right text-xs ${expiringSoon.find(e => e.name === m.name) ? 'text-red-600 font-bold' : 'text-gray-500'}`}>{m.expiry}</td>
              <td className="py-2 text-right text-xs">₹{m.price}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      {/* Bill maker */}
      {showBill && (
        <div className="bg-white border border-green-200 rounded-xl p-4">
          <h3 className="font-bold text-gray-800 mb-3 bengali">🧾 ওষুধের বিল</h3>
          {billMeds.map((med, i) => (
            <div key={i} className="grid grid-cols-3 gap-2 mb-2">
              <input className="border rounded-lg px-3 py-2 text-sm col-span-1" placeholder="ওষুধের নাম" value={med.name} onChange={e => { const b = [...billMeds]; b[i].name = e.target.value; setBillMeds(b) }} />
              <input className="border rounded-lg px-3 py-2 text-sm" placeholder="পরিমাণ" value={med.qty} onChange={e => { const b = [...billMeds]; b[i].qty = e.target.value; setBillMeds(b) }} />
              <input className="border rounded-lg px-3 py-2 text-sm" placeholder="₹" value={med.price} onChange={e => { const b = [...billMeds]; b[i].price = e.target.value; setBillMeds(b) }} />
            </div>
          ))}
          <div className="flex gap-2">
            <button onClick={() => setBillMeds([...billMeds, { name: '', qty: '', price: '' }])} className="flex-1 border border-dashed rounded-lg py-2 text-sm text-gray-500 bengali">+ যোগ করুন</button>
            <button onClick={printBill} className="flex-1 bg-green-600 text-white rounded-lg py-2 text-sm font-bold flex items-center justify-center gap-2 bengali"><Printer size={14} />প্রিন্ট</button>
          </div>
          <div className="mt-2 text-right font-bold bengali">মোট: ₹{billMeds.reduce((s, m) => s + (+m.price || 0), 0)}</div>
        </div>
      )}

      {/* Add medicine */}
      <div className="bg-white border rounded-xl p-4">
        <h3 className="font-bold text-gray-800 mb-3 bengali">➕ নতুন ওষুধ যোগ করুন</h3>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <input className="border rounded-lg px-3 py-2 text-sm" placeholder="ওষুধের নাম" value={newMed.name} onChange={e => setNewMed({ ...newMed, name: e.target.value })} />
          <input className="border rounded-lg px-3 py-2 text-sm" placeholder="স্টক পরিমাণ" type="number" value={newMed.stock} onChange={e => setNewMed({ ...newMed, stock: e.target.value })} />
          <select className="border rounded-lg px-3 py-2 text-sm" value={newMed.unit} onChange={e => setNewMed({ ...newMed, unit: e.target.value })}>
            {['strip', 'tablet', 'bottle', 'tube', 'injection', 'pcs'].map(u => <option key={u}>{u}</option>)}
          </select>
          <input className="border rounded-lg px-3 py-2 text-sm" placeholder="মেয়াদ (YYYY-MM)" value={newMed.expiry} onChange={e => setNewMed({ ...newMed, expiry: e.target.value })} />
          <input className="border rounded-lg px-3 py-2 text-sm col-span-2" placeholder="দাম (₹)" type="number" value={newMed.price} onChange={e => setNewMed({ ...newMed, price: e.target.value })} />
        </div>
        <button onClick={addMed} className="w-full bg-indigo-600 text-white rounded-lg py-2 text-sm font-bold bengali hover:bg-indigo-700">যোগ করুন</button>
      </div>
    </div>
  )
}

// ── 3. GST & TAX HELPER ──────────────────────────────────────────
function GSTHelperUI() {
  const [items, setItems] = useState([{ desc: '', qty: '1', rate: '', gst: '18' }])
  const [bizName, setBizName] = useState('')
  const [gstin, setGstin] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [invoiceNo, setInvoiceNo] = useState(`INV-${Date.now().toString().slice(-6)}`)

  const total = items.reduce((s, i) => s + (+i.qty * +i.rate || 0), 0)
  const gstAmt = items.reduce((s, i) => s + (+i.qty * +i.rate * +i.gst / 100 || 0), 0)
  const grand = total + gstAmt

  const printInvoice = () => {
    const w = window.open('', '_blank')!
    w.document.write(`<html><head><title>GST Invoice</title><style>
      body{font-family:sans-serif;padding:30px;max-width:700px;margin:auto}
      h1{text-align:center;color:#4f46e5}table{width:100%;border-collapse:collapse}
      td,th{border:1px solid #ddd;padding:8px}th{background:#f3f4f6}
      .total-row{font-weight:bold;background:#eff6ff}.header{display:flex;justify-content:space-between}
      .badge{background:#4f46e5;color:white;padding:4px 12px;border-radius:20px;font-size:12px}
    </style></head><body>
      <h1>🧾 GST Invoice</h1>
      <div class="header">
        <div><strong>${bizName || 'আপনার ব্যবসা'}</strong><br/>GSTIN: ${gstin || 'N/A'}</div>
        <div class="badge">Invoice #${invoiceNo}</div>
      </div>
      <p>তারিখ: ${new Date().toLocaleDateString('bn-IN')} | গ্রাহক: ${customerName || 'N/A'}</p>
      <table><thead><tr><th>পণ্য/সেবা</th><th>পরিমাণ</th><th>দাম</th><th>GST%</th><th>GST টাকা</th><th>মোট</th></tr></thead>
      <tbody>${items.map(i => `<tr><td>${i.desc}</td><td>${i.qty}</td><td>₹${i.rate}</td><td>${i.gst}%</td><td>₹${(+i.qty * +i.rate * (+i.gst / 100)).toFixed(2)}</td>
<td>₹${(+i.qty * +i.rate * (1 + +i.gst / 100)).toFixed(2)}</td></tr>`).join('')}</tbody>
      <tfoot><tr class="total-row"><td colspan="4">মোট</td><td>₹${gstAmt.toFixed(2)}</td><td>₹${grand.toFixed(2)}</td></tr></tfoot>
      </table><br/><p>ধন্যবাদ আপনার ব্যবসার জন্য!</p></body></html>`)
    w.print()
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border rounded-xl p-4">
        <h3 className="font-bold text-gray-800 mb-3 bengali">🧾 GST Invoice তৈরি করুন</h3>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <input className="border rounded-lg px-3 py-2 text-sm bengali" placeholder="আপনার ব্যবসার নাম" value={bizName} onChange={e => setBizName(e.target.value)} />
          <input className="border rounded-lg px-3 py-2 text-sm" placeholder="GSTIN নম্বর" value={gstin} onChange={e => setGstin(e.target.value)} />
          <input className="border rounded-lg px-3 py-2 text-sm bengali" placeholder="গ্রাহকের নাম" value={customerName} onChange={e => setCustomerName(e.target.value)} />
          <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Invoice নম্বর" value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} />
        </div>
        <div className="border-t pt-3 mb-3">
          <div className="grid grid-cols-12 gap-1 text-xs font-bold text-gray-500 mb-2 bengali">
            <span className="col-span-4">পণ্য/সেবা</span><span className="col-span-2">পরিমাণ</span><span className="col-span-2">দাম (₹)</span><span className="col-span-2">GST %</span><span className="col-span-2">মোট</span>
          </div>
          {items.map((item, i) => (
            <div key={i} className="grid grid-cols-12 gap-1 mb-2 items-center">
              <input className="border rounded px-2 py-1.5 text-sm col-span-4 bengali" placeholder="বিবরণ" value={item.desc} onChange={e => { const it = [...items]; it[i].desc = e.target.value; setItems(it) }} />
              <input className="border rounded px-2 py-1.5 text-sm col-span-2" type="number" value={item.qty} onChange={e => { const it = [...items]; it[i].qty = e.target.value; setItems(it) }} />
              <input className="border rounded px-2 py-1.5 text-sm col-span-2" type="number" placeholder="₹" value={item.rate} onChange={e => { const it = [...items]; it[i].rate = e.target.value; setItems(it) }} />
              <select className="border rounded px-1 py-1.5 text-sm col-span-2" value={item.gst} onChange={e => { const it = [...items]; it[i].gst = e.target.value; setItems(it) }}>
                {['0', '5', '12', '18', '28'].map(g => <option key={g}>{g}</option>)}
              </select>
              <div className="col-span-2 text-right text-sm font-bold text-indigo-700">₹{((+item.qty * +item.rate) * (1 + +item.gst / 100)).toFixed(0)}</div>
            </div>
          ))}
          <button onClick={() => setItems([...items, { desc: '', qty: '1', rate: '', gst: '18' }])} className="text-xs text-indigo-600 border border-dashed border-indigo-300 rounded-lg px-3 py-1.5 bengali w-full">+ পণ্য/সেবা যোগ করুন</button>
        </div>
        <div className="bg-indigo-50 rounded-lg p-3 space-y-1 text-sm mb-3">
          <div className="flex justify-between bengali"><span>মূল পরিমাণ</span><span>₹{total.toFixed(2)}</span></div>
          <div className="flex justify-between bengali text-orange-600"><span>GST</span><span>₹{gstAmt.toFixed(2)}</span></div>
          <div className="flex justify-between font-bold text-indigo-700 bengali text-base border-t pt-2"><span>মোট দেয়</span><span>₹{grand.toFixed(2)}</span></div>
        </div>
        <button onClick={printInvoice} className="w-full bg-green-600 text-white rounded-lg py-2.5 font-bold bengali flex items-center justify-center gap-2 hover:bg-green-700"><Printer size={16} />Invoice প্রিন্ট / ডাউনলোড</button>
      </div>

      {/* GST rates reference */}
      <div className="bg-white border rounded-xl p-4">
        <h3 className="font-bold text-gray-800 mb-3 bengali">📊 GST হারের তালিকা</h3>
        <div className="space-y-2 text-sm">
          {[['0%', 'চাল, গম, সবজি, দুধ, ডিম', 'text-green-700', 'bg-green-50'],
            ['5%', 'চিনি, চা, কফি, কেরোসিন', 'text-blue-700', 'bg-blue-50'],
            ['12%', 'বাটার, ঘি, মোবাইল ফোন', 'text-yellow-700', 'bg-yellow-50'],
            ['18%', 'সাবান, টুথপেস্ট, রেস্তোরাঁ, AC', 'text-orange-700', 'bg-orange-50'],
            ['28%', 'গাড়ি, AC, সিমেন্ট, সিগারেট', 'text-red-700', 'bg-red-50'],
          ].map(([rate, items, textC, bgC]) => (
            <div key={rate} className={`${bgC} rounded-lg p-2.5 flex gap-3`}>
              <span className={`font-bold ${textC} w-8 flex-shrink-0`}>{rate}</span>
              <span className={`${textC} bengali`}>{items}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── 4. COACHING CENTRE MANAGER ────────────────────────────────────
function CoachingManagerUI() {
  const [students, setStudents] = useState([
    { name: 'রিয়া দাস', class: 'X', subject: 'গণিত', fee: 800, paid: 800, attend: 22, total: 25 },
    { name: 'সোহম সাহা', class: 'XII', subject: 'পদার্থবিজ্ঞান', fee: 1000, paid: 0, attend: 18, total: 25 },
    { name: 'প্রিয়া মণ্ডল', class: 'IX', subject: 'ইংরেজি', fee: 700, paid: 700, attend: 24, total: 25 },
  ])
  const [newStudent, setNewStudent] = useState({ name: '', class: '', subject: '', fee: '', phone: '' })

  const addStudent = () => {
    if (!newStudent.name) return
    setStudents([...students, { name: newStudent.name, class: newStudent.class, subject: newStudent.subject, fee: +newStudent.fee, paid: 0, attend: 0, total: 25 }])
    setNewStudent({ name: '', class: '', subject: '', fee: '', phone: '' })
    toast.success('ছাত্র যোগ হয়েছে!')
  }

  const totalFee = students.reduce((s, st) => s + st.fee, 0)
  const totalPaid = students.reduce((s, st) => s + st.paid, 0)
  const totalDue = totalFee - totalPaid

  const printReport = () => {
    const w = window.open('', '_blank')!
    w.document.write(`<html><head><title>Coaching Report</title><style>body{font-family:sans-serif;padding:20px}table{width:100%;border-collapse:collapse}td,th{border:1px solid #ddd;padding:8px}th{background:#f3f4f6}</style></head><body>
      <h2>🏫 কোচিং সেন্টার রিপোর্ট — ${new Date().toLocaleDateString('bn-IN')}</h2>
      <table><thead><tr><th>নাম</th><th>শ্রেণী</th><th>বিষয়</th><th>ফি</th><th>পরিশোধ</th><th>বাকি</th><th>উপস্থিতি</th></tr></thead>
      <tbody>${students.map(s => `<tr><td>${s.name}</td><td>${s.class}</td><td>${s.subject}</td><td>₹${s.fee}</td><td>₹${s.paid}</td><td style="color:${s.fee-s.paid>0?'red':'green'}">₹${s.fee-s.paid}</td><td>${s.attend}/${s.total}</td></tr>`).join('')}</tbody>
      <tfoot><tr><td colspan="3"><strong>মোট</strong></td><td>₹${totalFee}</td><td>₹${totalPaid}</td><td style="color:red">₹${totalDue}</td><td></td></tr></tfoot></table></body></html>`)
    w.print()
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[{ label: 'মোট ফি', value: `₹${totalFee}`, color: 'bg-indigo-50 border-indigo-200' },
          { label: 'পরিশোধ', value: `₹${totalPaid}`, color: 'bg-green-50 border-green-200' },
          { label: 'বাকি', value: `₹${totalDue}`, color: 'bg-red-50 border-red-200' }].map(s => (
          <div key={s.label} className={`${s.color} border rounded-xl p-3 text-center`}>
            <div className="font-bold text-gray-900 text-lg">{s.value}</div>
            <div className="text-xs text-gray-500 bengali">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white border rounded-xl p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-gray-800 bengali">📋 ছাত্রের তালিকা</h3>
          <button onClick={printReport} className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg font-bold bengali border border-indigo-200 flex items-center gap-1"><Printer size={12} />রিপোর্ট</button>
        </div>
        <div className="space-y-2">
          {students.map((s, i) => (
            <div key={i} className={`border rounded-xl p-3 ${s.fee - s.paid > 0 ? 'border-red-100 bg-red-50' : 'border-green-100 bg-green-50'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-gray-900 bengali">{s.name}</div>
                  <div className="text-xs text-gray-500 bengali">শ্রেণী {s.class} · {s.subject}</div>
                  <div className="text-xs text-gray-500 bengali mt-1">উপস্থিতি: {s.attend}/{s.total} দিন ({Math.round(s.attend/s.total*100)}%)</div>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${s.fee - s.paid > 0 ? 'text-red-600' : 'text-green-600'} bengali`}>
                    {s.fee - s.paid > 0 ? `₹${s.fee - s.paid} বাকি` : '✓ পরিশোধিত'}
                  </div>
                  {s.fee - s.paid > 0 && (
                    <button onClick={() => { const st = [...students]; st[i].paid = st[i].fee; setStudents(st); toast.success('পরিশোধ হয়েছে!') }} className="text-xs bg-green-600 text-white px-2 py-1 rounded-lg font-bold bengali mt-1">✓ পরিশোধ</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border rounded-xl p-4">
        <h3 className="font-bold text-gray-800 mb-3 bengali">➕ নতুন ছাত্র ভর্তি</h3>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <input className="border rounded-lg px-3 py-2 text-sm bengali" placeholder="নাম" value={newStudent.name} onChange={e => setNewStudent({ ...newStudent, name: e.target.value })} />
          <input className="border rounded-lg px-3 py-2 text-sm bengali" placeholder="শ্রেণী" value={newStudent.class} onChange={e => setNewStudent({ ...newStudent, class: e.target.value })} />
          <input className="border rounded-lg px-3 py-2 text-sm bengali" placeholder="বিষয়" value={newStudent.subject} onChange={e => setNewStudent({ ...newStudent, subject: e.target.value })} />
          <input className="border rounded-lg px-3 py-2 text-sm" placeholder="মাসিক ফি (₹)" type="number" value={newStudent.fee} onChange={e => setNewStudent({ ...newStudent, fee: e.target.value })} />
          <input className="border rounded-lg px-3 py-2 text-sm col-span-2" placeholder="অভিভাবকের ফোন" value={newStudent.phone} onChange={e => setNewStudent({ ...newStudent, phone: e.target.value })} />
        </div>
        <button onClick={addStudent} className="w-full bg-indigo-600 text-white rounded-lg py-2 text-sm font-bold bengali hover:bg-indigo-700">ভর্তি করুন</button>
      </div>
    </div>
  )
}

// ── 5. BUDGET SAHAYAK ────────────────────────────────────────────
function BudgetUI() {
  const [income, setIncome] = useState([{ source: 'বেতন', amount: 25000 }, { source: 'ভাড়া', amount: 5000 }])
  const [expenses, setExpenses] = useState([
    { cat: 'বাজার', amount: 6000 }, { cat: 'বাড়ি ভাড়া', amount: 8000 },
    { cat: 'বিদ্যুৎ', amount: 800 }, { cat: 'ছেলের স্কুল', amount: 2000 },
  ])
  const [newExp, setNewExp] = useState({ cat: '', amount: '' })
  const [newInc, setNewInc] = useState({ source: '', amount: '' })

  const totalInc = income.reduce((s, i) => s + i.amount, 0)
  const totalExp = expenses.reduce((s, e) => s + e.amount, 0)
  const balance = totalInc - totalExp
  const savePct = Math.max(0, Math.round((balance / totalInc) * 100))

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl p-4 text-white">
        <div className="text-sm bengali opacity-80 mb-1">এই মাসের সঞ্চয়</div>
        <div className={`text-4xl font-extrabold ${balance < 0 ? 'text-red-300' : 'text-white'}`}>₹{Math.abs(balance).toLocaleString()}</div>
        <div className="text-sm bengali opacity-80">{balance < 0 ? '⚠️ ঘাটতি!' : `✓ সঞ্চয় হার: ${savePct}%`}</div>
        <div className="mt-3 bg-white bg-opacity-20 rounded-full h-2">
          <div className="bg-white rounded-full h-2 transition-all" style={{ width: `${Math.min(100, savePct)}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-green-50 border border-green-200 rounded-xl p-3">
          <div className="text-xs text-green-600 bengali font-bold mb-1">মোট আয়</div>
          <div className="text-xl font-bold text-green-700">₹{totalInc.toLocaleString()}</div>
          {income.map((i, idx) => <div key={idx} className="text-xs text-green-600 bengali mt-1">{i.source}: ₹{i.amount.toLocaleString()}</div>)}
          <div className="mt-2 flex gap-1">
            <input className="border rounded px-2 py-1 text-xs flex-1 bengali" placeholder="উৎস" value={newInc.source} onChange={e => setNewInc({ ...newInc, source: e.target.value })} />
            <input className="border rounded px-2 py-1 text-xs w-20" placeholder="₹" type="number" value={newInc.amount} onChange={e => setNewInc({ ...newInc, amount: e.target.value })} />
          </div>
          <button onClick={() => { if (!newInc.source || !newInc.amount) return; setIncome([...income, { source: newInc.source, amount: +newInc.amount }]); setNewInc({ source: '', amount: '' }) }} className="mt-1 w-full text-xs bg-green-600 text-white rounded py-1 font-bold bengali">+ যোগ</button>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <div className="text-xs text-red-600 bengali font-bold mb-1">মোট খরচ</div>
          <div className="text-xl font-bold text-red-700">₹{totalExp.toLocaleString()}</div>
          {expenses.map((e, idx) => <div key={idx} className="text-xs text-red-600 bengali mt-1 flex justify-between"><span>{e.cat}</span><span>₹{e.amount.toLocaleString()}</span></div>)}
          <div className="mt-2 flex gap-1">
            <input className="border rounded px-2 py-1 text-xs flex-1 bengali" placeholder="খাত" value={newExp.cat} onChange={e => setNewExp({ ...newExp, cat: e.target.value })} />
            <input className="border rounded px-2 py-1 text-xs w-20" placeholder="₹" type="number" value={newExp.amount} onChange={e => setNewExp({ ...newExp, amount: e.target.value })} />
          </div>
          <button onClick={() => { if (!newExp.cat || !newExp.amount) return; setExpenses([...expenses, { cat: newExp.cat, amount: +newExp.amount }]); setNewExp({ cat: '', amount: '' }) }} className="mt-1 w-full text-xs bg-red-600 text-white rounded py-1 font-bold bengali">+ যোগ</button>
        </div>
      </div>

      {balance < 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <div className="font-bold text-red-800 bengali mb-1">⚠️ সতর্কতা: খরচ আয়ের বেশি!</div>
          <div className="text-sm text-red-700 bengali">প্রতি মাসে ₹{Math.abs(balance).toLocaleString()} ঘাটতি। AI-কে জিজ্ঞেস করুন কীভাবে সাশ্রয় করবেন।</div>
        </div>
      )}
    </div>
  )
}

// ── 6. LOAN & EMI TRACKER ────────────────────────────────────────
function LoanTrackerUI() {
  const [loans, setLoans] = useState([
    { name: 'Home Loan — SBI', principal: 2000000, rate: 8.5, emi: 18000, paid: 36, total: 240, dueDate: '5' },
    { name: 'Car Loan — HDFC', principal: 500000, rate: 9.5, emi: 10500, paid: 12, total: 60, dueDate: '10' },
  ])
  const [newLoan, setNewLoan] = useState({ name: '', principal: '', rate: '', emi: '', total: '', dueDate: '' })

  const calcEMI = () => {
    const p = +newLoan.principal, r = +newLoan.rate / 100 / 12, n = +newLoan.total
    if (p && r && n) {
      const emi = Math.round(p * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1))
      setNewLoan({ ...newLoan, emi: emi.toString() })
    }
  }

  return (
    <div className="space-y-4">
      {loans.map((loan, i) => {
        const remaining = loan.total - loan.paid
        const pct = Math.round((loan.paid / loan.total) * 100)
        const totalPaid = loan.emi * loan.paid
        const estRemaining = loan.emi * remaining
        return (
          <div key={i} className="bg-white border rounded-xl p-4">
            <div className="flex justify-between items-start mb-2">
              <div><div className="font-bold text-gray-900 bengali">{loan.name}</div><div className="text-xs text-gray-500">সুদ: {loan.rate}% · EMI তারিখ: {loan.dueDate} তারিখ</div></div>
              <div className="text-right"><div className="font-bold text-indigo-700">₹{loan.emi.toLocaleString()}/মাস</div><div className="text-xs text-gray-500 bengali">প্রতি মাসের কিস্তি</div></div>
            </div>
            <div className="bg-gray-100 rounded-full h-2 mb-2"><div className="bg-indigo-600 rounded-full h-2" style={{ width: `${pct}%` }} /></div>
            <div className="flex justify-between text-xs text-gray-500 bengali mb-2"><span>{loan.paid}/{loan.total} কিস্তি দেওয়া হয়েছে ({pct}%)</span><span>{remaining} কিস্তি বাকি</span></div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-green-50 rounded-lg p-2 text-center bengali"><div className="font-bold text-green-700">₹{totalPaid.toLocaleString()}</div><div className="text-gray-500">পরিশোধ করা</div></div>
              <div className="bg-orange-50 rounded-lg p-2 text-center bengali"><div className="font-bold text-orange-700">₹{estRemaining.toLocaleString()}</div><div className="text-gray-500">বাকি আছে</div></div>
              <div className="bg-red-50 rounded-lg p-2 text-center bengali"><div className="font-bold text-red-700">₹{(totalPaid + estRemaining - loan.principal).toLocaleString()}</div><div className="text-gray-500">মোট সুদ</div></div>
            </div>
            <button onClick={() => { const l = [...loans]; l[i].paid = Math.min(l[i].total, l[i].paid + 1); setLoans(l); toast.success('কিস্তি পরিশোধ হয়েছে!') }} className="mt-3 w-full bg-indigo-600 text-white rounded-lg py-2 text-sm font-bold bengali">✓ এই মাসের কিস্তি পরিশোধ</button>
          </div>
        )
      })}

      <div className="bg-white border rounded-xl p-4">
        <h3 className="font-bold text-gray-800 mb-3 bengali">➕ নতুন লোন যোগ করুন</h3>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <input className="border rounded-lg px-3 py-2 text-sm bengali col-span-2" placeholder="লোনের নাম (যেমন: Home Loan — SBI)" value={newLoan.name} onChange={e => setNewLoan({ ...newLoan, name: e.target.value })} />
          <input className="border rounded-lg px-3 py-2 text-sm" placeholder="মূল পরিমাণ (₹)" type="number" value={newLoan.principal} onChange={e => setNewLoan({ ...newLoan, principal: e.target.value })} />
          <input className="border rounded-lg px-3 py-2 text-sm" placeholder="সুদের হার (%)" type="number" step="0.1" value={newLoan.rate} onChange={e => setNewLoan({ ...newLoan, rate: e.target.value })} />
          <input className="border rounded-lg px-3 py-2 text-sm" placeholder="মোট কিস্তি সংখ্যা" type="number" value={newLoan.total} onChange={e => setNewLoan({ ...newLoan, total: e.target.value })} />
          <button onClick={calcEMI} className="bg-gray-100 text-gray-700 rounded-lg px-3 py-2 text-sm font-bold bengali">EMI হিসাব করুন</button>
          {newLoan.emi && <div className="col-span-2 bg-indigo-50 rounded-lg p-2 text-center font-bold text-indigo-700 bengali">মাসিক EMI: ₹{newLoan.emi}</div>}
        </div>
        <button onClick={() => { if (!newLoan.name || !newLoan.emi) return; setLoans([...loans, { name: newLoan.name, principal: +newLoan.principal, rate: +newLoan.rate, emi: +newLoan.emi, paid: 0, total: +newLoan.total, dueDate: '5' }]); setNewLoan({ name: '', principal: '', rate: '', emi: '', total: '', dueDate: '' }); toast.success('লোন যোগ হয়েছে!') }} className="w-full bg-indigo-600 text-white rounded-lg py-2 text-sm font-bold bengali">যোগ করুন</button>
      </div>
    </div>
  )
}

// ── GENERIC TASK UI (for all other agents) ───────────────────────
function GenericAgentUI({ agent }: { agent: any }) {
  const configs: Record<string, { tasks: string[], quickActions: string[], tip: string }> = {
    'hotel-dhaba-manager': { tasks: ['মেনু আপডেট করুন', 'আজকের স্টক চেক', 'স্টাফের খাবার লগ', 'লাভক্ষতি দেখুন'], quickActions: ['আজকের আয়?', 'কোন dish সবচেয়ে বেশি বিকিয়েছে?', 'waste কমানোর উপায়?', 'মেনুর দাম বাড়ানো উচিত?'], tip: 'প্রতিদিনের menu cost AI-কে বলুন, সে লাভক্ষতি বের করে দেবে।' },
    'tiffin-service-tracker': { tasks: ['আজকের অর্ডার', 'নতুন সাবস্ক্রিপশন', 'মাসিক বিল তৈরি', 'ডেলিভারি রুট'], quickActions: ['কতজন subscribe করেছেন?', 'আজকের অর্ডার কত?', 'বাকি কারা?', 'মেনু plan করতে সাহায্য করো'], tip: 'প্রতিদিনের অর্ডার AI-কে বলুন, সে মাসিক বিল তৈরি করে দেবে।' },
    'mishti-dokan-manager': { tasks: ['রোজের উৎপাদন লগ', 'মেয়াদ চেক', 'উৎসব স্টক plan', 'সরবরাহকারী payment'], quickActions: ['আজকে কত মিষ্টি তৈরি হলো?', 'কোন মিষ্টি সবচেয়ে বেশি বিকলো?', 'পুজোর stock কত লাগবে?', 'কোন মিষ্টির মেয়াদ শেষ হচ্ছে?'], tip: 'উৎসবের আগে AI-কে বললে সে stock plan করে দেবে।' },
    'kaporer-dokan-tracker': { tasks: ['শাড়ি স্টক চেক', 'বিক্রির রেকর্ড', 'সিজন প্ল্যানিং', 'সরবরাহকারী payment'], quickActions: ['কোন শাড়ি কম আছে?', 'এই মাসে কত বিক্রি?', 'পুজোর season কী stock রাখব?', 'supplier-কে কত দিতে হবে?'], tip: 'শাড়ির রঙ ও ধরন AI-কে বললে সে season অনুযায়ী stock suggest করবে।' },
    'hardware-store-helper': { tasks: ['সিমেন্ট-রড স্টক', 'ক্লায়েন্ট অর্ডার', 'দামের আপডেট', 'contractor বাকি'], quickActions: ['আজকের stock কী কম আছে?', 'কোন contractor কত বাকি?', 'এই মাসের বিক্রি কত?', 'দাম বাড়ার কারণ কী?'], tip: 'contractor-এর বাকির হিসাব AI-কে দিন, সে remind করে দেবে।' },
    'doctor-chamber-helper': { tasks: ['appointment বুকিং', 'আজকের রোগী তালিকা', 'ফি ট্র্যাকিং', 'follow-up reminder'], quickActions: ['আজকে কতজন রোগী?', 'কার ফি বাকি আছে?', 'কাল কার appointment?', 'prescription follow-up কারা?'], tip: 'রোগীর নাম ও ফি AI-কে বলুন, সে reminder দেবে।' },
    'pathology-lab-tracker': { tasks: ['test order tracking', 'রিপোর্ট ready status', 'reagent stock', 'home collection'], quickActions: ['কার রিপোর্ট ready?', 'কোন reagent কম আছে?', 'আজকের collection কত?', 'কার payment বাকি?'], tip: 'রোগীর নাম ও test AI-কে বলুন, সে ready হলে জানাবে।' },
    'porashona-sahayak': { tasks: ['পড়ার রুটিন', 'বিষয়ভিত্তিক সাহায্য', 'পরীক্ষার প্রস্তুতি', 'প্রশ্নোত্তর'], quickActions: ['গণিত বুঝতে পারছি না', 'পরীক্ষার রুটিন বানাও', 'ইতিহাসের notes দাও', 'MCQ practice করব'], tip: 'যেকোনো বিষয় জিজ্ঞেস করুন, WBBSE/WBCHSE syllabus অনুযায়ী সাহায্য পাবেন।' },
    'tutor-assistant': { tasks: ['পাঠ পরিকল্পনা', 'homework tracking', 'অভিভাবককে message', 'ছাত্রের অগ্রগতি'], quickActions: ['আজকের পাঠ কী পড়াব?', 'ছাত্রের অগ্রগতি কেমন?', 'অভিভাবককে message লিখে দাও', 'পরীক্ষার আগে কী পড়াব?'], tip: 'প্রতিটি ছাত্রের নাম ও দুর্বল বিষয় AI-কে বলুন।' },
    'puja-organizer': { tasks: ['বাজেট ট্র্যাকিং', 'কমিটির কাজ', 'স্পনসর list', 'countdown'], quickActions: ['এখন পর্যন্ত কত খরচ?', 'কারা sponsor দিয়েছেন?', 'কী কাজ বাকি আছে?', 'আর কতদিন বাকি?'], tip: 'পুজো কমিটির বাজেট ও কাজের তালিকা AI-কে দিন।' },
    'wedding-planner-helper': { tasks: ['vendor booking', 'guest list', 'বাজেট tracking', 'checklist'], quickActions: ['কোন vendor বুক হয়নি?', 'কতজন অতিথি?', 'বাজেটের কত খরচ হয়েছে?', 'কী কী করা বাকি?'], tip: 'বিয়ের তারিখ ও বাজেট AI-কে বললে সে complete plan করে দেবে।' },
    'chashir-sahayak': { tasks: ['ফসলের calendar', 'সার সময়সূচি', 'মান্ডির দাম', 'আবহাওয়া পরামর্শ'], quickActions: ['এখন কোন ফসল লাগাব?', 'সার কখন দেব?', 'আজকের মান্ডির দাম?', 'পোকার সমস্যা হচ্ছে'], tip: 'আপনার জমি ও ফসলের কথা বলুন, সে মৌসুমী পরামর্শ দেবে।' },
    'poultry-dairy-manager': { tasks: ['ডিম/দুধ লগ', 'খাবারের stock', 'vaccination schedule', 'বিক্রির হিসাব'], quickActions: ['আজকে কত ডিম/দুধ?', 'খাবার কতটুকু আছে?', 'vaccination কবে?', 'এই মাসে কত আয়?'], tip: 'প্রতিদিনের উৎপাদন AI-কে বলুন, সে মাসিক রিপোর্ট বানাবে।' },
    'cold-storage-helper': { tasks: ['স্টক entry-exit', 'ক্লায়েন্ট billing', 'temperature log', 'storage capacity'], quickActions: ['কতটুকু স্টক আছে?', 'কার কতদিন storage হয়েছে?', 'কার বিল তৈরি করব?', 'কোন লটের মেয়াদ শেষ?'], tip: 'প্রতিটি ক্লায়েন্টের স্টক entry AI-কে বলুন।' },
    'mobile-repair-shop': { tasks: ['repair job tracking', 'parts stock', 'pickup reminder', 'billing'], quickActions: ['কার ফোন ready?', 'কোন parts কম আছে?', 'আজকের আয় কত?', 'কার ফোন কতদিন ধরে আছে?'], tip: 'কাস্টমারের নাম ও ফোনের সমস্যা AI-কে বলুন।' },
    'salon-parlour-manager': { tasks: ['appointment বুকিং', 'product stock', 'আয় ট্র্যাকিং', 'staff commission'], quickActions: ['আজকের appointment কে কে?', 'কোন product শেষ হচ্ছে?', 'এই মাসের আয়?', 'কোন service সবচেয়ে popular?'], tip: 'প্রতিদিনের appointment AI-কে বলুন।' },
    'tailoring-shop-assistant': { tasks: ['অর্ডার tracking', 'delivery তারিখ', 'মাপের record', 'বকেয়া payment'], quickActions: ['কার জামা ready?', 'কোন delivery আসছে কাল?', 'কার payment বাকি?', 'এই মাসের আয়?'], tip: 'অর্ডার নেওয়ার সময় delivery date AI-কে বলুন।' },
    'electrician-job-tracker': { tasks: ['রোজের কাজের log', 'material cost', 'payment collection', 'মাসের আয়'], quickActions: ['আজকে কী কাজ করলাম?', 'কার payment বাকি?', 'material খরচ কত হলো?', 'এই মাসের মোট আয়?'], tip: 'প্রতিটি কাজের পরে AI-কে বলুন, সে হিসাব রাখবে।' },
    'transport-auto-tracker': { tasks: ['trip log', 'fuel খরচ', 'driver payment', 'maintenance alert'], quickActions: ['আজকের trip কত?', 'fuel খরচ কত হলো?', 'driver-কে কত দিতে হবে?', 'গাড়ির service কবে?'], tip: 'প্রতিটি trip-এর পরে fuel ও আয় AI-কে বলুন।' },
    'printing-press-manager': { tasks: ['job order tracking', 'কাগজের stock', 'delivery schedule', 'client billing'], quickActions: ['কোন job ready?', 'কাগজের stock কতটুকু?', 'কাল কার delivery?', 'কার payment বাকি?'], tip: 'প্রতিটি print job AI-কে বলুন, সে delivery remind করবে।' },
    'pharmacy-crm': { tasks: ['customer register', 'purchase history', 'prescription track', 'due payment'], quickActions: ['নতুন customer যোগ করো', 'কার বাকি আছে?', 'prescription reminder', 'Excel export করো'], tip: 'প্রতিটি customer-এর ওষুধ কেনার ইতিহাস AI-কে বলুন।' },
    'dokan-crm': { tasks: ['customer register', 'purchase history', 'বাকির তালিকা', 'voice input'], quickActions: ['নতুন customer', 'কার বাকি কত?', 'কে সবচেয়ে বেশি কেনে?', 'মাসিক report'], tip: 'নিয়মিত খদ্দেরের কেনার ইতিহাস রাখুন।' },
    'coaching-crm': { tasks: ['student register', 'fee tracking', 'attendance', 'exam result'], quickActions: ['নতুন ছাত্র ভর্তি', 'কার fee বাকি?', 'attendance report', 'result দেখাও'], tip: 'প্রতি ছাত্রের fee ও attendance AI-কে বলুন।' },
    'hotel-crm': { tasks: ['guest register', 'order history', 'credit tracking', 'voice input'], quickActions: ['নতুন guest যোগ', 'কার বাকি আছে?', 'popular item কী?', 'মাসিক report'], tip: 'নিয়মিত গ্রাহকদের খাবারের পছন্দ রাখুন।' },
  }

  const cfg = configs[agentSlug(agent.name)] || { tasks: ['হিসাব রাখুন', 'তথ্য যোগ করুন', 'রিপোর্ট দেখুন', 'reminder সেট করুন'], quickActions: ['শুরু করতে সাহায্য করো', 'কীভাবে ব্যবহার করব?', 'আজকের কাজ কী?', 'report দেখাও'], tip: 'বাংলায় আপনার ব্যবসার তথ্য বলুন, AI সাহায্য করবে।' }

  return (
    <div className="space-y-4">
      <div className="bg-white border rounded-xl p-4">
        <h3 className="font-bold text-gray-800 mb-3 bengali">⚡ দ্রুত কাজ শুরু করুন</h3>
        <div className="grid grid-cols-2 gap-2">
          {cfg.tasks.map((task, i) => (
            <div key={i} className="border border-dashed border-indigo-200 rounded-xl p-3 text-center bg-indigo-50">
              <div className="text-sm font-bold text-indigo-700 bengali">{task}</div>
              <div className="text-xs text-indigo-500 bengali mt-1">AI-কে বলুন →</div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="font-bold text-amber-800 bengali mb-1">💡 টিপস</div>
        <div className="text-sm text-amber-700 bengali">{cfg.tip}</div>
      </div>
      <div className="bg-white border rounded-xl p-4">
        <h3 className="font-bold text-gray-800 mb-3 bengali">🎯 জনপ্রিয় প্রশ্ন — ক্লিক করুন</h3>
        <div className="flex flex-wrap gap-2">
          {cfg.quickActions.map((q, i) => (
            <span key={i} className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-full font-medium bengali cursor-pointer hover:bg-indigo-100 transition-colors" onClick={() => { const ta = document.querySelector('textarea'); if (ta) { (ta as HTMLTextAreaElement).value = q; ta.dispatchEvent(new Event('input', { bubbles: true })) } }}>
              {q}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════
export default function AgentDetailPage() {
  const params = useParams()
  const slug = params?.slug as string

  const agent = PREBUILT_AGENTS.find(a => agentSlug(a.name) === slug)

  if (!agent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-xl font-bold text-gray-800 bengali mb-2">এজেন্ট পাওয়া যায়নি</h2>
          <Link href="/library" className="text-indigo-600 bengali">Library-তে ফিরুন</Link>
        </div>
      </div>
    )
  }

  // Pick the right UI panel
  const renderPanel = () => {
    const s = agentSlug(agent.name)
    if (s === 'dokan-manager') return <DokanManagerUI />
    if (s === 'pharmacy-assistant') return <PharmacyUI />
    if (s === 'gst-tax-helper') return <GSTHelperUI />
    if (s === 'coaching-centre-manager') return <CoachingManagerUI />
    if (s === 'budget-sahayak') return <BudgetUI />
    if (s === 'loan-emi-tracker') return <LoanTrackerUI />
    return <GenericAgentUI agent={agent} />
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Back */}
        <Link href="/library" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-sm mb-5 transition-colors bengali">
          <ArrowLeft size={14} /> Library-তে ফিরুন
        </Link>

        {/* Agent header */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-5 flex items-center gap-4" style={{ borderLeft: `5px solid ${agent.color}` }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0" style={{ background: agent.color }}>{agent.icon}</div>
          <div className="flex-1">
            <h1 className="font-extrabold text-gray-900 text-xl bengali">{agent.name_bn || agent.name}</h1>
            <p className="text-gray-500 text-sm bengali mt-0.5">{agent.description_bn}</p>
          </div>
          <div className="hidden sm:flex flex-col items-end gap-1">
            <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-full font-bold bengali">✓ বিনামূল্যে</span>
            <span className="text-xs text-gray-400 bengali">Voice + Typing উভয়ই</span>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left: Agent-specific tools */}
          <div>
            <h2 className="font-bold text-gray-700 bengali mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center text-xs font-bold">📊</span>
              কাজের ড্যাশবোর্ড
            </h2>
            {renderPanel()}
          </div>

          {/* Right: AI Chat */}
          <div>
            <h2 className="font-bold text-gray-700 bengali mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-green-100 text-green-700 rounded-lg flex items-center justify-center text-xs font-bold">🤖</span>
              AI সহায়ক — বাংলায় কথা বলুন
            </h2>
            <AgentChat agent={agent} />
          </div>
        </div>

        {/* Subscription CTA */}
        <div className="mt-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-extrabold bengali mb-1">🚀 Pro Plan — সব features unlock করুন</h3>
            <p className="text-indigo-200 bengali text-sm">Excel export · PDF billing · SMS reminder · অসীমিত ব্যবহার · priority support</p>
          </div>
          <div className="flex-shrink-0 text-center">
            <div className="text-3xl font-extrabold">₹299<span className="text-lg font-normal">/মাস</span></div>
            <button className="mt-2 bg-white text-indigo-700 font-bold px-6 py-2 rounded-xl bengali hover:bg-indigo-50 transition-colors text-sm">Subscribe করুন</button>
          </div>
        </div>
      </div>
    </div>
  )
}
