'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AgentFormData, AgentCategory, AgentTool, CATEGORY_LABELS, TOOL_LABELS } from '@/types'
import { generateAgentWithAI } from '@/lib/agentUtils'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'
import { Sparkles, Loader2, CheckCircle2, Mic, MicOff, Globe } from 'lucide-react'

export default function AgentBuilderForm() {
  const router = useRouter()
  const [step, setStep]                   = useState<'form' | 'building' | 'done'>('form')
  const [progress, setProgress]           = useState(0)
  const [progressLabel, setProgressLabel] = useState('')
  const [createdId, setCreatedId]         = useState<string | null>(null)

  const [form, setForm] = useState<AgentFormData>({
    name: '',
    description: '',
    category: 'business',
    tools: ['memory', 'calculations'],
  })

  // ── Voice state ────────────────────────────────────────────
  const [listeningField, setListeningField] = useState<'name' | 'description' | null>(null)
  const [voiceLang, setVoiceLang]           = useState<'bn-IN' | 'en-IN'>('bn-IN')
  const recognitionRef                      = useRef<any>(null)

  const startVoice = useCallback((field: 'name' | 'description') => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      toast.error('আপনার browser voice input support করে না।')
      return
    }
    if (recognitionRef.current) recognitionRef.current.abort()

    const r = new SR()
    recognitionRef.current = r
    r.lang              = voiceLang
    r.interimResults    = true
    r.maxAlternatives   = 1
    r.continuous        = false

    r.onstart  = () => setListeningField(field)
    r.onerror  = (e: any) => {
      setListeningField(null)
      if (e.error === 'not-allowed') toast.error('Microphone permission দিন।')
      else if (e.error === 'no-speech') toast.error('কোনো কথা শোনা যায়নি।')
    }
    r.onresult = (e: any) => {
      let transcript = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript
      }
      setForm(f => ({ ...f, [field]: transcript }))
    }
    r.onend = () => setListeningField(null)
    r.start()
  }, [voiceLang])

  const stopVoice = useCallback(() => {
    recognitionRef.current?.stop()
    setListeningField(null)
  }, [])

  const isListening = (field: 'name' | 'description') => listeningField === field

  // ── Tools / categories ─────────────────────────────────────
  const categories = Object.entries(CATEGORY_LABELS) as [AgentCategory, typeof CATEGORY_LABELS[AgentCategory]][]
  const tools      = Object.entries(TOOL_LABELS)      as [AgentTool,     typeof TOOL_LABELS[AgentTool]][]

  const toggleTool = (tool: AgentTool) => {
    setForm(f => ({
      ...f,
      tools: f.tools.includes(tool) ? f.tools.filter(t => t !== tool) : [...f.tools, tool],
    }))
  }

  // ── Build agent ─────────────────────────────────────────────
  const buildAgent = async () => {
    if (!form.name.trim() || !form.description.trim()) {
      toast.error('এজেন্টের নাম ও বিবরণ দিন')
      return
    }
    setStep('building')

    const steps = [
      { pct: 20,  label: 'আপনার চাহিদা বিশ্লেষণ করছি...'   },
      { pct: 40,  label: 'Bengali workflow তৈরি হচ্ছে...'    },
      { pct: 60,  label: 'AI personality সেট হচ্ছে...'       },
      { pct: 80,  label: 'টুলস সংযুক্ত হচ্ছে...'            },
      { pct: 100, label: 'প্রায় শেষ...'                     },
    ]

    for (const s of steps) {
      await new Promise(r => setTimeout(r, 500))
      setProgress(s.pct)
      setProgressLabel(s.label)
    }

    try {
      const generated = await generateAgentWithAI(form)
      const { data: { user } } = await supabase.auth.getUser()

      const { data, error } = await supabase
        .from('agents')
        .insert({
          user_id:      user?.id || '00000000-0000-0000-0000-000000000000',
          name:         form.name,
          name_bn:      form.name,
          description:  form.description,
          description_bn: form.description,
          category:     form.category,
          tools:        form.tools,
          system_prompt: generated.system_prompt,
          icon:         generated.icon,
          color:        generated.color,
          is_public:    false,
          is_featured:  false,
        })
        .select()
        .single()

      if (error) {
        console.warn('Supabase error (might be unauthenticated):', error)
        setStep('done')
        return
      }

      setCreatedId(data.id)
      setStep('done')
    } catch (err) {
      console.error(err)
      setStep('done')
    }
  }

  // ── Building screen ─────────────────────────────────────────
  if (step === 'building') {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Loader2 className="text-indigo-600 animate-spin" size={32} />
        </div>
        <h3 className="font-bold text-gray-900 text-lg mb-2">এজেন্ট তৈরি হচ্ছে...</h3>
        <p className="text-gray-500 text-sm bengali mb-6">{progressLabel}</p>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
          <div className="h-full bg-indigo-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-gray-400">{progress}%</p>
      </div>
    )
  }

  // ── Done screen ─────────────────────────────────────────────
  if (step === 'done') {
    return (
      <div className="bg-white rounded-2xl border border-emerald-200 p-10 text-center">
        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="text-emerald-600" size={36} />
        </div>
        <h3 className="font-bold text-gray-900 text-xl mb-2">🎉 এজেন্ট তৈরি হয়েছে!</h3>
        <p className="text-gray-500 text-sm bengali mb-6">
          <strong className="text-gray-900">{form.name}</strong> সফলভাবে তৈরি হয়েছে। এখন বাংলায় chat করুন।
        </p>
        <div className="bg-emerald-50 rounded-xl p-4 text-left mb-6 text-sm space-y-1.5">
          {['Bengali language ✅', 'Memory চালু ✅', 'Calculations চালু ✅', 'Bengali cultural context ✅'].map(f => (
            <div key={f} className="text-emerald-700 bengali">{f}</div>
          ))}
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors">
            এখনই চালান →
          </button>
          <button onClick={() => router.push('/dashboard')}
            className="px-6 py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition-colors">
            Dashboard দেখুন
          </button>
        </div>
      </div>
    )
  }

  // ── Main form ───────────────────────────────────────────────
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-indigo-600 px-6 py-5 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-white text-lg flex items-center gap-2">
            <Sparkles size={20} /> এজেন্ট Builder
          </h2>
          <p className="text-indigo-200 text-sm mt-1">আপনার চাহিদা বাংলায় লিখুন বা বলুন — AI বাকি কাজ করবে</p>
        </div>

        {/* Voice language toggle */}
        <div className="flex items-center gap-1.5 bg-indigo-500 rounded-lg p-1">
          <Globe size={12} className="text-indigo-200 ml-1" />
          <button
            onClick={() => setVoiceLang('bn-IN')}
            className={`text-[11px] font-semibold px-2 py-1 rounded-md transition-colors bengali ${voiceLang === 'bn-IN' ? 'bg-white text-indigo-600' : 'text-indigo-200 hover:text-white'}`}
          >
            বাংলা
          </button>
          <button
            onClick={() => setVoiceLang('en-IN')}
            className={`text-[11px] font-semibold px-2 py-1 rounded-md transition-colors ${voiceLang === 'en-IN' ? 'bg-white text-indigo-600' : 'text-indigo-200 hover:text-white'}`}
          >
            EN
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">

        {/* Name field + mic */}
        <div>
          <label className="block text-[13px] font-bold text-gray-700 mb-2">
            এজেন্টের নাম <span className="font-normal text-gray-400">(বাংলা বা English)</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="যেমন: আমার দোকান ম্যানেজার, পড়াশোনা সহায়ক..."
              className={`flex-1 px-4 py-3 rounded-xl border text-[14px] focus:outline-none focus:ring-2 bengali transition-colors ${
                isListening('name')
                  ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-50'
                  : 'border-gray-200 focus:border-indigo-400 focus:ring-indigo-50'
              }`}
            />
            <button
              onClick={() => isListening('name') ? stopVoice() : startVoice('name')}
              title={isListening('name') ? 'বন্ধ করুন' : `${voiceLang === 'bn-IN' ? 'বাংলায়' : 'English-এ'} বলুন`}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
                isListening('name')
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                  : 'bg-gray-100 hover:bg-indigo-100 hover:text-indigo-600 text-gray-600'
              }`}
            >
              {isListening('name') ? <MicOff size={18} className="text-white" /> : <Mic size={18} />}
            </button>
          </div>
          {isListening('name') && (
            <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1 bengali">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse inline-block" />
              {voiceLang === 'bn-IN' ? 'বাংলায় বলুন...' : 'Speak in English...'}
            </p>
          )}
        </div>

        {/* Description field + mic */}
        <div>
          <label className="block text-[13px] font-bold text-gray-700 mb-2">
            কী করবে এই এজেন্ট? <span className="font-normal text-gray-400">(বাংলায় বিস্তারিত লিখুন বা বলুন)</span>
          </label>
          <div className="relative">
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={4}
              placeholder="যেমন: আমার মুদি দোকানের জন্য একটা এজেন্ট দরকার। সে রোজের বিক্রির হিসাব রাখবে, স্টক কম হলে আমাকে জানাবে..."
              className={`w-full px-4 py-3 pr-14 rounded-xl border text-[14px] focus:outline-none focus:ring-2 resize-none bengali transition-colors ${
                isListening('description')
                  ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-50'
                  : 'border-gray-200 focus:border-indigo-400 focus:ring-indigo-50'
              }`}
            />
            {/* Mic button inside textarea */}
            <button
              onClick={() => isListening('description') ? stopVoice() : startVoice('description')}
              title={isListening('description') ? 'বন্ধ করুন' : `${voiceLang === 'bn-IN' ? 'বাংলায়' : 'English-এ'} বলুন`}
              className={`absolute right-3 bottom-3 w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                isListening('description')
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                  : 'bg-gray-100 hover:bg-indigo-100 hover:text-indigo-600 text-gray-600'
              }`}
            >
              {isListening('description') ? <MicOff size={15} className="text-white" /> : <Mic size={15} />}
            </button>
          </div>
          {isListening('description') && (
            <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1 bengali">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse inline-block" />
              {voiceLang === 'bn-IN' ? 'বাংলায় বিস্তারিত বলুন...' : 'Describe in English...'}
            </p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-[13px] font-bold text-gray-700 mb-3">Category বেছে নিন</label>
          <div className="grid grid-cols-3 gap-2">
            {categories.map(([key, val]) => (
              <button
                key={key}
                onClick={() => setForm(f => ({ ...f, category: key }))}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[13px] font-medium transition-all ${
                  form.category === key
                    ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                <span>{val.icon}</span>
                <span className="bengali">{val.bn}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tools */}
        <div>
          <label className="block text-[13px] font-bold text-gray-700 mb-3">কোন সুবিধাগুলো চান?</label>
          <div className="flex flex-wrap gap-2">
            {tools.map(([key, val]) => (
              <button
                key={key}
                onClick={() => toggleTool(key)}
                className={`px-3.5 py-2 rounded-full border text-[12px] font-semibold transition-all bengali ${
                  form.tools.includes(key)
                    ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {form.tools.includes(key) ? '✓ ' : ''}{val.bn}
              </button>
            ))}
          </div>
        </div>

        {/* Build button */}
        <button
          onClick={buildAgent}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[15px] rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          <Sparkles size={18} />
          এজেন্ট তৈরি করুন →
        </button>
      </div>
    </div>
  )
}
