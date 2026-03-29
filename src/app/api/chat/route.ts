import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { messages, systemPrompt } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages' }, { status: 400 })
    }

    const history = messages
      .filter((_: any, i: number) => i > 0)
      .map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 1024,
      messages: [
        {
          role: 'system',
          content: systemPrompt || `You are a helpful AI assistant for Bengali users. Always respond in Bengali (বাংলা). Be practical, friendly, and culturally aware of Bengali context.`,
        },
        ...(history.length > 0
          ? history
          : [{ role: 'user' as const, content: messages[messages.length - 1]?.content || 'হ্যালো' }]),
      ],
    })

    const content = response.choices[0]?.message?.content || 'দুঃখিত, উত্তর দিতে পারছি না।'

    return NextResponse.json({ content })
  } catch (error: any) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { content: 'দুঃখিত, এই মুহূর্তে উত্তর দিতে পারছি না। আবার চেষ্টা করুন।' },
      { status: 200 }
    )
  }
}
