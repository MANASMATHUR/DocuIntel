'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, MessageSquare, Send, Loader2, Scale } from 'lucide-react';

interface NegotiationModalProps {
    isOpen: boolean;
    onClose: () => void;
    clause: string;
    scenario: any;
}

export function NegotiationModal({ isOpen, onClose, clause, scenario }: NegotiationModalProps) {
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/negotiate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clause,
                    scenario,
                    userText: input,
                    history: messages
                }),
            });
            const data = await res.json();
            setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        } catch (error) {
            console.error('Negotiation failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.97, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-bg-surface border border-white/[0.08] rounded-xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden shadow-2xl"
            >
                {/* Header */}
                <div className="px-5 py-4 border-b border-white/[0.06] flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Scale className="text-primary w-5 h-5" />
                        <div>
                            <h3 className="font-semibold text-white text-base">Contract Negotiation</h3>
                            <p className="text-xs text-text-dim">{scenario?.name || 'Standard Review'}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/[0.06] rounded-lg text-text-dim hover:text-white transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="flex flex-1 min-h-0">
                    {/* Left Panel - Context */}
                    <div className="w-72 border-r border-white/[0.06] p-5 hidden lg:block overflow-y-auto custom-scrollbar">
                        <div className="space-y-4">
                            <div>
                                <span className="text-xs font-medium text-text-dim block mb-1.5">Scenario</span>
                                <div className="px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 text-sm font-medium text-primary">
                                    {scenario?.name || 'Standard Review'}
                                </div>
                            </div>

                            <div>
                                <span className="text-xs font-medium text-text-dim block mb-1.5">Clause Under Review</span>
                                <p className="text-sm text-text-secondary leading-relaxed">
                                    {clause}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel - Chat */}
                    <div className="flex-1 flex flex-col min-w-0">
                        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
                            {messages.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                                    <MessageSquare size={32} className="text-white mb-3" />
                                    <p className="text-sm font-medium text-white mb-1">Ready to Negotiate</p>
                                    <p className="text-xs text-text-dim max-w-[220px]">
                                        Type your opening position to start.
                                    </p>
                                </div>
                            )}

                            {messages.map((msg, i) => (
                                <div key={i} className="space-y-1.5">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-medium ${msg.role === 'user' ? 'text-primary' : 'text-emerald-400'}`}>
                                            {msg.role === 'user' ? 'You' : 'Opposing Counsel'}
                                        </span>
                                    </div>
                                    <div className={`px-4 py-3 rounded-lg text-sm leading-relaxed ${
                                        msg.role === 'user'
                                            ? 'bg-primary/10 border border-primary/15 text-text-secondary ml-8'
                                            : 'bg-white/[0.03] border border-white/[0.06] text-text-secondary mr-8'
                                    }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}

                            {isLoading && (
                                <div className="space-y-1.5">
                                    <span className="text-xs font-medium text-emerald-400">Opposing Counsel</span>
                                    <div className="px-4 py-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-text-dim mr-8 flex items-center gap-2">
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        Preparing response...
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-white/[0.06]">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Type your argument..."
                                    className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary/40 text-white placeholder:text-text-dim"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={isLoading || !input.trim()}
                                    className="px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-30 hover:bg-primary-dark transition-colors flex items-center gap-2"
                                >
                                    <Send size={14} />
                                    Send
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
