'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
    Building2,
    Shield,
    Zap,
    Brain,
    BarChart3,
    GitBranch,
    Target,
    CheckCircle2,
    ArrowRight,
    Github
} from 'lucide-react'

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-bg">
            {/* Header */}
            <header className="border-b border-divider bg-bg-surface">
                <div className="max-w-[1440px] mx-auto px-12 h-20 flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-text-inverse" />
                        </div>
                        <span className="text-xl font-semibold text-primary">DocuIntel</span>
                    </div>

                    {/* Nav */}
                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-text-secondary">
                        <a href="#product" className="hover:text-text transition-colors">Product</a>
                        <a href="#architecture" className="hover:text-text transition-colors">Architecture</a>
                        <a href="#security" className="hover:text-text transition-colors">Security</a>
                        <a href="#demo" className="hover:text-text transition-colors">Demo</a>
                        <a href="https://github.com" className="hover:text-text transition-colors flex items-center gap-2">
                            <Github size={16} />
                            GitHub
                        </a>
                    </nav>

                    {/* CTA */}
                    <Link href="/dashboard">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="px-6 py-2.5 bg-primary text-text-inverse rounded-lg font-medium text-sm hover:bg-primary-dark transition-colors shadow-sm"
                        >
                            Request Demo
                        </motion.button>
                    </Link>
                </div>
            </header>

            {/* Hero Section */}
            <section className="py-24 px-12">
                <div className="max-w-[1440px] mx-auto">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        {/* Left - Hero Content */}
                        <div>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                            >
                                <h1 className="text-[40px] font-semibold leading-tight text-text mb-6">
                                    AI That Actually<br />
                                    Understands Contracts.
                                </h1>
                                <p className="text-lg text-text-secondary mb-10 leading-relaxed">
                                    Agentic, explainable, production-grade legal intelligence.
                                </p>

                                {/* Metrics Bar */}
                                <div className="grid grid-cols-3 gap-4 mb-10">
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className="bg-bg-surface border border-divider rounded-lg p-4"
                                    >
                                        <div className="text-2xl font-semibold text-success mb-1">96%</div>
                                        <div className="text-xs text-text-secondary font-medium">Retrieval Accuracy</div>
                                    </motion.div>

                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="bg-bg-surface border border-divider rounded-lg p-4"
                                    >
                                        <div className="text-2xl font-semibold text-accent mb-1 font-mono">&lt;500ms</div>
                                        <div className="text-xs text-text-secondary font-medium">Cached Response</div>
                                    </motion.div>

                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4 }}
                                        className="bg-bg-surface border border-divider rounded-lg p-4"
                                    >
                                        <div className="text-2xl font-semibold text-primary mb-1">0</div>
                                        <div className="text-xs text-text-secondary font-medium">Hallucinations</div>
                                    </motion.div>
                                </div>

                                <Link href="/dashboard">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="px-8 py-3.5 bg-primary text-text-inverse rounded-lg font-semibold shadow-lg hover:bg-primary-dark transition-colors flex items-center gap-2"
                                    >
                                        Start Analysis
                                        <ArrowRight size={18} />
                                    </motion.button>
                                </Link>
                            </motion.div>
                        </div>

                        {/* Right - Product Preview */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="bg-bg-surface border border-divider rounded-2xl p-8 shadow-xl"
                        >
                            {/* Mock Product Preview */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between pb-4 border-b border-divider">
                                    <span className="font-semibold text-text">Contract_NDA_2024.pdf</span>
                                    <span className="px-3 py-1 bg-success/10 text-success text-xs font-medium rounded-full">
                                        Analyzed
                                    </span>
                                </div>

                                {/* Risk Cards Preview */}
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3 p-4 bg-risk-high/5 border border-risk-high/20 rounded-lg">
                                        <div className="w-2 h-2 bg-risk-high rounded-full mt-1.5" />
                                        <div className="flex-1">
                                            <div className="font-medium text-text text-sm mb-1">Termination Ambiguity</div>
                                            <div className="text-xs text-text-secondary">Clause 8.2 lacks clear notice period</div>
                                        </div>
                                        <span className="text-xs font-mono text-text-dim">92%</span>
                                    </div>

                                    <div className="flex items-start gap-3 p-4 bg-risk-medium/5 border border-risk-medium/20 rounded-lg">
                                        <div className="w-2 h-2 bg-risk-medium rounded-full mt-1.5" />
                                        <div className="flex-1">
                                            <div className="font-medium text-text text-sm mb-1">IP Assignment Scope</div>
                                            <div className="text-xs text-text-secondary">Section 5.1 may need refinement</div>
                                        </div>
                                        <span className="text-xs font-mono text-text-dim">76%</span>
                                    </div>

                                    <div className="flex items-start gap-3 p-4 bg-success/5 border border-success/20 rounded-lg">
                                        <CheckCircle2 size={14} className="text-success mt-1" />
                                        <div className="flex-1">
                                            <div className="font-medium text-text text-sm mb-1">Confidentiality Standards</div>
                                            <div className="text-xs text-text-secondary">Well-defined protection terms</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Citations */}
                                <div className="pt-4 border-t border-divider">
                                    <div className="text-xs font-medium text-text-dim mb-2">CITATIONS</div>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-2 py-1 bg-bg-subtle text-text-secondary text-xs rounded font-mono">§8.2</span>
                                        <span className="px-2 py-1 bg-bg-subtle text-text-secondary text-xs rounded font-mono">§5.1</span>
                                        <span className="px-2 py-1 bg-bg-subtle text-text-secondary text-xs rounded font-mono">§3.4</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Feature Highlights */}
            <section className="py-20 px-12 bg-bg-subtle border-t border-divider">
                <div className="max-w-[1440px] mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-[28px] font-semibold text-text mb-4">
                            Production-Grade Legal Intelligence
                        </h2>
                        <p className="text-text-secondary max-w-2xl mx-auto">
                            Built for legal teams, compliance officers, and founders who need explainable AI
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="bg-bg-surface border border-divider rounded-xl p-8 hover:shadow-lg transition-shadow"
                        >
                            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-6">
                                <GitBranch className="w-6 h-6 text-accent" />
                            </div>
                            <h3 className="text-xl font-semibold text-text mb-3">Hybrid RAG</h3>
                            <p className="text-text-secondary text-sm leading-relaxed">
                                Dense + BM25 + RRF retrieval ensures accurate clause matching with enterprise-grade precision
                            </p>
                        </motion.div>

                        {/* Feature 2 */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="bg-bg-surface border border-divider rounded-xl p-8 hover:shadow-lg transition-shadow"
                        >
                            <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mb-6">
                                <Brain className="w-6 h-6 text-success" />
                            </div>
                            <h3 className="text-xl font-semibold text-text mb-3">Agentic ReAct</h3>
                            <p className="text-text-secondary text-sm leading-relaxed">
                                Transparent reasoning with visible thought → action → observation chains for explainability
                            </p>
                        </motion.div>

                        {/* Feature 3 */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 }}
                            className="bg-bg-surface border border-divider rounded-xl p-8 hover:shadow-lg transition-shadow"
                        >
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                                <BarChart3 className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="text-xl font-semibold text-text mb-3">GraphRAG Intelligence</h3>
                            <p className="text-text-secondary text-sm leading-relaxed">
                                Clause relationship mapping reveals hidden dependencies and contract structure insights
                            </p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-12">
                <div className="max-w-[1440px] mx-auto">
                    <div className="bg-primary rounded-2xl p-16 text-center">
                        <h2 className="text-[32px] font-semibold text-text-inverse mb-6">
                            Ready for Production-Grade Legal AI?
                        </h2>
                        <p className="text-text-inverse/80 text-lg mb-8 max-w-2xl mx-auto">
                            Join legal teams and compliance officers using DocuIntel for explainable contract analysis
                        </p>
                        <Link href="/dashboard">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="px-10 py-4 bg-accent text-primary rounded-lg font-semibold text-lg shadow-xl hover:bg-accent-light transition-colors"
                            >
                                Request Enterprise Demo
                            </motion.button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-12 border-t border-divider">
                <div className="max-w-[1440px] mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-text-inverse" />
                        </div>
                        <span className="font-semibold text-primary">DocuIntel</span>
                    </div>

                    <div className="flex gap-8 text-sm text-text-secondary">
                        <a href="#" className="hover:text-text transition-colors">Privacy</a>
                        <a href="#" className="hover:text-text transition-colors">Security</a>
                        <a href="#" className="hover:text-text transition-colors">Terms</a>
                        <a href="#" className="hover:text-text transition-colors">Contact</a>
                    </div>

                    <p className="text-sm text-text-dim">© 2026 DocuIntel. All rights reserved.</p>
                </div>
            </footer>
        </div>
    )
}
