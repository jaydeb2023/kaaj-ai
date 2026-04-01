import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms & Conditions — Sahayak AI',
  description: 'Sahayak AI ব্যবহারের শর্তাবলী',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Terms & Conditions</h1>
            <p className="text-gray-500 bengali">ব্যবহারের শর্তাবলী</p>
            <p className="text-xs text-gray-400 mt-2">Last updated: April 2026</p>
          </div>

          <div className="prose prose-gray max-w-none space-y-8 text-[15px] leading-relaxed">

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">1. Acceptance of Terms</h2>
              <p className="text-gray-600">By accessing and using Sahayak AI (sahayakai.tech), you agree to be bound by these Terms and Conditions. If you do not agree, please do not use the service. These terms apply to all users including individuals and business owners in West Bengal, Bangladesh, and elsewhere.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">2. Service Description</h2>
              <p className="text-gray-600 bengali">Sahayak AI একটি Bengali-first AI agent platform যা ছোট ও মাঝারি ব্যবসার জন্য তৈরি। আমরা AI-powered chatbots, business management tools, এবং report generation সুবিধা প্রদান করি।</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">3. Free Tier & Paid Services</h2>
              <p className="text-gray-600">Core features of Sahayak AI are free to use. We may introduce premium features in the future with prior notice. We will never charge you without your explicit consent.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">4. User Responsibilities</h2>
              <ul className="list-disc pl-5 text-gray-600 space-y-2">
                <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                <li>You agree not to use the service for any illegal or harmful purpose.</li>
                <li>You agree not to share false, misleading, or defamatory content through the platform.</li>
                <li>You are responsible for the accuracy of business data you enter into the system.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">5. AI Limitations</h2>
              <p className="text-gray-600 bengali">Sahayak AI একটি AI-powered tool। AI-এর দেওয়া পরামর্শ সবসময় ১০০% সঠিক নাও হতে পারে। ব্যবসায়িক, আইনি, বা চিকিৎসা সংক্রান্ত গুরুত্বপূর্ণ সিদ্ধান্তের ক্ষেত্রে সর্বদা বিশেষজ্ঞের পরামর্শ নিন।</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">6. Data & Privacy</h2>
              <p className="text-gray-600">We collect and use data as described in our Privacy Policy. Your business data is stored securely and is never sold to third parties. Conversation data may be used in anonymized form to improve our AI models.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">7. Intellectual Property</h2>
              <p className="text-gray-600">All content, branding, and technology of Sahayak AI is owned by Debjay Sarader. You retain ownership of the data and content you create using our platform.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">8. Termination</h2>
              <p className="text-gray-600">We reserve the right to suspend or terminate accounts that violate these terms. You may delete your account at any time from the dashboard settings.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">9. Changes to Terms</h2>
              <p className="text-gray-600">We may update these terms from time to time. We will notify users of significant changes via email or a notice on the platform. Continued use after changes constitutes acceptance.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">10. Contact</h2>
              <p className="text-gray-600">For questions about these terms, please contact us at <a href="/contact" className="text-indigo-600 hover:underline">our contact page</a> or email us directly.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
