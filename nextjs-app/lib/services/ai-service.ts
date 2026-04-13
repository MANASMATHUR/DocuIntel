import OpenAI from 'openai';

// Multi-provider configuration
interface ProviderConfig {
    name: string;
    apiKey: string | undefined;
    baseURL?: string;
    model: string;
    tokenBudget: number;
}

const PROVIDERS: ProviderConfig[] = [
    {
        name: 'OpenAI',
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.AUTOLAWYER_MODEL || 'gpt-4o-mini',
        tokenBudget: parseInt(process.env.OPENAI_TOKEN_BUDGET || '2000000'),
    },
    {
        name: 'Nebius',
        apiKey: process.env.NEBIUS_API_KEY,
        baseURL: process.env.NEBIUS_BASE_URL,
        model: 'meta-llama/Meta-Llama-3.1-70B-Instruct',
        tokenBudget: parseInt(process.env.NEBIUS_TOKEN_BUDGET || '1500000'),
    },
    {
        name: 'SambaNova',
        apiKey: process.env.SAMBA_NOVA_API_KEY,
        baseURL: process.env.SAMBA_NOVA_BASE_URL,
        model: 'Meta-Llama-3.1-70B-Instruct',
        tokenBudget: parseInt(process.env.SAMBA_NOVA_TOKEN_BUDGET || '1000000'),
    },
    {
        name: 'Blaxel',
        apiKey: process.env.BLAXEL_API_KEY,
        baseURL: process.env.BLAXEL_BASE_URL,
        model: 'gpt-4o-mini',
        tokenBudget: parseInt(process.env.BLAXEL_TOKEN_BUDGET || '500000'),
    },
];

// Mock response for when all providers fail
const MOCK_RISK_ANALYSIS = {
    risk_score: 0.8,
    severity: "high",
    rationale: "This clause contains an unlimited indemnity obligation which poses significant financial risk.",
    recommendation: "Cap the indemnity to 12 months of fees.",
    redline: "The Supplier's liability shall be limited to the total fees paid in the preceding 12 months."
};

export class AIService {
    private providers: { client: OpenAI; config: ProviderConfig }[] = [];
    private activeProviderIndex: number = 0;
    private pythonBackendBaseUrl: string;

    constructor() {
        this.pythonBackendBaseUrl = process.env.AUTOLAWYER_PYTHON_BACKEND_URL || 'http://127.0.0.1:8000';

        // Initialize all available providers (keeping client + config paired)
        for (const config of PROVIDERS) {
            if (config.apiKey) {
                const client = new OpenAI({
                    apiKey: config.apiKey,
                    baseURL: config.baseURL,
                });
                this.providers.push({ client, config });
                console.log(`✅ Initialized ${config.name} provider`);
            } else {
                console.warn(`⚠️  ${config.name} API key not found, skipping`);
            }
        }

        if (this.providers.length === 0) {
            console.warn("⚠️  No AI providers available. Using mock mode.");
        }
    }

    /**
     * Analyze a clause with automatic provider fallback
     */
    async analyzeClauseRisk(clauseText: string, policy: string = "Standard commercial terms"): Promise<any> {
        if (this.providers.length === 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            return MOCK_RISK_ANALYSIS;
        }

        // Try each provider in order until one succeeds
        for (let i = 0; i < this.providers.length; i++) {
            const providerIndex = (this.activeProviderIndex + i) % this.providers.length;
            const { client, config } = this.providers[providerIndex];

            try {
                console.log(`🤖 Attempting analysis with ${config.name}...`);

                const completion = await client.chat.completions.create({
                    model: config.model,
                    messages: [
                        {
                            role: "system",
                            content: `You are an expert legal AI. Analyze the following contract clause against this policy: "${policy}". 
Return a JSON object with:
- risk_score (0.0 to 1.0)
- severity ("low", "medium", "high", "critical")
- rationale (concise explanation)
- recommendation (actionable advice)
- redline (suggested rewrite)`
                        },
                        {
                            role: "user",
                            content: clauseText
                        }
                    ],
                    response_format: { type: "json_object" },
                    temperature: 0.3,
                });

                const content = completion.choices[0].message.content;
                const result = JSON.parse(content || "{}");

                console.log(`✅ Success with ${config.name}`);
                this.activeProviderIndex = providerIndex; // Remember successful provider
                return result;

            } catch (error: any) {
                console.error(`❌ ${config.name} failed:`, error.message);

                // If this was the last provider, throw
                if (i === this.providers.length - 1) {
                    console.error("❌ All providers failed, using mock response");
                    return MOCK_RISK_ANALYSIS;
                }

                // Otherwise, try next provider
                continue;
            }
        }

        return MOCK_RISK_ANALYSIS;
    }

    /**
     * Call the local Python backend for deep analysis (GPU-accelerated)
     */
    async analyzeWithPythonBackend(file: File, instructions: string): Promise<any> {
        const health = await this.checkPythonBackend();
        if (!health.ok) {
            throw new Error(`GPU backend unavailable: ${health.reason}`);
        }

        const formData = new FormData();
        formData.append('primary_docs', file);
        formData.append('instructions', instructions);

        const startTime = Date.now();
        const maxAttempts = 2;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

            try {
                console.log(`🚀 Connecting to AutoLawyer Backend (attempt ${attempt}/${maxAttempts})...`);
                const response = await fetch(`${this.pythonBackendBaseUrl}/api/cases`, {
                    method: 'POST',
                    body: formData,
                    signal: controller.signal,
                });
                clearTimeout(timeoutId);

                const latency = Date.now() - startTime;
                const { metrics } = await import('../metrics');
                metrics.recordLatency(latency, 'python_backend_analysis');

                if (!response.ok) {
                    metrics.recordRequest(false);
                    throw new Error(`Python backend error: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();
                metrics.recordRequest(true);
                return data;
            } catch (error: any) {
                clearTimeout(timeoutId);
                console.error('Python backend connection failed:', error);
                if (attempt === maxAttempts) {
                    if (error.name === 'TypeError' && error.message.includes('fetch')) {
                        console.error("💡 Is the Python backend running? Run 'python autolawyer-mcp/api/api.py'");
                    }
                    throw error;
                }
            }
        }
    }

    async checkPythonBackend(): Promise<{ ok: boolean; reason?: string }> {
        const healthPaths = ['/api/health', '/health'];
        let lastReason = 'health check failed';

        for (const path of healthPaths) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            try {
                const response = await fetch(`${this.pythonBackendBaseUrl}${path}`, {
                    method: 'GET',
                    signal: controller.signal,
                });
                clearTimeout(timeoutId);

                if (!response.ok) {
                    lastReason = `${path} returned ${response.status}`;
                    continue;
                }

                const body = await response.json().catch(() => ({}));
                const status = typeof body?.status === 'string' ? body.status.toLowerCase() : '';
                if (status === 'ok' || status === 'healthy' || status === 'running' || status === '') {
                    return { ok: true };
                }
                lastReason = `${path} returned unhealthy status: ${status}`;
            } catch (error: any) {
                clearTimeout(timeoutId);
                if (error.name === 'AbortError') {
                    lastReason = `${path} timed out`;
                    continue;
                }
                lastReason = `${path} not reachable`;
            }
        }

        return { ok: false, reason: lastReason };
    }

    /**
     * Get status of all providers
     */
    getProviderStatus() {
        return this.providers.map(({ config }, index) => ({
            name: config.name,
            available: !!config.apiKey,
            active: index === this.activeProviderIndex,
            model: config.model,
            tokenBudget: config.tokenBudget,
        }));
    }
}

export const aiService = new AIService();
