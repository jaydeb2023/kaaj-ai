import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Blog — Sahayak AI',
  description: 'Sahayak AI blog — Bengali business tips, AI guides, and product updates',
}

const POSTS = [
  {
    slug: '#',
    category: 'গাইড',
    categoryColor: 'bg-indigo-50 text-indigo-700',
    date: 'এপ্রিল ২০২৬',
    title: 'আপনার মুদি দোকানের হিসাব AI দিয়ে কীভাবে রাখবেন',
    excerpt: 'Dokan Manager agent ব্যবহার করে রোজের বিক্রি, স্টক এবং বাকির হিসাব কীভাবে মাত্র ৫ মিনিটে রাখবেন — সম্পূর্ণ বাংলায়।',
    readTime: '৫ মিনিট',
    icon: '🏪',
  },
  {
    slug: '#',
    category: 'Tips',
    categoryColor: 'bg-emerald-50 text-emerald-700',
    date: 'এপ্রিল ২০২৬',
    title: 'ফার্মেসিতে ওষুধের মেয়াদ track করার সহজ উপায়',
    excerpt: 'Pharmacy Assistant agent কীভাবে expiry alert দেয়, supplier reorder remind করে — একটি ফার্মেসি মালিকের real experience।',
    readTime: '৪ মিনিট',
    icon: '💊',
  },
  {
    slug: '#',
    category: 'Product Update',
    categoryColor: 'bg-amber-50 text-amber-700',
    date: 'এপ্রিল ২০২৬',
    title: 'নতুন feature: বাংলায় voice input এখন available',
    excerpt: 'এখন থেকে টাইপ না করেও AI-এর সাথে কথা বলতে পারবেন — বাংলায় বা ইংরেজিতে। কীভাবে ব্যবহার করবেন জানুন।',
    readTime: '৩ মিনিট',
    icon: '🎤',
  },
  {
    slug: '#',
    category: 'ব্যবসা',
    categoryColor: 'bg-purple-50 text-purple-700',
    date: 'মার্চ ২০২৬',
    title: 'পূজা কমিটির বাজেট ম্যানেজ করুন AI দিয়ে',
    excerpt: 'দুর্গাপূজার বাজেট ট্র্যাকিং, স্পনসর ম্যানেজমেন্ট, এবং কমিটির কাজ — সব এক জায়গায় বাংলায়।',
    readTime: '৬ মিনিট',
    icon: '🌺',
  },
  {
    slug: '#',
    category: 'গাইড',
    categoryColor: 'bg-indigo-50 text-indigo-700',
    date: 'মার্চ ২০২৬',
    title: 'BHASHINI কী এবং কেন এটি Bengali AI-এর ভবিষ্যৎ',
    excerpt: 'ভারত সরকারের Bengali voice model BHASHINI কীভাবে কাজ করে এবং কীভাবে এটি বাংলার ব্যবসায়ীদের সাহায্য করবে।',
    readTime: '৭ মিনিট',
    icon: '🎙️',
  },
  {
    slug: '#',
    category: 'Tips',
    categoryColor: 'bg-emerald-50 text-emerald-700',
    date: 'ফেব্রুয়ারি ২০২৬',
    title: 'কোচিং সেন্টারের fee collection আর miss হবে না',
    excerpt: 'Coaching Centre Manager agent দিয়ে কোন ছাত্র কবে ফি দিয়েছে, কার বাকি আছে — সব real-time track করুন।',
    readTime: '৪ মিনিট',
    icon: '📚',
  },
]

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 py-14 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-3 bengali">Blog & Updates</h1>
          <p className="text-gray-500 bengali text-lg">Bengali ব্যবসার টিপস, AI গাইড, এবং product আপডেট</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">

        {/* Featured post */}
        <div className="bg-indigo-600 rounded-2xl p-8 mb-8 text-white">
          <div className="flex items-start gap-4">
            <div className="text-4xl flex-shrink-0">{POSTS[0].icon}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold px-3 py-1 bg-indigo-500 rounded-full">{POSTS[0].category}</span>
                <span className="text-indigo-300 text-xs">{POSTS[0].date}</span>
              </div>
              <h2 className="text-2xl font-extrabold mb-3 bengali">{POSTS[0].title}</h2>
              <p className="text-indigo-200 bengali text-sm leading-relaxed mb-4">{POSTS[0].excerpt}</p>
              <div className="flex items-center gap-4">
                <span className="text-indigo-300 text-xs">{POSTS[0].readTime} পড়তে হবে</span>
                <Link href={POSTS[0].slug} className="flex items-center gap-1 text-white text-sm font-semibold hover:gap-2 transition-all">
                  পড়ুন <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Post grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {POSTS.slice(1).map((post, i) => (
            <Link key={i} href={post.slug}
              className="group bg-white rounded-2xl border border-gray-200 p-6 hover:border-indigo-300 hover:shadow-md transition-all">
              <div className="text-3xl mb-4">{post.icon}</div>
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${post.categoryColor}`}>{post.category}</span>
                <span className="text-gray-400 text-xs bengali">{post.date}</span>
              </div>
              <h3 className="font-bold text-gray-900 text-[15px] mb-2 bengali leading-snug">{post.title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed bengali line-clamp-3 mb-4">{post.excerpt}</p>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-xs bengali">{post.readTime} পড়তে হবে</span>
                <span className="text-indigo-600 text-xs font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                  পড়ুন <ArrowRight size={11} />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Coming soon note */}
        <div className="mt-10 bg-white rounded-2xl border border-gray-200 p-6 text-center">
          <p className="text-gray-500 bengali text-sm">আরো blog post আসছে শীঘ্রই। নতুন post-এর notification পেতে আমাদের follow করুন।</p>
        </div>
      </div>
    </div>
  )
}
