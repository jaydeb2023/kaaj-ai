import { AgentCategory, AgentTool, AgentFormData } from '@/types'

export function buildSystemPrompt(data: AgentFormData): string {
  const toolInstructions: Record<AgentTool, string> = {
    memory: '- Remember all information shared in the conversation and refer back to it',
    calculations: '- Perform accurate calculations for money, quantities, percentages etc.',
    web_search: '- You can reference current information when asked',
    reminders: '- Help set up reminders and follow-up tasks',
    reports: '- Generate structured summaries and reports when asked',
    sms_alert: '- Mention when SMS alerts should be sent for critical events',
  }

  const categoryContext: Record<AgentCategory, string> = {
    business: 'Bengali small business context: shops, markets, inventory, credit (বাকি), profit/loss',
    education: 'Bengali student context: school exams, coaching, study planning, Bengali medium',
    festival: 'Bengali festival context: Durga Puja, Kali Puja, community organizing, budgets',
    finance: 'Bengali family finance: household budget, savings, EMI, middle-class context',
    health: 'Bengali healthcare: medicine reminders, doctor visits, health tracking',
    agriculture: 'Bengali farming: crop planning, market prices, weather, government schemes',
    other: 'General Bengali context',
    service: 'Bengali service context: customer service, enquiries, ticketing, issue resolution',
  }

  const activeToolInstructions = data.tools
    .map(t => toolInstructions[t])
    .join('\\n')

  return `You are a helpful AI assistant named "${data.name}" created on Kaaj AI (কাজ AI).

DESCRIPTION: ${data.description}

CONTEXT: ${categoryContext[data.category]}

LANGUAGE RULES:
- ALWAYS respond in Bengali (বাংলা) unless the user writes in English
- Use natural, conversational Bengali — not overly formal
- Mix English technical terms naturally when needed (like "stock", "budget", "EMI")
- Use "আপনি" form (respectful) by default

CAPABILITIES:
${activeToolInstructions}

PERSONALITY:
- Warm, helpful, practical — like a knowledgeable friend
- Give realistic advice for Bengali context
- Be concise but thorough
- Use Bengali cultural knowledge naturally
- When relevant, mention cost-saving tips and risk warnings

MANAGEMENT KNOWLEDGE:
- Always consider practical constraints (power cuts, payment delays, festival seasons)
- Give step-by-step actionable advice
- Warn about common risks in Bengali business/family context
- Suggest free or low-cost solutions first`
}

export async function generateAgentWithAI(data: AgentFormData): Promise<{
  name_bn: string
  description_bn: string
  system_prompt: string
  icon: string
  color: string
}> {
  const CATEGORY_ICONS: Record<AgentCategory, string> = {
    business: '🏪',
    education: '📚',
    festival: '🌺',
    finance: '💰',
    health: '🏥',
    agriculture: '🌾',
    other: '⚡',
    service: '🛠️',   // 👈 ADD THIS LINE
  }
 const CATEGORY_COLORS: Record<AgentCategory, string> = {
  business: '#EEF2FF',
  education: '#D1FAE5',
  festival: '#FEF3C7',
  finance: '#FEE2E2',
  health: '#E0F2FE',
  agriculture: '#DCFCE7',
  other: '#F3F4F6',
  service: '#F0F9FF',   // or any color you like
}

  return {
    name_bn: data.name,
    description_bn: data.description,
    system_prompt: buildSystemPrompt(data),
    icon: CATEGORY_ICONS[data.category],
    color: CATEGORY_COLORS[data.category],
  }
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
