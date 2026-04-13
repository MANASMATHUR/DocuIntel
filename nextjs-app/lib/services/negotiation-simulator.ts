import { aiService } from './ai-service';

export interface NegotiationScenario {
    scenario_id: string;
    name: string;
    probability: number; // 0-100%
    financial_impact: number; // Estimated $ impact
    counterparty_reaction: 'accept' | 'reject' | 'negotiate';
    explanation: string;
}

export class NegotiationSimulator {
    /**
     * Simulates negotiation outcomes for a clause using AI when available.
     */
    static async simulateScenarios(
        clauseText: string,
        riskScore: number,
        policy: string = ''
    ): Promise<NegotiationScenario[]> {
        // Low-risk clauses are likely accepted without pushback
        if (riskScore < 0.3) {
            return [{
                scenario_id: 'smooth-sailing',
                name: 'Standard Acceptance',
                probability: 95,
                financial_impact: 0,
                counterparty_reaction: 'accept',
                explanation: 'Clause is standard and low risk. Counterparty likely to accept without comment.'
            }];
        }

        // Try AI-generated scenarios first
        try {
            const scenarios = await NegotiationSimulator.generateAIScenarios(clauseText, riskScore, policy);
            if (scenarios.length > 0) return scenarios;
        } catch (error) {
            console.warn('AI scenario generation failed, using fallback:', error);
        }

        // Fallback: deterministic scenarios based on risk score
        return NegotiationSimulator.generateFallbackScenarios(riskScore);
    }

    /**
     * Uses the AI service to generate contextual negotiation scenarios.
     */
    private static async generateAIScenarios(
        clauseText: string,
        riskScore: number,
        policy: string
    ): Promise<NegotiationScenario[]> {
        const prompt = `Analyze this contract clause for negotiation outcomes.

Clause: "${clauseText.slice(0, 500)}"
Risk Score: ${riskScore.toFixed(2)}
Policy Context: ${policy.slice(0, 200) || 'Standard commercial terms'}

Return a JSON array with exactly 3 scenarios (best case, likely case, worst case). Each scenario must have:
- scenario_id: string (e.g. "best-case")
- name: string (short title)
- probability: number (0-100, must sum to 100)
- financial_impact: number (estimated USD impact)
- counterparty_reaction: "accept" | "reject" | "negotiate"
- explanation: string (1-2 sentences)

Return ONLY the JSON array, no other text.`;

        const analysis = await aiService.analyzeClauseRisk(prompt, 'negotiation');

        // If the AI returned scenario data, parse it
        if (Array.isArray(analysis)) {
            return NegotiationSimulator.validateScenarios(analysis);
        }

        // Sometimes the AI wraps the result
        if (analysis.scenarios && Array.isArray(analysis.scenarios)) {
            return NegotiationSimulator.validateScenarios(analysis.scenarios);
        }

        return [];
    }

    private static validateScenarios(raw: any[]): NegotiationScenario[] {
        return raw
            .filter(s => s.scenario_id && s.name && typeof s.probability === 'number')
            .map(s => ({
                scenario_id: String(s.scenario_id),
                name: String(s.name),
                probability: Math.max(0, Math.min(100, Number(s.probability))),
                financial_impact: Number(s.financial_impact) || 0,
                counterparty_reaction: ['accept', 'reject', 'negotiate'].includes(s.counterparty_reaction)
                    ? s.counterparty_reaction
                    : 'negotiate',
                explanation: String(s.explanation || ''),
            }))
            .slice(0, 3);
    }

    private static generateFallbackScenarios(riskScore: number): NegotiationScenario[] {
        const baseImpact = Math.round(riskScore * 75000);

        return [
            {
                scenario_id: 'best-case',
                name: 'Minor Pushback',
                probability: 30,
                financial_impact: Math.round(baseImpact * 0.1),
                counterparty_reaction: 'negotiate',
                explanation: 'Counterparty requests clarification but accepts the core obligation with minor edits.'
            },
            {
                scenario_id: 'likely-case',
                name: 'Compromise Required',
                probability: 50,
                financial_impact: Math.round(baseImpact * 0.5),
                counterparty_reaction: 'negotiate',
                explanation: 'Counterparty rejects the current terms and proposes a reasonable cap or mutual obligation.'
            },
            {
                scenario_id: 'worst-case',
                name: 'Deal Blocker',
                probability: 20,
                financial_impact: Math.round(baseImpact * 1.5),
                counterparty_reaction: 'reject',
                explanation: 'Counterparty refuses to sign unless this clause is substantially revised or removed.'
            }
        ];
    }
}
