'use client'

import { useState, useRef } from 'react'
import {
  AlertTriangle, Package, Plus, Printer, Trash2, Search,
  TrendingUp, DollarSign, Clock, FileText, Phone, User,
  ChevronDown, ChevronUp, Download, Check, X, RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'

// ─── Types ───────────────────────────────────────────────────────
interface Medicine {
  id: string
  name: string
  generic: string
  category: string
  stock: number
  unit: string
  expiry: string
  mrp: number
  costPrice: number
  minStock: number
  supplier: string
  rack: string
  prescriptionRequired: boolean
}

interface Sale {
  id: string
  date: string
  customerName: string
  customerPhone: string
  doctorName: string
  items: { name: string; qty: number; mrp: number; discount: number }[]
  total: number
  paid: number
  prescriptionNo: string
}

interface Supplier {
  id: string
  name: string
  phone: string
  medicines: string[]
  pendingAmount: number
  lastOrder: string
}

// ─── Helpers ─────────────────────────────────────────────────────
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

// ─── Initial data ─────────────────────────────────────────────────
const INIT_MEDICINES: Medicine[] = [
  { id: uid(), name: 'Paracetamol 500mg', generic: 'Paracetamol', category: 'Analgesic', stock: 84, unit: 'strip', expiry: '2027-03', mrp: 12, costPrice: 8, minStock: 50, supplier: 'ACI Healthcare', rack: 'A-1', prescriptionRequired: false },
  { id: uid(), name: 'Amoxicillin 250mg', generic: 'Amoxicillin', category: 'Antibiotic', stock: 23, unit: 'strip', expiry: '2025-12', mrp: 45, costPrice: 30, minStock: 30, supplier: 'Square Pharma', rack: 'B-3', prescriptionRequired: true },
  { id: uid(), name: 'Antacid Syrup 170ml', generic: 'Magnesium Hydroxide', category: 'GI', stock: 8, unit: 'bottle', expiry: '2025-10', mrp: 55, costPrice: 35, minStock: 15, supplier: 'Beximco Pharma', rack: 'C-2', prescriptionRequired: false },
  { id: uid(), name: 'Metformin 500mg', generic: 'Metformin HCl', category: 'Diabetes', stock: 60, unit: 'strip', expiry: '2026-06', mrp: 22, costPrice: 14, minStock: 40, supplier: 'ACI Healthcare', rack: 'D-1', prescriptionRequired: true },
  { id: uid(), name: 'Amlodipine 5mg', generic: 'Amlodipine', category: 'Cardiac', stock: 45, unit: 'strip', expiry: '2026-09', mrp: 35, costPrice: 22, minStock: 30, supplier: 'Square Pharma', rack: 'D-2', prescriptionRequired: true },
  { id: uid(), name: 'ORS Sachet', generic: 'ORS', category: 'Electrolyte', stock: 120, unit: 'pcs', expiry: '2026-12', mrp: 5, costPrice: 3, minStock: 80, supplier: 'Renata Ltd', rack: 'A-3', prescriptionRequired: false },
  { id: uid(), name: 'Cetirizine 10mg', generic: 'Cetirizine', category: 'Antihistamine', stock: 18, unit: 'strip', expiry: '2026-04', mrp: 18, costPrice: 11, minStock: 25, supplier: 'Beximco Pharma', rack: 'B-1', prescriptionRequired: false },
  { id: uid(), name: 'Omeprazole 20mg', generic: 'Omeprazole', category: 'GI', stock: 32, unit: 'strip', expiry: '2026-07', mrp: 28, costPrice: 18, minStock: 30, supplier: 'ACI Healthcare', rack: 'C-1', prescriptionRequired: false },
]

const INIT_SALES: Sale[] = [
  { id: uid(), date: today(), customerName: 'রামবাবু দাস', customerPhone: '9876543210', doctorName: 'ডা. সুমিত রায়', items: [{ name: 'Paracetamol 500mg', qty: 2, mrp: 12, discount: 0 }, { name: 'ORS Sachet', qty: 5, mrp: 5, discount: 0 }], total: 49, paid: 49, prescriptionNo: 'RX-001' },
  { id: uid(), date: today(), customerName: 'সুমিত্রা দেবী', customerPhone: '9123456780', doctorName: 'ডা. মীনা চক্রবর্তী', items: [{ name: 'Metformin 500mg', qty: 3, mrp: 22, discount: 5 }, { name: 'Amlodipine 5mg', qty: 2, mrp: 35, discount: 5 }], total: 133, paid: 100, prescriptionNo: 'RX-002' },
]

const INIT_SUPPLIERS: Supplier[] = [
  { id: uid(), name: 'ACI Healthcare', phone: '02-9887766', medicines: ['Paracetamol 500mg', 'Metformin 500mg', 'Omeprazole 20mg'], pendingAmount: 1200, lastOrder: '2025-04-01' },
  { id: uid(), name: 'Square Pharma', phone: '02-9111222', medicines: ['Amoxicillin 250mg', 'Amlodipine 5mg'], pendingAmount: 0, lastOrder: '2025-04-05' },
  { id: uid(), name: 'Beximco Pharma', phone: '02-8855443', medicines: ['Antacid Syrup 170ml', 'Cetirizine 10mg'], pendingAmount: 600, lastOrder: '2025-03-28' },
  { id: uid(), name: 'Renata Ltd', phone: '02-7766554', medicines: ['ORS Sachet'], pendingAmount: 0, lastOrder: '2025-04-03' },
]

// ─── Tab definitions ──────────────────────────────────────────────
const TABS = [
  { id: 'stock',    label: 'স্টক ও ইনভেন্টরি', icon: '💊' },
  { id: 'sales',   label: 'বিক্রি ও বিল',     icon: '🧾' },
  { id: 'expiry',  label: 'মেয়াদ সতর্কতা',   icon: '⚠️' },
  { id: 'supplier',label: 'সরবরাহকারী',        icon: '🚚' },
  { id: 'report',  label: 'রিপোর্ট',            icon: '📊' },
]

const CATEGORIES = ['সব', 'Analgesic', 'Antibiotic', 'Cardiac', 'Diabetes', 'GI', 'Antihistamine', 'Electrolyte', 'Other']
const UNITS = ['strip', 'tablet', 'capsule', 'bottle', 'tube', 'injection', 'pcs', 'sachet', 'vial']

// ══════════════════════════════════════════════════════════════════
export default function PharmacyAssistantUI() {
  const [tab, setTab] = useState('stock')
  const [medicines, setMedicines] = useState<Medicine[]>(INIT_MEDICINES)
  const [sales, setSales] = useState<Sale[]>(INIT_SALES)
  const [suppliers, setSuppliers] = useState<Supplier[]>(INIT_SUPPLIERS)

  // Stock tab state
  const [searchQ, setSearchQ] = useState('')
  const [catFilter, setCatFilter] = useState('সব')
  const [showAddMed, setShowAddMed] = useState(false)
  const [newMed, setNewMed] = useState<Partial<Medicine>>({ unit: 'strip', category: 'Analgesic', prescriptionRequired: false })

  // Sales tab state
  const [showNewSale, setShowNewSale] = useState(false)
  const [saleForm, setSaleForm] = useState({ customerName: '', customerPhone: '', doctorName: '', prescriptionNo: '' })
  const [saleItems, setSaleItems] = useState<{ name: string; qty: number; mrp: number; discount: number }[]>([{ name: '', qty: 1, mrp: 0, discount: 0 }])

  // ── Derived stats ────────────────────────────────────────────
  const todaySales = sales.filter(s => s.date === today())
  const todayRevenue = todaySales.reduce((s, r) => s + r.paid, 0)
  const todayDue = todaySales.reduce((s, r) => s + (r.total - r.paid), 0)
  const lowStock = medicines.filter(m => m.stock < m.minStock)
  const expired = medicines.filter(m => expiryStatus(m.expiry) === 'expired')
  const expiringSoon = medicines.filter(m => ['critical', 'warning'].includes(expiryStatus(m.expiry)))
  const totalPendingSupplier = suppliers.reduce((s, r) => s + r.pendingAmount, 0)
  const totalStockValue = medicines.reduce((s, m) => s + m.stock * m.costPrice, 0)

  // ── Stock operations ─────────────────────────────────────────
  const addMedicine = () => {
    if (!newMed.name || !newMed.stock) { toast.error('নাম ও স্টক দিন'); return }
    setMedicines([...medicines, { id: uid(), name: newMed.name!, generic: newMed.generic || '', category: newMed.category || 'Other', stock: +newMed.stock!, unit: newMed.unit || 'strip', expiry: newMed.expiry || monthYear(), mrp: +(newMed.mrp || 0), costPrice: +(newMed.costPrice || 0), minStock: +(newMed.minStock || 20), supplier: newMed.supplier || '', rack: newMed.rack || '', prescriptionRequired: !!newMed.prescriptionRequired }])
    setNewMed({ unit: 'strip', category: 'Analgesic', prescriptionRequired: false })
    setShowAddMed(false)
    toast.success('ওষুধ যোগ হয়েছে!')
  }

  const deleteMed = (id: string) => { setMedicines(medicines.filter(m => m.id !== id)); toast.success('মুছে ফেলা হয়েছে') }

  const filteredMeds = medicines.filter(m => {
    const matchQ = !searchQ || m.name.toLowerCase().includes(searchQ.toLowerCase()) || m.generic.toLowerCase().includes(searchQ.toLowerCase())
    const matchCat = catFilter === 'সব' || m.category === catFilter
    return matchQ && matchCat
  })

  // ── Sale operations ───────────────────────────────────────────
  const addSaleItem = () => setSaleItems([...saleItems, { name: '', qty: 1, mrp: 0, discount: 0 }])
  const updateSaleItem = (i: number, field: string, val: any) => {
    const items = [...saleItems]
    if (field === 'name') {
      const med = medicines.find(m => m.name === val)
      items[i] = { ...items[i], name: val, mrp: med ? med.mrp : items[i].mrp }
    } else {
      items[i] = { ...items[i], [field]: val }
    }
    setSaleItems(items)
  }

  const saleTotal = saleItems.reduce((s, i) => s + (i.qty * i.mrp * (1 - i.discount / 100)), 0)

  const saveSale = (paid: number) => {
    if (!saleForm.customerName || saleItems.every(i => !i.name)) { toast.error('গ্রাহকের নাম ও ওষুধ দিন'); return }
    const sale: Sale = { id: uid(), date: today(), ...saleForm, items: saleItems.filter(i => i.name), total: +saleTotal.toFixed(2), paid, prescriptionNo: saleForm.prescriptionNo || `RX-${uid()}` }
    setSales([sale, ...sales])
    // Reduce stock
    const updMeds = [...medicines]
    sale.items.forEach(si => {
      const idx = updMeds.findIndex(m => m.name === si.name)
      if (idx >= 0) updMeds[idx] = { ...updMeds[idx], stock: Math.max(0, updMeds[idx].stock - si.qty) }
    })
    setMedicines(updMeds)
    setSaleForm({ customerName: '', customerPhone: '', doctorName: '', prescriptionNo: '' })
    setSaleItems([{ name: '', qty: 1, mrp: 0, discount: 0 }])
    setShowNewSale(false)
    toast.success('বিক্রি সেভ হয়েছে!')
  }

  const printBill = (sale: Sale) => {
    const w = window.open('', '_blank')!
    w.document.write(`<!DOCTYPE html><html><head><title>Medicine Bill</title><meta charset="utf-8">
<style>
  body{font-family:'Segoe UI',sans-serif;padding:24px;max-width:420px;margin:auto;color:#111}
  h2{text-align:center;color:#4f46e5;margin:0 0 4px}
  .sub{text-align:center;color:#666;font-size:12px;margin-bottom:16px}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th{background:#4f46e5;color:white;padding:7px 8px;text-align:left}
  td{padding:6px 8px;border-bottom:1px solid #eee}
  .total{font-weight:700;font-size:15px}.paid{color:#16a34a}.due{color:#dc2626}
  .footer{text-align:center;margin-top:18px;font-size:11px;color:#888}
  .rx{background:#fef3c7;border:1px solid #fbbf24;border-radius:6px;padding:8px;font-size:12px;margin-bottom:12px}
</style></head><body>
<h2>💊 ওষুধের বিল</h2>
<div class="sub">তারিখ: ${new Date().toLocaleDateString('bn-IN')} | RX: ${sale.prescriptionNo}</div>
${sale.doctorName ? `<div class="rx">ডাক্তার: ${sale.doctorName}</div>` : ''}
<p><strong>রোগী:</strong> ${sale.customerName} ${sale.customerPhone ? `| 📞 ${sale.customerPhone}` : ''}</p>
<table>
  <tr><th>ওষুধ</th><th>পরিমাণ</th><th>দাম</th><th>মোট</th></tr>
  ${sale.items.map(i => `<tr><td>${i.name}</td><td>${i.qty}</td><td>₹${i.mrp}${i.discount > 0 ? ` <small>(-${i.discount}%)</small>` : ''}</td><td>₹${(i.qty * i.mrp * (1 - i.discount / 100)).toFixed(0)}</td></tr>`).join('')}
  <tr><td colspan="3" class="total">মোট</td><td class="total">₹${sale.total}</td></tr>
  <tr><td colspan="3" class="paid">পরিশোধিত</td><td class="paid">₹${sale.paid}</td></tr>
  ${sale.total - sale.paid > 0 ? `<tr><td colspan="3" class="due">বাকি</td><td class="due">₹${(sale.total - sale.paid).toFixed(0)}</td></tr>` : ''}
</table>
<div class="footer">সুস্থ থাকুন! ধন্যবাদ 🙏</div>
</body></html>`)
    w.print()
  }

  const downloadExcel = () => {
    let csv = 'ওষুধের নাম,Generic,Category,স্টক,Unit,মেয়াদ,MRP,Cost,Min Stock,Supplier,Rack\n'
    medicines.forEach(m => {
      csv += `"${m.name}","${m.generic}","${m.category}",${m.stock},"${m.unit}","${m.expiry}",${m.mrp},${m.costPrice},${m.minStock},"${m.supplier}","${m.rack}"\n`
    })
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `pharmacy-stock-${today()}.csv`; a.click()
    toast.success('Excel ডাউনলোড হয়েছে!')
  }

  // ══════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════
  return (
    <div className="space-y-4">

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: 'আজকের বিক্রি', value: `₹${todayRevenue.toLocaleString()}`, icon: '💰', color: 'bg-green-50 border-green-200', text: 'text-green-700' },
          { label: 'বাকি আছে', value: `₹${todayDue.toLocaleString()}`, icon: '⏳', color: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700' },
          { label: 'কম স্টক', value: `${lowStock.length}টি`, icon: '📦', color: 'bg-orange-50 border-orange-200', text: 'text-orange-700' },
          { label: 'মেয়াদ সমস্যা', value: `${expired.length + expiringSoon.length}টি`, icon: '⚠️', color: 'bg-red-50 border-red-200', text: 'text-red-700' },
        ].map(c => (
          <div key={c.label} className={`${c.color} border rounded-xl p-3`}>
            <div className="text-lg mb-0.5">{c.icon}</div>
            <div className={`font-extrabold text-lg ${c.text}`}>{c.value}</div>
            <div className="text-xs text-gray-500 bengali">{c.label}</div>
          </div>
        ))}
      </div>

      {/* ── Critical alerts ── */}
      {(lowStock.length > 0 || expired.length > 0) && (
        <div className="space-y-2">
          {expired.length > 0 && (
            <div className="bg-red-50 border border-red-300 rounded-xl p-3">
              <div className="font-bold text-red-800 bengali text-sm flex items-center gap-1.5 mb-1.5">🚫 মেয়াদ শেষ — এখনই সরান</div>
              <div className="flex flex-wrap gap-2">{expired.map(m => <span key={m.id} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-lg bengali">💊 {m.name}</span>)}</div>
            </div>
          )}
          {lowStock.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
              <div className="font-bold text-orange-800 bengali text-sm flex items-center gap-1.5 mb-1.5">📦 কম স্টক — অর্ডার করুন</div>
              <div className="flex flex-wrap gap-2">{lowStock.map(m => <span key={m.id} className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-lg bengali">💊 {m.name}: {m.stock} {m.unit}</span>)}</div>
            </div>
          )}
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="bg-white border rounded-2xl overflow-hidden">
        <div className="flex overflow-x-auto border-b bg-gray-50">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold transition-all bengali whitespace-nowrap ${tab === t.id ? 'bg-white text-indigo-700 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>

        <div className="p-4">

          {/* ══ TAB: STOCK ══════════════════════════════════════════ */}
          {tab === 'stock' && (
            <div className="space-y-3">
              <div className="flex gap-2 flex-wrap">
                <div className="flex-1 relative min-w-[160px]">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="ওষুধ খুঁজুন..." className="w-full pl-8 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-indigo-400 bengali" />
                </div>
                <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="border rounded-lg px-2 py-2 text-sm focus:outline-none">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <button onClick={downloadExcel} className="flex items-center gap-1.5 text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-2 rounded-lg font-bold hover:bg-green-100 bengali">
                  <Download size={12} />Excel
                </button>
                <button onClick={() => setShowAddMed(!showAddMed)} className="flex items-center gap-1.5 text-xs bg-indigo-600 text-white px-3 py-2 rounded-lg font-bold hover:bg-indigo-700 bengali">
                  <Plus size={12} />নতুন ওষুধ
                </button>
              </div>

              {/* Add medicine form */}
              {showAddMed && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-2">
                  <div className="font-bold text-indigo-800 bengali text-sm mb-2">➕ নতুন ওষুধ যোগ করুন</div>
                  <div className="grid grid-cols-2 gap-2">
                    <input placeholder="ওষুধের নাম *" className="border rounded-lg px-3 py-2 text-sm col-span-2 focus:outline-none focus:border-indigo-400" value={newMed.name || ''} onChange={e => setNewMed({ ...newMed, name: e.target.value })} />
                    <input placeholder="Generic নাম" className="border rounded-lg px-3 py-2 text-sm focus:outline-none" value={newMed.generic || ''} onChange={e => setNewMed({ ...newMed, generic: e.target.value })} />
                    <select className="border rounded-lg px-3 py-2 text-sm focus:outline-none" value={newMed.category} onChange={e => setNewMed({ ...newMed, category: e.target.value })}>
                      {CATEGORIES.slice(1).map(c => <option key={c}>{c}</option>)}
                    </select>
                    <input placeholder="স্টক পরিমাণ *" type="number" className="border rounded-lg px-3 py-2 text-sm focus:outline-none" value={newMed.stock || ''} onChange={e => setNewMed({ ...newMed, stock: +e.target.value })} />
                    <select className="border rounded-lg px-3 py-2 text-sm focus:outline-none" value={newMed.unit} onChange={e => setNewMed({ ...newMed, unit: e.target.value })}>
                      {UNITS.map(u => <option key={u}>{u}</option>)}
                    </select>
                    <input placeholder="মেয়াদ (YYYY-MM)" className="border rounded-lg px-3 py-2 text-sm focus:outline-none" value={newMed.expiry || ''} onChange={e => setNewMed({ ...newMed, expiry: e.target.value })} />
                    <input placeholder="Min স্টক" type="number" className="border rounded-lg px-3 py-2 text-sm focus:outline-none" value={newMed.minStock || ''} onChange={e => setNewMed({ ...newMed, minStock: +e.target.value })} />
                    <input placeholder="MRP (₹)" type="number" className="border rounded-lg px-3 py-2 text-sm focus:outline-none" value={newMed.mrp || ''} onChange={e => setNewMed({ ...newMed, mrp: +e.target.value })} />
                    <input placeholder="Cost Price (₹)" type="number" className="border rounded-lg px-3 py-2 text-sm focus:outline-none" value={newMed.costPrice || ''} onChange={e => setNewMed({ ...newMed, costPrice: +e.target.value })} />
                    <input placeholder="সরবরাহকারী" className="border rounded-lg px-3 py-2 text-sm focus:outline-none" value={newMed.supplier || ''} onChange={e => setNewMed({ ...newMed, supplier: e.target.value })} />
                    <input placeholder="Rack নম্বর (যেমন A-1)" className="border rounded-lg px-3 py-2 text-sm focus:outline-none" value={newMed.rack || ''} onChange={e => setNewMed({ ...newMed, rack: e.target.value })} />
                    <label className="flex items-center gap-2 text-sm col-span-2 cursor-pointer">
                      <input type="checkbox" checked={!!newMed.prescriptionRequired} onChange={e => setNewMed({ ...newMed, prescriptionRequired: e.target.checked })} />
                      <span className="bengali">Prescription আবশ্যক (Rx)?</span>
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={addMedicine} className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm font-bold bengali hover:bg-indigo-700">যোগ করুন</button>
                    <button onClick={() => setShowAddMed(false)} className="px-4 border rounded-lg py-2 text-sm text-gray-500 hover:bg-gray-50">বাতিল</button>
                  </div>
                </div>
              )}

              {/* Medicine table */}
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full text-sm min-w-[600px]">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-500">
                      <th className="text-left p-3 font-semibold">ওষুধ</th>
                      <th className="text-center p-3 font-semibold bengali">স্টক</th>
                      <th className="text-center p-3 font-semibold bengali">মেয়াদ</th>
                      <th className="text-right p-3 font-semibold">MRP</th>
                      <th className="text-center p-3 font-semibold">Rack</th>
                      <th className="text-center p-3 font-semibold">Rx</th>
                      <th className="p-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMeds.map(m => {
                      const es = expiryStatus(m.expiry)
                      const ls = m.stock < m.minStock
                      return (
                        <tr key={m.id} className={`border-t hover:bg-gray-50 ${ls ? 'bg-orange-50/40' : ''}`}>
                          <td className="p-3">
                            <div className="font-semibold text-gray-800 text-xs leading-snug">{m.name}</div>
                            <div className="text-gray-400 text-[10px]">{m.generic} · {m.category}</div>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`font-bold text-xs ${ls ? 'text-red-600' : 'text-green-700'}`}>{m.stock}</span>
                            <div className="text-gray-400 text-[10px]">{m.unit}</div>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${es === 'expired' ? 'bg-red-100 text-red-700' : es === 'critical' ? 'bg-orange-100 text-orange-700' : es === 'warning' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                              {m.expiry}
                            </span>
                          </td>
                          <td className="p-3 text-right font-bold text-gray-700">₹{m.mrp}</td>
                          <td className="p-3 text-center text-xs text-gray-500">{m.rack}</td>
                          <td className="p-3 text-center">{m.prescriptionRequired ? <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">Rx</span> : <span className="text-[10px] text-gray-300">—</span>}</td>
                          <td className="p-3 text-right">
                            <button onClick={() => deleteMed(m.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {filteredMeds.length === 0 && <div className="text-center py-8 text-gray-400 bengali text-sm">কোনো ওষুধ পাওয়া যায়নি</div>}
              </div>
              <div className="text-xs text-gray-400 bengali text-right">মোট স্টক মূল্য: ₹{totalStockValue.toLocaleString()}</div>
            </div>
          )}

          {/* ══ TAB: SALES ══════════════════════════════════════════ */}
          {tab === 'sales' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="text-sm font-bold text-gray-700 bengali">আজকের বিক্রি: {todaySales.length}টি · ₹{todayRevenue}</div>
                <button onClick={() => setShowNewSale(!showNewSale)} className="flex items-center gap-1.5 text-xs bg-indigo-600 text-white px-3 py-2 rounded-lg font-bold hover:bg-indigo-700 bengali">
                  <Plus size={12} />নতুন বিক্রি
                </button>
              </div>

              {/* New sale form */}
              {showNewSale && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-3">
                  <div className="font-bold text-indigo-800 bengali text-sm">🧾 নতুন বিক্রির এন্ট্রি</div>
                  <div className="grid grid-cols-2 gap-2">
                    <input placeholder="রোগীর নাম *" className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 bengali col-span-2" value={saleForm.customerName} onChange={e => setSaleForm({ ...saleForm, customerName: e.target.value })} />
                    <input placeholder="ফোন নম্বর" className="border rounded-lg px-3 py-2 text-sm focus:outline-none" value={saleForm.customerPhone} onChange={e => setSaleForm({ ...saleForm, customerPhone: e.target.value })} />
                    <input placeholder="ডাক্তারের নাম" className="border rounded-lg px-3 py-2 text-sm focus:outline-none bengali" value={saleForm.doctorName} onChange={e => setSaleForm({ ...saleForm, doctorName: e.target.value })} />
                    <input placeholder="Prescription নম্বর (RX)" className="border rounded-lg px-3 py-2 text-sm focus:outline-none col-span-2" value={saleForm.prescriptionNo} onChange={e => setSaleForm({ ...saleForm, prescriptionNo: e.target.value })} />
                  </div>

                  {/* Sale items */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-12 gap-1 text-[10px] font-bold text-gray-500 px-1 bengali">
                      <span className="col-span-5">ওষুধ</span><span className="col-span-2 text-center">পরিমাণ</span><span className="col-span-2 text-center">MRP ₹</span><span className="col-span-2 text-center">ছাড়%</span><span className="col-span-1"></span>
                    </div>
                    {saleItems.map((item, i) => (
                      <div key={i} className="grid grid-cols-12 gap-1 items-center">
                        <select className="border rounded px-2 py-1.5 text-xs col-span-5 focus:outline-none" value={item.name} onChange={e => updateSaleItem(i, 'name', e.target.value)}>
                          <option value="">ওষুধ বেছে নিন</option>
                          {medicines.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                        </select>
                        <input type="number" min="1" className="border rounded px-2 py-1.5 text-xs col-span-2 text-center focus:outline-none" value={item.qty} onChange={e => updateSaleItem(i, 'qty', +e.target.value)} />
                        <input type="number" className="border rounded px-2 py-1.5 text-xs col-span-2 text-center focus:outline-none" value={item.mrp} onChange={e => updateSaleItem(i, 'mrp', +e.target.value)} />
                        <input type="number" min="0" max="100" className="border rounded px-2 py-1.5 text-xs col-span-2 text-center focus:outline-none" value={item.discount} onChange={e => updateSaleItem(i, 'discount', +e.target.value)} />
                        <button onClick={() => setSaleItems(saleItems.filter((_, j) => j !== i))} className="col-span-1 text-gray-300 hover:text-red-400 flex justify-center"><Trash2 size={12} /></button>
                      </div>
                    ))}
                    <button onClick={addSaleItem} className="w-full border border-dashed border-indigo-300 text-indigo-600 rounded-lg py-1.5 text-xs font-bold bengali hover:bg-indigo-50">+ ওষুধ যোগ করুন</button>
                  </div>

                  <div className="flex items-center justify-between bg-white rounded-lg p-3 border">
                    <span className="font-bold bengali text-sm">মোট: ₹{saleTotal.toFixed(0)}</span>
                    <div className="flex gap-2">
                      <button onClick={() => saveSale(saleTotal)} className="bg-green-600 text-white rounded-lg px-3 py-1.5 text-xs font-bold bengali hover:bg-green-700">সম্পূর্ণ পেমেন্ট</button>
                      <button onClick={() => { const p = prompt(`কত টাকা পেলেন? (মোট: ₹${saleTotal.toFixed(0)})`); if (p) saveSale(+p) }} className="bg-yellow-500 text-white rounded-lg px-3 py-1.5 text-xs font-bold bengali hover:bg-yellow-600">আংশিক পেমেন্ট</button>
                      <button onClick={() => setShowNewSale(false)} className="border rounded-lg px-3 py-1.5 text-xs text-gray-500">বাতিল</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Sales list */}
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {sales.length === 0 && <div className="text-center py-8 text-gray-400 bengali text-sm">কোনো বিক্রি নেই</div>}
                {sales.map(sale => (
                  <div key={sale.id} className="bg-white border rounded-xl p-3 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-gray-800 bengali text-sm">{sale.customerName}</div>
                        <div className="text-xs text-gray-400 bengali">{sale.date} {sale.doctorName && `· ডা. ${sale.doctorName}`}</div>
                        <div className="text-xs text-gray-500 mt-1 bengali">{sale.items.map(i => `${i.name} ×${i.qty}`).join(', ')}</div>
                      </div>
                      <div className="text-right flex flex-col gap-1 items-end">
                        <span className="font-extrabold text-indigo-700">₹{sale.total}</span>
                        {sale.total - sale.paid > 0
                          ? <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold bengali">বাকি ₹{(sale.total - sale.paid).toFixed(0)}</span>
                          : <span className="text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-bold bengali">পরিশোধিত</span>
                        }
                        <button onClick={() => printBill(sale)} className="text-[10px] text-indigo-600 hover:underline flex items-center gap-0.5 bengali mt-0.5">
                          <Printer size={10} />বিল প্রিন্ট
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ TAB: EXPIRY ══════════════════════════════════════════ */}
          {tab === 'expiry' && (
            <div className="space-y-3">
              <div className="text-sm font-bold text-gray-700 bengali mb-2">মেয়াদের অবস্থা</div>
              {(['expired', 'critical', 'warning', 'ok'] as const).map(status => {
                const meds = medicines.filter(m => expiryStatus(m.expiry) === status)
                if (meds.length === 0) return null
                const config = {
                  expired: { label: '🚫 মেয়াদ শেষ', bg: 'bg-red-50 border-red-200', text: 'text-red-800', badge: 'bg-red-100 text-red-700' },
                  critical: { label: '🔴 ১ মাসের মধ্যে শেষ', bg: 'bg-orange-50 border-orange-200', text: 'text-orange-800', badge: 'bg-orange-100 text-orange-700' },
                  warning: { label: '🟡 ৩ মাসের মধ্যে শেষ', bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-800', badge: 'bg-yellow-100 text-yellow-700' },
                  ok: { label: '✅ ভালো অবস্থায়', bg: 'bg-green-50 border-green-200', text: 'text-green-800', badge: 'bg-green-100 text-green-700' },
                }[status]
                return (
                  <div key={status} className={`${config.bg} border rounded-xl p-3`}>
                    <div className={`font-bold text-sm bengali mb-2 ${config.text}`}>{config.label} ({meds.length}টি)</div>
                    <div className="space-y-1.5">
                      {meds.map(m => (
                        <div key={m.id} className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-semibold text-gray-800">{m.name}</span>
                            <span className="text-xs text-gray-400 ml-2 bengali">{m.supplier}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${config.badge}`}>{m.expiry}</span>
                            <span className="text-xs text-gray-500 bengali">{m.stock} {m.unit}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ══ TAB: SUPPLIER ══════════════════════════════════════════ */}
          {tab === 'supplier' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="text-sm font-bold text-gray-700 bengali">মোট বকেয়া: ₹{totalPendingSupplier.toLocaleString()}</div>
              </div>
              {suppliers.map(s => (
                <div key={s.id} className="bg-white border rounded-xl p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-bold text-gray-800 bengali">{s.name}</div>
                      <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><Phone size={10} />{s.phone}</div>
                    </div>
                    <div className="text-right">
                      {s.pendingAmount > 0
                        ? <span className="text-sm font-extrabold text-red-600">₹{s.pendingAmount} বকেয়া</span>
                        : <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold bengali">✓ পরিশোধিত</span>
                      }
                      <div className="text-xs text-gray-400 bengali mt-1">শেষ অর্ডার: {s.lastOrder}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {s.medicines.map(m => <span key={m} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{m}</span>)}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => { const amt = prompt(`${s.name} কে কত টাকা পেমেন্ট করলেন?`); if (amt) { setSuppliers(suppliers.map(sup => sup.id === s.id ? { ...sup, pendingAmount: Math.max(0, sup.pendingAmount - +amt) } : sup)); toast.success('পেমেন্ট রেকর্ড হয়েছে!') } }} className="flex-1 text-xs bg-green-50 text-green-700 border border-green-200 rounded-lg py-1.5 font-bold bengali hover:bg-green-100">
                      💳 পেমেন্ট করুন
                    </button>
                    <button onClick={() => toast.success(`${s.name} কে অর্ডার পাঠানো হয়েছে!`)} className="flex-1 text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg py-1.5 font-bold bengali hover:bg-indigo-100">
                      📦 অর্ডার করুন
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ══ TAB: REPORT ══════════════════════════════════════════ */}
          {tab === 'report' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'মোট ওষুধ', value: `${medicines.length}টি`, icon: '💊', sub: `${lowStock.length}টি কম স্টক` },
                  { label: 'স্টক মূল্য', value: `₹${totalStockValue.toLocaleString()}`, icon: '💰', sub: 'Cost price অনুযায়ী' },
                  { label: 'আজকের বিক্রি', value: `₹${todayRevenue}`, icon: '📈', sub: `${todaySales.length}টি বিল` },
                  { label: 'মেয়াদ সমস্যা', value: `${expired.length + expiringSoon.length}টি`, icon: '⚠️', sub: `${expired.length}টি মেয়াদ শেষ` },
                ].map(r => (
                  <div key={r.label} className="bg-gray-50 border rounded-xl p-3">
                    <div className="text-xl mb-1">{r.icon}</div>
                    <div className="font-extrabold text-gray-900">{r.value}</div>
                    <div className="text-xs font-semibold text-gray-700 bengali">{r.label}</div>
                    <div className="text-[10px] text-gray-400 bengali mt-0.5">{r.sub}</div>
                  </div>
                ))}
              </div>

              {/* Category breakdown */}
              <div className="bg-white border rounded-xl p-4">
                <div className="font-bold text-gray-800 bengali text-sm mb-3">📂 Category অনুযায়ী স্টক</div>
                <div className="space-y-2">
                  {CATEGORIES.slice(1).map(cat => {
                    const catMeds = medicines.filter(m => m.category === cat)
                    if (catMeds.length === 0) return null
                    const total = catMeds.reduce((s, m) => s + m.stock * m.costPrice, 0)
                    return (
                      <div key={cat} className="flex items-center justify-between">
                        <span className="text-xs text-gray-700">{cat}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 bengali">{catMeds.length}টি ওষুধ</span>
                          <span className="text-xs font-bold text-indigo-700">₹{total.toLocaleString()}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Low stock reorder list */}
              {lowStock.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <div className="font-bold text-orange-800 bengali text-sm mb-3">📦 Reorder তালিকা</div>
                  <div className="space-y-2">
                    {lowStock.map(m => (
                      <div key={m.id} className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-gray-800">{m.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-orange-600 font-bold bengali">আছে: {m.stock} {m.unit}</span>
                          <span className="text-gray-500 bengali">দরকার: {m.minStock} {m.unit}</span>
                          <span className="text-gray-400">{m.supplier}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => { let text = 'Reorder List:\n'; lowStock.forEach(m => { text += `${m.name}: ${m.minStock - m.stock} ${m.unit}\n` }); navigator.clipboard?.writeText(text); toast.success('Reorder list copied!') }} className="mt-3 w-full text-xs bg-orange-100 text-orange-700 border border-orange-200 rounded-lg py-2 font-bold bengali hover:bg-orange-200">
                    📋 Reorder List Copy করুন
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
