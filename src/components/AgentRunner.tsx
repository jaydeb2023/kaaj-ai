'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Agent } from '@/types'
import { Send, Bot, Mic, MicOff, Globe } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import toast from 'react-hot-toast'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  agent: Agent | typeof import('@/types').PREBUILT_AGENTS[0]
  agentId?: string
}

// Extend window type for SpeechRecognition cross-browser
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

export default function AgentRunner({ agent, agentId }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `নমস্কার! আমি **${agent.name_bn || agent.name}**। ${agent.description_bn || agent.description}\n\nআপনাকে কীভাবে সাহায্য করতে পারি?`,
    },
  ])
  const [input, setInput]             = useState('')
  const [loading, setLoading]         = useState(false)

  // ── Voice state ─────────────────────────────────────────────
  const [isListening, setIsListening] = useState(false)
  const [voiceLang, setVoiceLang]     = useState<'bn-IN' | 'en-IN'>('bn-IN')
  const [voiceSupported, setVoiceSupported] = useState(true)
  const recognitionRef                = useRef<any>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef    = useRef<HTMLTextAreaElement>(null)

  // Check browser support on mount
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) setVoiceSupported(false)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const quickReplies: Record<string, string[]> = {
    business:    ['আজকের বিক্রি কত?',    'স্টক চেক করো',           'বাকির হিসাব দেখাও',    'এই মাসের লাভ কত?'  ],
    education:   ['পড়ার রুটিন বানাও',    'কোন subject আগে পড়ব?',  'সময় বাঁচানোর উপায়',   'পরীক্ষার tips দাও' ],
    festival:    ['বাজেট কত হলো?',       'কাজের তালিকা দেখাও',    'স্পনসর কারা আছেন?',    'কতদিন বাকি?'       ],
    finance:     ['এই মাসের খরচ?',       'সঞ্চয় কীভাবে বাড়াবো?', 'বাজেট plan বানাও',      'EMI হিসাব করো'     ],
    health:      ['আজকের ওষুধ?',         'appointment কবে?',        'স্বাস্থ্য tips দাও',    'রিপোর্ট দেখাও'     ],
    agriculture: ['এই মাসের কাজ কী?',   'ফসলের দাম কত?',          'আবহাওয়া কেমন?',        'সার কতটুকু দেব?'  ],
    service:     ['আজকের কাজ কী?',      'payment বাকি কত?',        'স্টক চেক করো',          'মাসের আয় কত?'     ],
  }

  const qr = quickReplies[agent.category] || []

  // ── Send message (unchanged logic) ──────────────────────────
  const sendMessage = async (text?: string) => {
    const msg = text || input.trim()
    if (!msg || loading) return

    setInput('')
    const newMessages: Message[] = [...messages, { role: 'user', content: msg }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          systemPrompt: agent.system_prompt,
          agentId,
        }),
      })

      if (!res.ok) throw new Error('Failed to get response')

      const data = await res.json()
      setMessages([...newMessages, { role: 'assistant', content: data.content }])
    } catch {
      toast.error('উত্তর পেতে সমস্যা হয়েছে। আবার চেষ্টা করুন।')
      setMessages(newMessages.slice(0, -1))
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // ── Voice: start listening ───────────────────────────────────
  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      toast.error('আপনার browser voice input support করে না।')
      return
    }

    // Stop any existing session
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }

    const recognition = new SR()
    recognitionRef.current = recognition

    recognition.lang          = voiceLang
    recognition.interimResults = true
    recognition.maxAlternatives = 1
    recognition.continuous    = false

    recognition.onstart = () => setIsListening(true)

    recognition.onresult = (event: any) => {
      let transcript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }
      setInput(transcript)
    }

    recognition.onerror = (event: any) => {
      setIsListening(false)
      if (event.error === 'not-allowed') {
        toast.error('Microphone permission দিন। Browser settings থেকে allow করুন।')
      } else if (event.error === 'no-speech') {
        toast.error('কোনো কথা শোনা যায়নি। আবার চেষ্টা করুন।')
      } else {
        toast.error('Voice input-এ সমস্যা হয়েছে।')
      }
    }

    recognition.onend = () => {
      setIsListening(false)
      // Auto-send if there's a transcript
      setInput(prev => {
        if (prev.trim()) {
          setTimeout(() => sendMessage(prev.trim()), 100)
        }
        return prev
      })
    }

    recognition.start()
  }, [voiceLang])

  // ── Voice: stop listening ────────────────────────────────────
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsListening(false)
  }, [])

  // ── Cleanup on unmount ───────────────────────────────────────
  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.abort()
    }
  }, [])

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-gray-200 overflow-hidden h-[600px]">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="bg-gray-900 px-5 py-4 flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: agent.color }}
        >
          {agent.icon}
        </div>
        <div>
          <div className="font-bold text-white text-[14px]">{agent.name_bn || agent.name}</div>
          <div className="text-emerald-400 text-[11px] flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block" />
            Online · Ready to help
          </div>
        </div>

        {/* Voice language toggle in header */}
        {voiceSupported && (
          <div className="ml-auto flex items-center gap-1.5 bg-gray-800 rounded-lg p-1">
            <Globe size={12} className="text-gray-400 ml-1" />
            <button
              onClick={() => setVoiceLang('bn-IN')}
              className={`text-[11px] font-semibold px-2 py-1 rounded-md transition-colors bengali ${
                voiceLang === 'bn-IN'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              বাংলা
            </button>
            <button
              onClick={() => setVoiceLang('en-IN')}
              className={`text-[11px] font-semibold px-2 py-1 rounded-md transition-colors ${
                voiceLang === 'en-IN'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              EN
            </button>
          </div>
        )}

        {!voiceSupported && <Bot className="text-gray-500 ml-auto" size={18} />}
      </div>

      {/* ── Messages ───────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            {msg.role === 'assistant' && (
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-sm mr-2 mt-1 flex-shrink-0"
                style={{ background: agent.color }}
              >
                {agent.icon}
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed bengali ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-sm'
                  : 'bg-gray-50 text-gray-800 border border-gray-100 rounded-bl-sm'
              }`}
            >
              {msg.role === 'assistant' ? (
                <ReactMarkdown className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5">
                  {msg.content}
                </ReactMarkdown>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start animate-fade-in">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-sm mr-2 flex-shrink-0"
              style={{ background: agent.color }}
            >
              {agent.icon}
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1.5 items-center">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Quick replies ──────────────────────────────────────── */}
      {qr.length > 0 && messages.length <= 2 && (
        <div className="px-4 py-2 border-t border-gray-100 flex gap-2 flex-wrap bg-gray-50">
          {qr.map(q => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="text-xs font-medium px-3 py-1.5 rounded-full border border-gray-200 bg-white hover:border-indigo-300 hover:text-indigo-600 transition-colors bengali"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* ── Input bar ─────────────────────────────────────────── */}
      <div className="p-3 border-t border-gray-100 flex gap-2 items-end">

        {/* Voice mic button */}
        {voiceSupported && (
          <button
            onClick={isListening ? stopListening : startListening}
            disabled={loading}
            title={isListening ? 'বন্ধ করুন' : `${voiceLang === 'bn-IN' ? 'বাংলায়' : 'English-এ'} বলুন`}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${
              isListening
                ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }`}
          >
            {isListening
              ? <MicOff size={16} className="text-white" />
              : <Mic size={16} />
            }
          </button>
        )}

        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isListening
            ? (voiceLang === 'bn-IN' ? 'বলুন... (শুনছি)' : 'Speak now... (listening)')
            : 'বাংলায় লিখুন বা মাইক্রোফোনে বলুন...'
          }
          rows={1}
          disabled={loading || isListening}
          className={`flex-1 resize-none rounded-xl border px-4 py-2.5 text-[14px] focus:outline-none focus:ring-2 bengali disabled:opacity-50 max-h-[120px] transition-colors ${
            isListening
              ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-50'
              : 'border-gray-200 focus:border-indigo-400 focus:ring-indigo-50'
          }`}
          style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }}
        />

        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors flex-shrink-0"
        >
          <Send size={16} className="text-white" />
        </button>
      </div>

      {/* Listening status bar */}
      {isListening && (
        <div className="bg-red-50 border-t border-red-100 px-4 py-2 flex items-center gap-2">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse flex-shrink-0" />
          <span className="text-xs text-red-600 bengali font-medium">
            {voiceLang === 'bn-IN' ? 'বাংলায় বলুন...' : 'Speak in English...'}
          </span>
          <button onClick={stopListening} className="ml-auto text-xs text-red-500 hover:text-red-700 bengali">
            বন্ধ করুন
          </button>
        </div>
      )}
    </div>
  )
}
