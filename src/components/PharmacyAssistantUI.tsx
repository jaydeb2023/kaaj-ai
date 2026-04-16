'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  AlertTriangle, Package, Plus, Printer, Trash2, Search,
  TrendingUp, DollarSign, Clock, FileText, Phone, User,
  Download, Check, X, RefreshCw, Mic, MicOff, Send,
  Camera, ChevronDown, ChevronUp, Globe, ShoppingBag,
  Stethoscope, Truck, BarChart2, Bot, BookOpen
} from 'lucide-react'
import toast from 'react-hot-toast'

// ─── Types ────────────────────────────────────────────────────────
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

interface SaleItem {
  name: string
  qty: number
  mrp: number
  discount: number
}

interface Sale {
  id: string
  date: string
  customerName: string
  customerPhone: string
  doctorName: string
  items: SaleItem[]
  total: number
  paid: number
  prescriptionNo: string
}

interface Patient {
  id: string
  name: string
  age: number
  gender: string
  phone: string
  address: string
  doctorName: string
  bloodGroup: string
  notes: string
}

interface Prescription {
  id: string
  date: string
  patientName: string
  patientPhone: string
  doctorName: string
  hospital: string
  diagnosis: string
  medicines: { name: string; dosage: string; duration: string; qty: number }[]
}

interface Supplier {
  id: string
  name: string
  phone: string
  medicines: string[]
  pendingAmount: number
  lastOrder: string
}

interface KhataImport {
  id: string
  date: string
  recordCount: number
  status: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
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

// ─── Initial Data ─────────────────────────────────────────────────
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

const INIT_PATIENTS: Patient[] = [
  { id: uid(), name: 'রামবাবু দাস', age: 52, gender: 'পুরুষ', phone: '9876543210', address: 'কলকাতা', doctorName: 'ডা. সুমিত রায়', bloodGroup: 'B+', notes: 'ডায়াবেটিস' },
  { id: uid(), name: 'সুমিত্রা দেবী', age: 45, gender: 'মহিলা', phone: '9123456780', address: 'হাওড়া', doctorName: 'ডা. মীনা চক্রবর্তী', bloodGroup: 'O+', notes: 'উচ্চ রক্তচাপ' },
]

const INIT_SUPPLIERS: Supplier[] = [
  { id: uid(), name: 'ACI Healthcare', phone: '02-9887766', medicines: ['Paracetamol 500mg', 'Metformin 500mg', 'Omeprazole 20mg'], pendingAmount: 1200, lastOrder: '2025-04-01' },
  { id: uid(), name: 'Square Pharma', phone: '02-9111222', medicines: ['Amoxicillin 250mg', 'Amlodipine 5mg'], pendingAmount: 0, lastOrder: '2025-04-05' },
  { id: uid(), name: 'Beximco Pharma', phone: '02-8855443', medicines: ['Antacid Syrup 170ml', 'Cetirizine 10mg'], pendingAmount: 600, lastOrder: '2025-03-28' },
  { id: uid(), name: 'Renata Ltd', phone: '02-7766554', medicines: ['ORS Sachet'], pendingAmount: 0, lastOrder: '2025-04-03' },
]

const CATEGORIES = ['সব', 'Analgesic', 'Antibiotic', 'Cardiac', 'Diabetes', 'GI', 'Antihistamine', 'Electrolyte', 'Other']
const UNITS = ['strip', 'tablet', 'capsule', 'bottle', 'tube', 'injection', 'pcs', 'sachet', 'vial']
const QUICK_QUESTIONS = [
  'আজকের স্টক রিপোর্ট দিন',
  'কোন ওষুধের মেয়াদ শেষ হচ্ছে?',
  'সবচেয়ে বেশি বিক্রি কোন ওষুধ?',
  'বাকি তালিকা দেখান',
  'কম স্টক কোথায় আছে?',
  'আজকের মোট লাভ কত?',
]

// ─── Voice Hook ────────────────────────────────────────────────────
declare global { interface Window { SpeechRecognition: any; webkitSpeechRecognition: any } }

function useVoice(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(true)
  const [lang, setLang] = useState<'bn-IN' | 'en-IN'>('bn-IN')
  const ref = useRef<any>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && !window.SpeechRecognition && !window.webkitSpeechRecognition) {
      setSupported(false)
    }
  }, [])

  const start = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { toast.error('Browser voice support নেই'); return }
    if (ref.current) ref.current.stop()
    const r = new SR()
    ref.current = r
    r.lang = lang; r.interimResults = true; r.continuous = false
    r.onstart = () => setListening(true)
    r.onresult = (e: any) => {
      let t = ''
      for (let i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript
      onResult(t)
    }
    r.onerror = () => setListening(false)
    r.onend = () => setListening(false)
    r.start()
  }, [lang, onResult])

  const stop = useCallback(() => { ref.current?.stop(); setListening(false) }, [])
  useEffect(() => () => ref.current?.abort(), [])
  return { listening, supported, lang, setLang, start, stop }
}

