'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { supabase } from "@/lib/supabaseClient"
import {
  AlertTriangle, Package, Plus, Printer, Trash2, Search,
  TrendingUp, DollarSign, Clock, FileText, Phone, User,
  Download, Check, X, RefreshCw,
  Camera, ChevronDown, ChevronUp, Globe, ShoppingBag,
  Stethoscope, Truck, BarChart2, BookOpen, Edit2,
  Save, Share2, MessageCircle, IndianRupee, Calendar,
  Heart, Loader2, CheckCircle, XCircle, Bell
} from 'lucide-react'
import toast from 'react-hot-toast'

// ─── Types ────────────────────────────────────────────────────────
interface Medicine {
  id: string
  user_id?: string
  name: string
  generic: string
  category: string
  stock: number
  unit: string
  expiry: string
  mrp: number
  cost_price: number
  min_stock: number
  supplier: string
  rack: string
  prescription_required: boolean
}

interface Patient {
  id: string
  user_id?: string
  name: string
  age: number
  gender: string
  phone: string
  address: string
  doctor_name: string
  blood_group: string
  notes: string
  total_due?: number
}

interface Purchase {
  id: string
  user_id?: string
  customer_id: string
  purchase_date: string
  item_name: string
  quantity: number
  unit: string
  unit_price: number
  total_amount: number
  paid_amount: number
  due_amount: number
  payment_status: string
  notes: string
  customer_name?: string
}

interface HalkhataEntry {
  patient: Patient
  purchases: Purchase[]
  total_due: number
  last_purchase: string
}

// ─── Helpers ──────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2, 9) }
function today() { return new Date().toISOString().slice(0, 10) }
function monthYear() { return new Date().toISOString().slice(0, 7) }

function expiryStatus(expiry: string) {
  const now = new Date()
  const exp = new Date(expiry + '-01')
  const diffDays = (exp.getTime() - now.getTime()) / 86400000
  if (diffDays < 0) return 'expired'
  if (diffDays < 30) return 'critical'
  if (diffDays < 90) return 'warning'
  return 'ok'
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
}

function fmtAmt(n: number) { return `₹${Number(n || 0).toFixed(0)}` }

