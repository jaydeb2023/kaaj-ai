import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabaseServer'
import { PREBUILT_AGENTS } from '@/types'
import AgentRunner from '@/components/AgentRunner'
import { ArrowLeft, Share2, Users } from 'lucide-react'
import Link from 'next/link'

interface Props {
  params: { id: string }
}

export default async function AgentDetailPage({ params }: Props) {
  // First check prebuilt agents by index
  const prebuiltIndex = parseInt(params.id)
  let agent: any = null

  if (!isNaN(prebuiltIndex) && prebuiltIndex >= 0 && prebuiltIndex < PREBUILT_AGENTS.length) {
    agent = { ...PREBUILT_AGENTS[prebuiltIndex], id: params.id }
  } else {
    // Try fetching from Supabase
    try {
      const supabase = createServerClient()
      const { data } = await supabase
        .from('agents')
        .select('*')
        .eq('id', params.id)
        .single()
      agent = data
    } catch {
      // fallback to first prebuilt
      agent = { ...PREBUILT_AGENTS[0], id: params.id }
    }
  }

  if (!agent) notFound()

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back */}
        <Link href="/library" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-sm mb-6 transition-colors">
          <ArrowLeft size={15} /> Library-তে ফিরুন
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Agent info */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-6" style={{ borderTop: `3px solid ${agent.color}` }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-4" style={{ background: agent.color }}>
                {agent.icon}
              </div>
              <h1 className="font-extrabold text-gray-900 text-xl mb-1">{agent.name}</h1>
              {agent.name_bn && <p className="text-indigo-600 font-bold bengali mb-3">{agent.name_bn}</p>}
              <p className="text-gray-500 text-[14px] leading-relaxed bengali">{agent.description_bn || agent.description}</p>

              <div className="border-t border-gray-100 mt-4 pt-4 flex items-center gap-2 text-gray-400 text-xs">
                <Users size={12} />
                <span>{(agent.use_count || 0).toLocaleString()}+ conversations</span>
              </div>
            </div>

            {/* Share */}
            <button className="w-full flex items-center justify-center gap-2 py-3 border border-gray-200 bg-white hover:bg-gray-50 rounded-xl text-sm font-medium text-gray-600 transition-colors">
              <Share2 size={15} /> Share করুন
            </button>

            {/* Tips */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
              <h4 className="font-bold text-indigo-800 text-[13px] mb-2">💬 কীভাবে ব্যবহার করবেন</h4>
              <ul className="space-y-1.5 text-indigo-700 text-[12px] bengali">
                <li>• বাংলায় সরাসরি প্রশ্ন করুন</li>
                <li>• হিসাব-নিকাশ জিজ্ঞেস করুন</li>
                <li>• তথ্য দিন, সে মনে রাখবে</li>
                <li>• সমস্যা বললে সমাধান দেবে</li>
              </ul>
            </div>
          </div>

          {/* Chat runner */}
          <div className="lg:col-span-2">
            <AgentRunner agent={agent} agentId={params.id} />
          </div>
        </div>
      </div>
    </div>
  )
}
