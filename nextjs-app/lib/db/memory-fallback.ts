import { randomUUID } from 'crypto';

export interface MockUser {
    _id: { toString: () => string };
    email: string;
    password?: string;
    name: string;
    role: string;
    isGuest?: boolean;
    guestExpiresAt?: Date;
}

// In-memory store (will reset on serverless function cold starts)
const fallbackUsers: MockUser[] = [];

export function getFallbackUserByEmail(email: string): MockUser | undefined {
    return fallbackUsers.find(u => u.email === email);
}

export function createFallbackUser(data: Partial<MockUser>): MockUser {
    const user: MockUser = {
        _id: { toString: () => randomUUID() },
        email: data.email || '',
        password: data.password,
        name: data.name || 'User',
        role: data.role || 'user',
        isGuest: data.isGuest,
        guestExpiresAt: data.guestExpiresAt
    };
    fallbackUsers.push(user);
    return user;
}
