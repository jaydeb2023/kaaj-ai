import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { messages, systemPrompt, agentId } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages' }, { status: 400 })
    }

    // Build message history for Claude (skip the initial assistant greeting)
    const history = messages
      .filter((_: any, i: number) => i > 0) // skip initial greeting
      .map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt || `You are a helpful AI assistant for Bengali users. Always respond in Bengali (বাংলা). Be practical, friendly, and culturally aware of Bengali context.`,
      messages: history.length > 0 ? history : [{ role: 'user', content: messages[messages.length - 1]?.content || 'হ্যালো' }],
    })

    const content = response.content[0]?.type === 'text' ? response.content[0].text : 'দুঃখিত, উত্তর দিতে পারছি না।'

    return NextResponse.json({ content })
  } catch (error: any) {
    console.error('Chat API error:', error)

    if (error?.status === 401) {
      return NextResponse.json({ error: 'API key invalid' }, { status: 401 })
    }

    return NextResponse.json(
      { content: 'দুঃখিত, এই মুহূর্তে উত্তর দিতে পারছি না। আবার চেষ্টা করুন।' },
      { status: 200 }
    )
  }
}
