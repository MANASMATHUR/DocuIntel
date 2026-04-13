import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getSharedReport, saveSharedReport } from '@/lib/report-share-store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const caseData = body?.caseData as Record<string, unknown> | undefined;
    if (!caseData || typeof caseData !== 'object') {
      return NextResponse.json({ error: 'caseData is required' }, { status: 400 });
    }
    const token = randomUUID().replace(/-/g, '').slice(0, 24);
    await saveSharedReport(caseData, token);
    return NextResponse.json({ token, path: `/report/${token}` });
  } catch (e: any) {
    console.error('share report error', e);
    return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  if (!token) {
    return NextResponse.json({ error: 'token is required' }, { status: 400 });
  }
  const record = await getSharedReport(token);
  if (!record) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(record);
}
