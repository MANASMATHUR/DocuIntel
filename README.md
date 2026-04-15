<p align="center">
  <h1 align="center">DocuIntel</h1>
  <p align="center">
    <strong>AI-powered contract analysis, risk assessment, and end-to-end legal workflow platform</strong>
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js" alt="Next.js"/>
  <img src="https://img.shields.io/badge/TypeScript-5.3-blue?style=for-the-badge&logo=typescript" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991?style=for-the-badge&logo=openai" alt="OpenAI"/>
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb" alt="MongoDB"/>
  <img src="https://img.shields.io/badge/Stripe-Billing-635BFF?style=for-the-badge&logo=stripe" alt="Stripe"/>
  <img src="https://img.shields.io/badge/Python-3.11-yellow?style=for-the-badge&logo=python" alt="Python"/>
</p>

---

## What is DocuIntel?

DocuIntel is a production-grade SaaS platform for legal contract analysis. Upload a PDF, DOCX, or TXT contract and get a full risk audit: clause-by-clause risk scoring, redline suggestions, negotiation simulations, branded PDF reports, and e-signature workflows. Built for legal teams, solo practitioners, and anyone who reviews contracts.

**Core workflow:**

1. Upload a contract
2. AI segments it into clauses and scores each one for risk
3. Get redline rewrites, rationale, and negotiation scenarios
4. Export a branded report, save approved clauses to your library, or send for signature via DocuSign

---

## Features

### Contract Analysis Engine
- Clause segmentation, per-clause risk scoring (critical/high/medium/low), redline generation, and rationale
- Negotiation simulator with three scenarios per high-risk clause (probability, financial impact, counterparty reaction)
- Interactive negotiation chat against AI-simulated opposing counsel
- Full pipeline instrumented with agent logs and latency tracking

### Authentication and Per-User Data
- Email/password signup and login with bcrypt hashing and JWT cookies
- One-click demo login for frictionless onboarding
- Password reset via time-limited email tokens (Resend)
- Every user sees only their own cases, settings, and stats

### Case Management
- Cases persisted to MongoDB with clauses, risks, redlines, reports, agent logs, and vector stats
- Star/favorite cases, rename titles, archive and restore
- Filter by risk level, search across all cases
- Export metadata as JSON

### Case Comparison
- Select any two of your cases and compare risk profiles side by side
- Delta table showing changes across severity levels
- Top risks breakdown for each case

### Clause Library
- Save approved clause templates with name, category, and tags
- Categories: Liability, Indemnification, Termination, Privacy, IP, Payment, Confidentiality
- Search and filter by category, copy text to clipboard

### Global Search
- Full-text search across all your cases, clauses, and risk rationales
- Results show matching snippets with context, tagged by type and severity
- Click any result to jump to the source case

### Branded PDF Export
- Professional HTML report with DocuIntel header, risk summary table, and clause analysis grid
- Severity badges, suggested redlines, and generation date
- Print-ready layout with proper page styling
- Plain text export also available

### Performance Intelligence
- Every analysis step records latency, success rate, and retrieval accuracy
- Intelligence tab shows live metrics from the analysis pipeline
- Agent logs show each step: document extraction, RAG ingestion, clause batches, completion

### Vector Store
- Documents chunked and embedded via OpenAI text-embedding-3-small into an in-memory vector store
- Indexed chunk count and embedding status visible in the Vector Store tab
- Persisted across hot reloads via global singleton

### Billing (Stripe)
- Three tiers: Free (5 analyses/month), Pro ($29/month unlimited), Team ($79/month)
- Stripe Checkout for subscription creation
- Stripe Webhook handler for `checkout.session.completed`, `invoice.paid`, `customer.subscription.deleted`
- Stripe Customer Portal for self-service subscription management
- Monthly usage counter with automatic reset on billing period renewal
- Paywall enforced at the API level before analysis runs

### Integrations

**Slack** - Paste your incoming webhook URL and get formatted notifications when an analysis completes. Shows risk emoji, clause count, and severity breakdown.

**Outgoing Webhooks (Zapier/n8n)** - Configure a webhook URL to receive POST events with case data and timestamps on each analysis. Use it to trigger downstream workflows: create Jira tickets, update spreadsheets, notify teams.

**Google Drive** - OAuth-based import. Connect your Drive, browse PDF/DOCX/TXT files, and import contracts directly without manual upload. Token auto-refresh handled.

**DocuSign** - OAuth-based e-signature flow. After reviewing redlines, send the contract directly for signature. Creates an envelope and sends to the recipient.

**Email Notifications (Resend)** - Password reset emails and analysis completion notifications with branded HTML templates.

### Python Backend (Optional)
A FastAPI backend in `autolawyer-mcp/` provides GPU-accelerated analysis with:
- **Agent Router**: Multi-provider model selection with token budgets and fallback
- **Clause GraphRAG**: Maps cross-references and dependencies between clauses
- **Semantic Cache**: ChromaDB-backed cache to skip redundant LLM calls
- **MCP Tools**: Clause segmenter, risk classifier, redline generator, report builder

