'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface User {
    userId: string;
    email: string;
    name: string;
    role: string;
    plan?: string;
    stats?: Record<string, unknown>;
    image?: string;
    emailVerified?: string;
    accounts?: { provider: string; providerAccountId: string }[];
    memberSince?: string;
}

interface UserContextValue {
    user: User | null;
    loading: boolean;
    logout: () => Promise<void>;
    refetch: () => void;
}

const UserContext = createContext<UserContextValue | null>(null);

async function fetchUser(): Promise<User | null> {
    const res = await fetch('/api/auth/me');
    if (!res.ok) return null;
    const data = await res.json();
    return data.user ?? null;
}

export function UserProvider({ children }: { children: ReactNode }) {
    const queryClient = useQueryClient();
    const { data: user, isLoading, refetch } = useQuery({
        queryKey: ['user'],
        queryFn: fetchUser,
    });

    const logout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        queryClient.setQueryData(['user'], null);
        window.location.href = '/login';
    };

    return (
        <UserContext.Provider
            value={{
                user: user ?? null,
                loading: isLoading,
                logout,
                refetch: () => { refetch(); },
            }}
        >
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const ctx = useContext(UserContext);
    if (!ctx) {
        throw new Error('useUser must be used within UserProvider');
    }
    return ctx;
}
