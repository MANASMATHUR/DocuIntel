import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import ClauseTemplate from '@/lib/db/models/ClauseTemplate';

export async function GET(request: NextRequest) {
    const userId = request.headers.get('X-User-Id') || 'anonymous';
    try {
        await dbConnect();
        const templates = await ClauseTemplate.find({ user_id: userId }).sort({ createdAt: -1 }).lean();
        return NextResponse.json({ templates });
    } catch (error: any) {
        return NextResponse.json({ templates: [] });
    }
}

export async function POST(request: NextRequest) {
    const userId = request.headers.get('X-User-Id') || 'anonymous';
    try {
        const { name, category, text, source_case_id, source_heading, tags } = await request.json();
        if (!name || !text) {
            return NextResponse.json({ error: 'Name and text are required' }, { status: 400 });
        }

        await dbConnect();
        const template = await ClauseTemplate.create({
            user_id: userId,
            name,
            category: category || 'General',
            text,
            source_case_id,
            source_heading,
            tags: tags || [],
        });

        return NextResponse.json(template.toObject());
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const userId = request.headers.get('X-User-Id') || 'anonymous';
    try {
        const { id } = await request.json();
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        await dbConnect();
        await ClauseTemplate.findOneAndDelete({ _id: id, user_id: userId });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
