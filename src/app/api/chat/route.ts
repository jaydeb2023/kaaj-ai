import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { messages, systemPrompt } = await req.json()

    const history = messages
      .filter((_: any, i: number) => i > 0)
      .map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      }))

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1024,
        messages: [
          {
            role: 'system',
            content: systemPrompt || 'You are a helpful Bengali AI assistant. Always respond in Bengali.',
          },
          ...(history.length > 0 ? history : [{ role: 'user', content: messages[messages.length - 1]?.content || 'হ্যালো' }]),
        ],
      }),
    })

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || 'দুঃখিত, উত্তর দিতে পারছি না।'

    return NextResponse.json({ content })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { content: 'দুঃখিত, এই মুহূর্তে উত্তর দিতে পারছি না। আবার চেষ্টা করুন।' },
      { status: 200 }
    )
  }
}