// ─── Voice Hook ────────────────────────────────────────────────────
const CATEGORIES = ['সব', 'Analgesic', 'Antibiotic', 'Cardiac', 'Diabetes', 'GI', 'Antihistamine', 'Electrolyte', 'Vitamin', 'Skin', 'Other']
const UNITS = ['strip', 'tablet', 'capsule', 'bottle', 'tube', 'injection', 'pcs', 'sachet', 'vial', 'kg', 'ml']
// ══════════════════════════════════════════════════════════════════
export default function PharmacyAssistantUI({ userId: propUserId }: { userId?: string }) {
  // using shared supabase singleton from lib
  const [userId, setUserId] = useState<string | null>(propUserId || null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('stock')

  // ── Data state ────────────────────────────────────────────────
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [halkhataData, setHalkhataData] = useState<HalkhataEntry[]>([])

  // ── Stock tab ─────────────────────────────────────────────────
  const [searchQ, setSearchQ] = useState('')
  const [catFilter, setCatFilter] = useState('সব')
  const [showAddMed, setShowAddMed] = useState(false)
  const [editMed, setEditMed] = useState<Medicine | null>(null)
  const [newMed, setNewMed] = useState<Partial<Medicine>>({ unit: 'strip', category: 'Analgesic', prescription_required: false, stock: 0, min_stock: 20 })
  const [savingMed, setSavingMed] = useState(false)

  // ── Billing tab ───────────────────────────────────────────────
  const [showNewSale, setShowNewSale] = useState(false)
  const [salePatient, setSalePatient] = useState<Patient | null>(null)
  const [salePatientSearch, setSalePatientSearch] = useState('')
  const [saleItems, setSaleItems] = useState<{ name: string; qty: number; mrp: number; discount: number }[]>([{ name: '', qty: 1, mrp: 0, discount: 0 }])
  const [salePaid, setSalePaid] = useState(0)
  const [saleDoctor, setSaleDoctor] = useState('')
  const [savingSale, setSavingSale] = useState(false)
  const [recentSales, setRecentSales] = useState<Purchase[]>([])

  // ── Patient tab ───────────────────────────────────────────────
  const [showAddPatient, setShowAddPatient] = useState(false)
  const [patientSearch, setPatientSearch] = useState('')
  const [newPatient, setNewPatient] = useState<Partial<Patient>>({ gender: 'পুরুষ', blood_group: 'জানা নেই' })
  const [savingPatient, setSavingPatient] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [patientPurchases, setPatientPurchases] = useState<Purchase[]>([])

  // ── হালখাতা tab ───────────────────────────────────────────────
  const [halkhataSearch, setHalkhataSearch] = useState('')
  const [selectedHalkhata, setSelectedHalkhata] = useState<HalkhataEntry | null>(null)
  const [showCardPreview, setShowCardPreview] = useState(false)

  // ── Payment modal ─────────────────────────────────────────────
  const [payingPurchase, setPayingPurchase] = useState<Purchase | null>(null)
  const [payAmount, setPayAmount] = useState(0)
  const [savingPayment, setSavingPayment] = useState(false)

  const TABS = [
    { id: 'stock', label: 'স্টক', icon: <Package size={13} /> },
    { id: 'billing', label: 'বিল', icon: <FileText size={13} /> },
    { id: 'patients', label: 'রোগী', icon: <User size={13} /> },
    { id: 'halkhata', label: 'হালখাতা', icon: <BookOpen size={13} /> },
    { id: 'expiry', label: 'মেয়াদ', icon: <Clock size={13} /> },
    { id: 'report', label: 'রিপোর্ট', icon: <BarChart2 size={13} /> },
  ]

  // ══════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-emerald-600">
        <Loader2 className="animate-spin mr-2" size={22} />
        <span className="bengali text-sm">লোড হচ্ছে...</span>
      </div>
    )
  }

  if (!userId) {
    return (
      <div className="text-center py-16">
        <p className="bengali text-gray-500 mb-3">এই ফিচার ব্যবহার করতে লগইন করুন</p>
        <a href="/login" className="bg-emerald-600 text-white px-6 py-2 rounded-xl text-sm">লগইন করুন</a>
      </div>
    )
  }

  // ── Derived stats ─────────────────────────────────────────────
  const todayPurchases = recentSales.filter(s => s.purchase_date === today())
  const todayRevenue = todayPurchases.reduce((s, r) => s + Number(r.total_amount || 0), 0)
  const totalDue = halkhataData.reduce((s, h) => s + h.total_due, 0)
  const lowStock = medicines.filter(m => m.stock <= m.min_stock)
  const expired = medicines.filter(m => expiryStatus(m.expiry) === 'expired')
  const expiringSoon = medicines.filter(m => ['critical', 'warning'].includes(expiryStatus(m.expiry)))

  const filteredMeds = medicines.filter(m => {
    const matchQ = !searchQ || m.name.toLowerCase().includes(searchQ.toLowerCase()) || m.generic.toLowerCase().includes(searchQ.toLowerCase())
    const matchCat = catFilter === 'সব' || m.category === catFilter
    return matchQ && matchCat
  })
  const filteredPatients = patients.filter(p =>
    !patientSearch || p.name.toLowerCase().includes(patientSearch.toLowerCase()) || p.phone.includes(patientSearch)
  )
  const filteredHalkhata = halkhataData.filter(h =>
    !halkhataSearch || h.patient.name.toLowerCase().includes(halkhataSearch.toLowerCase()) || h.patient.phone.includes(halkhataSearch)
  )
  const saleGross = saleItems.reduce((s, i) => s + (i.qty * i.mrp * (1 - i.discount / 100)), 0)

  return (
    <div className="space-y-3">

      {/* ── Stats Bar ── */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: 'আজকের বিক্রি', value: fmtAmt(todayRevenue), color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
          { label: 'মোট বাকি', value: fmtAmt(totalDue), color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
          { label: 'কম স্টক', value: `${lowStock.length}টি`, color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
          { label: 'মেয়াদ সমস্যা', value: `${expired.length + expiringSoon.length}টি`, color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
        ].map(c => (
          <div key={c.label} className={`${c.bg} border rounded-xl p-3 cursor-pointer`}>
            <div className={`font-extrabold text-lg ${c.color}`}>{c.value}</div>
            <div className="text-xs text-gray-500 bengali">{c.label}</div>
          </div>
        ))}
      </div>

      {/* ── Alerts ── */}
      {(expired.length > 0 || lowStock.length > 0) && (
        <div className="space-y-2">
          {expired.length > 0 && (
            <div className="bg-red-50 border border-red-300 rounded-xl p-3">
              <div className="font-bold text-red-800 bengali text-sm mb-1.5">🚫 মেয়াদ শেষ — এখনই সরান</div>
              <div className="flex flex-wrap gap-2">{expired.map(m => <span key={m.id} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-lg bengali">💊 {m.name}</span>)}</div>
            </div>
          )}
          {lowStock.length > 0 && (
            <div className="bg-orange-50 border border-orange-300 rounded-xl p-3">
              <div className="font-bold text-orange-800 bengali text-sm mb-1.5">📦 কম স্টক — অর্ডার করুন</div>
              <div className="flex flex-wrap gap-2">{lowStock.map(m => <span key={m.id} className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-lg bengali">💊 {m.name}: {m.stock} {m.unit}</span>)}</div>
            </div>
          )}
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all bengali
              ${tab === t.id ? 'bg-emerald-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ════════════════ STOCK TAB ════════════════ */}
      {tab === 'stock' && (
        <div className="space-y-3">
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 text-gray-400" size={14} />
              <input className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="ওষুধ খুঁজুন..." value={searchQ} onChange={e => setSearchQ(e.target.value)} />
            </div>
            <button onClick={() => { setShowAddMed(true); setEditMed(null); setNewMed({ unit: 'strip', category: 'Analgesic', prescription_required: false, stock: 0, min_stock: 20 }) }}
              className="bg-emerald-600 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 whitespace-nowrap bengali">
              <Plus size={14} /> ওষুধ যোগ
            </button>
            <button onClick={() => { let csv = 'নাম,Generic,Category,স্টক,Unit,মেয়াদ,MRP,Cost\n'; medicines.forEach(m => { csv += `"${m.name}","${m.generic}","${m.category}",${m.stock},"${m.unit}","${m.expiry}",${m.mrp},${m.cost_price}\n` }); downloadCSV(csv, `stock-${today()}.csv`) }}
              className="bg-gray-100 text-gray-600 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1">
              <Download size={14} />
            </button>
          </div>

          {/* Category filter */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCatFilter(c)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all
                  ${catFilter === c ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {c}
              </button>
            ))}
          </div>

          {/* Add/Edit Medicine Form */}
          {showAddMed && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
              <div className="font-bold text-emerald-800 bengali text-sm">{editMed ? '✏️ ওষুধ সম্পাদনা' : '➕ নতুন ওষুধ'}</div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'ওষুধের নাম *', key: 'name', type: 'text' },
                  { label: 'Generic নাম', key: 'generic', type: 'text' },
                  { label: 'বর্তমান স্টক *', key: 'stock', type: 'number' },
                  { label: 'ন্যূনতম স্টক', key: 'min_stock', type: 'number' },
                  { label: 'MRP (₹)', key: 'mrp', type: 'number' },
                  { label: 'ক্রয় মূল্য (₹)', key: 'cost_price', type: 'number' },
                  { label: 'মেয়াদ (YYYY-MM)', key: 'expiry', type: 'month' },
                  { label: 'Rack/শেলফ', key: 'rack', type: 'text' },
                  { label: 'সরবরাহকারী', key: 'supplier', type: 'text' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs text-gray-500 bengali">{f.label}</label>
                    <input type={f.type} value={(newMed as any)[f.key] || ''}
                      onChange={e => setNewMed(p => ({ ...p, [f.key]: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 mt-0.5" />
                  </div>
                ))}
                <div>
                  <label className="text-xs text-gray-500 bengali">Unit</label>
                  <select value={newMed.unit || 'strip'} onChange={e => setNewMed(p => ({ ...p, unit: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none mt-0.5">
                    {UNITS.map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 bengali">Category</label>
                  <select value={newMed.category || 'Other'} onChange={e => setNewMed(p => ({ ...p, category: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none mt-0.5">
                    {CATEGORIES.filter(c => c !== 'সব').map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="rxReq" checked={!!newMed.prescription_required}
                  onChange={e => setNewMed(p => ({ ...p, prescription_required: e.target.checked }))} />
                <label htmlFor="rxReq" className="text-xs text-gray-600 bengali">প্রেসক্রিপশন প্রয়োজন</label>
              </div>
              <div className="flex gap-2">
                <button onClick={saveMedicine} disabled={savingMed}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 bengali disabled:opacity-60">
                  {savingMed ? <Loader2 className="animate-spin" size={13} /> : <Save size={13} />}
                  {editMed ? 'আপডেট করুন' : 'সেভ করুন'}
                </button>
                <button onClick={() => { setShowAddMed(false); setEditMed(null) }}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-xs font-bold bengali">বাতিল</button>
              </div>
            </div>
          )}

          {/* Medicine Table */}
          <div className="space-y-2">
            {filteredMeds.length === 0 ? (
              <div className="text-center py-8 text-gray-400 bengali text-sm">
                {medicines.length === 0 ? '💊 এখনো কোনো ওষুধ যোগ করা হয়নি' : 'কোনো ফলাফল পাওয়া যায়নি'}
              </div>
            ) : filteredMeds.map(m => {
              const status = expiryStatus(m.expiry)
              const isLow = m.stock <= m.min_stock
              const statusColor = status === 'expired' ? 'border-red-300 bg-red-50' : status === 'critical' ? 'border-orange-300 bg-orange-50' : isLow ? 'border-yellow-300 bg-yellow-50' : 'border-gray-100 bg-white'
              return (
                <div key={m.id} className={`border rounded-xl p-3 ${statusColor}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-800 text-sm truncate">{m.name}</div>
                      <div className="text-xs text-gray-500">{m.generic} · {m.category} · {m.rack}</div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => startEditMed(m)} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg"><Edit2 size={13} /></button>
                      <button onClick={() => deleteMed(m.id)} className="text-red-400 hover:bg-red-50 p-1.5 rounded-lg"><Trash2 size={13} /></button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500 bengali">স্টক:</span>
                      <span className={`font-bold ${isLow ? 'text-red-600' : 'text-gray-800'}`}>{m.stock} {m.unit}</span>
                      <div className="flex gap-1 ml-1">
                        <button onClick={() => updateStockDirect(m, m.stock + 1)} className="w-5 h-5 rounded bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center hover:bg-emerald-200">+</button>
                        <button onClick={() => m.stock > 0 && updateStockDirect(m, m.stock - 1)} className="w-5 h-5 rounded bg-gray-100 text-gray-600 font-bold flex items-center justify-center hover:bg-gray-200">−</button>
                      </div>
                    </div>
                    <span className="text-gray-500">MRP: <b className="text-gray-800">₹{m.mrp}</b></span>
                    <span className={`${status !== 'ok' ? 'text-red-600 font-bold' : 'text-gray-500'} bengali`}>মেয়াদ: {m.expiry}</span>
                    {m.supplier && <span className="text-gray-400">{m.supplier}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ════════════════ BILLING TAB ════════════════ */}
      {tab === 'billing' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="font-bold text-gray-700 bengali text-sm">বিলিং ইতিহাস ({recentSales.length})</div>
            <button onClick={() => setShowNewSale(true)}
              className="bg-emerald-600 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 bengali">
              <Plus size={14} /> নতুন বিল
            </button>
          </div>

          {/* New Sale Form */}
          {showNewSale && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
              <div className="font-bold text-blue-800 bengali text-sm">🧾 নতুন বিল তৈরি</div>

              {/* Patient search */}
              <div>
                <label className="text-xs text-gray-500 bengali">রোগী বেছে নিন *</label>
                <div className="relative mt-0.5">
                  <Search className="absolute left-2.5 top-2.5 text-gray-400" size={13} />
                  <input className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm"
                    placeholder="নাম বা ফোন দিয়ে খুঁজুন..."
                    value={salePatient ? salePatient.name : salePatientSearch}
                    onChange={e => { setSalePatientSearch(e.target.value); setSalePatient(null) }} />
                </div>
                {!salePatient && salePatientSearch && (
                  <div className="mt-1 border border-gray-200 rounded-lg bg-white max-h-32 overflow-y-auto">
                    {patients.filter(p => p.name.toLowerCase().includes(salePatientSearch.toLowerCase()) || p.phone.includes(salePatientSearch))
                      .map(p => (
                        <div key={p.id} onClick={() => { setSalePatient(p); setSalePatientSearch('') }}
                          className="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer bengali">
                          {p.name} {p.phone ? `(${p.phone})` : ''} {(p.total_due || 0) > 0 ? <span className="text-red-500 text-xs">বাকি: ₹{p.total_due}</span> : ''}
                        </div>
                      ))}
                    {patients.filter(p => p.name.toLowerCase().includes(salePatientSearch.toLowerCase()) || p.phone.includes(salePatientSearch)).length === 0 && (
                      <div className="px-3 py-2 text-xs text-gray-400 bengali">পাওয়া যায়নি — প্রথমে রোগী ট্যাবে যোগ করুন</div>
                    )}
                  </div>
                )}
                {salePatient && (
                  <div className="mt-1 bg-white border border-emerald-300 rounded-lg px-3 py-2 flex justify-between items-center">
                    <span className="bengali text-sm font-semibold text-emerald-700">✅ {salePatient.name} {salePatient.phone && `(${salePatient.phone})`}</span>
                    <button onClick={() => setSalePatient(null)} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs text-gray-500 bengali">ডাক্তারের নাম</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-0.5"
                  placeholder="ডা. ..." value={saleDoctor} onChange={e => setSaleDoctor(e.target.value)} />
              </div>

              {/* Items */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-gray-600 bengali">ওষুধ তালিকা</div>
                {saleItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-4 gap-1.5 items-center">
                    <div className="col-span-2">
                      <select value={item.name} onChange={e => {
                        const med = medicines.find(m => m.name === e.target.value)
                        const items = [...saleItems]
                        items[idx] = { ...items[idx], name: e.target.value, mrp: med ? med.mrp : 0 }
                        setSaleItems(items)
                      }} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs">
                        <option value="">ওষুধ বেছে নিন</option>
                        {medicines.map(m => <option key={m.id} value={m.name}>{m.name} (স্টক:{m.stock})</option>)}
                      </select>
                    </div>
                    <input type="number" min={1} placeholder="পরিমাণ" value={item.qty}
                      onChange={e => { const i = [...saleItems]; i[idx].qty = +e.target.value; setSaleItems(i) }}
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs" />
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500">₹{(item.qty * item.mrp).toFixed(0)}</span>
                      <button onClick={() => setSaleItems(saleItems.filter((_, i) => i !== idx))} className="text-red-400 ml-auto"><X size={12} /></button>
                    </div>
                  </div>
                ))}
                <button onClick={() => setSaleItems([...saleItems, { name: '', qty: 1, mrp: 0, discount: 0 }])}
                  className="text-xs text-emerald-600 flex items-center gap-1 font-semibold bengali">
                  <Plus size={13} /> ওষুধ যোগ করুন
                </button>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="bengali text-gray-600">মোট</span>
                  <span className="font-bold">{fmtAmt(saleGross)}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="bengali text-sm text-gray-600">আজকে পরিশোধ</span>
                  <input type="number" min={0} max={saleGross} value={salePaid}
                    onChange={e => setSalePaid(+e.target.value)}
                    className="w-24 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-right font-bold" />
                </div>
                {saleGross - salePaid > 0 && (
                  <div className="flex justify-between text-sm bg-red-50 rounded-lg px-2 py-1.5">
                    <span className="bengali text-red-600 font-semibold">বাকি থাকবে</span>
                    <span className="font-bold text-red-600">{fmtAmt(saleGross - salePaid)}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button onClick={saveSale} disabled={savingSale}
                  className="flex-1 bg-emerald-600 text-white py-2 rounded-xl text-sm font-bold bengali disabled:opacity-60 flex items-center justify-center gap-1">
                  {savingSale ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                  বিল সেভ করুন
                </button>
                <button onClick={() => setShowNewSale(false)}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold bengali">বাতিল</button>
              </div>
            </div>
          )}

          {/* Recent Sales */}
          <div className="space-y-2">
            {recentSales.length === 0 ? (
              <div className="text-center py-8 text-gray-400 bengali text-sm">এখনো কোনো বিল নেই</div>
            ) : recentSales.map(s => (
              <div key={s.id} className="bg-white border border-gray-100 rounded-xl p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-gray-800 text-sm bengali">{s.customer_name}</div>
                    <div className="text-xs text-gray-500">{s.item_name} × {s.quantity} · {s.purchase_date}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-800 text-sm">{fmtAmt(s.total_amount)}</div>
                    {Number(s.due_amount) > 0 ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-red-500 bengali">বাকি: {fmtAmt(s.due_amount)}</span>
                        <button onClick={() => { setPayingPurchase(s); setPayAmount(Number(s.due_amount)) }}
                          className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold bengali hover:bg-emerald-200">পরিশোধ</button>
                      </div>
                    ) : (
                      <span className="text-xs text-emerald-600 bengali flex items-center gap-0.5"><CheckCircle size={11} /> পরিশোধিত</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════════════════ PATIENTS TAB ════════════════ */}
      {tab === 'patients' && (
        <div className="space-y-3">
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 text-gray-400" size={14} />
              <input className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="নাম বা ফোন দিয়ে খুঁজুন..." value={patientSearch} onChange={e => setPatientSearch(e.target.value)} />
            </div>
            <button onClick={() => setShowAddPatient(true)}
              className="bg-emerald-600 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 whitespace-nowrap bengali">
              <Plus size={14} /> রোগী যোগ
            </button>
          </div>

          {showAddPatient && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
              <div className="font-bold text-blue-800 bengali text-sm">👤 নতুন রোগী রেজিস্ট্রেশন</div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'নাম *', key: 'name', type: 'text', full: true },
                  { label: 'বয়স', key: 'age', type: 'number' },
                  { label: 'ফোন', key: 'phone', type: 'tel' },
                  { label: 'ডাক্তারের নাম', key: 'doctor_name', type: 'text' },
                  { label: 'ঠিকানা', key: 'address', type: 'text', full: true },
                  { label: 'নোট (রোগ ইত্যাদি)', key: 'notes', type: 'text', full: true },
                ].map(f => (
                  <div key={f.key} className={f.full ? 'col-span-2' : ''}>
                    <label className="text-xs text-gray-500 bengali">{f.label}</label>
                    <input type={f.type} value={(newPatient as any)[f.key] || ''}
                      onChange={e => setNewPatient(p => ({ ...p, [f.key]: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 mt-0.5" />
                  </div>
                ))}
                <div>
                  <label className="text-xs text-gray-500 bengali">লিঙ্গ</label>
                  <select value={newPatient.gender} onChange={e => setNewPatient(p => ({ ...p, gender: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm mt-0.5">
                    <option>পুরুষ</option><option>মহিলা</option><option>অন্যান্য</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 bengali">রক্তের গ্রুপ</label>
                  <select value={newPatient.blood_group} onChange={e => setNewPatient(p => ({ ...p, blood_group: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm mt-0.5">
                    {['জানা নেই', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={savePatient} disabled={savingPatient}
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 bengali disabled:opacity-60">
                  {savingPatient ? <Loader2 className="animate-spin" size={13} /> : <Save size={13} />} সেভ করুন
                </button>
                <button onClick={() => setShowAddPatient(false)}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-xs font-bold bengali">বাতিল</button>
              </div>
            </div>
          )}

          {filteredPatients.length === 0 ? (
            <div className="text-center py-8 text-gray-400 bengali text-sm">
              {patients.length === 0 ? '👤 এখনো কোনো রোগী নেই' : 'কোনো ফলাফল পাওয়া যায়নি'}
            </div>
          ) : filteredPatients.map(p => (
            <div key={p.id} className="bg-white border border-gray-100 rounded-xl p-3 hover:shadow-sm transition-shadow">
              <div className="flex justify-between items-start">
                <div className="cursor-pointer flex-1" onClick={async () => {
                  setSelectedPatient(p); await loadPatientPurchases(p.id); setTab('patient_detail')
                }}>
                  <div className="font-bold text-gray-800 bengali">{p.name}
                    <span className="text-xs font-normal text-gray-400 ml-2">{p.gender} · {p.age ? `${p.age} বছর` : ''}</span>
                  </div>
                  {p.phone && <div className="text-xs text-gray-500 flex items-center gap-1"><Phone size={11} />{p.phone}</div>}
                  {p.doctor_name && <div className="text-xs text-gray-400 bengali">🩺 {p.doctor_name}</div>}
                  {p.notes && <div className="text-xs text-gray-400 bengali mt-0.5">{p.notes}</div>}
                </div>
                <div className="flex flex-col items-end gap-1">
                  {(p.total_due || 0) > 0 ? (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold bengali">বাকি ₹{(p.total_due || 0).toFixed(0)}</span>
                  ) : (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full bengali">✅ ক্লিয়ার</span>
                  )}
                  <button onClick={() => deletePatient(p.id)} className="text-red-400 hover:bg-red-50 p-1 rounded-lg"><Trash2 size={13} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ════════════════ PATIENT DETAIL (inline) ════════════════ */}
      {tab === 'patient_detail' && selectedPatient && (
        <div className="space-y-3">
          <button onClick={() => setTab('patients')} className="flex items-center gap-1 text-sm text-emerald-600 font-semibold bengali">
            ← রোগীর তালিকায় ফিরুন
          </button>
          <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-xl p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-bold text-lg text-gray-800 bengali">{selectedPatient.name}</div>
                <div className="text-xs text-gray-500 space-y-0.5 mt-1">
                  {selectedPatient.phone && <div className="flex items-center gap-1"><Phone size={11} />{selectedPatient.phone}</div>}
                  {selectedPatient.address && <div>📍 {selectedPatient.address}</div>}
                  {selectedPatient.doctor_name && <div className="bengali">🩺 {selectedPatient.doctor_name}</div>}
                  {selectedPatient.notes && <div className="bengali">{selectedPatient.notes}</div>}
                </div>
              </div>
              <div className="text-right">
                {(selectedPatient.total_due || 0) > 0 ? (
                  <div className="bg-red-100 border border-red-200 rounded-xl px-4 py-2 text-center">
                    <div className="text-xs text-red-500 bengali">মোট বাকি</div>
                    <div className="text-xl font-black text-red-600">₹{(selectedPatient.total_due || 0).toFixed(0)}</div>
                  </div>
                ) : (
                  <div className="bg-green-100 border border-green-200 rounded-xl px-4 py-2 text-center">
                    <div className="text-emerald-600 font-bold bengali text-sm">✅ সব পরিশোধিত</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="font-bold text-gray-700 bengali text-sm">কেনাকাটার ইতিহাস ({patientPurchases.length})</div>
          {patientPurchases.length === 0 ? (
            <div className="text-center py-6 text-gray-400 bengali text-sm">কোনো কেনাকাটা নেই</div>
          ) : patientPurchases.map(p => (
            <div key={p.id} className={`border rounded-xl p-3 ${Number(p.due_amount) > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-sm text-gray-800">{p.item_name}</div>
                  <div className="text-xs text-gray-500">{p.quantity} × ₹{p.unit_price} · {p.purchase_date}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">{fmtAmt(p.total_amount)}</div>
                  {Number(p.due_amount) > 0 ? (
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-xs text-red-500 bengali">বাকি: {fmtAmt(p.due_amount)}</span>
                      <button onClick={() => { setPayingPurchase(p); setPayAmount(Number(p.due_amount)) }}
                        className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full bengali hover:bg-emerald-200">পরিশোধ</button>
                    </div>
                  ) : (
                    <span className="text-xs text-emerald-600 bengali">✅ পরিশোধিত</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ════════════════ হালখাতা TAB ════════════════ */}
      {tab === 'halkhata' && (
        <div className="space-y-3">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-black text-amber-800 bengali text-base">📒 হালখাতা</div>
                <div className="text-xs text-amber-600 bengali">মোট {halkhataData.length} রোগীর কাছে বাকি আছে</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-amber-700">{fmtAmt(totalDue)}</div>
                <div className="text-xs text-amber-500 bengali">মোট বাকি</div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 text-gray-400" size={13} />
              <input className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-sm"
                placeholder="রোগীর নাম বা ফোন..." value={halkhataSearch} onChange={e => setHalkhataSearch(e.target.value)} />
            </div>
            <button onClick={exportHalkhataExcel}
              className="bg-green-600 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 bengali">
              <Download size={13} /> Excel
            </button>
          </div>

          {filteredHalkhata.length === 0 ? (
            <div className="text-center py-8 text-gray-400 bengali text-sm">
              {halkhataData.length === 0 ? '🎉 কোনো বাকি নেই! সব পরিশোধিত।' : 'কোনো ফলাফল নেই'}
            </div>
          ) : filteredHalkhata.map(entry => (
            <div key={entry.patient.id} className="bg-white border border-amber-200 rounded-xl p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-bold text-gray-800 bengali">{entry.patient.name}</div>
                  <div className="text-xs text-gray-500 space-y-0.5 mt-0.5">
                    {entry.patient.phone && <div className="flex items-center gap-1"><Phone size={10} />{entry.patient.phone}</div>}
                    {entry.patient.address && <div>📍 {entry.patient.address}</div>}
                    {entry.patient.doctor_name && <div className="bengali">🩺 {entry.patient.doctor_name}</div>}
                  </div>
                  <div className="text-xs text-gray-400 mt-1 bengali">
                    {entry.purchases.length}টি কেনাকাটায় বাকি · শেষ: {entry.last_purchase}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black text-red-600">₹{entry.total_due.toFixed(0)}</div>
                  <div className="text-xs text-red-400 bengali">বাকি</div>
                </div>
              </div>

              {/* Details */}
              <div className="mt-3 space-y-1.5">
                {entry.purchases.slice(0, 3).map(p => (
                  <div key={p.id} className="flex justify-between text-xs bg-amber-50 rounded-lg px-2 py-1.5">
                    <span className="text-gray-600">{p.item_name} ({p.purchase_date})</span>
                    <span className="font-bold text-red-600">বাকি ₹{Number(p.due_amount).toFixed(0)}</span>
                  </div>
                ))}
                {entry.purchases.length > 3 && (
                  <div className="text-xs text-gray-400 bengali text-center">+ আরো {entry.purchases.length - 3}টি...</div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 mt-3">
                <button onClick={() => shareHalkhataWhatsApp(entry)}
                  className="flex-1 bg-green-500 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 bengali hover:bg-green-600">
                  <MessageCircle size={13} /> WhatsApp
                </button>
                <button onClick={() => printHalkhataCard(entry)}
                  className="flex-1 bg-blue-500 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 bengali hover:bg-blue-600">
                  <Printer size={13} /> প্রিন্ট কার্ড
                </button>
                <button onClick={() => { setPayingPurchase(entry.purchases[0]); setPayAmount(entry.total_due) }}
                  className="flex-1 bg-emerald-600 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 bengali hover:bg-emerald-700">
                  <IndianRupee size={13} /> পরিশোধ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ════════════════ EXPIRY TAB ════════════════ */}
      {tab === 'expiry' && (
        <div className="space-y-3">
          {expired.length > 0 && (
            <div>
              <div className="font-bold text-red-700 bengali text-sm mb-2">🚫 মেয়াদ উত্তীর্ণ ({expired.length}টি)</div>
              {expired.map(m => (
                <div key={m.id} className="bg-red-50 border border-red-200 rounded-xl p-3 mb-2 flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-red-800 text-sm">{m.name}</div>
                    <div className="text-xs text-red-500 bengali">মেয়াদ: {m.expiry} · স্টক: {m.stock} {m.unit}</div>
                  </div>
                  <button onClick={() => deleteMed(m.id)} className="text-red-400 hover:text-red-600"><Trash2 size={15} /></button>
                </div>
              ))}
            </div>
          )}
          {expiringSoon.length > 0 && (
            <div>
              <div className="font-bold text-orange-700 bengali text-sm mb-2">⚠️ শীঘ্রই মেয়াদ শেষ ({expiringSoon.length}টি)</div>
              {expiringSoon.map(m => {
                const status = expiryStatus(m.expiry)
                return (
                  <div key={m.id} className={`border rounded-xl p-3 mb-2 ${status === 'critical' ? 'bg-orange-50 border-orange-200' : 'bg-yellow-50 border-yellow-200'}`}>
                    <div className="font-semibold text-sm">{m.name}</div>
                    <div className="text-xs text-gray-500 bengali">মেয়াদ: {m.expiry} · স্টক: {m.stock} {m.unit} · সরবরাহকারী: {m.supplier || 'অজানা'}</div>
                  </div>
                )
              })}
            </div>
          )}
          {expired.length === 0 && expiringSoon.length === 0 && (
            <div className="text-center py-10 text-gray-400 bengali text-sm">✅ সব ওষুধের মেয়াদ ঠিক আছে!</div>
          )}
        </div>
      )}

      {/* ════════════════ REPORT TAB ════════════════ */}
      {tab === 'report' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'মোট ওষুধ', value: `${medicines.length}টি`, icon: '💊', color: 'text-blue-700', bg: 'bg-blue-50' },
              { label: 'মোট রোগী', value: `${patients.length}জন`, icon: '👤', color: 'text-purple-700', bg: 'bg-purple-50' },
              { label: 'মোট বাকি', value: fmtAmt(totalDue), icon: '💰', color: 'text-red-700', bg: 'bg-red-50' },
              { label: 'আজকের আয়', value: fmtAmt(todayRevenue), icon: '📈', color: 'text-green-700', bg: 'bg-green-50' },
              { label: 'কম স্টক', value: `${lowStock.length}টি`, icon: '📦', color: 'text-orange-700', bg: 'bg-orange-50' },
              { label: 'মেয়াদ সমস্যা', value: `${expired.length + expiringSoon.length}টি`, icon: '⚠️', color: 'text-amber-700', bg: 'bg-amber-50' },
            ].map(c => (
              <div key={c.label} className={`${c.bg} rounded-xl p-4 text-center`}>
                <div className="text-2xl mb-1">{c.icon}</div>
                <div className={`font-black text-xl ${c.color}`}>{c.value}</div>
                <div className="text-xs text-gray-500 bengali">{c.label}</div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button onClick={() => { let csv = 'রোগী,ওষুধ,পরিমাণ,মোট,পরিশোধ,বাকি,তারিখ\n'; recentSales.forEach(s => { csv += `"${s.customer_name}","${s.item_name}",${s.quantity},${s.total_amount},${s.paid_amount},${s.due_amount},"${s.purchase_date}"\n` }); downloadCSV(csv, `sales-${today()}.csv`) }}
              className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 bengali hover:bg-blue-700">
              <Download size={14} /> বিক্রির রিপোর্ট
            </button>
            <button onClick={exportHalkhataExcel}
              className="flex-1 bg-amber-500 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 bengali hover:bg-amber-600">
              <Download size={14} /> হালখাতা Excel
            </button>
          </div>
          <button onClick={() => { let csv = 'নাম,Generic,Category,স্টক,Unit,মেয়াদ,MRP,Cost\n'; medicines.forEach(m => { csv += `"${m.name}","${m.generic}","${m.category}",${m.stock},"${m.unit}","${m.expiry}",${m.mrp},${m.cost_price}\n` }); downloadCSV(csv, `stock-${today()}.csv`) }}
            className="w-full bg-emerald-600 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 bengali hover:bg-emerald-700">
            <Download size={14} /> স্টক রিপোর্ট Excel
          </button>
        </div>
      )}


      {/* ════════════════ PAYMENT MODAL ════════════════ */}
      {payingPurchase && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setPayingPurchase(null)}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="font-bold text-gray-800 bengali mb-1">💰 পেমেন্ট গ্রহণ</div>
            <div className="text-xs text-gray-500 bengali mb-3">{payingPurchase.item_name} · বাকি: {fmtAmt(payingPurchase.due_amount)}</div>
            <label className="text-xs text-gray-500 bengali">পরিশোধের পরিমাণ (₹)</label>
            <input type="number" value={payAmount} min={1} max={Number(payingPurchase.due_amount)}
              onChange={e => setPayAmount(+e.target.value)}
              className="w-full border-2 border-emerald-400 rounded-xl px-3 py-2.5 text-xl font-bold text-center mt-1 mb-4 focus:outline-none" />
            <div className="flex gap-2">
              <button onClick={savePayment} disabled={savingPayment || payAmount <= 0}
                className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl font-bold bengali disabled:opacity-60 flex items-center justify-center gap-1">
                {savingPayment ? <Loader2 className="animate-spin" size={15} /> : <Check size={15} />} নিশ্চিত করুন
              </button>
              <button onClick={() => setPayingPurchase(null)}
                className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl font-bold bengali">বাতিল</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
