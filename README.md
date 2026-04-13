<p align="center">
  <h1 align="center">DocuIntel: Legal AI Assistant</h1>
  <p align="center">
    <strong>AI-powered contract analysis, risk assessment, and redline generation</strong>
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js" alt="Next.js"/>
  <img src="https://img.shields.io/badge/TypeScript-5.3-blue?style=for-the-badge&logo=typescript" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991?style=for-the-badge&logo=openai" alt="OpenAI"/>
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb" alt="MongoDB"/>
  <img src="https://img.shields.io/badge/Python-3.11-yellow?style=for-the-badge&logo=python" alt="Python"/>
</p>

---

## Overview

DocuIntel is a full-stack legal AI assistant that analyzes contracts, identifies risks, generates redline suggestions, and simulates negotiation scenarios. Upload a PDF, DOCX, or TXT contract and get a complete risk audit with actionable recommendations.

**What it does:**
- Segments contracts into individual clauses
- Scores each clause for risk (critical, high, medium, low)
- Generates redline rewrites with rationale
- Simulates negotiation scenarios with probability and financial impact estimates
- Tracks analysis metrics (latency, accuracy, success rate)
- Stores cases in MongoDB for persistence and retrieval

---

## Architecture

```mermaid
flowchart TB
    subgraph Client["Client Layer"]
        UI[Next.js React UI]
        Upload[Document Upload]
        Dashboard[Analysis Dashboard]
    end

    subgraph API["API Layer - Next.js"]
        Auth[JWT Auth + Middleware]
        CasesAPI["/api/cases"]
        MetricsAPI["/api/metrics"]
        NegotiateAPI["/api/negotiate"]
        ReportsAPI["/api/reports"]
    end

    subgraph Services["Service Layer"]
        RiskEngine[Risk Engine]
        AIService[AI Service - Multi-Provider]
        NegSim[Negotiation Simulator]
        DocProcessor[Document Processor]
        RAG[In-Memory Vector Store]
        MetricsManager[Metrics Manager]
    end

    subgraph Storage["Storage"]
        MongoDB[(MongoDB Atlas)]
        InMemory[In-Memory Fallback]
    end

    subgraph Optional["Optional - Python Backend"]
        FastAPI[FastAPI Server]
        AgentRouter[Agent Router]
        ClauseGraph[Clause GraphRAG]
        SemanticCache[Semantic Cache]
    end

    UI --> Auth
    Auth --> CasesAPI
    CasesAPI --> RiskEngine
    RiskEngine --> DocProcessor
    RiskEngine --> AIService
    RiskEngine --> NegSim
    RiskEngine --> RAG
    RiskEngine --> MetricsManager
    AIService --> MongoDB
    AIService --> InMemory
    CasesAPI --> FastAPI
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 14, React 18, TypeScript | Dashboard UI with SSR |
| **Styling** | Tailwind CSS, Framer Motion | Dark theme, animations |
| **Charts** | Recharts | Risk distribution visualization |
| **AI** | OpenAI API (gpt-4o-mini) | Clause analysis, risk scoring |
| **Embeddings** | OpenAI text-embedding-3-small | Semantic clause retrieval |
| **Database** | MongoDB Atlas + Mongoose | Case persistence |
| **Auth** | JWT (jose) | Token-based authentication |
| **Documents** | pdf-parse, mammoth | PDF and DOCX extraction |
| **Python (optional)** | FastAPI, sentence-transformers | GPU-accelerated deep analysis |

---

## Features

### Contract Analysis Pipeline
Each uploaded document goes through: text extraction, clause segmentation, per-clause risk scoring via LLM, redline generation, and negotiation simulation. The entire pipeline is instrumented with logging and latency tracking.

### Multi-Provider AI Fallback
The AI service tries providers in order (OpenAI, then any configured fallbacks) and automatically fails over if one is unavailable. Responses are validated and coerced to prevent malformed LLM output from crashing the UI.

### Negotiation Simulator
High-risk clauses automatically get three negotiation scenarios (best case, likely case, worst case) with probability percentages and estimated financial impact. Users can also open an interactive negotiation chat against AI-simulated opposing counsel.

### Real-Time Metrics
Every analysis step records latency, success/failure, and retrieval accuracy. The Intelligence tab shows live performance data pulled from the `/api/metrics` endpoint.

### Vector Store
Documents are chunked and embedded into an in-memory vector store for semantic clause retrieval during analysis. Stats (indexed chunks, embedding status) are visible in the Vector Store tab.

### Case Management
Cases are persisted to MongoDB Atlas with full analysis results (clauses, risks, redlines, reports, agent logs). The Cases page supports search, filtering by risk level, archiving, and metadata export.

### Python Backend (Optional)
A FastAPI backend in `autolawyer-mcp/` provides GPU-accelerated analysis with:
- **Agent Router**: Multi-provider model selection with token budgets
- **Clause GraphRAG**: Maps cross-references and dependencies between clauses
- **Semantic Cache**: ChromaDB-backed cache to skip redundant LLM calls
- **MCP Tools**: Clause segmenter, risk classifier, redline generator, report builder

Enable it by toggling "Deep Analysis (GPU)" in the upload form.

---

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- OpenAI API key

### 1. Clone and install

```bash
git clone https://github.com/your-username/AutoLawyer.git
cd AutoLawyer/nextjs-app
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in:

```env
OPENAI_API_KEY=your-openai-key
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/docuintel?retryWrites=true&w=majority
```

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Upload a contract and click "Run Audit".

### 4. (Optional) Python backend

```bash
cd autolawyer-mcp
pip install -r requirements.txt
python api/api.py
```

---

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/cases` | POST | Upload document, run analysis |
| `/api/cases` | GET | List all cases |
| `/api/cases?case_id=xxx` | GET | Get single case |
| `/api/cases/[id]/download` | GET | Download case report |
| `/api/negotiate` | POST | Interactive negotiation chat |
| `/api/reports` | POST | Generate export (HTML/TXT) |
| `/api/reports/share` | POST | Create shareable report link |
| `/api/metrics` | GET | Performance metrics |
| `/api/health` | GET | Health check |
| `/api/settings` | GET/POST | User preferences |
| `/api/auth/demo-token` | GET | Dev mode auth token |
| `/api/providers` | GET | List AI provider status |

---

## Project Structure

```
nextjs-app/
  app/
    api/                  # API routes
    components/           # Page-level components
    dashboard/            # Dashboard pages (overview, cases, settings)
  components/
    ui/                   # Shared UI components (diff-viewer, risk-chart, layout)
    modals/               # Modal dialogs (negotiation)
  lib/
    services/             # Core services (risk-engine, ai-service, negotiation-simulator, langchain-rag)
    db/                   # MongoDB connection and models
    metrics.ts            # Performance tracking
    auth.ts               # JWT authentication
  autolawyer-mcp/         # Optional Python backend
    agent/                # Agent core, router, policies
    mcp_tools/            # Clause RAG, graph, report builder
    services/             # Semantic cache
    api/                  # FastAPI server
```

---

## Supported Document Formats

- **PDF** (.pdf) via pdf-parse
- **Word** (.docx) via mammoth
- **Plain text** (.txt)

---

## License

MIT
