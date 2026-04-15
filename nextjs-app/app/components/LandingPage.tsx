'use client'

import Link from 'next/link'
import { Scale, AlertTriangle, FileEdit, MessageSquare, BarChart3, Database, Upload, Search, FileCheck, Download, Bell, ArrowRight, GitCompare, BookOpen, Plug, CreditCard, Shield, FileSignature, Cloud } from 'lucide-react'

const CAPABILITIES = [
    { icon: Scale, title: 'Clause Segmentation', desc: 'Automatically breaks contracts into individual clauses for granular, line-by-line analysis. Supports PDF, DOCX, and plain text.' },
    { icon: AlertTriangle, title: 'Risk Scoring', desc: 'Each clause is scored as critical, high, medium, or low risk using GPT-4o-mini with detailed rationale for every assessment.' },
    { icon: FileEdit, title: 'Redline Generation', desc: 'AI-drafted rewrites for every risky clause, with side-by-side diff view and plain-language explanations.' },
    { icon: MessageSquare, title: 'Negotiation Simulator', desc: 'Three scenarios per high-risk clause: best case, likely, and worst case with probability and financial impact. Plus interactive AI negotiation chat.' },
    { icon: GitCompare, title: 'Case Comparison', desc: 'Compare any two contracts side by side. See risk deltas, severity changes, and top risks for each document.' },
    { icon: BookOpen, title: 'Clause Library', desc: 'Save approved clause templates with categories and tags. Build a reusable library from your best contract language.' },
    { icon: Search, title: 'Global Search', desc: 'Full-text search across all your cases, clauses, and risk rationales. Find any contract term instantly.' },
    { icon: BarChart3, title: 'Intelligence Dashboard', desc: 'Live performance metrics: analysis latency, success rates, and agent logs showing every step of the pipeline.' },
    { icon: Database, title: 'Case Persistence', desc: 'Every analysis stored in MongoDB with full audit trail. Star, rename, archive, filter by risk, and export metadata.' },
]

const INTEGRATIONS = [
    { icon: CreditCard, name: 'Stripe', desc: 'Subscription billing with free and paid tiers' },
    { icon: Cloud, name: 'Google Drive', desc: 'Import contracts directly from your Drive' },
    { icon: FileSignature, name: 'DocuSign', desc: 'Send approved redlines for e-signature' },
    { icon: Bell, name: 'Slack', desc: 'Get notified when analysis completes' },
    { icon: Plug, name: 'Webhooks', desc: 'Trigger Zapier/n8n workflows on events' },
    { icon: Shield, name: 'Resend', desc: 'Transactional emails and password resets' },
]

const STEPS = [
    { num: 'I', icon: Upload, title: 'Upload', desc: 'Drop your PDF, DOCX, or TXT contract into the platform.' },
    { num: 'II', icon: Search, title: 'Analyze', desc: 'GPT-4o-mini segments every clause and scores risk in under a minute.' },
    { num: 'III', icon: FileCheck, title: 'Review', desc: 'Examine redline rewrites, negotiation scenarios, and rationale.' },
    { num: 'IV', icon: Download, title: 'Export', desc: 'Download a branded PDF report or send for e-signature.' },
]