// ══════════════════════════════════════════════════════════════════
export default function PharmacyAssistantUI() {
  const [tab, setTab] = useState('stock')

  // ── Core data state ──────────────────────────────────────────
  const [medicines, setMedicines] = useState<Medicine[]>(INIT_MEDICINES)
  const [sales, setSales] = useState<Sale[]>(INIT_SALES)
  const [patients, setPatients] = useState<Patient[]>(INIT_PATIENTS)
  const [suppliers, setSuppliers] = useState<Supplier[]>(INIT_SUPPLIERS)
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [khataImports, setKhataImports] = useState<KhataImport[]>([])

  // ── Stock tab ────────────────────────────────────────────────
  const [searchQ, setSearchQ] = useState('')
  const [catFilter, setCatFilter] = useState('সব')
  const [showAddMed, setShowAddMed] = useState(false)
  const [newMed, setNewMed] = useState<Partial<Medicine>>({ unit: 'strip', category: 'Analgesic', prescriptionRequired: false })
  const [editStockId, setEditStockId] = useState<string | null>(null)
  const [editStockVal, setEditStockVal] = useState('')

  // ── Billing tab ──────────────────────────────────────────────
  const [showNewSale, setShowNewSale] = useState(false)
  const [saleForm, setSaleForm] = useState({ customerName: '', customerPhone: '', doctorName: '', prescriptionNo: '' })
  const [saleItems, setSaleItems] = useState<SaleItem[]>([{ name: '', qty: 1, mrp: 0, discount: 0 }])
  const [saleDiscount, setSaleDiscount] = useState(0)
  const [currentBill, setCurrentBill] = useState<Sale | null>(null)

  // ── Patient tab ──────────────────────────────────────────────
  const [showAddPatient, setShowAddPatient] = useState(false)
  const [patientSearch, setPatientSearch] = useState('')
  const [newPatient, setNewPatient] = useState<Partial<Patient>>({ gender: 'পুরুষ', bloodGroup: 'জানা নেই' })

  // ── Prescription tab ─────────────────────────────────────────
  const [rxForm, setRxForm] = useState({ patientName: '', patientPhone: '', doctorName: '', hospital: '', diagnosis: '' })
  const [rxMeds, setRxMeds] = useState<{ name: string; dosage: string; duration: string; qty: number }[]>([{ name: '', dosage: '', duration: '', qty: 1 }])

  // ── Khata tab ────────────────────────────────────────────────
  const [khataImage, setKhataImage] = useState<string | null>(null)
  const [khataExtracted, setKhataExtracted] = useState('')
  const [khataRecords, setKhataRecords] = useState<any[]>([])
  const [khataLoading, setKhataLoading] = useState(false)
  const khataRef = useRef<HTMLInputElement>(null)

  // ── Supplier tab ─────────────────────────────────────────────
  const [showAddSupplier, setShowAddSupplier] = useState(false)
  const [newSupplier, setNewSupplier] = useState<Partial<Supplier>>({})

  // ── AI Chat tab ──────────────────────────────────────────────
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'নমস্কার! আমি আপনার ফার্মেসি AI সহায়ক। স্টক, বিল, রোগী, মেয়াদ — যেকোনো প্রশ্ন বাংলায় করুন!' }
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const voice = useVoice((t) => setChatInput(t))

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMessages, chatLoading])

  // ── Derived stats ─────────────────────────────────────────────
  const todaySales = sales.filter(s => s.date === today())
  const todayRevenue = todaySales.reduce((s, r) => s + r.total, 0)
  const todayDue = sales.reduce((s, r) => s + (r.total - r.paid), 0)
  const lowStock = medicines.filter(m => m.stock <= m.minStock)
  const expired = medicines.filter(m => expiryStatus(m.expiry) === 'expired')
  const expiringSoon = medicines.filter(m => ['critical', 'warning'].includes(expiryStatus(m.expiry)))
  const totalStockValue = medicines.reduce((s, m) => s + m.stock * m.costPrice, 0)
  const totalPendingSupplier = suppliers.reduce((s, r) => s + r.pendingAmount, 0)

  const filteredMeds = medicines.filter(m => {
    const matchQ = !searchQ || m.name.toLowerCase().includes(searchQ.toLowerCase()) || m.generic.toLowerCase().includes(searchQ.toLowerCase())
    const matchCat = catFilter === 'সব' || m.category === catFilter
    return matchQ && matchCat
  })

  const filteredPatients = patients.filter(p =>
    !patientSearch || p.name.toLowerCase().includes(patientSearch.toLowerCase()) || p.phone.includes(patientSearch)
  )

  const saleGross = saleItems.reduce((s, i) => s + (i.qty * i.mrp * (1 - i.discount / 100)), 0)
  const saleTotal = Math.max(0, saleGross - saleDiscount)

  // ── Stock ops ─────────────────────────────────────────────────
  const addMedicine = () => {
    if (!newMed.name || !newMed.stock) { toast.error('নাম ও স্টক দিন'); return }
    setMedicines([...medicines, {
      id: uid(), name: newMed.name!, generic: newMed.generic || '',
      category: newMed.category || 'Other', stock: +newMed.stock!,
      unit: newMed.unit || 'strip', expiry: newMed.expiry || monthYear(),
      mrp: +(newMed.mrp || 0), costPrice: +(newMed.costPrice || 0),
      minStock: +(newMed.minStock || 20), supplier: newMed.supplier || '',
      rack: newMed.rack || '', prescriptionRequired: !!newMed.prescriptionRequired
    }])
    setNewMed({ unit: 'strip', category: 'Analgesic', prescriptionRequired: false })
    setShowAddMed(false)
    toast.success('ওষুধ যোগ হয়েছে!')
  }

  const deleteMed = (id: string) => {
    if (!confirm('এই ওষুধ মুছে ফেলবেন?')) return
    setMedicines(medicines.filter(m => m.id !== id))
    toast.success('মুছে ফেলা হয়েছে')
  }

  const saveEditStock = (id: string) => {
    setMedicines(medicines.map(m => m.id === id ? { ...m, stock: +editStockVal } : m))
    setEditStockId(null)
    toast.success('স্টক আপডেট হয়েছে!')
  }

  const exportStock = () => {
    let csv = 'ওষুধের নাম,Generic,Category,স্টক,Unit,মেয়াদ,MRP,Cost,Min Stock,Supplier,Rack\n'
    medicines.forEach(m => {
      csv += `"${m.name}","${m.generic}","${m.category}",${m.stock},"${m.unit}","${m.expiry}",${m.mrp},${m.costPrice},${m.minStock},"${m.supplier}","${m.rack}"\n`
    })
    downloadCSV(csv, `stock-${today()}.csv`)
    toast.success('Excel ডাউনলোড হয়েছে!')
  }

  // ── Sale ops ──────────────────────────────────────────────────
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

  const saveSale = (paid: number) => {
    if (!saleForm.customerName || saleItems.every(i => !i.name)) {
      toast.error('রোগীর নাম ও ওষুধ দিন'); return
    }
    const sale: Sale = {
      id: uid(), date: today(), ...saleForm,
      items: saleItems.filter(i => i.name),
      total: +saleTotal.toFixed(2), paid,
      prescriptionNo: saleForm.prescriptionNo || `RX-${uid()}`
    }
    // Deduct stock
    const updMeds = [...medicines]
    sale.items.forEach(si => {
      const idx = updMeds.findIndex(m => m.name === si.name)
      if (idx >= 0) updMeds[idx] = { ...updMeds[idx], stock: Math.max(0, updMeds[idx].stock - si.qty) }
    })
    setMedicines(updMeds)
    setSales([sale, ...sales])
    setCurrentBill(sale)
    setSaleForm({ customerName: '', customerPhone: '', doctorName: '', prescriptionNo: '' })
    setSaleItems([{ name: '', qty: 1, mrp: 0, discount: 0 }])
    setSaleDiscount(0)
    setShowNewSale(false)
    toast.success('বিল তৈরি হয়েছে!')
  }

  const printBill = (sale: Sale) => {
    const w = window.open('', '_blank')!
    w.document.write(`<!DOCTYPE html><html><head><title>বিল</title><meta charset="utf-8">
<style>
  body{font-family:'Segoe UI',sans-serif;padding:24px;max-width:420px;margin:auto;color:#111}
  h2{text-align:center;color:#059669;margin:0 0 4px}
  .sub{text-align:center;color:#666;font-size:12px;margin-bottom:16px;border-bottom:2px solid #111;padding-bottom:10px}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th{background:#059669;color:white;padding:7px 8px;text-align:left}
  td{padding:6px 8px;border-bottom:1px solid #eee}
  .total{font-weight:700;font-size:15px}.paid{color:#16a34a}.due{color:#dc2626}
  .footer{text-align:center;margin-top:18px;font-size:11px;color:#888;border-top:1px dashed #ccc;padding-top:10px}
</style></head><body>
<h2>💊 ফার্মেসি বিল</h2>
<div class="sub">তারিখ: ${new Date().toLocaleDateString('bn-IN')} | RX: ${sale.prescriptionNo}</div>
<p><strong>রোগী:</strong> ${sale.customerName} ${sale.customerPhone ? `| 📞 ${sale.customerPhone}` : ''}</p>
${sale.doctorName ? `<p><strong>ডাক্তার:</strong> ${sale.doctorName}</p>` : ''}
<table>
  <tr><th>ওষুধ</th><th>পরিমাণ</th><th>মূল্য</th><th>মোট</th></tr>
  ${sale.items.map(i => `<tr><td>${i.name}</td><td>${i.qty}</td><td>₹${i.mrp}${i.discount > 0 ? ` (-${i.discount}%)` : ''}</td><td>₹${(i.qty * i.mrp * (1 - i.discount / 100)).toFixed(0)}</td></tr>`).join('')}
  <tr><td colspan="3" class="total">মোট</td><td class="total">₹${sale.total}</td></tr>
  <tr><td colspan="3" class="paid">পরিশোধিত</td><td class="paid">₹${sale.paid}</td></tr>
  ${sale.total - sale.paid > 0 ? `<tr><td colspan="3" class="due">বাকি</td><td class="due">₹${(sale.total - sale.paid).toFixed(0)}</td></tr>` : ''}
</table>
<div class="footer">সুস্থ থাকুন! ধন্যবাদ 🙏</div>
</body></html>`)
    w.document.close()
    w.print()
  }

  const sendWhatsApp = (sale: Sale) => {
    const phone = sale.customerPhone.replace(/[^0-9]/g, '')
    let txt = `🏥 *ফার্মেসি বিল*\n\nরোগী: ${sale.customerName}\nতারিখ: ${sale.date}\nRX: ${sale.prescriptionNo}\n\n`
    txt += sale.items.map(i => `${i.name} × ${i.qty} = ₹${(i.qty * i.mrp * (1 - i.discount / 100)).toFixed(0)}`).join('\n')
    txt += `\n\n*মোট: ₹${sale.total}*\nপরিশোধ: ₹${sale.paid}\nবাকি: ₹${(sale.total - sale.paid).toFixed(0)}`
    txt += '\n\nধন্যবাদ! সুস্থ থাকুন 💊'
    window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(txt)}`, '_blank')
  }

  const exportSalesReport = () => {
    let csv = 'তারিখ,রোগী,ফোন,ডাক্তার,মোট,পরিশোধ,বাকি,RX\n'
    sales.forEach(s => {
      csv += `"${s.date}","${s.customerName}","${s.customerPhone}","${s.doctorName}",${s.total},${s.paid},${s.total - s.paid},"${s.prescriptionNo}"\n`
    })
    downloadCSV(csv, `sales-report-${today()}.csv`)
    toast.success('Sales রিপোর্ট ডাউনলোড হয়েছে!')
  }

  // ── Patient ops ───────────────────────────────────────────────
  const addPatient = () => {
    if (!newPatient.name) { toast.error('নাম দিন'); return }
    setPatients([...patients, {
      id: uid(), name: newPatient.name!, age: +(newPatient.age || 0),
      gender: newPatient.gender || 'পুরুষ', phone: newPatient.phone || '',
      address: newPatient.address || '', doctorName: newPatient.doctorName || '',
      bloodGroup: newPatient.bloodGroup || 'জানা নেই', notes: newPatient.notes || ''
    }])
    setNewPatient({ gender: 'পুরুষ', bloodGroup: 'জানা নেই' })
    setShowAddPatient(false)
    toast.success('রোগী রেজিস্ট্রেশন হয়েছে!')
  }

  const deletePatient = (id: string) => {
    if (!confirm('এই রোগী মুছে ফেলবেন?')) return
    setPatients(patients.filter(p => p.id !== id))
  }

  // ── Prescription ops ──────────────────────────────────────────
  const addRxMed = () => setRxMeds([...rxMeds, { name: '', dosage: '', duration: '', qty: 1 }])

  const savePrescription = () => {
    if (!rxForm.patientName) { toast.error('রোগীর নাম দিন'); return }
    const rx: Prescription = {
      id: uid(), date: today(), ...rxForm,
      medicines: rxMeds.filter(m => m.name)
    }
    setPrescriptions([rx, ...prescriptions])
    setRxForm({ patientName: '', patientPhone: '', doctorName: '', hospital: '', diagnosis: '' })
    setRxMeds([{ name: '', dosage: '', duration: '', qty: 1 }])
    toast.success('প্রেসক্রিপশন সেভ হয়েছে!')
  }

  // ── Khata (Photo) ops ─────────────────────────────────────────
  const handleKhataUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const base64Full = ev.target?.result as string
      setKhataImage(base64Full)
      setKhataExtracted('')
      setKhataRecords([])
      setKhataLoading(true)
      const b64 = base64Full.split(',')[1]
      const mt = base64Full.split(';')[0].split(':')[1]
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemPrompt: `তুমি একটি ফার্মেসি খাতা OCR সিস্টেম। ছবি থেকে সব রেকর্ড পড়ো এবং JSON array হিসেবে দাও।
Format: [{"name":"রোগীর নাম","phone":"ফোন","medicine":"ওষুধ","qty":1,"amount":100,"date":"তারিখ"}]
শুধু JSON দাও, অন্য কিছু না।`,
            messages: [{
              role: 'user',
              content: [
                { type: 'image_url', image_url: { url: base64Full } },
                { type: 'text', text: 'এই খাতার ছবি থেকে সব রেকর্ড পড়ে JSON দিন।' }
              ]
            }]
          })
        })
        const data = await res.json()
        const txt = data.content || ''
        setKhataExtracted(txt)
        const jsonMatch = txt.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          try { setKhataRecords(JSON.parse(jsonMatch[0])) } catch { }
        }
      } catch {
        setKhataExtracted('AI সংযোগে সমস্যা। ম্যানুয়ালি ডেটা এন্ট্রি করুন।')
      } finally {
        setKhataLoading(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const importKhataRecords = () => {
    let imported = 0
    khataRecords.forEach(r => {
      if (r.name) {
        const exists = patients.find(p => p.phone === r.phone || p.name === r.name)
        if (!exists) {
          setPatients(prev => [...prev, {
            id: uid(), name: r.name, age: 0, gender: 'অজানা',
            phone: r.phone || '', address: '', doctorName: '',
            bloodGroup: 'জানা নেই', notes: r.medicine || ''
          }])
        }
        if (r.medicine) {
          setSales(prev => [...prev, {
            id: uid(), date: r.date || today(), customerName: r.name,
            customerPhone: r.phone || '', doctorName: '',
            items: [{ name: r.medicine, qty: +(r.qty || 1), mrp: +(r.amount || 0), discount: 0 }],
            total: +(r.amount || 0), paid: +(r.amount || 0),
            prescriptionNo: `KHATA-${uid()}`
          }])
        }
        imported++
      }
    })
    setKhataImports(prev => [...prev, { id: uid(), date: today(), recordCount: imported, status: 'imported' }])
    setKhataImage(null); setKhataExtracted(''); setKhataRecords([])
    toast.success(`${imported}টি রেকর্ড Import হয়েছে!`)
  }

  // ── Supplier ops ──────────────────────────────────────────────
  const addSupplier = () => {
    if (!newSupplier.name) { toast.error('নাম দিন'); return }
    setSuppliers([...suppliers, {
      id: uid(), name: newSupplier.name!, phone: newSupplier.phone || '',
      medicines: [], pendingAmount: +(newSupplier.pendingAmount || 0), lastOrder: today()
    }])
    setNewSupplier({})
    setShowAddSupplier(false)
    toast.success('সরবরাহকারী যোগ হয়েছে!')
  }

  // ── AI Chat ───────────────────────────────────────────────────
  const buildContext = () => {
    const todayRev = todaySales.reduce((a, s) => a + s.total, 0)
    const low = lowStock.map(m => `${m.name}(${m.stock} ${m.unit})`).join(', ')
    const exp = [...expired, ...expiringSoon].map(m => `${m.name}(${m.expiry})`).join(', ')
    const due = sales.filter(s => s.total > s.paid).map(s => `${s.customerName}:₹${s.total - s.paid}`).join(', ')
    return `ফার্মেসি তথ্য: মোট ওষুধ=${medicines.length}টি, আজকের বিক্রি=₹${todayRev}, কম স্টক: ${low || 'নেই'}, মেয়াদ সমস্যা: ${exp || 'নেই'}, বাকি: ${due || 'নেই'}, মোট রোগী=${patients.length}`
  }

  const sendChat = async (text?: string) => {
    const msg = text || chatInput.trim()
    if (!msg || chatLoading) return
    setChatInput('')
    const newMsgs: ChatMessage[] = [...chatMessages, { role: 'user', content: msg }]
    setChatMessages(newMsgs)
    setChatLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: `তুমি একজন বাংলা ফার্মেসি AI সহায়ক। সংক্ষেপে ও স্পষ্টভাবে উত্তর দাও। সবসময় বাংলায় উত্তর দাও।\n\n${buildContext()}`,
          messages: newMsgs.filter((_, i) => i > 0).map(m => ({ role: m.role, content: m.content }))
        })
      })
      const data = await res.json()
      setChatMessages([...newMsgs, { role: 'assistant', content: data.content }])
    } catch {
      toast.error('উত্তর পেতে সমস্যা হয়েছে')
      setChatMessages(newMsgs)
    } finally {
      setChatLoading(false)
    }
  }

  // ── TABS config ───────────────────────────────────────────────
  const TABS = [
    { id: 'stock',        label: 'স্টক',          icon: <Package size={13} /> },
    { id: 'billing',      label: 'বিল',            icon: <FileText size={13} /> },
    { id: 'patients',     label: 'রোগী',           icon: <User size={13} /> },
    { id: 'prescription', label: 'প্রেসক্রিপশন',  icon: <Stethoscope size={13} /> },
    { id: 'khata',        label: 'খাতা Import',    icon: <Camera size={13} /> },
    { id: 'expiry',       label: 'মেয়াদ',          icon: <Clock size={13} /> },
    { id: 'supplier',     label: 'সরবরাহ',         icon: <Truck size={13} /> },
    { id: 'report',       label: 'রিপোর্ট',        icon: <BarChart2 size={13} /> },
    { id: 'ai',           label: 'AI সহায়ক',      icon: <Bot size={13} /> },
  ]

  // ══════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════
  return (
    <div className="space-y-3">

      {/* ── Stats Bar ── */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: 'আজকের বিক্রি', value: `₹${todayRevenue}`, color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
          { label: 'মোট বাকি', value: `₹${todayDue}`, color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
          { label: 'কম স্টক', value: `${lowStock.length}টি`, color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
          { label: 'মেয়াদ সমস্যা', value: `${expired.length + expiringSoon.length}টি`, color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
        ].map(c => (
          <div key={c.label} className={`${c.bg} border rounded-xl p-3`}>
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
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
              <div className="font-bold text-orange-800 bengali text-sm mb-1.5">📦 কম স্টক — অর্ডার করুন</div>
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
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold transition-all bengali whitespace-nowrap border-b-2 ${tab === t.id ? 'bg-white text-green-700 border-green-600' : 'text-gray-500 hover:text-gray-700 border-transparent'}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        <div className="p-4">

          {/* ══ STOCK ══════════════════════════════════════════════ */}
          {tab === 'stock' && (
            <div className="space-y-3">
              <div className="flex gap-2 flex-wrap">
                <div className="flex-1 relative min-w-[160px]">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="ওষুধ খুঁজুন..." className="w-full pl-8 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-green-400 bengali" />
                </div>
                <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="border rounded-lg px-2 py-2 text-sm focus:outline-none">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <button onClick={exportStock} className="flex items-center gap-1.5 text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-2 rounded-lg font-bold hover:bg-green-100 bengali">
                  <Download size={12} />Excel
                </button>
                <button onClick={() => setShowAddMed(!showAddMed)} className="flex items-center gap-1.5 text-xs bg-green-600 text-white px-3 py-2 rounded-lg font-bold hover:bg-green-700 bengali">
                  <Plus size={12} />নতুন ওষুধ
                </button>
              </div>

              {showAddMed && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
                  <div className="font-bold text-green-800 bengali text-sm mb-2">➕ নতুন ওষুধ যোগ করুন</div>
                  <div className="grid grid-cols-2 gap-2">
                    <input placeholder="ওষুধের নাম *" className="border rounded-lg px-3 py-2 text-sm col-span-2 focus:outline-none focus:border-green-400" value={newMed.name || ''} onChange={e => setNewMed({ ...newMed, name: e.target.value })} />
                    <input placeholder="Generic নাম" className="border rounded-lg px-3 py-2 text-sm focus:outline-none" value={newMed.generic || ''} onChange={e => setNewMed({ ...newMed, generic: e.target.value })} />
                    <select className="border rounded-lg px-3 py-2 text-sm focus:outline-none" value={newMed.category} onChange={e => setNewMed({ ...newMed, category: e.target.value })}>
                      {CATEGORIES.slice(1).map(c => <option key={c}>{c}</option>)}
                    </select>
                    <input placeholder="স্টক পরিমাণ *" type="number" className="border rounded-lg px-3 py-2 text-sm focus:outline-none" value={newMed.stock || ''} onChange={e => setNewMed({ ...newMed, stock: +e.target.value })} />
                    <select className="border rounded-lg px-3 py-2 text-sm focus:outline-none" value={newMed.unit} onChange={e => setNewMed({ ...newMed, unit: e.target.value })}>
                      {UNITS.map(u => <option key={u}>{u}</option>)}
                    </select>
                    <input placeholder="মেয়াদ (YYYY-MM)" type="month" className="border rounded-lg px-3 py-2 text-sm focus:outline-none" value={newMed.expiry || ''} onChange={e => setNewMed({ ...newMed, expiry: e.target.value })} />
                    <input placeholder="Min স্টক" type="number" className="border rounded-lg px-3 py-2 text-sm focus:outline-none" value={newMed.minStock || ''} onChange={e => setNewMed({ ...newMed, minStock: +e.target.value })} />
                    <input placeholder="MRP (₹)" type="number" className="border rounded-lg px-3 py-2 text-sm focus:outline-none" value={newMed.mrp || ''} onChange={e => setNewMed({ ...newMed, mrp: +e.target.value })} />
                    <input placeholder="Cost Price (₹)" type="number" className="border rounded-lg px-3 py-2 text-sm focus:outline-none" value={newMed.costPrice || ''} onChange={e => setNewMed({ ...newMed, costPrice: +e.target.value })} />
                    <input placeholder="সরবরাহকারী" className="border rounded-lg px-3 py-2 text-sm focus:outline-none" value={newMed.supplier || ''} onChange={e => setNewMed({ ...newMed, supplier: e.target.value })} />
                    <input placeholder="Rack (যেমন A-1)" className="border rounded-lg px-3 py-2 text-sm focus:outline-none" value={newMed.rack || ''} onChange={e => setNewMed({ ...newMed, rack: e.target.value })} />
                    <label className="flex items-center gap-2 text-sm col-span-2 cursor-pointer">
                      <input type="checkbox" checked={!!newMed.prescriptionRequired} onChange={e => setNewMed({ ...newMed, prescriptionRequired: e.target.checked })} />
                      <span className="bengali">Prescription আবশ্যক (Rx)?</span>
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={addMedicine} className="flex-1 bg-green-600 text-white rounded-lg py-2 text-sm font-bold bengali hover:bg-green-700">যোগ করুন</button>
                    <button onClick={() => setShowAddMed(false)} className="px-4 border rounded-lg py-2 text-sm text-gray-500 hover:bg-gray-50">বাতিল</button>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-500">
                      <th className="text-left p-3 font-semibold bengali">ওষুধ</th>
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
                      const ls = m.stock <= m.minStock
                      return (
                        <tr key={m.id} className={`border-t hover:bg-gray-50 ${ls ? 'bg-orange-50/40' : ''}`}>
                          <td className="p-3">
                            <div className="font-semibold text-gray-800 text-xs">{m.name}</div>
                            <div className="text-gray-400 text-[10px]">{m.generic} · {m.category} · {m.supplier}</div>
                          </td>
                          <td className="p-3 text-center">
                            {editStockId === m.id ? (
                              <div className="flex items-center gap-1 justify-center">
                                <input type="number" value={editStockVal} onChange={e => setEditStockVal(e.target.value)} className="w-16 border rounded px-1 py-0.5 text-xs text-center focus:outline-none" />
                                <button onClick={() => saveEditStock(m.id)} className="text-green-600"><Check size={12} /></button>
                                <button onClick={() => setEditStockId(null)} className="text-gray-400"><X size={12} /></button>
                              </div>
                            ) : (
                              <button onClick={() => { setEditStockId(m.id); setEditStockVal(String(m.stock)) }} className={`font-bold text-xs ${ls ? 'text-red-600' : 'text-green-700'} hover:underline`}>
                                {m.stock} {m.unit}
                              </button>
                            )}
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
                            <button onClick={() => deleteMed(m.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
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

          {/* ══ BILLING ════════════════════════════════════════════ */}
          {tab === 'billing' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="text-sm font-bold text-gray-700 bengali">আজ {todaySales.length}টি বিল · ₹{todayRevenue}</div>
                <div className="flex gap-2">
                  <button onClick={exportSalesReport} className="flex items-center gap-1 text-xs bg-gray-50 border px-3 py-2 rounded-lg font-bold text-gray-600 hover:bg-gray-100 bengali">
                    <Download size={12} />Report
                  </button>
                  <button onClick={() => setShowNewSale(!showNewSale)} className="flex items-center gap-1.5 text-xs bg-green-600 text-white px-3 py-2 rounded-lg font-bold hover:bg-green-700 bengali">
                    <Plus size={12} />নতুন বিল
                  </button>
                </div>
              </div>

              {showNewSale && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
                  <div className="font-bold text-green-800 bengali text-sm">🧾 নতুন বিল তৈরি করুন</div>
                  <div className="grid grid-cols-2 gap-2">
                    <input list="patient-names" placeholder="রোগীর নাম *" className="border rounded-lg px-3 py-2 text-sm col-span-2 focus:outline-none focus:border-green-400 bengali" value={saleForm.customerName} onChange={e => {
                      const p = patients.find(p => p.name === e.target.value)
                      setSaleForm({ ...saleForm, customerName: e.target.value, customerPhone: p?.phone || saleForm.customerPhone, doctorName: p?.doctorName || saleForm.doctorName })
                    }} />
                    <datalist id="patient-names">{patients.map(p => <option key={p.id} value={p.name} />)}</datalist>
                    <input placeholder="ফোন নম্বর" className="border rounded-lg px-3 py-2 text-sm focus:outline-none" value={saleForm.customerPhone} onChange={e => setSaleForm({ ...saleForm, customerPhone: e.target.value })} />
                    <input placeholder="ডাক্তারের নাম" className="border rounded-lg px-3 py-2 text-sm focus:outline-none bengali" value={saleForm.doctorName} onChange={e => setSaleForm({ ...saleForm, doctorName: e.target.value })} />
                    <input placeholder="RX নম্বর" className="border rounded-lg px-3 py-2 text-sm focus:outline-none col-span-2" value={saleForm.prescriptionNo} onChange={e => setSaleForm({ ...saleForm, prescriptionNo: e.target.value })} />
                  </div>

                  <div className="space-y-2">
                    <div className="grid grid-cols-12 gap-1 text-[10px] font-bold text-gray-500 px-1 bengali">
                      <span className="col-span-5">ওষুধ</span><span className="col-span-2 text-center">পরিমাণ</span><span className="col-span-2 text-center">MRP ₹</span><span className="col-span-2 text-center">ছাড়%</span><span className="col-span-1"></span>
                    </div>
                    {saleItems.map((item, i) => (
                      <div key={i} className="grid grid-cols-12 gap-1 items-center">
                        <select className="border rounded px-2 py-1.5 text-xs col-span-5 focus:outline-none" value={item.name} onChange={e => updateSaleItem(i, 'name', e.target.value)}>
                          <option value="">ওষুধ বেছে নিন</option>
                          {medicines.map(m => <option key={m.id} value={m.name}>{m.name} (স্টক:{m.stock})</option>)}
                        </select>
                        <input type="number" min="1" className="border rounded px-2 py-1.5 text-xs col-span-2 text-center focus:outline-none" value={item.qty} onChange={e => updateSaleItem(i, 'qty', +e.target.value)} />
                        <input type="number" className="border rounded px-2 py-1.5 text-xs col-span-2 text-center focus:outline-none" value={item.mrp} onChange={e => updateSaleItem(i, 'mrp', +e.target.value)} />
                        <input type="number" min="0" max="100" className="border rounded px-2 py-1.5 text-xs col-span-2 text-center focus:outline-none" value={item.discount} onChange={e => updateSaleItem(i, 'discount', +e.target.value)} />
                        <button onClick={() => setSaleItems(saleItems.filter((_, j) => j !== i))} className="col-span-1 text-gray-300 hover:text-red-400 flex justify-center"><Trash2 size={12} /></button>
                      </div>
                    ))}
                    <button onClick={addSaleItem} className="w-full border border-dashed border-green-300 text-green-600 rounded-lg py-1.5 text-xs font-bold bengali hover:bg-green-50">+ ওষুধ যোগ করুন</button>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 bengali">অতিরিক্ত ছাড় (₹)</span>
                    <input type="number" min="0" className="border rounded-lg px-2 py-1.5 text-xs w-20 focus:outline-none" value={saleDiscount} onChange={e => setSaleDiscount(+e.target.value)} />
                    <span className="ml-auto font-extrabold text-green-700 bengali">মোট: ₹{saleTotal.toFixed(0)}</span>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => saveSale(saleTotal)} className="flex-1 bg-green-600 text-white rounded-lg py-2 text-xs font-bold bengali hover:bg-green-700">✅ সম্পূর্ণ পেমেন্ট</button>
                    <button onClick={() => { const p = prompt(`কত টাকা পেলেন? (মোট: ₹${saleTotal.toFixed(0)})`); if (p) saveSale(+p) }} className="flex-1 bg-yellow-500 text-white rounded-lg py-2 text-xs font-bold bengali hover:bg-yellow-600">⏳ আংশিক পেমেন্ট</button>
                    <button onClick={() => setShowNewSale(false)} className="border rounded-lg px-4 py-2 text-xs text-gray-500">বাতিল</button>
                  </div>
                </div>
              )}

              {/* Current bill preview */}
              {currentBill && (
                <div className="bg-gray-50 border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-bold text-sm bengali">🧾 সর্বশেষ বিল — {currentBill.customerName}</div>
                    <div className="flex gap-2">
                      <button onClick={() => printBill(currentBill)} className="flex items-center gap-1 text-xs bg-gray-800 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-gray-900 bengali">
                        <Printer size={11} />প্রিন্ট
                      </button>
                      <button onClick={() => sendWhatsApp(currentBill)} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-bold" style={{ background: '#25d366', color: '#fff' }}>
                        📲 WhatsApp
                      </button>
                    </div>
                  </div>
                  <div className="text-xs space-y-1">
                    {currentBill.items.map((i, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{i.name} × {i.qty}{i.discount > 0 ? ` (-${i.discount}%)` : ''}</span>
                        <span>₹{(i.qty * i.mrp * (1 - i.discount / 100)).toFixed(0)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-bold border-t pt-1 text-green-700">
                      <span>মোট</span><span>₹{currentBill.total}</span>
                    </div>
                    <div className="flex justify-between text-green-600"><span>পরিশোধ</span><span>₹{currentBill.paid}</span></div>
                    {currentBill.total - currentBill.paid > 0 && (
                      <div className="flex justify-between text-red-600"><span>বাকি</span><span>₹{(currentBill.total - currentBill.paid).toFixed(0)}</span></div>
                    )}
                  </div>
                </div>
              )}

              {/* Sales list */}
              <div className="space-y-2 max-h-[380px] overflow-y-auto">
                {sales.length === 0 && <div className="text-center py-8 text-gray-400 bengali text-sm">কোনো বিক্রি নেই</div>}
                {sales.map(sale => (
                  <div key={sale.id} className="bg-white border rounded-xl p-3 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-gray-800 bengali text-sm">{sale.customerName}</div>
                        <div className="text-xs text-gray-400 bengali">{sale.date} {sale.doctorName && `· ${sale.doctorName}`}</div>
                        <div className="text-xs text-gray-500 mt-1">{sale.items.map(i => `${i.name} ×${i.qty}`).join(', ')}</div>
                      </div>
                      <div className="text-right flex flex-col gap-1 items-end">
                        <span className="font-extrabold text-green-700">₹{sale.total}</span>
                        {sale.total - sale.paid > 0
                          ? <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold bengali">বাকি ₹{(sale.total - sale.paid).toFixed(0)}</span>
                          : <span className="text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-bold bengali">পরিশোধিত</span>
                        }
                        <div className="flex gap-1.5 mt-0.5">
                          <button onClick={() => printBill(sale)} className="text-[10px] text-gray-500 hover:text-gray-800 flex items-center gap-0.5 bengali"><Printer size={10} />প্রিন্ট</button>
                          <button onClick={() => sendWhatsApp(sale)} className="text-[10px] text-green-600 hover:underline">📲 WA</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ PATIENTS ═══════════════════════════════════════════ */}
          {tab === 'patients' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={patientSearch} onChange={e => setPatientSearch(e.target.value)} placeholder="নাম বা ফোন দিয়ে খুঁজুন..." className="w-full pl-8 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-green-400 bengali" />
                </div>
                <button onClick={() => setShowAddPatient(!showAddPatient)} className="flex items-center gap-1.5 text-xs bg-green-600 text-white px-3 py-2 rounded-lg font-bold hover:bg-green-700 bengali">
                  <Plus size={12} />নতুন রোগী
                </button>
              </div>

              {showAddPatient && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
                  <div className="font-bold text-green-800 bengali text-sm mb-2">👤 নতুন রোগী রেজিস্ট্রেশন</div>
                  <div className="grid grid-cols-2 gap-2">
                    <input placeholder="নাম *" className="border rounded-lg px-3 py-2 text-sm col-span-2 focus:outline-none bengali" value={newPatient.name || ''} onChange={e => setNewPatient({ ...newPatient, name: e.target.value })} />
                    <input placeholder="বয়স" type="number" className="border rounded-lg px-3 py-2 text-sm focus:outline-none" value={newPatient.age || ''} onChange={e => setNewPatient({ ...newPatient, age: +e.target.value })} />
                    <select className="border rounded-lg px-3 py-2 text-sm focus:outline-none bengali" value={newPatient.gender} onChange={e => setNewPatient({ ...newPatient, gender: e.target.value })}>
                      <option>পুরুষ</option><option>মহিলা</option><option>অন্যান্য</option>
                    </select>
                    <input placeholder="মোবাইল" type="tel" className="border rounded-lg px-3 py-2 text-sm focus:outline-none" value={newPatient.phone || ''} onChange={e => setNewPatient({ ...newPatient, phone: e.target.value })} />
                    <select className="border rounded-lg px-3 py-2 text-sm focus:outline-none" value={newPatient.bloodGroup} onChange={e => setNewPatient({ ...newPatient, bloodGroup: e.target.value })}>
                      {['জানা নেই', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(g => <option key={g}>{g}</option>)}
                    </select>
                    <input placeholder="ঠিকানা" className="border rounded-lg px-3 py-2 text-sm col-span-2 focus:outline-none bengali" value={newPatient.address || ''} onChange={e => setNewPatient({ ...newPatient, address: e.target.value })} />
                    <input placeholder="নিয়মিত ডাক্তার" className="border rounded-lg px-3 py-2 text-sm col-span-2 focus:outline-none bengali" value={newPatient.doctorName || ''} onChange={e => setNewPatient({ ...newPatient, doctorName: e.target.value })} />
                    <textarea placeholder="নোট (ডায়াবেটিস, রক্তচাপ...)" className="border rounded-lg px-3 py-2 text-sm col-span-2 focus:outline-none bengali resize-none" rows={2} value={newPatient.notes || ''} onChange={e => setNewPatient({ ...newPatient, notes: e.target.value })} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={addPatient} className="flex-1 bg-green-600 text-white rounded-lg py-2 text-sm font-bold bengali hover:bg-green-700">রেজিস্ট্রেশন করুন</button>
                    <button onClick={() => setShowAddPatient(false)} className="px-4 border rounded-lg py-2 text-sm text-gray-500">বাতিল</button>
                  </div>
                </div>
              )}

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {filteredPatients.length === 0 && <div className="text-center py-8 text-gray-400 bengali text-sm">কোনো রোগী নেই</div>}
                {filteredPatients.map(p => {
                  const psales = sales.filter(s => s.customerPhone === p.phone || s.customerName === p.name)
                  const totalBuy = psales.reduce((a, s) => a + s.total, 0)
                  const totalDueP = psales.reduce((a, s) => a + (s.total - s.paid), 0)
                  return (
                    <div key={p.id} className="bg-white border rounded-xl p-3 hover:shadow-sm">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-gray-800 bengali">{p.name}</div>
                          <div className="text-xs text-gray-400 mt-0.5 bengali">{p.age > 0 ? `${p.age} বছর · ` : ''}{p.gender} · {p.bloodGroup}</div>
                          {p.phone && <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Phone size={10} />{p.phone}</div>}
                          {p.doctorName && <div className="text-xs text-gray-500 bengali mt-0.5">ডা: {p.doctorName}</div>}
                          {p.notes && <div className="text-xs text-gray-400 bengali mt-0.5 italic">{p.notes}</div>}
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-700 text-sm">₹{totalBuy}</div>
                          {totalDueP > 0 && <div className="text-xs text-red-600 font-bold bengali">বাকি ₹{totalDueP}</div>}
                          <div className="text-xs text-gray-400 bengali">{psales.length}টি বিল</div>
                          <button onClick={() => deletePatient(p.id)} className="text-gray-300 hover:text-red-500 mt-1"><Trash2 size={12} /></button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ══ PRESCRIPTION ═══════════════════════════════════════ */}
          {tab === 'prescription' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-3">
                <div className="font-bold text-gray-800 bengali text-sm">📋 প্রেসক্রিপশন এন্ট্রি</div>
                <div className="space-y-2">
                  <input list="rx-patient-names" placeholder="রোগীর নাম *" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none bengali" value={rxForm.patientName} onChange={e => {
                    const p = patients.find(p => p.name === e.target.value)
                    setRxForm({ ...rxForm, patientName: e.target.value, patientPhone: p?.phone || rxForm.patientPhone, doctorName: p?.doctorName || rxForm.doctorName })
                  }} />
                  <datalist id="rx-patient-names">{patients.map(p => <option key={p.id} value={p.name} />)}</datalist>
                  <div className="grid grid-cols-2 gap-2">
                    <input placeholder="ফোন" className="border rounded-lg px-3 py-2 text-sm focus:outline-none" value={rxForm.patientPhone} onChange={e => setRxForm({ ...rxForm, patientPhone: e.target.value })} />
                    <input placeholder="ডাক্তার" className="border rounded-lg px-3 py-2 text-sm focus:outline-none bengali" value={rxForm.doctorName} onChange={e => setRxForm({ ...rxForm, doctorName: e.target.value })} />
                    <input placeholder="হাসপাতাল/ক্লিনিক" className="border rounded-lg px-3 py-2 text-sm col-span-2 focus:outline-none bengali" value={rxForm.hospital} onChange={e => setRxForm({ ...rxForm, hospital: e.target.value })} />
                    <input placeholder="রোগ নির্ণয় (Diagnosis)" className="border rounded-lg px-3 py-2 text-sm col-span-2 focus:outline-none" value={rxForm.diagnosis} onChange={e => setRxForm({ ...rxForm, diagnosis: e.target.value })} />
                  </div>
                  <div className="font-bold text-gray-700 text-xs bengali mt-2">ওষুধের তালিকা</div>
                  {rxMeds.map((m, i) => (
                    <div key={i} className="grid grid-cols-12 gap-1 items-center">
                      <select className="col-span-4 border rounded px-2 py-1.5 text-xs focus:outline-none" value={m.name} onChange={e => { const n = [...rxMeds]; n[i].name = e.target.value; setRxMeds(n) }}>
                        <option value="">ওষুধ</option>
                        {medicines.map(med => <option key={med.id} value={med.name}>{med.name}</option>)}
                      </select>
                      <input placeholder="Dosage" className="col-span-3 border rounded px-2 py-1.5 text-xs focus:outline-none" value={m.dosage} onChange={e => { const n = [...rxMeds]; n[i].dosage = e.target.value; setRxMeds(n) }} />
                      <input placeholder="Duration" className="col-span-3 border rounded px-2 py-1.5 text-xs focus:outline-none" value={m.duration} onChange={e => { const n = [...rxMeds]; n[i].duration = e.target.value; setRxMeds(n) }} />
                      <input type="number" min="1" className="col-span-1 border rounded px-1 py-1.5 text-xs text-center focus:outline-none" value={m.qty} onChange={e => { const n = [...rxMeds]; n[i].qty = +e.target.value; setRxMeds(n) }} />
                      <button onClick={() => setRxMeds(rxMeds.filter((_, j) => j !== i))} className="col-span-1 text-gray-300 hover:text-red-400 flex justify-center"><Trash2 size={11} /></button>
                    </div>
                  ))}
                  <button onClick={addRxMed} className="w-full border border-dashed border-green-300 text-green-600 rounded-lg py-1.5 text-xs font-bold bengali hover:bg-green-50">+ ওষুধ যোগ করুন</button>
                  <button onClick={savePrescription} className="w-full bg-green-600 text-white rounded-lg py-2 text-sm font-bold bengali hover:bg-green-700">💾 প্রেসক্রিপশন সেভ করুন</button>
                </div>
              </div>

              <div>
                <div className="font-bold text-gray-800 bengali text-sm mb-3">📁 সংরক্ষিত প্রেসক্রিপশন ({prescriptions.length})</div>
                <div className="space-y-2 max-h-[420px] overflow-y-auto">
                  {prescriptions.length === 0 && <div className="text-center py-8 text-gray-400 bengali text-sm">কোনো প্রেসক্রিপশন নেই</div>}
                  {prescriptions.map(rx => (
                    <div key={rx.id} className="bg-white border rounded-xl p-3">
                      <div className="flex justify-between items-start mb-1">
                        <div className="font-bold text-gray-800 bengali text-sm">{rx.patientName}</div>
                        <div className="text-xs text-gray-400">{rx.date}</div>
                      </div>
                      <div className="text-xs text-gray-500 bengali">{rx.doctorName}{rx.hospital && ` · ${rx.hospital}`}</div>
                      {rx.diagnosis && <div className="text-xs text-blue-600 mt-0.5 bengali">Dx: {rx.diagnosis}</div>}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {rx.medicines.map((m, i) => <span key={i} className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{m.name}{m.dosage ? ` - ${m.dosage}` : ''}</span>)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══ KHATA IMPORT ═══════════════════════════════════════ */}
          {tab === 'khata' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-3">
                <div className="font-bold text-gray-800 bengali text-sm">📷 খাতার ছবি থেকে ডেটা Import</div>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors"
                  onClick={() => khataRef.current?.click()}
                >
                  <div className="text-3xl mb-2">📸</div>
                  <div className="font-bold text-gray-700 bengali text-sm mb-1">খাতার ছবি বেছে নিন</div>
                  <div className="text-xs text-gray-400 bengali">AI স্বয়ংক্রিয়ভাবে নাম, ওষুধ, টাকার হিসাব পড়বে</div>
                </div>
                <input ref={khataRef} type="file" accept="image/*" className="hidden" onChange={handleKhataUpload} />

                {khataImage && <img src={khataImage} alt="Khata" className="w-full rounded-xl border max-h-48 object-contain" />}

                {khataLoading && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                    <div className="text-sm bengali animate-pulse">AI পড়ছে... অনুগ্রহ করে অপেক্ষা করুন ⏳</div>
                  </div>
                )}

                {khataExtracted && !khataLoading && (
                  <div className="space-y-2">
                    <div className="font-bold text-gray-700 bengali text-xs">AI পঠিত ডেটা:</div>
                    <div className="bg-gray-50 border rounded-xl p-3 text-xs font-mono max-h-32 overflow-y-auto whitespace-pre-wrap">{khataExtracted}</div>
                    {khataRecords.length > 0 && (
                      <>
                        <div className="font-bold text-gray-700 bengali text-xs">{khataRecords.length}টি রেকর্ড পাওয়া গেছে:</div>
                        {khataRecords.map((r, i) => (
                          <div key={i} className="bg-white border rounded-lg p-2 text-xs bengali">
                            <span className="font-bold">{r.name}</span> {r.phone && `· ${r.phone}`} — {r.medicine} {r.qty && `× ${r.qty}`} {r.amount && `= ₹${r.amount}`}
                          </div>
                        ))}
                        <button onClick={importKhataRecords} className="w-full bg-green-600 text-white rounded-xl py-2.5 text-sm font-bold bengali hover:bg-green-700">
                          ✅ সব রেকর্ড Import করুন
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div>
                <div className="font-bold text-gray-800 bengali text-sm mb-3">📋 Import ইতিহাস</div>
                {khataImports.length === 0 && <div className="text-center py-8 text-gray-400 bengali text-sm">এখনো কোনো Import করা হয়নি</div>}
                <div className="space-y-2">
                  {khataImports.map(k => (
                    <div key={k.id} className="bg-white border rounded-xl p-3 flex justify-between items-center">
                      <div className="text-xs bengali text-gray-600">{k.date}</div>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">{k.recordCount}টি রেকর্ড</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══ EXPIRY ═════════════════════════════════════════════ */}
          {tab === 'expiry' && (
            <div className="space-y-3">
              <div className="text-sm font-bold text-gray-700 bengali">মেয়াদের অবস্থা</div>
              {(['expired', 'critical', 'warning', 'ok'] as const).map(status => {
                const meds = medicines.filter(m => expiryStatus(m.expiry) === status)
                if (meds.length === 0) return null
                const config = {
                  expired: { label: '🚫 মেয়াদ শেষ', bg: 'bg-red-50 border-red-200', text: 'text-red-800', badge: 'bg-red-100 text-red-700' },
                  critical: { label: '🔴 ১ মাসের মধ্যে', bg: 'bg-orange-50 border-orange-200', text: 'text-orange-800', badge: 'bg-orange-100 text-orange-700' },
                  warning: { label: '🟡 ৩ মাসের মধ্যে', bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-800', badge: 'bg-yellow-100 text-yellow-700' },
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
                            {status === 'expired' && (
                              <button onClick={() => { if (confirm(`${m.name} মুছে ফেলবেন?`)) setMedicines(medicines.filter(x => x.id !== m.id)) }} className="text-red-400 hover:text-red-600"><Trash2 size={11} /></button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ══ SUPPLIER ═══════════════════════════════════════════ */}
          {tab === 'supplier' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="text-sm font-bold text-gray-700 bengali">মোট বকেয়া: ₹{totalPendingSupplier.toLocaleString()}</div>
                <button onClick={() => setShowAddSupplier(!showAddSupplier)} className="flex items-center gap-1.5 text-xs bg-green-600 text-white px-3 py-2 rounded-lg font-bold hover:bg-green-700 bengali">
                  <Plus size={12} />সরবরাহকারী যোগ
                </button>
              </div>

              {showAddSupplier && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input placeholder="নাম *" className="border rounded-lg px-3 py-2 text-sm focus:outline-none" value={newSupplier.name || ''} onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })} />
                    <input placeholder="ফোন" className="border rounded-lg px-3 py-2 text-sm focus:outline-none" value={newSupplier.phone || ''} onChange={e => setNewSupplier({ ...newSupplier, phone: e.target.value })} />
                    <input placeholder="বকেয়া (₹)" type="number" className="border rounded-lg px-3 py-2 text-sm col-span-2 focus:outline-none" value={newSupplier.pendingAmount || ''} onChange={e => setNewSupplier({ ...newSupplier, pendingAmount: +e.target.value })} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={addSupplier} className="flex-1 bg-green-600 text-white rounded-lg py-2 text-sm font-bold bengali hover:bg-green-700">যোগ করুন</button>
                    <button onClick={() => setShowAddSupplier(false)} className="px-4 border rounded-lg py-2 text-sm text-gray-500">বাতিল</button>
                  </div>
                </div>
              )}

              {suppliers.map(s => (
                <div key={s.id} className="bg-white border rounded-xl p-4">
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
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {s.medicines.map(m => <span key={m} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{m}</span>)}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { const amt = prompt(`${s.name} কে কত টাকা পেমেন্ট করলেন?`); if (amt) { setSuppliers(suppliers.map(sup => sup.id === s.id ? { ...sup, pendingAmount: Math.max(0, sup.pendingAmount - +amt) } : sup)); toast.success('পেমেন্ট রেকর্ড হয়েছে!') } }} className="flex-1 text-xs bg-green-50 text-green-700 border border-green-200 rounded-lg py-1.5 font-bold bengali hover:bg-green-100">
                      💳 পেমেন্ট করুন
                    </button>
                    <a href={`tel:${s.phone.replace(/[^0-9]/g, '')}`} className="flex-1 text-center text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-lg py-1.5 font-bold bengali hover:bg-blue-100">
                      📞 কল করুন
                    </a>
                    <button onClick={() => { if (confirm(`${s.name} মুছে ফেলবেন?`)) setSuppliers(suppliers.filter(x => x.id !== s.id)) }} className="text-gray-300 hover:text-red-500 px-2"><Trash2 size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ══ REPORT ═════════════════════════════════════════════ */}
          {tab === 'report' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: 'আজকের বিক্রি', value: `₹${todayRevenue}`, sub: `${todaySales.length}টি বিল` },
                  { label: 'মোট বাকি', value: `₹${todayDue}`, sub: 'সব সময়ের' },
                  { label: 'স্টক মূল্য', value: `₹${totalStockValue.toLocaleString()}`, sub: 'Cost price অনুযায়ী' },
                  { label: 'মোট রোগী', value: `${patients.length}জন`, sub: `${sales.length}টি বিল মোট` },
                ].map(r => (
                  <div key={r.label} className="bg-gray-50 border rounded-xl p-3">
                    <div className="font-extrabold text-gray-900 text-lg">{r.value}</div>
                    <div className="text-xs font-semibold text-gray-700 bengali">{r.label}</div>
                    <div className="text-[10px] text-gray-400 bengali mt-0.5">{r.sub}</div>
                  </div>
                ))}
              </div>

              {/* Top selling medicines */}
              <div className="bg-white border rounded-xl p-4">
                <div className="font-bold text-gray-800 bengali text-sm mb-3">🏆 শীর্ষ বিক্রয় ওষুধ</div>
                {(() => {
                  const medCount: Record<string, number> = {}
                  sales.forEach(s => s.items.forEach(i => { medCount[i.name] = (medCount[i.name] || 0) + i.qty * i.mrp }))
                  return Object.entries(medCount).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, val], idx) => (
                    <div key={name} className="flex items-center justify-between py-1.5 border-b last:border-0">
                      <span className="text-xs text-gray-700">{idx + 1}. {name}</span>
                      <span className="text-xs font-bold text-green-700">₹{val.toLocaleString()}</span>
                    </div>
                  ))
                })()}
              </div>

              {/* Due list */}
              {sales.some(s => s.total > s.paid) && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="font-bold text-red-800 bengali text-sm mb-3">💳 বাকির তালিকা</div>
                  {sales.filter(s => s.total > s.paid).map(s => (
                    <div key={s.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                      <div className="text-xs bengali">
                        <span className="font-bold">{s.customerName}</span>
                        <span className="text-gray-400 ml-1">{s.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-red-600">₹{(s.total - s.paid).toFixed(0)}</span>
                        {s.customerPhone && <button onClick={() => sendWhatsApp(s)} className="text-[10px] text-green-600">📲</button>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={exportSalesReport} className="flex-1 flex items-center justify-center gap-1.5 text-xs bg-green-600 text-white px-3 py-2.5 rounded-lg font-bold hover:bg-green-700 bengali">
                  <Download size={12} />Sales Report (Excel)
                </button>
                <button onClick={exportStock} className="flex-1 flex items-center justify-center gap-1.5 text-xs bg-gray-600 text-white px-3 py-2.5 rounded-lg font-bold hover:bg-gray-700 bengali">
                  <Download size={12} />Stock Report (Excel)
                </button>
              </div>
            </div>
          )}

          {/* ══ AI CHAT ════════════════════════════════════════════ */}
          {tab === 'ai' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col">
                <div className="font-bold text-gray-800 bengali text-sm mb-2">🤖 AI সহায়ক — বাংলায় কথা বলুন</div>
                <div className="bg-white border rounded-2xl overflow-hidden flex flex-col" style={{ height: 420 }}>
                  {/* Chat header */}
                  <div className="bg-gray-900 px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-green-500 flex items-center justify-center text-base flex-shrink-0">💊</div>
                    <div>
                      <div className="font-bold text-white text-xs bengali">ফার্মেসি AI</div>
                      <div className="text-green-400 text-[10px] flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />Online
                      </div>
                    </div>
                    {voice.supported && (
                      <div className="ml-auto flex items-center gap-1 bg-gray-800 rounded-lg p-1">
                        <Globe size={10} className="text-gray-400 ml-1" />
                        {(['bn-IN', 'en-IN'] as const).map(l => (
                          <button key={l} onClick={() => voice.setLang(l)} className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors ${voice.lang === l ? 'bg-green-600 text-white' : 'text-gray-400'}`}>
                            {l === 'bn-IN' ? 'বাং' : 'EN'}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {chatMessages.map((m, i) => (
                      <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {m.role === 'assistant' && (
                          <div className="w-6 h-6 rounded-lg bg-green-500 flex items-center justify-center text-xs mr-1.5 mt-0.5 flex-shrink-0">💊</div>
                        )}
                        <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed bengali ${m.role === 'user' ? 'bg-green-600 text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                          {m.content}
                        </div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="w-6 h-6 rounded-lg bg-green-500 flex items-center justify-center text-xs mr-1.5 flex-shrink-0">💊</div>
                        <div className="bg-gray-100 rounded-2xl px-3 py-2">
                          <div className="flex gap-1">
                            {[0, 1, 2].map(i => <span key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full inline-block animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Input */}
                  <div className="p-2 border-t flex gap-2 items-end">
                    {voice.supported && (
                      <button
                        onClick={voice.listening ? voice.stop : voice.start}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${voice.listening ? 'bg-red-500 animate-pulse' : 'bg-gray-100 hover:bg-gray-200'}`}
                      >
                        {voice.listening ? <MicOff size={14} className="text-white" /> : <Mic size={14} className="text-gray-600" />}
                      </button>
                    )}
                    <textarea
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat() } }}
                      placeholder={voice.listening ? 'বলুন...' : 'বাংলায় জিজ্ঞেস করুন...'}
                      rows={1}
                      className="flex-1 resize-none rounded-xl border px-3 py-2 text-xs focus:outline-none focus:border-green-400 bengali max-h-20"
                    />
                    <button
                      onClick={() => sendChat()}
                      disabled={!chatInput.trim() || chatLoading}
                      className="w-9 h-9 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-40 flex items-center justify-center flex-shrink-0"
                    >
                      <Send size={14} className="text-white" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="font-bold text-gray-800 bengali text-sm">⚡ দ্রুত প্রশ্ন</div>
                <div className="space-y-2">
                  {QUICK_QUESTIONS.map(q => (
                    <button key={q} onClick={() => sendChat(q)} className="w-full text-left text-xs border rounded-xl px-3 py-2.5 text-gray-700 hover:bg-green-50 hover:border-green-300 transition-colors bengali">
                      {q} ↗
                    </button>
                  ))}
                </div>

                <div className="font-bold text-gray-800 bengali text-sm mt-4">📊 আজকের সারসংক্ষেপ</div>
                <div className="bg-gray-50 border rounded-xl p-3 space-y-2">
                  {[
                    { label: 'আজকের বিক্রি', value: `₹${todayRevenue}`, color: 'text-green-700' },
                    { label: 'মোট বাকি', value: `₹${todayDue}`, color: todayDue > 0 ? 'text-red-600' : 'text-green-600' },
                    { label: 'কম স্টক', value: `${lowStock.length}টি`, color: lowStock.length > 0 ? 'text-orange-600' : 'text-green-600' },
                    { label: 'মেয়াদ সমস্যা', value: `${expired.length + expiringSoon.length}টি`, color: expired.length > 0 ? 'text-red-600' : 'text-green-600' },
                    { label: 'মোট রোগী', value: `${patients.length}জন`, color: 'text-gray-700' },
                  ].map(r => (
                    <div key={r.label} className="flex justify-between items-center text-xs bengali">
                      <span className="text-gray-600">{r.label}</span>
                      <span className={`font-bold ${r.color}`}>{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
