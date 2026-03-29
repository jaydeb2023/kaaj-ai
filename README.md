# Kaaj AI — কাজ AI

**Bengali-first AI Agent Platform** for West Bengal and Bangladesh.

> Create powerful AI agents in natural Bengali. For shop owners, students, families, and communities.

---

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/kaaj-ai.git
cd kaaj-ai
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your keys:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Supabase Setup

1. Go to [supabase.com](https://supabase.com) → New Project
2. Go to **SQL Editor** → paste contents of `supabase/migrations/001_initial_schema.sql` → Run
3. Copy your **Project URL** and **anon key** from Settings → API

### 4. Anthropic API

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create API key → copy it to `.env.local`

### 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel

### One-click deploy:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### Manual:

```bash
npm install -g vercel
vercel
```

Add environment variables in Vercel Dashboard → Settings → Environment Variables.

---

## Project Structure

```
kaaj-ai/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing page
│   │   ├── library/page.tsx      # Agent marketplace
│   │   ├── agents/
│   │   │   ├── new/page.tsx      # Create agent
│   │   │   └── [id]/page.tsx     # Run agent
│   │   ├── dashboard/page.tsx    # User dashboard
│   │   ├── login/page.tsx        # Auth
│   │   └── api/
│   │       ├── chat/route.ts     # Claude AI chat endpoint
│   │       └── agents/route.ts   # Agent CRUD
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── AgentCard.tsx
│   │   ├── AgentRunner.tsx       # Chat interface
│   │   └── AgentBuilderForm.tsx  # Create agent form
│   ├── lib/
│   │   ├── supabaseClient.ts
│   │   ├── supabaseServer.ts
│   │   └── agentUtils.ts         # Prompt builder
│   └── types/index.ts            # TypeScript types + prebuilt agents
└── supabase/
    └── migrations/001_initial_schema.sql
```

---

## Features

- **Bengali-first**: All UI and AI responses in natural Bengali
- **Agent Builder**: Describe in Bengali → AI creates structured agent
- **Agent Runner**: Real-time chat with Claude AI
- **Library**: Pre-built agents (Dokan Manager, Porashona Sahayak, etc.)
- **Dashboard**: Manage your agents
- **Supabase Auth**: Email/password authentication
- **Persistent Memory**: Conversations saved per agent

## Prebuilt Agents

| Agent | Category | Use Case |
|-------|----------|----------|
| দোকান ম্যানেজার | Business | Shop sales, stock, credit tracking |
| পড়াশোনা সহায়ক | Education | Exam prep, study planning |
| পূজা অর্গানাইজার | Festival | Festival budget, committee tasks |
| বাজেট সহায়ক | Finance | Family budget, savings advice |

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **AI**: Anthropic Claude (`claude-sonnet-4-20250514`)
- **Deployment**: Vercel

---

Made with ❤️ for West Bengal & Bangladesh
