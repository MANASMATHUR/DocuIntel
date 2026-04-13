import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
    try {
        const { scenario, clause, persona = 'Competitive Corporate Lawyer' } = await request.json();

        if (!clause || !scenario) {
            return NextResponse.json({ error: 'Clause and scenario are required' }, { status: 400 });
        }

        if (!process.env.OPENAI_API_KEY) {
            // Mock negotiation response
            return NextResponse.json({
                response: `[MOCK NEGOTIATION] As a ${persona}, I've reviewed your proposal for the ${scenario.name} scenario. Your attempt to cap liability at $10k is commercially unreasonable given the deal size. We proposed $50k as a compromise, or we'll need to walk away from this section.`,
                strategy: "Focusing on market standards to push for higher caps.",
            });
        }

        const systemPrompt = `You are playing the role of a ${persona} in a legal negotiation.
    The current scenario is: ${scenario.name} - ${scenario.explanation}.
    The clause being negotiated is: "${clause}".
    Your goal is to be firm but professional. React to the user's attempt to negotiate this clause based on your persona.`;

        const response = await openai.chat.completions.create({
            model: process.env.AUTOLAWYER_MODEL || 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: "Let's negotiate this clause." }
            ],
            temperature: 0.7,
            max_tokens: 500,
        });

        const content = response.choices[0]?.message?.content ?? null;
        if (!content) {
            return NextResponse.json({ error: 'No response from AI provider' }, { status: 502 });
        }

        return NextResponse.json({
            response: content,
            strategy: "AI-generated negotiation strategy based on scenario probability.",
        });

    } catch (error: any) {
        console.error('Negotiation error:', error);
        return NextResponse.json({ error: 'Failed to initiate negotiation' }, { status: 500 });
    }
}