---

## Architecture

```mermaid
flowchart TB
    subgraph Client["Client Layer"]
        Landing[Landing Page]
        Auth[Login / Signup]
        Dashboard[Dashboard]
        Pages[Cases, Compare, Library, Search, Billing, Integrations, Settings]
    end

    subgraph API["API Layer - Next.js"]
        Middleware[JWT Cookie Middleware]
        CasesAPI["/api/cases + /compare"]
        AuthAPI["/api/auth/*"]
        BillingAPI["/api/billing/*"]
        IntegrationsAPI["/api/integrations/*"]
        OtherAPI["/api/negotiate, /reports, /metrics, /search, /library"]
    end

    subgraph Services["Service Layer"]
        RiskEngine[Risk Engine + Agent Logs]
        AIService[AI Service - Multi-Provider]
        NegSim[Negotiation Simulator]
        DocProcessor[Document Processor]
        RAG[In-Memory Vector Store]
        Metrics[Metrics Manager]
        Notifications[Notification Service]
        PlanCheck[Plan Limit Check]
    end

    subgraph External["External Services"]
        OpenAI[OpenAI API]
        Stripe[Stripe Billing]
        Resend[Resend Email]
        SlackHook[Slack Webhooks]
        Google[Google Drive API]
        DocuSign[DocuSign API]
    end

    subgraph Storage["Storage"]
        MongoDB[(MongoDB Atlas)]
    end

    Client --> Middleware
    Middleware --> API
    CasesAPI --> PlanCheck
    PlanCheck --> RiskEngine
    RiskEngine --> AIService --> OpenAI
    RiskEngine --> DocProcessor
    RiskEngine --> NegSim
    RiskEngine --> RAG
    RiskEngine --> Metrics
    CasesAPI --> Notifications
    Notifications --> SlackHook
    Notifications --> Resend
    BillingAPI --> Stripe
    IntegrationsAPI --> Google
    IntegrationsAPI --> DocuSign
    API --> MongoDB
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 14, React 18, TypeScript | Dashboard, SSR, routing |
| **Styling** | Tailwind CSS, Framer Motion | Dark/light themes, animations |
| **Charts** | Recharts | Risk distribution donut chart |
| **AI** | OpenAI API (gpt-4o-mini) | Clause analysis, risk scoring, negotiation |
| **Embeddings** | OpenAI text-embedding-3-small | Semantic clause retrieval |
| **Database** | MongoDB Atlas + Mongoose | Users, cases, settings, templates, tokens |
| **Auth** | JWT (jose) + bcrypt | Cookie-based auth, password hashing |
| **Billing** | Stripe (checkout, webhooks, portal) | Subscription management, paywalling |
| **Email** | Resend | Password resets, analysis notifications |
| **Documents** | pdf-parse v1, mammoth | PDF and DOCX text extraction |
| **Integrations** | Slack, Google Drive, DocuSign | Notifications, import, e-signatures |
| **Python (opt)** | FastAPI, ChromaDB, sentence-transformers | GPU analysis, GraphRAG, semantic cache |

---

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- OpenAI API key

### 1. Clone and install

```bash
git clone https://github.com/MANASMATHUR/DocuIntel.git
cd DocuIntel/nextjs-app
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Required variables:

```env
OPENAI_API_KEY=your-openai-key
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/docuintel?retryWrites=true&w=majority
JWT_SECRET=your-random-secret-at-least-32-chars
```

Optional (enable as needed):

```env
# Stripe billing
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_TEAM_PRICE_ID=price_...

# Email (password reset, notifications)
RESEND_API_KEY=re_...

# Google Drive import
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# DocuSign e-signatures
DOCUSIGN_CLIENT_ID=...
DOCUSIGN_CLIENT_SECRET=...
```

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up or click "Try Demo" to start.

### 4. (Optional) Python backend

```bash
cd autolawyer-mcp
pip install -r requirements.txt
python api/api.py
```

---

## API Routes

