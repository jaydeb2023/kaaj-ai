import AgentBuilderForm from '@/components/AgentBuilderForm'
import { PREBUILT_AGENTS, CATEGORY_LABELS } from '@/types'
import Link from 'next/link'

export default function NewAgentPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
            নিজের এজেন্ট তৈরি করুন
          </h1>
          <p className="text-gray-500 bengali text-lg">
            বাংলায় বর্ণনা করুন — AI বাকি কাজ করবে
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Builder form */}
          <div className="lg:col-span-2">
            <AgentBuilderForm />
          </div>

          {/* Sidebar — templates */}
          <div className="space-y-4">
            <h3 className="font-bold text-gray-700 text-[13px] uppercase tracking-wide">জনপ্রিয় টেমপ্লেট</h3>
            {PREBUILT_AGENTS.slice(0, 4).map((agent, i) => {
              const cat = CATEGORY_LABELS[agent.category]
              return (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-indigo-300 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xl" style={{ background: agent.color }}>
                      {agent.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-900 text-[13px] truncate">{agent.name}</div>
                      <div className="text-indigo-600 text-[11px] font-semibold bengali">{agent.name_bn}</div>
                    </div>
                    <span className="text-xs text-gray-400">{agent.use_count}+</span>
                  </div>
                </div>
              )
            })}
            <Link href="/library" className="block text-center text-indigo-600 text-sm font-semibold py-3 border border-dashed border-indigo-200 rounded-xl hover:bg-indigo-50 transition-colors">
              সব এজেন্ট দেখুন →
            </Link>

            {/* Tips */}
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mt-4">
              <h4 className="font-bold text-amber-800 text-[13px] mb-2">💡 ভালো এজেন্ট তৈরির টিপস</h4>
              <ul className="space-y-1.5 text-amber-700 text-[12px] bengali">
                <li>• বিস্তারিত বর্ণনা দিলে ভালো এজেন্ট তৈরি হয়</li>
                <li>• আপনার ব্যবসার ধরন উল্লেখ করুন</li>
                <li>• কোন সমস্যা সমাধান করতে চান সেটা বলুন</li>
                <li>• Memory tool সবসময় রাখুন</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
