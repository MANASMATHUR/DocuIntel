import dbConnect from '@/lib/db/mongodb';
import SharedReport from '@/lib/db/models/SharedReport';

export type SharedReportRecord = {
    token: string;
    createdAt: string;
    /** Mongo user id of creator; not exposed on public GET (absent on legacy shares) */
    ownerUserId?: string;
    caseData: Record<string, unknown>;
};

function toRecord(doc: {
    token: string;
    ownerUserId?: string;
    caseData: unknown;
    createdAt?: Date;
}): SharedReportRecord {
    return {
        token: doc.token,
        createdAt: (doc.createdAt ? new Date(doc.createdAt) : new Date()).toISOString(),
        ownerUserId: doc.ownerUserId,
        caseData: (doc.caseData ?? {}) as Record<string, unknown>,
    };
}

export async function saveSharedReport(
    caseData: Record<string, unknown>,
    token: string,
    ownerUserId: string
): Promise<SharedReportRecord> {
    await dbConnect();
    const doc = await SharedReport.findOneAndUpdate(
        { token },
        { $set: { ownerUserId, caseData } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    if (!doc) {
        throw new Error('Failed to persist shared report');
    }

    return toRecord(doc);
}

export async function getSharedReport(token: string): Promise<SharedReportRecord | null> {
    await dbConnect();
    const doc = await SharedReport.findOne({ token }).lean();
    if (!doc) return null;
    return toRecord(doc);
}
