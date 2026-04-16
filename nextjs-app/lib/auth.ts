import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'docuintel-dev-secret-change-in-prod'
);

const TOKEN_EXPIRY = '7d';
const COOKIE_NAME = 'docuintel-token';

export interface UserPayload {
    userId: string;
    email: string;
    name: string;
    role: string;
}

export async function createToken(payload: UserPayload): Promise<string> {
    return new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime(TOKEN_EXPIRY)
        .setIssuedAt()
        .sign(JWT_SECRET);
}

export async function validateToken(token: string): Promise<{ success: boolean; user?: UserPayload; error?: string }> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return {
            success: true,
            user: {
                userId: payload.userId as string,
                email: payload.email as string,
                name: payload.name as string,
                role: payload.role as string,
            },
        };
    } catch {
        return { success: false, error: 'Invalid or expired token' };
    }
}

export function setAuthCookie(token: string) {
    const cookieStore = cookies();
    cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
    });
}

export function getAuthCookie(): string | undefined {
    const cookieStore = cookies();
    return cookieStore.get(COOKIE_NAME)?.value;
}

export function clearAuthCookie() {
    const cookieStore = cookies();
    cookieStore.delete(COOKIE_NAME);
}

export async function getCurrentUser(): Promise<UserPayload | null> {
    const token = getAuthCookie();
    if (!token) return null;
    const result = await validateToken(token);
    return result.success ? result.user! : null;
}