const INDUSTRY_ARTICLES = [
    {
        source: 'Factor Law',
        date: 'March 2025',
        title: 'Why 2025 Is a Breakout Moment for AI-Powered Contract Analysis',
        excerpt: 'With $2 trillion in PE dry powder and anticipated antitrust rollbacks, deal activity is surging, making AI contract analysis indispensable for legal teams.',
        url: 'https://www.factor.law/insights/perfect-storm-why-2025-is-a-breakout-moment-for-ai-powered-contract-analysis',
    },
    {
        source: 'Legartis',
        date: 'April 2025',
        title: 'Trends 2025: The Rise of AI Agents in Contract Analysis',
        excerpt: 'AI agents with long-term memory and autonomous learning are changing the landscape of legal technology. Explainable AI is becoming central to contract review.',
        url: 'https://www.legartis.ai/blog/trends-ai-contract-analysis',
    },
    {
        source: 'Akin Gump',
        date: 'January 2026',
        title: 'AI and Technology Are Reshaping Private Equity Deal Flow',
        excerpt: 'Global buyout deal value surged 44% to over $1 trillion in 2025. Almost half of larger deals involved AI-native companies or cited AI benefits.',
        url: 'https://www.akingump.com/en/insights/articles/2026-perspectives-in-private-equity-ai-and-technology',
    },
    {
        source: 'LawVu',
        date: 'December 2025',
        title: 'How AI-Powered Contract Analysis Unlocks Insights at Scale',
        excerpt: '78% of in-house teams plan to bring contract drafting in-house. AI-powered analysis is key to surfacing hidden risks in centralized repositories.',
        url: 'https://lawvu.com/articles/ai-powered-contract-analysis-lawvu-lens/',
    },
]

