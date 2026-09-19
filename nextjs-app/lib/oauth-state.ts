import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const STATE_COOKIE = 'oauth_state';
const DEV_SECRET = 'docuintel-dev-secret-change-in-prod';

function getSecret(): Uint8Array {
    const secret = process.env.JWT_SECRET || process.env.AUTH_SECRET || DEV_SECRET;
    return new TextEncoder().encode(secret);
}

export async function createOAuthState(provider: string): Promise<string> {
    const nonce = crypto.randomUUID();
    const state = await new SignJWT({ provider, nonce })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('10m')
        .setIssuedAt()
        .sign(getSecret());

    cookies().set(STATE_COOKIE, state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 600,
    });

    return state;
}

export async function verifyOAuthState(state: string, provider: string): Promise<boolean> {
    try {
        const { payload } = await jwtVerify(state, getSecret());
        const cookieState = cookies().get(STATE_COOKIE)?.value;
        cookies().delete(STATE_COOKIE);
        return payload.provider === provider && cookieState === state;
    } catch {
        cookies().delete(STATE_COOKIE);
        return false;
    }
}
