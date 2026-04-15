import { NextRequest, NextResponse } from 'next/server';

// Legacy endpoint - demo login is now handled by POST /api/auth/login with { demo: true }
export async function GET(request: NextRequest) {
    return NextResponse.json({
        message: 'Use POST /api/auth/login with { "demo": true } for demo access.',
    });
}

export async function POST(request: NextRequest) {
    return GET(request);
}
