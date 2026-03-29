import Link from 'next/link'
import { PREBUILT_AGENTS, CATEGORY_LABELS } from '@/types'
import { ArrowRight, Users, Star, Zap, Shield, Globe } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* HERO */}
      <section className="bg-white border-b border-gray-200 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-semibold px-4 py-2 rounded-full border border-indigo-100 mb-8">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
            ১০০% বিনামূল্যে · Bengali-first AI Platform · West Bengal &amp; Bangladesh
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-4">
            আপনার ব্যবসার জন্য
            <span className="block text-indigo-600 bengali mt-2">AI এজেন্ট, বাংলায়</span>
          </h1>

          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 bengali leading-relaxed">
            দোকান মালিক, কোচিং সেন্টার, পূজা কমিটি — সবার জন্য।
            <br />বাংলায় বলুন, AI কাজ করবে। কোনো coding লাগবে না।
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/agents/new"
              className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg rounded-2xl transition-colors shadow-lg shadow-indigo-100"
            >
              বিনামূল্যে শুরু করুন
              <ArrowRight size={20} />
            </Link>
            <Link
              href="/library"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-lg rounded-2xl border border-gray-200 transition-colors"
            >
              Library দেখুন
            </Link>
          </div>

          {/* Social proof mini */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-1.5"><Users size={15} className="text-indigo-400" /><span><strong className="text-gray-900">৪৮০+</strong> দোকান ব্যবহার করছে</span></div>
            <div className="flex items-center gap-1.5"><Star size={15} className="text-amber-400" /><span><strong className="text-gray-900">৪.৯/৫</strong> rating</span></div>
            <div className="flex items-center gap-1.5"><Globe size={15} className="text-emerald-400" /><span><strong className="text-gray-900">WB &amp; BD</strong> তে জনপ্রিয়</span></div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-gray-900">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-800">
          {[
            { n: '২,৪০০+', l: 'Agents তৈরি' },
            { n: '১৮,০০০+', l: 'Bengali ব্যবহারকারী' },
            { n: '৯৮%', l: 'Satisfaction rate' },
            { n: '১০০%', l: 'চিরকাল বিনামূল্যে' },
          ].map(s => (
            <div key={s.n} className="py-8 px-6 text-center">
              <div className="text-3xl font-extrabold text-white bengali">{s.n}</div>
              <div className="text-gray-400 text-sm mt-1 bengali">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PREBUILT AGENTS */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">সবচেয়ে জনপ্রিয় AI এজেন্ট</h2>
            <p className="text-gray-500 text-lg bengali">Real Bengali use cases — এখনই ব্যবহার করুন</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PREBUILT_AGENTS.map((agent, i) => {
              const cat = CATEGORY_LABELS[agent.category]
              return (
                <Link
                  key={i}
                  href="/library"
                  className="group bg-white rounded-2xl border border-gray-200 p-5 hover:border-indigo-300 hover:shadow-md transition-all"
                  style={{ borderTop: `3px solid ${agent.color}` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: agent.color }}>
                      {agent.icon}
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-600 bengali">{cat.bn}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-[15px] mb-0.5">{agent.name}</h3>
                  <p className="text-indigo-600 text-[13px] font-semibold mb-2 bengali">{agent.name_bn}</p>
                  <p className="text-gray-500 text-[13px] leading-relaxed mb-4 bengali line-clamp-2">{agent.description_bn}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 flex items-center gap-1"><Users size={11} />{agent.use_count}+ uses</span>
                    <span className="text-indigo-600 text-xs font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">চেষ্টা করুন <ArrowRight size={11} /></span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-gray-900 py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold text-white mb-3">মাত্র ৩ ধাপে শুরু করুন</h2>
          <p className="text-gray-400 text-lg mb-12 bengali">কোনো coding জ্ঞান লাগবে না</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { n: '১', t: 'বাংলায় বর্ণনা করুন', d: 'আপনার দরকার কী সেটা সহজ বাংলায় লিখুন। যেমন: "আমার মুদি দোকানের হিসাব রাখতে চাই।"' },
              { n: '২', t: 'AI এজেন্ট তৈরি হবে', d: 'আমাদের AI আপনার চাহিদা বুঝে স্বয়ংক্রিয়ভাবে একটি কাস্টম এজেন্ট তৈরি করবে।' },
              { n: '৩', t: 'বাংলায় chat করুন', d: 'আপনার এজেন্টের সাথে বাংলায় কথা বলুন। সে মনে রাখবে, হিসাব রাখবে, সাহায্য করবে।' },
            ].map(s => (
              <div key={s.n} className="bg-gray-800 border border-gray-700 rounded-2xl p-6 text-left">
                <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg mb-4 bengali">{s.n}</div>
                <h3 className="font-bold text-white text-[16px] mb-2 bengali">{s.t}</h3>
                <p className="text-gray-400 text-[14px] leading-relaxed bengali">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 px-4 bg-indigo-50 border-y border-indigo-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">ব্যবহারকারীরা কী বলছেন</h2>
            <p className="text-gray-500 bengali">কলকাতা ও বাংলাদেশের real users</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { q: '"আমার মুদি দোকানের বাকির হিসাব রাখা এখন অনেক সহজ। রোজ রাতে একবার বললেই সব হিসাব দিয়ে দেয়!"', name: 'রামপ্রসাদ মণ্ডল', role: 'মুদি দোকান মালিক, বালিগঞ্জ', init: 'রা' },
              { q: '"মাধ্যমিকের আগে পড়ার রুটিন বানাতে সাহায্য করেছে। বাংলায় সব বুঝিয়ে দেয়, English-এ কষ্ট নেই।"', name: 'সুপর্ণা দাস', role: 'ছাত্রী, Class X, হাওড়া', init: 'সু' },
              { q: '"পূজা কমিটির বাজেট ট্র্যাক করা এখন অনেক সহজ। স্পনসরের টাকা কোথায় গেল সব হিসাব থাকে।"', name: 'দেবাশিস চক্রবর্তী', role: 'পূজা কমিটি সম্পাদক, শ্রীরামপুর', init: 'দে' },
            ].map(t => (
              <div key={t.name} className="bg-white border border-indigo-100 rounded-2xl p-6">
                <div className="text-amber-400 text-sm mb-3">★★★★★</div>
                <p className="text-gray-700 text-[14px] leading-relaxed italic mb-5 bengali">{t.q}</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[13px] font-bold bengali">{t.init}</div>
                  <div>
                    <div className="font-bold text-gray-900 text-[13px] bengali">{t.name}</div>
                    <div className="text-gray-400 text-[11px] bengali">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">কেন Kaaj AI বেছে নেবেন?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: <Globe className="text-indigo-600" size={24} />, t: '১০০% বাংলায়', d: 'সম্পূর্ণ বাংলা ভাষায় কথা বলুন। Kolkata slang থেকে literary Bangla — সব বোঝে।' },
              { icon: <Shield className="text-emerald-600" size={24} />, t: 'চিরকাল বিনামূল্যে', d: 'Core features সবসময় free। কোনো hidden charge নেই। Credit card লাগবে না।' },
              { icon: <Zap className="text-amber-600" size={24} />, t: 'ব্যবসায়িক জ্ঞান', d: 'প্রতিটি এজেন্টে Bengal-এর ব্যবসায়িক বাস্তবতার জ্ঞান দেওয়া আছে।' },
            ].map(f => (
              <div key={f.t} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-4 shadow-sm border border-gray-100">{f.icon}</div>
                <h3 className="font-bold text-gray-900 text-[16px] mb-2 bengali">{f.t}</h3>
                <p className="text-gray-500 text-[14px] leading-relaxed bengali">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-indigo-600 py-20 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-extrabold text-white mb-4">আজই শুরু করুন</h2>
          <p className="text-indigo-200 text-lg mb-8 bengali">কোনো credit card লাগবে না। মাত্র ২ মিনিটে আপনার প্রথম AI এজেন্ট তৈরি করুন।</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/agents/new" className="px-8 py-4 bg-white hover:bg-gray-50 text-indigo-600 font-bold text-lg rounded-2xl transition-colors">
              বিনামূল্যে শুরু করুন →
            </Link>
            <Link href="/library" className="px-8 py-4 bg-transparent hover:bg-indigo-500 text-white font-semibold text-lg rounded-2xl border-2 border-indigo-400 transition-colors">
              Library দেখুন
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 py-10 px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">ক</div>
          <span className="text-white font-bold">Kaaj AI · কাজ AI</span>
        </div>
        <p className="text-gray-500 text-sm bengali">বাংলার জন্য, বাংলায় তৈরি · Made with ❤️ for West Bengal &amp; Bangladesh</p>
        <div className="flex justify-center gap-6 mt-4 text-gray-600 text-sm">
          <Link href="/library" className="hover:text-gray-400">Library</Link>
          <Link href="/agents/new" className="hover:text-gray-400">Build Agent</Link>
          <Link href="/dashboard" className="hover:text-gray-400">Dashboard</Link>
        </div>
      </footer>
    </div>
  )
}
