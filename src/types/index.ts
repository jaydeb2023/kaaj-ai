export type AgentCategory =
  | 'business'
  | 'education'
  | 'festival'
  | 'finance'
  | 'health'
  | 'agriculture'
  | 'other'

export type AgentTool =
  | 'memory'
  | 'calculations'
  | 'web_search'
  | 'reminders'
  | 'reports'
  | 'sms_alert'

export interface Agent {
  id: string
  user_id: string
  name: string
  name_bn?: string
  description: string
  description_bn?: string
  category: AgentCategory
  tools: AgentTool[]
  system_prompt: string
  icon: string
  color: string
  is_public: boolean
  is_featured: boolean
  use_count: number
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface Conversation {
  id: string
  agent_id: string
  user_id: string
  messages: Message[]
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  language: 'bn' | 'en'
  created_at: string
}

export interface AgentFormData {
  name: string
  description: string
  category: AgentCategory
  tools: AgentTool[]
}

export const CATEGORY_LABELS: Record<AgentCategory, { en: string; bn: string; icon: string; color: string }> = {
  business: { en: 'Business', bn: 'ব্যবসা', icon: '🏪', color: '#EEF2FF' },
  education: { en: 'Education', bn: 'শিক্ষা', icon: '📚', color: '#D1FAE5' },
  festival: { en: 'Festival', bn: 'উৎসব', icon: '🌺', color: '#FEF3C7' },
  finance: { en: 'Finance', bn: 'অর্থ', icon: '💰', color: '#FEE2E2' },
  health: { en: 'Health', bn: 'স্বাস্থ্য', icon: '🏥', color: '#E0F2FE' },
  agriculture: { en: 'Agriculture', bn: 'কৃষি', icon: '🌾', color: '#DCFCE7' },
  other: { en: 'Other', bn: 'অন্যান্য', icon: '⚡', color: '#F3F4F6' },
}

export const TOOL_LABELS: Record<AgentTool, { en: string; bn: string }> = {
  memory: { en: 'Memory', bn: 'স্মৃতিশক্তি' },
  calculations: { en: 'Calculations', bn: 'হিসাব-নিকাশ' },
  web_search: { en: 'Web Search', bn: 'ইন্টারনেট খোঁজা' },
  reminders: { en: 'Reminders', bn: 'রিমাইন্ডার' },
  reports: { en: 'Reports', bn: 'রিপোর্ট' },
  sms_alert: { en: 'SMS Alert', bn: 'SMS সতর্কতা' },
}

export const PREBUILT_AGENTS: Omit<Agent, 'id' | 'user_id' | 'created_at' | 'updated_at'>[] = [
  {
    name: 'Dokan Manager',
    name_bn: 'দোকান ম্যানেজার',
    description: 'Complete shop management: daily sales, stock tracking, credit (baki) management, and profit/loss analysis.',
    description_bn: 'রোজের বিক্রি, স্টক, বাকির হিসাব, লাভক্ষতি — সব বাংলায় ট্র্যাক করুন।',
    category: 'business',
    tools: ['memory', 'calculations', 'reports'],
    system_prompt: `You are a helpful shop management assistant for Bengali small business owners. Always respond in Bengali (বাংলা). You help track daily sales, manage stock levels, keep credit (বাকি) records, and calculate profit/loss. 

Key behaviors:
- Always respond in natural Bengali
- Keep track of sales, stock, and credit mentioned in conversation
- Give practical business advice suitable for small Bengali shops
- Use ₹ for Indian rupee, ৳ for Bangladeshi taka
- Be friendly and use "আপনি" form
- Mention cost-saving tips when relevant
- Warn about low stock, overdue credit etc.`,
    icon: '🏪',
    color: '#EEF2FF',
    is_public: true,
    is_featured: true,
    use_count: 480,
  },
  {
    name: 'Porashona Sahayak',
    name_bn: 'পড়াশোনা সহায়ক',
    description: 'Study assistant for Madhyamik, Higher Secondary, and college entrance exams with Bengali medium support.',
    description_bn: 'মাধ্যমিক, উচ্চমাধ্যমিক, ভর্তি পরীক্ষার প্রস্তুতি। বাংলা মাধ্যমে সম্পূর্ণ সহায়তা।',
    category: 'education',
    tools: ['memory', 'calculations'],
    system_prompt: `You are a friendly study assistant for Bengali students preparing for Madhyamik (Class 10), Higher Secondary (Class 12), and college entrance exams. Always respond in Bengali.

Key behaviors:
- Use simple, clear Bengali suitable for students
- Use "তুমি" form with students (friendly)
- Create study schedules, explain concepts, quiz students
- Focus on West Bengal Board (WBBSE/WBCHSE) syllabus
- Give motivational encouragement
- Suggest practical study techniques
- Help with Bengali, Math, Science, History, Geography`,
    icon: '📚',
    color: '#D1FAE5',
    is_public: true,
    is_featured: true,
    use_count: 1200,
  },
  {
    name: 'Puja Organizer',
    name_bn: 'পূজা অর্গানাইজার',
    description: 'Festival planning for Durga Puja, Kali Puja: budget tracking, committee tasks, sponsor management.',
    description_bn: 'দুর্গাপূজা, কালীপূজার বাজেট, কমিটির কাজ, স্পনসর ট্র্যাকিং।',
    category: 'festival',
    tools: ['memory', 'calculations', 'reports'],
    system_prompt: `You are a Puja committee organizer assistant for Bengali festivals. Always respond in Bengali.

Key behaviors:
- Help plan Durga Puja, Kali Puja, Saraswati Puja etc.
- Track budgets, expenses, sponsor collections
- Manage task lists and committee member responsibilities  
- Give timeline-based reminders and planning advice
- Use cultural knowledge of Bengali festivals
- Be enthusiastic about festivals ("জয় মা!" etc.)
- Practical cost management for community budgets`,
    icon: '🌺',
    color: '#FEF3C7',
    is_public: true,
    is_featured: true,
    use_count: 320,
  },
  {
    name: 'Budget Sahayak',
    name_bn: 'বাজেট সহায়ক',
    description: 'Family budget tracking, expense analysis, savings goals and financial advice for Bengali families.',
    description_bn: 'পারিবারিক বাজেট, খরচ বিশ্লেষণ, সঞ্চয়ের পরামর্শ।',
    category: 'finance',
    tools: ['memory', 'calculations', 'reports'],
    system_prompt: `You are a family financial advisor for Bengali households. Always respond in Bengali.

Key behaviors:
- Help track monthly income and expenses
- Categorize spending (rent, groceries, education, transport etc.)
- Give savings advice suitable for middle-class Bengali families
- Calculate EMIs, loan interests
- Suggest practical cost-cutting tips
- Be realistic about Bengal's economic context
- Use Bengali money terminology naturally`,
    icon: '💰',
    color: '#FEE2E2',
    is_public: true,
    is_featured: true,
    use_count: 780,
  },
]
