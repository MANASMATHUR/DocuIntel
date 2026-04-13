/**
 * Demo Token API Route
 * 
 * Provides demo authentication tokens for testing and development.
 * 
 * @route GET /api/auth/demo-token
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateDemoTokens, DEMO_USER } from '@/lib/auth';

/**
 * GET /api/auth/demo-token
 * 
 * Returns demo authentication tokens for testing.
 * In production, replace with proper authentication flow.
 */
export async function GET(request: NextRequest) {
    try {
        const tokens = await generateDemoTokens();

        return NextResponse.json({
            ...tokens,
            user: {
                userId: DEMO_USER.userId,
                email: DEMO_USER.email,
                role: DEMO_USER.role,
            },
            message: 'Demo token generated successfully. Use for testing only.',
            note: 'This endpoint is for development purposes. Implement proper authentication for production.'
        });

    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to generate demo token' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/auth/demo-token
 * 
 * Alternative method for generating demo tokens.
 */
export async function POST(request: NextRequest) {
    return GET(request);
}
