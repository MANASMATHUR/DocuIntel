/** Runtime environment helpers — safe to import from server code */

export function isOAuthProviderConfigured(provider: 'google' | 'apple'): boolean {
    if (provider === 'google') {
        return !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
    }
    return !!(
        process.env.AUTH_APPLE_ID &&
        process.env.AUTH_APPLE_TEAM_ID &&
        process.env.AUTH_APPLE_KEY_ID &&
        process.env.AUTH_APPLE_PRIVATE_KEY
    );
}

export function getConfiguredOAuthProviders(): string[] {
    const providers: string[] = [];
    if (isOAuthProviderConfigured('google')) providers.push('google');
    if (isOAuthProviderConfigured('apple')) providers.push('apple');
    return providers;
}

export function assertProductionSecrets() {
    if (process.env.NODE_ENV !== 'production') return;
    const secret = process.env.AUTH_SECRET || process.env.JWT_SECRET;
    const devDefault = 'docuintel-dev-secret-change-in-prod';
    if (!secret || secret === devDefault) {
        throw new Error('AUTH_SECRET or JWT_SECRET must be set in production');
    }
}