### Auth
| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/register` | POST | Create account (email, password, name) |
| `/api/auth/login` | POST | Login or demo login (`{ demo: true }`) |
| `/api/auth/logout` | POST | Clear auth cookie |
| `/api/auth/me` | GET | Current user + stats + plan |
| `/api/auth/reset-password` | POST | Request password reset email |
| `/api/auth/reset-password/verify` | POST | Verify token + set new password |

### Cases
| Route | Method | Description |
|-------|--------|-------------|
| `/api/cases` | POST | Upload document, run analysis |
| `/api/cases` | GET | List user's cases |
| `/api/cases?case_id=xxx` | GET | Get single case |
| `/api/cases` | PATCH | Star/rename a case |
| `/api/cases/compare` | POST | Compare two cases |
| `/api/cases/[id]/download` | GET | Download case data |

### Features
| Route | Method | Description |
|-------|--------|-------------|
| `/api/negotiate` | POST | Interactive negotiation chat |
| `/api/reports` | POST | Generate branded HTML/TXT export |
| `/api/reports/share` | POST | Create shareable report link |
| `/api/search` | GET | Global search across cases and clauses |
| `/api/library` | GET/POST/DELETE | Clause template CRUD |
| `/api/metrics` | GET | Performance metrics |
| `/api/settings` | GET/POST | Per-user preferences |

### Billing
| Route | Method | Description |
|-------|--------|-------------|
| `/api/billing/checkout` | POST | Create Stripe Checkout session |
| `/api/billing/portal` | POST | Open Stripe Customer Portal |
| `/api/billing/webhook` | POST | Stripe webhook handler |

### Integrations
| Route | Method | Description |
|-------|--------|-------------|
| `/api/integrations` | GET/POST | Read/update integration settings |
| `/api/integrations/google/connect` | GET | Start Google Drive OAuth |
| `/api/integrations/google/callback` | GET | Google OAuth callback |
| `/api/integrations/google/files` | GET | List Drive files |
| `/api/integrations/docusign/connect` | GET | Start DocuSign OAuth |
| `/api/integrations/docusign/callback` | GET | DocuSign OAuth callback |
| `/api/integrations/docusign/send` | POST | Send document for e-signature |

---

## Dashboard Pages

| Page | Path | Description |
|------|------|-------------|
| Overview | `/dashboard` | Upload contracts, view analysis results, risk summary, stats |
| Case Audit | `/dashboard` (tab) | Browse segmented clauses |
| Vector Store | `/dashboard` (tab) | Embedding status, indexed chunks |
| Intelligence | `/dashboard` (tab) | Agent logs, performance metrics |
| Cases | `/dashboard/cases` | List, search, filter, archive, star, rename cases |
| Compare | `/dashboard/compare` | Side-by-side case risk comparison |
| Clause Library | `/dashboard/library` | Save, search, and reuse clause templates |
| Search | `/dashboard/search` | Global full-text search across all cases |
| Integrations | `/dashboard/integrations` | Slack, webhooks, Google Drive, DocuSign |
| Billing | `/dashboard/billing` | Pricing, checkout, manage subscription |
| Settings | `/dashboard/settings` | Profile, notifications, theme preferences |

---

## Project Structure

```
nextjs-app/
  app/
    api/
      auth/               # register, login, logout, me, reset-password
      billing/            # checkout, portal, webhook
      cases/              # CRUD, compare
      integrations/       # google, docusign, settings
      library/            # clause templates
      negotiate/          # negotiation chat
      reports/            # export, share
      search/             # global search
      metrics/            # performance data
      settings/           # user preferences
    components/           # AgentLogs, ClauseViewer, PerformanceDashboard, LandingPage
    dashboard/            # overview, cases, compare, library, search, billing, integrations, settings
    login/                # login page
    signup/               # signup page
    reset-password/       # password reset flow
    report/               # shareable report viewer
  components/
    ui/                   # dashboard-layout, diff-viewer, risk-chart
    modals/               # negotiation-modal
    case-collaboration-panel, risk-trend-snapshot
  lib/
    services/             # risk-engine, ai-service, negotiation-simulator, langchain-rag, document-processor
    db/models/            # User, Case, Settings, ClauseTemplate, ResetToken
    hooks/                # useUser, useCaseCollaboration
    auth.ts               # JWT creation, validation, cookie management
    stripe.ts             # Stripe client, plan config
    plan-check.ts         # Usage limits and paywall
    notifications.ts      # Slack, webhook, email notifications
    email.ts              # Resend email templates
    metrics.ts            # Performance tracking
    risk-history.ts       # Risk trend snapshots
    report-share-store.ts # Shareable report tokens
  middleware.ts           # Auth, CORS, route protection
  autolawyer-mcp/         # Optional Python backend
    agent/                # core, router, policies
    mcp_tools/            # clause_rag, clause_graph, report_builder
    services/             # semantic_cache
    api/                  # FastAPI endpoints
    samples/              # Test contracts
```

---

## Supported Documents

| Format | Library | Notes |
|--------|---------|-------|
| PDF | pdf-parse v1 | Works on Vercel serverless (no workers) |
| DOCX | mammoth | Extracts raw text from Word documents |
| TXT | Built-in | Read as UTF-8 |

---

## Deployment

### Vercel (recommended)

1. Push to GitHub
2. Import in Vercel
3. Add environment variables (OPENAI_API_KEY, MONGODB_URI, JWT_SECRET at minimum)
4. Deploy

The app uses `output: 'standalone'` in next.config.js for optimized serverless deployment.

### Stripe Setup

1. Create products and prices in Stripe Dashboard
2. Set `STRIPE_SECRET_KEY`, `STRIPE_PRO_PRICE_ID`, `STRIPE_TEAM_PRICE_ID`
3. Create a webhook endpoint pointing to `https://your-domain/api/billing/webhook`
4. Set `STRIPE_WEBHOOK_SECRET` from the webhook signing secret

---

## License

MIT
