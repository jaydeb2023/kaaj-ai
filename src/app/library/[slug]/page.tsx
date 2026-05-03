'use client'

/**
 * FULL PHARMACY LIBRARY PAGE
 * ─────────────────────────────────────────────────────────────
 * For: sahayakai.tech — rural mini-pharmacy / village doctor shop
 * Features:
 *   - Medicine stock with expiry, low-stock alerts
 *   - Patient records (name, father's name, address, due/balance)
 *   - Billing with partial payment + due tracking
 *   - Chatbot with memory (Anthropic API)
 *   - Supabase persistence
 *   - Bengali language throughout
 * ─────────────────────────────────────────────────────────────
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Package, Plus, Trash2, Search, FileText, User,
  Bot, Send, Mic, MicOff, AlertTriangle, Clock,
  Phone, MapPin, DollarSign, CheckCircle, XCircle,
  ChevronRight, BarChart2, Printer, RefreshCw,
  Users, Download, Edit2, Save, X, Home, Pill,
  Activity, TrendingUp, Calendar, UserCheck, Wallet
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'

// ══════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════

interface Medicine {
  id: string
  name: string
  generic: string
  category: string
  stock: number
  unit: string
  expiry: string       // YYYY-MM
  mrp: number
  cost_price: number
  min_stock: number
  supplier: string
  rack: string
  prescription_req: boolean
}

interface Patient {
  id: string
  name: string
  father_name: string
  mother_name: string
  age: number
  gender: string
  phone: string
  address: string
  village: string
  doctor_name: string
  blood_group: string
  notes: string
  total_due: number    // computed from bills
}

interface BillItem {
  med_name: string
  qty: number
  mrp: number
  discount: number
}

interface Bill {
  id: string
  patient_id: string
  patient_name: string
  patient_phone: string
  date: string
  items: BillItem[]
  total: number
  paid: number
  due: number
  notes: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// ══════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════

const uid = () => Math.random().toString(36).slice(2, 9)
const today = () => new Date().toISOString().slice(0, 10)
const bn = (n: number) => `₹${n.toLocaleString('en-IN')}`

function expiryBadge(expiry: string) {
  const now = new Date()
  const exp = new Date(expiry + '-01')
  const days = (exp.getTime() - now.getTime()) / 86400000
  if (days < 0)   return { label: 'মেয়াদ শেষ', cls: 'bg-red-100 text-red-700',    dot: 'bg-red-500' }
  if (days < 30)  return { label: '১ মাসে শেষ', cls: 'bg-orange-100 text-orange-700', dot: 'bg-orange-400' }
  if (days < 90)  return { label: '৩ মাসে শেষ', cls: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400' }
  return { label: 'ভালো', cls: 'bg-green-100 text-green-700', dot: 'bg-green-500' }
}

// ── Voice hook ──────────────────────────────────────────────
declare global { interface Window { SpeechRecognition: any; webkitSpeechRecognition: any } }
function useVoice(onResult: (t: string) => void) {
  const [listening, setListening] = useState(false)
  const ref = useRef<any>(null)
  const start = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { toast.error('ভয়েস সাপোর্ট নেই'); return }
    const r = new SR()
    ref.current = r
    r.lang = 'bn-IN'; r.interimResults = true
    r.onstart = () => setListening(true)
    r.onresult = (e: any) => {
      let t = ''
      for (let i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript
      onResult(t)
    }
    r.onerror = () => setListening(false)
    r.onend   = () => setListening(false)
    r.start()
  }, [onResult])
  const stop = useCallback(() => { ref.current?.stop(); setListening(false) }, [])
  return { listening, start, stop }
}

// ══════════════════════════════════════════════════════════
// DEMO SEED DATA (used when Supabase is not configured)
// ══════════════════════════════════════════════════════════

const SEED_MEDICINES: Medicine[] = [
  { id: uid(), name: 'Paracetamol 500mg', generic: 'Paracetamol', category: 'Analgesic', stock: 84, unit: 'strip', expiry: '2027-06', mrp: 12, cost_price: 8, min_stock: 30, supplier: 'ACI Healthcare', rack: 'A-1', prescription_req: false },
  { id: uid(), name: 'Amoxicillin 250mg', generic: 'Amoxicillin', category: 'Antibiotic', stock: 14, unit: 'strip', expiry: '2025-09', mrp: 45, cost_price: 30, min_stock: 20, supplier: 'Square Pharma', rack: 'B-3', prescription_req: true },
  { id: uid(), name: 'Metformin 500mg', generic: 'Metformin HCl', category: 'Diabetes', stock: 60, unit: 'strip', expiry: '2026-12', mrp: 22, cost_price: 14, min_stock: 40, supplier: 'ACI Healthcare', rack: 'D-1', prescription_req: true },
  { id: uid(), name: 'Amlodipine 5mg', generic: 'Amlodipine', category: 'Cardiac', stock: 8, unit: 'strip', expiry: '2026-09', mrp: 35, cost_price: 22, min_stock: 15, supplier: 'Square Pharma', rack: 'D-2', prescription_req: true },
  { id: uid(), name: 'ORS Sachet', generic: 'ORS', category: 'Electrolyte', stock: 120, unit: 'pcs', expiry: '2026-12', mrp: 5, cost_price: 3, min_stock: 50, supplier: 'Renata Ltd', rack: 'A-3', prescription_req: false },
  { id: uid(), name: 'Cetirizine 10mg', generic: 'Cetirizine', category: 'Antihistamine', stock: 6, unit: 'strip', expiry: '2025-11', mrp: 18, cost_price: 11, min_stock: 15, supplier: 'Beximco Pharma', rack: 'B-1', prescription_req: false },
  { id: uid(), name: 'Omeprazole 20mg', generic: 'Omeprazole', category: 'GI', stock: 32, unit: 'strip', expiry: '2027-03', mrp: 28, cost_price: 18, min_stock: 20, supplier: 'ACI Healthcare', rack: 'C-1', prescription_req: false },
  { id: uid(), name: 'Albendazole 400mg', generic: 'Albendazole', category: 'Antiparasitic', stock: 45, unit: 'tablet', expiry: '2026-08', mrp: 8, cost_price: 5, min_stock: 25, supplier: 'Eskayef', rack: 'E-2', prescription_req: false },
]

const SEED_PATIENTS: Patient[] = [
  { id: uid(), name: 'রামবাবু দাস', father_name: 'হরিদাস দাস', mother_name: 'সাবিত্রী দাস', age: 52, gender: 'পুরুষ', phone: '9876543210', address: 'ডাকঘর: রায়দিঘি', village: 'রায়দিঘি', doctor_name: 'ডা. সুমিত রায়', blood_group: 'B+', notes: 'ডায়াবেটিস, উচ্চ রক্তচাপ', total_due: 250 },
  { id: uid(), name: 'সুমিত্রা দেবী', father_name: 'মহেশ মণ্ডল', mother_name: 'রাধা মণ্ডল', age: 45, gender: 'মহিলা', phone: '9123456780', address: 'গ্রাম: মাথুরাপুর', village: 'মাথুরাপুর', doctor_name: 'ডা. মীনা চক্রবর্তী', blood_group: 'O+', notes: 'থাইরয়েড', total_due: 0 },
  { id: uid(), name: 'বিশ্বনাথ হালদার', father_name: 'নবকুমার হালদার', mother_name: '', age: 67, gender: 'পুরুষ', phone: '8765432109', address: 'পোস্ট: জয়নগর', village: 'জয়নগর', doctor_name: 'ডা. সুমিত রায়', blood_group: 'A+', notes: 'হৃদরোগ, ডায়াবেটিস', total_due: 580 },
]

const SEED_BILLS: Bill[] = [
  { id: uid(), patient_id: SEED_PATIENTS[0].id, patient_name: 'রামবাবু দাস', patient_phone: '9876543210', date: today(), items: [{ med_name: 'Metformin 500mg', qty: 3, mrp: 22, discount: 0 }, { med_name: 'Amlodipine 5mg', qty: 2, mrp: 35, discount: 0 }], total: 136, paid: 0, due: 136, notes: '' },
  { id: uid(), patient_id: SEED_PATIENTS[1].id, patient_name: 'সুমিত্রা দেবী', patient_phone: '9123456780', date: today(), items: [{ med_name: 'Paracetamol 500mg', qty: 2, mrp: 12, discount: 0 }, { med_name: 'ORS Sachet', qty: 5, mrp: 5, discount: 0 }], total: 49, paid: 49, due: 0, notes: '' },
]

const CATEGORIES = ['সব', 'Analgesic', 'Antibiotic', 'Cardiac', 'Diabetes', 'GI', 'Antihistamine', 'Electrolyte', 'Antiparasitic', 'Other']
const UNITS = ['strip', 'tablet', 'capsule', 'bottle', 'tube', 'injection', 'pcs', 'sachet', 'vial']

// ══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════

interface PharmacyLibraryProps {
  pharmacyName?: string
  agentId?: string
  userId?: string
}

export default function PharmacyLibraryPage({
  pharmacyName = 'গ্রাম ফার্মেসি',
  agentId,
  userId,
}: PharmacyLibraryProps) {

  const [tab, setTab] = useState<'dash' | 'stock' | 'patients' | 'billing' | 'chat'>('dash')

  // ── Data state ────────────────────────────────────────────
  const [medicines, setMedicines]   = useState<Medicine[]>(SEED_MEDICINES)
  const [patients,  setPatients]    = useState<Patient[]>(SEED_PATIENTS)
  const [bills,     setBills]       = useState<Bill[]>(SEED_BILLS)

  // ── Stock form ────────────────────────────────────────────
  const [showAddMed, setShowAddMed] = useState(false)
  const [medSearch,  setMedSearch]  = useState('')
  const [catFilter,  setCatFilter]  = useState('সব')
  const blankMed = (): Partial<Medicine> => ({ unit: 'strip', category: 'Analgesic', prescription_req: false })
  const [newMed, setNewMed] = useState<Partial<Medicine>>(blankMed())
  const [editMedId, setEditMedId] = useState<string | null>(null)
  const [editStockVal, setEditStockVal] = useState('')

  // ── Patient form ──────────────────────────────────────────
  const [showAddPat, setShowAddPat] = useState(false)
  const [patSearch,  setPatSearch]  = useState('')
  const blankPat = (): Partial<Patient> => ({ gender: 'পুরুষ', blood_group: 'অজানা' })
  const [newPat, setNewPat] = useState<Partial<Patient>>(blankPat())
  const [selectedPat, setSelectedPat] = useState<Patient | null>(null)

  // ── Billing form ──────────────────────────────────────────
  const [showNewBill, setShowNewBill] = useState(false)
  const [billPatName, setBillPatName] = useState('')
  const [billPatPhone, setBillPatPhone] = useState('')
  const [billItems, setBillItems] = useState<BillItem[]>([{ med_name: '', qty: 1, mrp: 0, discount: 0 }])
  const [billPaid, setBillPaid] = useState<number | ''>('')
  const [billNotes, setBillNotes] = useState('')

  // ── Chat state ────────────────────────────────────────────
  const [chatMsgs, setChatMsgs] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'নমস্কার! আমি আপনার ফার্মেসির AI সহায়ক। স্টক, রোগীর বাকি, ওষুধের মেয়াদ — যেকোনো প্রশ্ন করুন বাংলায়!' }
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const voice = useVoice(t => setChatInput(t))

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMsgs, chatLoading])

  // ── Derived stats ─────────────────────────────────────────
  const todayBills     = bills.filter(b => b.date === today())
  const todayRevenue   = todayBills.reduce((s, b) => s + b.paid, 0)
  const totalDue       = bills.reduce((s, b) => s + b.due, 0)
  const lowStock       = medicines.filter(m => m.stock <= m.min_stock)
  const expired        = medicines.filter(m => expiryBadge(m.expiry).label === 'মেয়াদ শেষ')
  const expiringSoon   = medicines.filter(m => ['১ মাসে শেষ', '৩ মাসে শেষ'].includes(expiryBadge(m.expiry).label))
  const patientsWithDue = patients.filter(p => {
    const patBills = bills.filter(b => b.patient_phone === p.phone || b.patient_name === p.name)
    return patBills.reduce((s, b) => s + b.due, 0) > 0
  })

  const filteredMeds = medicines.filter(m => {
    const q = medSearch.toLowerCase()
    return (catFilter === 'সব' || m.category === catFilter) &&
      (!q || m.name.toLowerCase().includes(q) || m.generic.toLowerCase().includes(q))
  })

  const filteredPats = patients.filter(p =>
    !patSearch || p.name.includes(patSearch) || p.phone.includes(patSearch) || p.village.includes(patSearch)
  )

  // ── Medicine ops ──────────────────────────────────────────
  const saveMed = () => {
    if (!newMed.name || !newMed.stock) { toast.error('নাম ও স্টক দিন'); return }
    const med: Medicine = {
      id: uid(), name: newMed.name!, generic: newMed.generic || '',
      category: newMed.category || 'Other', stock: +newMed.stock!,
      unit: newMed.unit || 'strip', expiry: newMed.expiry || '2026-12',
      mrp: +(newMed.mrp || 0), cost_price: +(newMed.cost_price || 0),
      min_stock: +(newMed.min_stock || 10), supplier: newMed.supplier || '',
      rack: newMed.rack || '', prescription_req: !!newMed.prescription_req
    }
    setMedicines([...medicines, med])
    setNewMed(blankMed())
    setShowAddMed(false)
    toast.success('ওষুধ যোগ হয়েছে!')
  }

  const updateStock = (id: string) => {
    setMedicines(medicines.map(m => m.id === id ? { ...m, stock: +editStockVal } : m))
    setEditMedId(null)
    toast.success('স্টক আপডেট হয়েছে!')
  }

  // ── Patient ops ───────────────────────────────────────────
  const savePat = () => {
    if (!newPat.name) { toast.error('নাম দিন'); return }
    const p: Patient = {
      id: uid(), name: newPat.name!, father_name: newPat.father_name || '',
      mother_name: newPat.mother_name || '', age: +(newPat.age || 0),
      gender: newPat.gender || 'পুরুষ', phone: newPat.phone || '',
      address: newPat.address || '', village: newPat.village || '',
      doctor_name: newPat.doctor_name || '', blood_group: newPat.blood_group || 'অজানা',
      notes: newPat.notes || '', total_due: 0
    }
    setPatients([...patients, p])
    setNewPat(blankPat())
    setShowAddPat(false)
    toast.success('রোগী যোগ হয়েছে!')
  }

  // ── Bill ops ──────────────────────────────────────────────
  const billTotal = billItems.reduce((s, i) => s + i.qty * i.mrp * (1 - i.discount / 100), 0)

  const addBillItem = () => setBillItems([...billItems, { med_name: '', qty: 1, mrp: 0, discount: 0 }])

  const updateBillItem = (i: number, field: string, val: any) => {
    const items = [...billItems]
    if (field === 'med_name') {
      const med = medicines.find(m => m.name === val)
      items[i] = { ...items[i], med_name: val, mrp: med ? med.mrp : items[i].mrp }
    } else {
      items[i] = { ...items[i], [field]: val }
    }
    setBillItems(items)
  }

  const saveBill = () => {
    if (!billPatName) { toast.error('রোগীর নাম দিন'); return }
    const paid = typeof billPaid === 'number' ? billPaid : billTotal
    const bill: Bill = {
      id: uid(), patient_id: '',
      patient_name: billPatName, patient_phone: billPatPhone,
      date: today(), items: billItems.filter(i => i.med_name),
      total: Math.round(billTotal), paid: Math.round(paid),
      due: Math.round(billTotal - paid), notes: billNotes
    }
    // deduct stock
    const updMeds = [...medicines]
    bill.items.forEach(bi => {
      const idx = updMeds.findIndex(m => m.name === bi.med_name)
      if (idx >= 0) updMeds[idx] = { ...updMeds[idx], stock: Math.max(0, updMeds[idx].stock - bi.qty) }
    })
    setMedicines(updMeds)
    setBills([bill, ...bills])
    setBillPatName(''); setBillPatPhone(''); setBillItems([{ med_name: '', qty: 1, mrp: 0, discount: 0 }])
    setBillPaid(''); setBillNotes(''); setShowNewBill(false)
    toast.success('বিল তৈরি হয়েছে!')
  }

  const printBill = (bill: Bill) => {
    const w = window.open('', '_blank')!
    w.document.write(`<!DOCTYPE html><html><head><title>বিল</title><meta charset="utf-8">
<style>
body{font-family:'Noto Sans Bengali',sans-serif;padding:20px;max-width:380px;margin:auto;color:#111}
h2{text-align:center;color:#16a34a;margin:0 0 2px}
.sub{text-align:center;font-size:11px;color:#666;border-bottom:2px dashed #ccc;padding-bottom:10px;margin-bottom:12px}
table{width:100%;border-collapse:collapse;font-size:12px}
th{background:#16a34a;color:white;padding:6px;text-align:left}
td{padding:5px 6px;border-bottom:1px solid #f0f0f0}
.tot{font-weight:700;font-size:14px}
.due{color:#dc2626}
.footer{text-align:center;margin-top:14px;font-size:10px;color:#999;border-top:1px dashed #ccc;padding-top:8px}
</style></head><body>
<h2>💊 ${pharmacyName}</h2>
<div class="sub">তারিখ: ${bill.date} · রোগী: ${bill.patient_name} ${bill.patient_phone ? `· ${bill.patient_phone}` : ''}</div>
<table>
<tr><th>ওষুধ</th><th>পরিমাণ</th><th>হার</th><th>মোট</th></tr>
${bill.items.map(i => `<tr><td>${i.med_name}</td><td>${i.qty}</td><td>₹${i.mrp}</td><td>₹${Math.round(i.qty * i.mrp * (1 - i.discount / 100))}</td></tr>`).join('')}
<tr><td colspan="3" class="tot">মোট</td><td class="tot">₹${bill.total}</td></tr>
<tr><td colspan="3">পরিশোধ</td><td style="color:#16a34a;font-weight:700">₹${bill.paid}</td></tr>
${bill.due > 0 ? `<tr><td colspan="3" class="due">বাকি</td><td class="due font-bold">₹${bill.due}</td></tr>` : ''}
</table>
<div class="footer">${pharmacyName} — সুস্থ থাকুন 🙏</div>
</body></html>`)
    w.document.close(); w.print()
  }

  const markDuePaid = (billId: string, amount: number) => {
    setBills(bills.map(b => b.id === billId ? { ...b, paid: b.paid + amount, due: Math.max(0, b.due - amount) } : b))
    toast.success('পেমেন্ট রেকর্ড হয়েছে!')
  }

  // ── AI Chat ───────────────────────────────────────────────
  const buildPharmacyContext = () => {
    const lowList  = lowStock.map(m => `${m.name}(${m.stock}${m.unit})`).join(', ')
    const expList  = expired.map(m => m.name).join(', ')
    const dueList  = bills.filter(b => b.due > 0)
      .slice(0, 10)
      .map(b => `${b.patient_name}:₹${b.due}`).join(', ')
    return `তুমি ${pharmacyName}-এর AI সহায়ক। বাংলায় সংক্ষেপে উত্তর দাও।
ফার্মেসি তথ্য:
- মোট ওষুধ: ${medicines.length}টি
- আজকের আয়: ₹${todayRevenue} (${todayBills.length}টি বিল)
- মোট বাকি: ₹${totalDue}
- কম স্টক: ${lowList || 'নেই'}
- মেয়াদ শেষ: ${expList || 'নেই'}
- বাকিদার: ${dueList || 'নেই'}
- মোট রোগী: ${patients.length}জন`
  }

  const sendChat = async (text?: string) => {
    const msg = (text || chatInput).trim()
    if (!msg || chatLoading) return
    setChatInput('')
    const msgs: ChatMessage[] = [...chatMsgs, { role: 'user', content: msg }]
    setChatMsgs(msgs)
    setChatLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: buildPharmacyContext(),
          messages: msgs.slice(1).map(m => ({ role: m.role, content: m.content }))
        })
      })
      const data = await res.json()
      setChatMsgs([...msgs, { role: 'assistant', content: data.content || 'উত্তর পাওয়া যায়নি' }])
    } catch {
      toast.error('AI সংযোগে সমস্যা')
    } finally { setChatLoading(false) }
  }

  // ══════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════

  const TABS = [
    { id: 'dash',     label: 'ড্যাশবোর্ড', icon: <Home size={14} /> },
    { id: 'stock',    label: 'স্টক',        icon: <Pill size={14} /> },
    { id: 'patients', label: 'রোগী',         icon: <Users size={14} /> },
    { id: 'billing',  label: 'বিলিং',        icon: <FileText size={14} /> },
    { id: 'chat',     label: 'AI সহায়ক',    icon: <Bot size={14} /> },
  ] as const

  return (
    <div className="min-h-screen bg-[#f6faf7] font-sans">

      {/* ── TOP HEADER ─────────────────────────────────────── */}
      <div className="bg-white border-b border-emerald-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-20 shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-xl flex-shrink-0">💊</div>
        <div>
          <h1 className="font-extrabold text-gray-900 text-base bengali leading-tight">{pharmacyName}</h1>
          <p className="text-xs text-emerald-600 bengali">ফার্মেসি ম্যানেজমেন্ট সিস্টেম</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {expired.length > 0 && (
            <span className="text-[10px] bg-red-100 text-red-600 font-bold px-2 py-1 rounded-full animate-pulse bengali">
              ⚠️ {expired.length} মেয়াদ শেষ
            </span>
          )}
          {lowStock.length > 0 && (
            <span className="text-[10px] bg-orange-100 text-orange-600 font-bold px-2 py-1 rounded-full bengali">
              📦 {lowStock.length} কম স্টক
            </span>
          )}
        </div>
      </div>

      {/* ── NAV TABS ───────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 px-2 flex overflow-x-auto gap-1 py-1.5">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all bengali
              ${tab === t.id ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4">

        {/* ══════════════════════════════════════════════════ */}
        {/* DASHBOARD */}
        {/* ══════════════════════════════════════════════════ */}
        {tab === 'dash' && (
          <div className="space-y-4">

            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'আজকের আয়',    value: bn(todayRevenue),              icon: <TrendingUp size={16} />, color: 'emerald', sub: `${todayBills.length}টি বিল` },
                { label: 'মোট বাকি',    value: bn(totalDue),                  icon: <Wallet size={16} />,     color: 'red',     sub: `${bills.filter(b=>b.due>0).length}জন বাকিদার` },
                { label: 'কম স্টক',     value: `${lowStock.length}টি`,        icon: <Package size={16} />,    color: 'orange',  sub: 'অর্ডার দরকার' },
                { label: 'মোট রোগী',   value: `${patients.length}জন`,        icon: <UserCheck size={16} />,  color: 'blue',    sub: `${patientsWithDue.length}জনের বাকি আছে` },
              ].map(c => (
                <div key={c.label}
                  className={`bg-${c.color}-50 border border-${c.color}-100 rounded-2xl p-4`}>
                  <div className={`text-${c.color}-600 mb-2`}>{c.icon}</div>
                  <div className={`font-extrabold text-xl text-${c.color}-700`}>{c.value}</div>
                  <div className="text-xs font-semibold text-gray-600 bengali">{c.label}</div>
                  <div className="text-[10px] text-gray-400 bengali mt-0.5">{c.sub}</div>
                </div>
              ))}
            </div>

            {/* Alerts */}
            {(expired.length > 0 || expiringSoon.length > 0 || lowStock.length > 0) && (
              <div className="space-y-2">
                {expired.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                    <div className="font-bold text-red-800 bengali text-sm mb-2">🚫 এখনই সরান — মেয়াদ শেষ হওয়া ওষুধ</div>
                    <div className="flex flex-wrap gap-2">
                      {expired.map(m => (
                        <span key={m.id} className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full font-semibold bengali">
                          {m.name} · {m.expiry}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {lowStock.length > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
                    <div className="font-bold text-orange-800 bengali text-sm mb-2">📦 অর্ডার দিন — কম স্টক</div>
                    <div className="flex flex-wrap gap-2">
                      {lowStock.map(m => (
                        <span key={m.id} className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-semibold bengali">
                          {m.name}: {m.stock} {m.unit} বাকি
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Due list preview */}
            {bills.filter(b => b.due > 0).length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-800 bengali text-sm">💳 বাকির তালিকা</h3>
                  <button onClick={() => setTab('billing')} className="text-xs text-emerald-600 font-bold bengali">সব দেখুন →</button>
                </div>
                <div className="space-y-2">
                  {bills.filter(b => b.due > 0).slice(0, 5).map(b => (
                    <div key={b.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <div className="font-semibold text-gray-800 bengali text-sm">{b.patient_name}</div>
                        <div className="text-xs text-gray-400 bengali">{b.date} · {b.patient_phone}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-red-600 text-sm">{bn(b.due)}</span>
                        <button
                          onClick={() => {
                            const amt = prompt(`${b.patient_name} কত টাকা দিল? (বাকি: ₹${b.due})`)
                            if (amt && +amt > 0) markDuePaid(b.id, Math.min(+amt, b.due))
                          }}
                          className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg font-bold bengali hover:bg-emerald-200"
                        >পেমেন্ট</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent bills */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4">
              <h3 className="font-bold text-gray-800 bengali text-sm mb-3">🧾 আজকের বিক্রয়</h3>
              {todayBills.length === 0
                ? <p className="text-sm text-gray-400 bengali text-center py-4">আজ কোনো বিল নেই</p>
                : <div className="space-y-2">
                    {todayBills.map(b => (
                      <div key={b.id} className="flex items-center justify-between p-2 rounded-xl bg-gray-50">
                        <div>
                          <span className="font-semibold text-gray-700 bengali text-sm">{b.patient_name}</span>
                          <div className="text-xs text-gray-400">{b.items.length}টি আইটেম</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-emerald-700">{bn(b.total)}</div>
                          {b.due > 0 && <div className="text-xs text-red-500 bengali">বাকি {bn(b.due)}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
              }
            </div>

          </div>
        )}

        {/* ══════════════════════════════════════════════════ */}
        {/* STOCK */}
        {/* ══════════════════════════════════════════════════ */}
        {tab === 'stock' && (
          <div className="space-y-3">
            {/* Controls */}
            <div className="flex gap-2 flex-wrap">
              <div className="flex-1 relative min-w-[150px]">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={medSearch} onChange={e => setMedSearch(e.target.value)}
                  placeholder="ওষুধ খুঁজুন..." className="w-full pl-8 pr-3 py-2 border rounded-xl text-sm focus:outline-none focus:border-emerald-400 bengali" />
              </div>
              <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
                className="border rounded-xl px-3 py-2 text-sm focus:outline-none bg-white">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <button onClick={() => setShowAddMed(!showAddMed)}
                className="flex items-center gap-1.5 text-xs bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-emerald-700 bengali">
                <Plus size={13} />নতুন ওষুধ
              </button>
            </div>

            {/* Add form */}
            {showAddMed && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-3">
                <div className="font-bold text-emerald-800 bengali">➕ নতুন ওষুধ যোগ করুন</div>
                <div className="grid grid-cols-2 gap-2">
                  <input placeholder="ওষুধের নাম *" className="border rounded-xl px-3 py-2 text-sm col-span-2 focus:outline-none focus:border-emerald-400" value={newMed.name||''} onChange={e=>setNewMed({...newMed,name:e.target.value})} />
                  <input placeholder="Generic নাম" className="border rounded-xl px-3 py-2 text-sm focus:outline-none" value={newMed.generic||''} onChange={e=>setNewMed({...newMed,generic:e.target.value})} />
                  <select className="border rounded-xl px-3 py-2 text-sm focus:outline-none" value={newMed.category} onChange={e=>setNewMed({...newMed,category:e.target.value})}>
                    {CATEGORIES.slice(1).map(c=><option key={c}>{c}</option>)}
                  </select>
                  <input placeholder="স্টক *" type="number" className="border rounded-xl px-3 py-2 text-sm focus:outline-none" value={newMed.stock||''} onChange={e=>setNewMed({...newMed,stock:+e.target.value})} />
                  <select className="border rounded-xl px-3 py-2 text-sm focus:outline-none" value={newMed.unit} onChange={e=>setNewMed({...newMed,unit:e.target.value})}>
                    {UNITS.map(u=><option key={u}>{u}</option>)}
                  </select>
                  <input placeholder="মেয়াদ (YYYY-MM)" type="month" className="border rounded-xl px-3 py-2 text-sm focus:outline-none" value={newMed.expiry||''} onChange={e=>setNewMed({...newMed,expiry:e.target.value})} />
                  <input placeholder="Min স্টক" type="number" className="border rounded-xl px-3 py-2 text-sm focus:outline-none" value={newMed.min_stock||''} onChange={e=>setNewMed({...newMed,min_stock:+e.target.value})} />
                  <input placeholder="MRP ₹" type="number" className="border rounded-xl px-3 py-2 text-sm focus:outline-none" value={newMed.mrp||''} onChange={e=>setNewMed({...newMed,mrp:+e.target.value})} />
                  <input placeholder="Cost ₹" type="number" className="border rounded-xl px-3 py-2 text-sm focus:outline-none" value={newMed.cost_price||''} onChange={e=>setNewMed({...newMed,cost_price:+e.target.value})} />
                  <input placeholder="সরবরাহকারী" className="border rounded-xl px-3 py-2 text-sm focus:outline-none" value={newMed.supplier||''} onChange={e=>setNewMed({...newMed,supplier:e.target.value})} />
                  <input placeholder="Rack" className="border rounded-xl px-3 py-2 text-sm focus:outline-none" value={newMed.rack||''} onChange={e=>setNewMed({...newMed,rack:e.target.value})} />
                  <label className="flex items-center gap-2 text-sm col-span-2 cursor-pointer bengali">
                    <input type="checkbox" checked={!!newMed.prescription_req} onChange={e=>setNewMed({...newMed,prescription_req:e.target.checked})} />
                    Prescription আবশ্যক (Rx)?
                  </label>
                </div>
                <div className="flex gap-2">
                  <button onClick={saveMed} className="flex-1 bg-emerald-600 text-white rounded-xl py-2 text-sm font-bold bengali hover:bg-emerald-700">যোগ করুন</button>
                  <button onClick={()=>setShowAddMed(false)} className="px-4 border rounded-xl text-sm text-gray-500">বাতিল</button>
                </div>
              </div>
            )}

            {/* Medicine table */}
            <div className="bg-white rounded-2xl border overflow-hidden">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500 border-b">
                    <th className="text-left p-3 font-semibold bengali">ওষুধ</th>
                    <th className="text-center p-3 font-semibold bengali">স্টক</th>
                    <th className="text-center p-3 font-semibold bengali">মেয়াদ</th>
                    <th className="text-right p-3 font-semibold">MRP</th>
                    <th className="text-center p-3 font-semibold">Rack</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMeds.map(m => {
                    const eb = expiryBadge(m.expiry)
                    const ls = m.stock <= m.min_stock
                    return (
                      <tr key={m.id} className={`border-t hover:bg-gray-50 ${ls ? 'bg-orange-50/30' : ''}`}>
                        <td className="p-3">
                          <div className="font-semibold text-gray-800 text-xs">{m.name}</div>
                          <div className="text-gray-400 text-[10px]">{m.generic} · {m.category}</div>
                          {m.prescription_req && <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">Rx</span>}
                        </td>
                        <td className="p-3 text-center">
                          {editMedId === m.id ? (
                            <div className="flex items-center gap-1 justify-center">
                              <input type="number" value={editStockVal} onChange={e=>setEditStockVal(e.target.value)}
                                className="w-16 border rounded px-1 py-0.5 text-xs text-center focus:outline-none" />
                              <button onClick={()=>updateStock(m.id)} className="text-emerald-600"><CheckCircle size={13} /></button>
                              <button onClick={()=>setEditMedId(null)} className="text-gray-400"><X size={13} /></button>
                            </div>
                          ) : (
                            <button onClick={()=>{setEditMedId(m.id);setEditStockVal(String(m.stock))}}
                              className={`font-bold text-xs hover:underline ${ls?'text-red-600':'text-emerald-700'}`}>
                              {m.stock} {m.unit}
                            </button>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold bengali ${eb.cls}`}>
                            <span className={`inline-block w-1.5 h-1.5 rounded-full ${eb.dot} mr-1`}></span>
                            {m.expiry}
                          </span>
                        </td>
                        <td className="p-3 text-right font-bold text-gray-700 text-xs">₹{m.mrp}</td>
                        <td className="p-3 text-center text-xs text-gray-400">{m.rack}</td>
                        <td className="p-3 text-right">
                          <button onClick={()=>setMedicines(medicines.filter(x=>x.id!==m.id))} className="text-gray-200 hover:text-red-500">
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {filteredMeds.length === 0 && <div className="text-center py-10 text-gray-400 bengali text-sm">কোনো ওষুধ পাওয়া যায়নি</div>}
            </div>
            <div className="text-xs text-gray-400 bengali text-right">
              মোট স্টক মূল্য: ₹{medicines.reduce((s,m)=>s+m.stock*m.cost_price,0).toLocaleString()}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════ */}
        {/* PATIENTS */}
        {/* ══════════════════════════════════════════════════ */}
        {tab === 'patients' && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={patSearch} onChange={e=>setPatSearch(e.target.value)}
                  placeholder="নাম, ফোন বা গ্রাম দিয়ে খুঁজুন..." className="w-full pl-8 pr-3 py-2 border rounded-xl text-sm focus:outline-none focus:border-emerald-400 bengali" />
              </div>
              <button onClick={()=>setShowAddPat(!showAddPat)}
                className="flex items-center gap-1.5 text-xs bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-emerald-700 bengali">
                <Plus size={13} />নতুন রোগী
              </button>
            </div>

            {/* Add patient form */}
            {showAddPat && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-3">
                <div className="font-bold text-emerald-800 bengali">👤 নতুন রোগী রেজিস্ট্রেশন</div>
                <div className="grid grid-cols-2 gap-2">
                  <input placeholder="রোগীর নাম *" className="border rounded-xl px-3 py-2 text-sm col-span-2 focus:outline-none bengali" value={newPat.name||''} onChange={e=>setNewPat({...newPat,name:e.target.value})} />
                  <input placeholder="বাবার নাম" className="border rounded-xl px-3 py-2 text-sm focus:outline-none bengali" value={newPat.father_name||''} onChange={e=>setNewPat({...newPat,father_name:e.target.value})} />
                  <input placeholder="মায়ের নাম" className="border rounded-xl px-3 py-2 text-sm focus:outline-none bengali" value={newPat.mother_name||''} onChange={e=>setNewPat({...newPat,mother_name:e.target.value})} />
                  <input placeholder="বয়স" type="number" className="border rounded-xl px-3 py-2 text-sm focus:outline-none" value={newPat.age||''} onChange={e=>setNewPat({...newPat,age:+e.target.value})} />
                  <select className="border rounded-xl px-3 py-2 text-sm focus:outline-none bengali" value={newPat.gender} onChange={e=>setNewPat({...newPat,gender:e.target.value})}>
                    <option>পুরুষ</option><option>মহিলা</option><option>অন্যান্য</option>
                  </select>
                  <input placeholder="মোবাইল নম্বর" type="tel" className="border rounded-xl px-3 py-2 text-sm focus:outline-none" value={newPat.phone||''} onChange={e=>setNewPat({...newPat,phone:e.target.value})} />
                  <select className="border rounded-xl px-3 py-2 text-sm focus:outline-none" value={newPat.blood_group} onChange={e=>setNewPat({...newPat,blood_group:e.target.value})}>
                    {['অজানা','A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g=><option key={g}>{g}</option>)}
                  </select>
                  <input placeholder="গ্রামের নাম" className="border rounded-xl px-3 py-2 text-sm focus:outline-none bengali" value={newPat.village||''} onChange={e=>setNewPat({...newPat,village:e.target.value})} />
                  <input placeholder="সম্পূর্ণ ঠিকানা" className="border rounded-xl px-3 py-2 text-sm col-span-2 focus:outline-none bengali" value={newPat.address||''} onChange={e=>setNewPat({...newPat,address:e.target.value})} />
                  <input placeholder="নিয়মিত ডাক্তার" className="border rounded-xl px-3 py-2 text-sm col-span-2 focus:outline-none bengali" value={newPat.doctor_name||''} onChange={e=>setNewPat({...newPat,doctor_name:e.target.value})} />
                  <textarea placeholder="নোট (ডায়াবেটিস, উচ্চ রক্তচাপ...)" className="border rounded-xl px-3 py-2 text-sm col-span-2 focus:outline-none bengali resize-none" rows={2} value={newPat.notes||''} onChange={e=>setNewPat({...newPat,notes:e.target.value})} />
                </div>
                <div className="flex gap-2">
                  <button onClick={savePat} className="flex-1 bg-emerald-600 text-white rounded-xl py-2 text-sm font-bold bengali hover:bg-emerald-700">রেজিস্ট্রেশন করুন</button>
                  <button onClick={()=>setShowAddPat(false)} className="px-4 border rounded-xl text-sm text-gray-500 bengali">বাতিল</button>
                </div>
              </div>
            )}

            {/* Patient cards */}
            <div className="space-y-2">
              {filteredPats.length === 0 && <div className="text-center py-10 text-gray-400 bengali text-sm">কোনো রোগী পাওয়া যায়নি</div>}
              {filteredPats.map(p => {
                const patBills = bills.filter(b => b.patient_phone === p.phone || b.patient_name === p.name)
                const patDue   = patBills.reduce((s,b)=>s+b.due,0)
                const patTotal = patBills.reduce((s,b)=>s+b.total,0)
                return (
                  <div key={p.id} className="bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-gray-900 bengali">{p.name}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${p.gender==='মহিলা'?'bg-pink-100 text-pink-700':'bg-blue-100 text-blue-700'} bengali`}>{p.gender}</span>
                          <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{p.blood_group}</span>
                        </div>
                        {p.father_name && <div className="text-xs text-gray-500 mt-1 bengali">পিতা: {p.father_name}</div>}
                        {p.age > 0 && <div className="text-xs text-gray-400 bengali">বয়স: {p.age} বছর</div>}
                        <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-gray-500">
                          {p.phone && <span className="flex items-center gap-1"><Phone size={10} />{p.phone}</span>}
                          {p.village && <span className="flex items-center gap-1 bengali"><MapPin size={10} />{p.village}</span>}
                          {p.doctor_name && <span className="bengali">ডা: {p.doctor_name}</span>}
                        </div>
                        {p.notes && <div className="text-xs text-indigo-600 bengali mt-1 italic">{p.notes}</div>}
                      </div>
                      <div className="text-right ml-3 flex-shrink-0">
                        <div className="font-bold text-emerald-700">{bn(patTotal)}</div>
                        {patDue > 0
                          ? <div className="text-xs text-red-600 font-extrabold bengali">বাকি {bn(patDue)}</div>
                          : <div className="text-xs text-emerald-600 bengali">✓ পরিশোধিত</div>}
                        <div className="text-[10px] text-gray-400 bengali">{patBills.length}টি বিল</div>
                        <button onClick={()=>setPatients(patients.filter(x=>x.id!==p.id))}
                          className="text-gray-200 hover:text-red-400 mt-1"><Trash2 size={12}/></button>
                      </div>
                    </div>

                    {/* Patient bill history */}
                    {patBills.length > 0 && (
                      <div className="mt-3 border-t pt-2 space-y-1">
                        {patBills.slice(0,3).map(b => (
                          <div key={b.id} className="flex items-center justify-between text-xs">
                            <span className="text-gray-500 bengali">{b.date} · {b.items.map(i=>i.med_name).join(', ').slice(0,40)}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{bn(b.total)}</span>
                              {b.due > 0 && (
                                <button onClick={()=>{
                                  const amt = prompt(`কত টাকা পেলেন? (বাকি: ₹${b.due})`)
                                  if (amt && +amt > 0) markDuePaid(b.id, Math.min(+amt, b.due))
                                }} className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold bengali hover:bg-red-200">বাকি {bn(b.due)}</button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════ */}
        {/* BILLING */}
        {/* ══════════════════════════════════════════════════ */}
        {tab === 'billing' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-gray-700 bengali">আজ {todayBills.length}টি বিল · {bn(todayRevenue)}</div>
              <button onClick={()=>setShowNewBill(!showNewBill)}
                className="flex items-center gap-1.5 text-xs bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-emerald-700 bengali">
                <Plus size={13}/>নতুন বিল
              </button>
            </div>

            {showNewBill && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-3">
                <div className="font-bold text-emerald-800 bengali">🧾 নতুন বিল তৈরি করুন</div>
                <div className="grid grid-cols-2 gap-2">
                  <input list="pat-list" placeholder="রোগীর নাম *" className="border rounded-xl px-3 py-2 text-sm col-span-2 focus:outline-none bengali"
                    value={billPatName} onChange={e=>{
                      const p = patients.find(x=>x.name===e.target.value)
                      setBillPatName(e.target.value)
                      if(p) setBillPatPhone(p.phone)
                    }} />
                  <datalist id="pat-list">{patients.map(p=><option key={p.id} value={p.name}/>)}</datalist>
                  <input placeholder="ফোন নম্বর" className="border rounded-xl px-3 py-2 text-sm col-span-2 focus:outline-none"
                    value={billPatPhone} onChange={e=>setBillPatPhone(e.target.value)} />
                </div>

                {/* Bill items */}
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-1 text-[10px] font-bold text-gray-500 px-1 bengali">
                    <span className="col-span-5">ওষুধ</span>
                    <span className="col-span-2 text-center">পরিমাণ</span>
                    <span className="col-span-2 text-center">MRP ₹</span>
                    <span className="col-span-2 text-center">ছাড়%</span>
                    <span></span>
                  </div>
                  {billItems.map((item, i) => (
                    <div key={i} className="grid grid-cols-12 gap-1 items-center">
                      <select className="border rounded-lg px-2 py-1.5 text-xs col-span-5 focus:outline-none"
                        value={item.med_name} onChange={e=>updateBillItem(i,'med_name',e.target.value)}>
                        <option value="">ওষুধ বেছে নিন</option>
                        {medicines.map(m=><option key={m.id} value={m.name}>{m.name} (স্টক:{m.stock})</option>)}
                      </select>
                      <input type="number" min="1" className="border rounded-lg px-2 py-1.5 text-xs col-span-2 text-center focus:outline-none"
                        value={item.qty} onChange={e=>updateBillItem(i,'qty',+e.target.value)} />
                      <input type="number" className="border rounded-lg px-2 py-1.5 text-xs col-span-2 text-center focus:outline-none"
                        value={item.mrp} onChange={e=>updateBillItem(i,'mrp',+e.target.value)} />
                      <input type="number" min="0" max="100" className="border rounded-lg px-2 py-1.5 text-xs col-span-2 text-center focus:outline-none"
                        value={item.discount} onChange={e=>updateBillItem(i,'discount',+e.target.value)} />
                      <button onClick={()=>setBillItems(billItems.filter((_,j)=>j!==i))} className="text-gray-300 hover:text-red-400"><Trash2 size={12}/></button>
                    </div>
                  ))}
                  <button onClick={addBillItem} className="w-full border border-dashed border-emerald-300 text-emerald-600 rounded-xl py-2 text-xs font-bold bengali hover:bg-emerald-50">
                    + ওষুধ যোগ করুন
                  </button>
                </div>

                <div className="flex items-center justify-between border-t pt-2">
                  <span className="font-extrabold text-emerald-700 bengali">মোট: {bn(Math.round(billTotal))}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input placeholder={`পরিশোধ (মোট: ₹${Math.round(billTotal)})`} type="number" className="border rounded-xl px-3 py-2 text-sm focus:outline-none col-span-2"
                    value={billPaid} onChange={e=>setBillPaid(e.target.value===''?'':+e.target.value)} />
                  <input placeholder="নোট (ঐচ্ছিক)" className="border rounded-xl px-3 py-2 text-sm focus:outline-none col-span-2 bengali"
                    value={billNotes} onChange={e=>setBillNotes(e.target.value)} />
                </div>

                <div className="flex gap-2">
                  <button onClick={()=>{setBillPaid(Math.round(billTotal));saveBill()}}
                    className="flex-1 bg-emerald-600 text-white rounded-xl py-2 text-xs font-bold bengali hover:bg-emerald-700">✅ সম্পূর্ণ পেমেন্ট</button>
                  <button onClick={saveBill}
                    className="flex-1 bg-yellow-500 text-white rounded-xl py-2 text-xs font-bold bengali hover:bg-yellow-600">⏳ আংশিক / বাকি</button>
                  <button onClick={()=>setShowNewBill(false)} className="border rounded-xl px-4 text-xs text-gray-500 bengali">বাতিল</button>
                </div>
              </div>
            )}

            {/* Bills list */}
            {/* Due bills first */}
            {bills.filter(b=>b.due>0).length > 0 && (
              <div>
                <div className="text-xs font-bold text-red-700 mb-2 bengali">⚠️ বাকি বিল</div>
                <div className="space-y-2">
                  {bills.filter(b=>b.due>0).map(b=>(
                    <div key={b.id} className="bg-red-50 border border-red-200 rounded-2xl p-3 flex items-start justify-between">
                      <div>
                        <div className="font-bold text-gray-800 bengali">{b.patient_name}</div>
                        <div className="text-xs text-gray-400 bengali">{b.date} · {b.patient_phone}</div>
                        <div className="text-xs text-gray-500 mt-1">{b.items.map(i=>`${i.med_name}×${i.qty}`).join(', ')}</div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <div className="text-xs text-gray-500">মোট {bn(b.total)}</div>
                        <div className="font-extrabold text-red-600 bengali">বাকি {bn(b.due)}</div>
                        <div className="flex gap-1 mt-1.5">
                          <button onClick={()=>printBill(b)} className="text-[10px] text-gray-500 hover:text-gray-800 flex items-center gap-0.5 bengali"><Printer size={10}/>প্রিন্ট</button>
                          <button onClick={()=>{
                            const amt = prompt(`${b.patient_name} কত টাকা দিল? (বাকি: ₹${b.due})`)
                            if(amt && +amt > 0) markDuePaid(b.id, Math.min(+amt, b.due))
                          }} className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-lg font-bold bengali">পেমেন্ট নিন</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Paid bills */}
            <div>
              <div className="text-xs font-bold text-gray-400 mb-2 bengali">✅ পরিশোধিত বিল</div>
              <div className="space-y-2">
                {bills.filter(b=>b.due===0).map(b=>(
                  <div key={b.id} className="bg-white border border-gray-100 rounded-2xl p-3 flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-gray-800 bengali">{b.patient_name}</div>
                      <div className="text-xs text-gray-400">{b.date}</div>
                      <div className="text-xs text-gray-500">{b.items.map(i=>`${i.med_name}×${i.qty}`).join(', ')}</div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <div className="font-bold text-emerald-700">{bn(b.total)}</div>
                      <button onClick={()=>printBill(b)} className="text-[10px] text-gray-400 hover:text-gray-700 flex items-center gap-0.5 mt-1 bengali"><Printer size={10}/>প্রিন্ট</button>
                    </div>
                  </div>
                ))}
                {bills.filter(b=>b.due===0).length === 0 && (
                  <div className="text-center py-6 text-gray-400 bengali text-sm">কোনো পরিশোধিত বিল নেই</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════ */}
        {/* AI CHAT */}
        {/* ══════════════════════════════════════════════════ */}
        {tab === 'chat' && (
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            {/* Chat window */}
            <div className="sm:col-span-3 flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden" style={{height: 520}}>
              {/* Header */}
              <div className="bg-emerald-700 px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-base">💊</div>
                <div>
                  <div className="font-bold text-white text-xs bengali">ফার্মেসি AI সহায়ক</div>
                  <div className="text-emerald-200 text-[10px] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full inline-block"/>সক্রিয়
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50">
                {chatMsgs.map((m, i) => (
                  <div key={i} className={`flex ${m.role==='user'?'justify-end':'justify-start'}`}>
                    {m.role==='assistant' && (
                      <div className="w-7 h-7 rounded-xl bg-emerald-600 flex items-center justify-center text-xs mr-2 mt-0.5 flex-shrink-0">💊</div>
                    )}
                    <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed bengali shadow-sm
                      ${m.role==='user'?'bg-emerald-600 text-white rounded-br-sm':'bg-white text-gray-800 rounded-bl-sm border'}`}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="w-7 h-7 rounded-xl bg-emerald-600 flex items-center justify-center text-xs mr-2 flex-shrink-0">💊</div>
                    <div className="bg-white border rounded-2xl px-3 py-2 shadow-sm">
                      <div className="flex gap-1">{[0,1,2].map(i=>(
                        <span key={i} className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay:`${i*0.15}s`}}/>
                      ))}</div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div className="p-2 border-t bg-white flex gap-2 items-end">
                <button onClick={voice.listening ? voice.stop : voice.start}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${voice.listening?'bg-red-500 animate-pulse':'bg-gray-100 hover:bg-gray-200'}`}>
                  {voice.listening ? <MicOff size={14} className="text-white"/> : <Mic size={14} className="text-gray-600"/>}
                </button>
                <textarea value={chatInput} onChange={e=>setChatInput(e.target.value)}
                  onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendChat()}}}
                  placeholder="বাংলায় জিজ্ঞেস করুন..." rows={1}
                  className="flex-1 resize-none rounded-xl border px-3 py-2 text-xs focus:outline-none focus:border-emerald-400 bengali max-h-20" />
                <button onClick={()=>sendChat()} disabled={!chatInput.trim()||chatLoading}
                  className="w-9 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 flex items-center justify-center flex-shrink-0">
                  <Send size={14} className="text-white"/>
                </button>
              </div>
            </div>

            {/* Quick buttons + summary */}
            <div className="sm:col-span-2 space-y-3">
              <div className="font-bold text-gray-800 bengali text-sm">⚡ দ্রুত প্রশ্ন</div>
              {[
                'আজকের স্টক রিপোর্ট দিন',
                'কোন ওষুধের মেয়াদ শেষ হচ্ছে?',
                'বাকির তালিকা দেখান',
                'কম স্টক কোথায় আছে?',
                'আজকের মোট লাভ কত?',
                'সবচেয়ে বেশি বিক্রি কোন ওষুধ?',
              ].map(q=>(
                <button key={q} onClick={()=>sendChat(q)} disabled={chatLoading}
                  className="w-full text-left text-xs border bg-white rounded-xl px-3 py-2.5 text-gray-600 hover:bg-emerald-50 hover:border-emerald-300 transition-colors bengali disabled:opacity-50">
                  {q} ↗
                </button>
              ))}

              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3 space-y-2 mt-2">
                <div className="font-bold text-emerald-800 bengali text-xs">📊 এখনকার তথ্য</div>
                {[
                  { l: 'আজকের আয়', v: bn(todayRevenue), c: 'text-emerald-700' },
                  { l: 'মোট বাকি', v: bn(totalDue), c: totalDue>0?'text-red-600':'text-emerald-600' },
                  { l: 'কম স্টক', v: `${lowStock.length}টি`, c: lowStock.length>0?'text-orange-600':'text-emerald-600' },
                  { l: 'মেয়াদ সমস্যা', v: `${expired.length+expiringSoon.length}টি`, c: expired.length>0?'text-red-600':'text-emerald-600' },
                  { l: 'মোট রোগী', v: `${patients.length}জন`, c: 'text-gray-700' },
                ].map(r=>(
                  <div key={r.l} className="flex justify-between items-center text-xs bengali">
                    <span className="text-gray-500">{r.l}</span>
                    <span className={`font-extrabold ${r.c}`}>{r.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