export default function LandingPage() {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()

    return (
        <div className="min-h-screen" style={{ background: '#F5F0E8', color: '#1a1a1a' }}>
            {/* Nav */}
            <header className="border-b" style={{ borderColor: '#d4cfc5' }}>
                <div className="max-w-[1100px] mx-auto px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Scale size={18} />
                        <span className="font-semibold text-sm tracking-wide">DocuIntel</span>
                    </div>
                    <nav className="hidden md:flex items-center gap-8 text-xs font-medium tracking-wider uppercase" style={{ color: '#555' }}>
                        <a href="#capabilities" className="hover:text-black transition-colors">Features</a>
                        <a href="#industry" className="hover:text-black transition-colors">Industry</a>
                        <a href="#pricing" className="hover:text-black transition-colors">Pricing</a>
                    </nav>
                    <Link href="/login" className="px-5 py-2 border border-black text-xs font-semibold uppercase tracking-wider hover:bg-black hover:text-white transition-all">
                        Get Started
                    </Link>
                </div>
            </header>

            {/* Masthead */}
            <section className="border-b py-10 text-center" style={{ borderColor: '#d4cfc5' }}>
                <p className="text-[10px] uppercase tracking-[0.4em] mb-4" style={{ color: '#888' }}>{today}</p>
                <h1 className="text-6xl md:text-8xl font-black tracking-tight" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
                    DocuIntel
                </h1>
                <p className="text-base md:text-lg italic mt-2" style={{ fontFamily: 'var(--font-playfair), Georgia, serif', color: '#666' }}>
                    The Legal Intelligence Platform
                </p>
                <div className="flex items-center justify-center gap-3 mt-6 text-[9px] uppercase tracking-[0.3em] font-semibold flex-wrap" style={{ color: '#888' }}>
                    <span>Contract Analysis</span>
                    <span style={{ color: '#ccc' }}>·</span>
                    <span>Risk Scoring</span>
                    <span style={{ color: '#ccc' }}>·</span>
                    <span>Redline Generation</span>
                    <span style={{ color: '#ccc' }}>·</span>
                    <span>Negotiation Simulation</span>
                    <span style={{ color: '#ccc' }}>·</span>
                    <span>E-Signatures</span>
                </div>
            </section>

            {/* Hero */}
            <section className="max-w-[1100px] mx-auto px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12">
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] font-semibold mb-3" style={{ color: '#888' }}>
                            What DocuIntel Does
                        </p>
                        <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-6" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
                            Upload a Contract, Get a Complete Risk Audit in Under a Minute
                        </h2>
                        <div className="text-base leading-relaxed mb-8" style={{ color: '#444' }}>
                            <span className="text-5xl font-bold float-left mr-3 mt-1 leading-none" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>D</span>
                            ocuIntel is a full-stack SaaS platform that analyzes legal contracts using GPT-4o-mini. Upload a PDF, DOCX, or TXT file and get clause-by-clause risk scoring, AI-generated redline rewrites, negotiation simulations with financial impact estimates, and a branded export-ready report. Each user gets their own workspace with case history, a clause library, and integrations with Stripe, Slack, Google Drive, and DocuSign.
                        </div>
                        <div className="flex gap-4">
                            <Link href="/signup" className="px-6 py-3 bg-black text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-2 hover:bg-gray-800 transition-colors">
                                <Scale size={14} /> Start Free Audit
                            </Link>
                            <Link href="/login" className="px-6 py-3 border border-black text-xs font-semibold uppercase tracking-wider flex items-center gap-2 hover:bg-black hover:text-white transition-all">
                                Try Demo <ArrowRight size={14} />
                            </Link>
                        </div>
                    </div>

                    {/* Sidebar - What You Get */}
                    <div className="border-l pl-8 hidden lg:block" style={{ borderColor: '#d4cfc5' }}>
                        <p className="text-[10px] uppercase tracking-[0.2em] font-semibold mb-6" style={{ color: '#888' }}>What You Get</p>

                        <div className="mb-8">
                            <p className="text-3xl font-bold" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>4 Risk Levels</p>
                            <p className="text-xs font-semibold uppercase tracking-wider mt-1">Per-Clause Scoring</p>
                            <p className="text-xs italic mt-1" style={{ color: '#888' }}>Critical, high, medium, low with rationale</p>
                        </div>
                        <div className="border-t pt-6 mb-8" style={{ borderColor: '#d4cfc5' }}>
                            <p className="text-3xl font-bold" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>3 Scenarios</p>
                            <p className="text-xs font-semibold uppercase tracking-wider mt-1">Per High-Risk Clause</p>
                            <p className="text-xs italic mt-1" style={{ color: '#888' }}>Best case, likely, worst case with $ impact</p>
                        </div>
                        <div className="border-t pt-6 mb-8" style={{ borderColor: '#d4cfc5' }}>
                            <p className="text-3xl font-bold" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>6 Integrations</p>
                            <p className="text-xs font-semibold uppercase tracking-wider mt-1">Built In</p>
                            <p className="text-xs italic mt-1" style={{ color: '#888' }}>Stripe, Slack, Google Drive, DocuSign, Webhooks, Resend</p>
                        </div>
                        <div className="border-t pt-6" style={{ borderColor: '#d4cfc5' }}>
                            <p className="text-3xl font-bold" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>Full Auth</p>
                            <p className="text-xs font-semibold uppercase tracking-wider mt-1">Per-User Workspace</p>
                            <p className="text-xs italic mt-1" style={{ color: '#888' }}>Signup, login, password reset, demo mode</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Capabilities */}
            <section id="capabilities" className="border-t" style={{ borderColor: '#d4cfc5' }}>
                <div className="max-w-[1100px] mx-auto px-6 py-16">
                    <div className="text-center mb-12">
                        <p className="text-[10px] uppercase tracking-[0.3em] font-semibold mb-2" style={{ color: '#888' }}>Section II</p>
                        <h2 className="text-4xl font-bold inline-block border-t-2 border-b-2 border-black py-2 px-4" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
                            Capabilities
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 border-t" style={{ borderColor: '#d4cfc5' }}>
                        {CAPABILITIES.map((cap, i) => (
                            <div key={i} className={`p-8 border-b ${i % 3 !== 2 ? 'md:border-r' : ''}`} style={{ borderColor: '#d4cfc5' }}>
                                <cap.icon size={22} strokeWidth={1.5} style={{ color: '#888' }} className="mb-4" />
                                <h3 className="text-lg font-bold mb-2" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>{cap.title}</h3>
                                <p className="text-sm leading-relaxed" style={{ color: '#555' }}>{cap.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Integrations */}
            <section className="border-t" style={{ borderColor: '#d4cfc5', background: '#EDE8DE' }}>
                <div className="max-w-[1100px] mx-auto px-6 py-16">
                    <div className="text-center mb-12">
                        <p className="text-[10px] uppercase tracking-[0.3em] font-semibold mb-2" style={{ color: '#888' }}>Section III</p>
                        <h2 className="text-4xl font-bold inline-block border-t-2 border-b-2 border-black py-2 px-4" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
                            Integrations
                        </h2>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px border" style={{ borderColor: '#d4cfc5', background: '#d4cfc5' }}>
                        {INTEGRATIONS.map((item, i) => (
                            <div key={i} className="p-6 text-center" style={{ background: '#EDE8DE' }}>
                                <item.icon size={22} strokeWidth={1.5} className="mx-auto mb-3" style={{ color: '#666' }} />
                                <h3 className="font-bold text-sm mb-1">{item.name}</h3>
                                <p className="text-xs leading-relaxed" style={{ color: '#888' }}>{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="border-t" style={{ borderColor: '#d4cfc5' }}>
                <div className="max-w-[1100px] mx-auto px-6 py-16">
                    <div className="text-center mb-12">
                        <p className="text-[10px] uppercase tracking-[0.3em] font-semibold mb-2" style={{ color: '#888' }}>Section IV</p>
                        <h2 className="text-4xl font-bold inline-block border-t-2 border-b-2 border-black py-2 px-4" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
                            How It Works
                        </h2>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 border" style={{ borderColor: '#d4cfc5' }}>
                        {STEPS.map((step, i) => (
                            <div key={i} className={`p-8 text-center ${i < 3 ? 'border-r' : ''}`} style={{ borderColor: '#d4cfc5' }}>
                                <p className="text-2xl font-light mb-2" style={{ fontFamily: 'var(--font-playfair), Georgia, serif', color: '#aaa' }}>{step.num}</p>
                                <step.icon size={22} strokeWidth={1.5} className="mx-auto mb-3" style={{ color: '#666' }} />
                                <h3 className="font-bold text-sm mb-2">{step.title}</h3>
                                <p className="text-xs leading-relaxed" style={{ color: '#666' }}>{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Industry Context */}
            <section id="industry" className="border-t" style={{ borderColor: '#d4cfc5' }}>
                <div className="max-w-[1100px] mx-auto px-6 py-16">
                    <div className="text-center mb-10">
                        <p className="text-[10px] uppercase tracking-[0.3em] font-semibold mb-2" style={{ color: '#888' }}>Section V</p>
                        <h2 className="text-4xl font-bold inline-block border-t-2 border-b-2 border-black py-2 px-4 italic" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
                            Industry Context
                        </h2>
                        <p className="text-sm italic mt-4 max-w-lg mx-auto" style={{ color: '#888' }}>
                            The legal AI market is accelerating. These articles from leading publications show why platforms like DocuIntel are becoming essential.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-px border" style={{ borderColor: '#d4cfc5', background: '#d4cfc5' }}>
                        {INDUSTRY_ARTICLES.map((article, i) => (
                            <a
                                key={i}
                                href={article.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-8 hover:bg-white/60 transition-colors group"
                                style={{ background: '#F5F0E8' }}
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#c07830' }}>{article.source}</span>
                                    <span style={{ color: '#ccc' }}>·</span>
                                    <span className="text-[10px]" style={{ color: '#999' }}>{article.date}</span>
                                </div>
                                <h3 className="text-lg font-bold leading-snug mb-3 group-hover:underline" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
                                    {article.title}
                                </h3>
                                <p className="text-sm leading-relaxed" style={{ color: '#666' }}>
                                    {article.excerpt}
                                </p>
                            </a>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing - Real tiers */}
            <section id="pricing" className="border-t" style={{ borderColor: '#d4cfc5', background: '#EDE8DE' }}>
                <div className="max-w-[1100px] mx-auto px-6 py-16">
                    <div className="text-center mb-12">
                        <p className="text-[10px] uppercase tracking-[0.3em] font-semibold mb-2" style={{ color: '#888' }}>Section VI</p>
                        <h2 className="text-4xl font-bold inline-block border-t-2 border-b-2 border-black py-2 px-4" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
                            Pricing
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-px border" style={{ borderColor: '#d4cfc5', background: '#d4cfc5' }}>
                        {[
                            { name: 'Free', price: '$0', period: '', features: ['5 analyses per month', 'Basic risk scoring', 'Text export', 'Community support'], cta: 'Get Started' },
                            { name: 'Pro', price: '$29', period: '/month', features: ['Unlimited analyses', 'Negotiation simulator', 'Branded PDF export', 'Clause library', 'Case comparison', 'Global search', 'Priority support'], cta: 'Upgrade to Pro', popular: true },
                            { name: 'Team', price: '$79', period: '/month', features: ['Everything in Pro', 'Team collaboration', 'API access', 'Webhooks and integrations', 'DocuSign e-signatures', 'Dedicated support'], cta: 'Upgrade to Team' },
                        ].map((plan, i) => (
                            <div key={i} className="p-8 flex flex-col" style={{ background: plan.popular ? '#F5F0E8' : '#EDE8DE' }}>
                                {plan.popular && <p className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: '#c07830' }}>Most Popular</p>}
                                <h3 className="text-xl font-bold mb-1" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>{plan.name}</h3>
                                <div className="mb-4">
                                    <span className="text-3xl font-bold">{plan.price}</span>
                                    <span className="text-sm" style={{ color: '#888' }}>{plan.period}</span>
                                </div>
                                <ul className="space-y-2 mb-6 flex-1">
                                    {plan.features.map((f, fi) => (
                                        <li key={fi} className="text-sm flex items-start gap-2" style={{ color: '#555' }}>
                                            <span style={{ color: '#888' }}>-</span> {f}
                                        </li>
                                    ))}
                                </ul>
                                <Link
                                    href="/signup"
                                    className={`block text-center py-3 text-xs font-semibold uppercase tracking-wider transition-all ${
                                        plan.popular
                                            ? 'bg-black text-white hover:bg-gray-800'
                                            : 'border border-black hover:bg-black hover:text-white'
                                    }`}
                                >
                                    {plan.cta}
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Tech Stack */}
            <section className="border-t" style={{ borderColor: '#d4cfc5' }}>
                <div className="max-w-[1100px] mx-auto px-6 py-16">
                    <div className="text-center mb-12">
                        <p className="text-[10px] uppercase tracking-[0.3em] font-semibold mb-2" style={{ color: '#888' }}>Section VII</p>
                        <h2 className="text-4xl font-bold inline-block border-t-2 border-b-2 border-black py-2 px-4" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
                            Built With
                        </h2>
                    </div>
                    <div className="flex flex-wrap justify-center gap-4 text-xs font-medium uppercase tracking-wider" style={{ color: '#888' }}>
                        {['Next.js 14', 'TypeScript', 'React 18', 'Tailwind CSS', 'OpenAI GPT-4o-mini', 'MongoDB Atlas', 'Mongoose', 'Stripe', 'Resend', 'jose (JWT)', 'bcrypt', 'pdf-parse', 'mammoth', 'Recharts', 'Framer Motion'].map((tech, i) => (
                            <span key={i} className="px-3 py-2 border" style={{ borderColor: '#d4cfc5' }}>{tech}</span>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t py-6 px-6" style={{ borderColor: '#d4cfc5' }}>
                <div className="max-w-[1100px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Scale size={14} />
                        <span className="text-xs font-semibold">DocuIntel</span>
                    </div>
                    <div className="flex gap-6 text-xs font-medium uppercase tracking-wider" style={{ color: '#888' }}>
                        <a href="https://github.com/MANASMATHUR/DocuIntel" target="_blank" rel="noopener noreferrer" className="hover:text-black transition-colors">GitHub</a>
                        <Link href="/dashboard" className="hover:text-black transition-colors">Dashboard</Link>
                        <Link href="/login" className="hover:text-black transition-colors">Sign In</Link>
                    </div>
                    <p className="text-xs" style={{ color: '#aaa' }}>© 2025 DocuIntel. MIT License.</p>
                </div>
            </footer>
        </div>
    )
}
