import { promises as fs } from 'fs';
import path from 'path';

export type SharedReportRecord = {
  token: string;
  createdAt: string;
  caseData: Record<string, unknown>;
};

const DATA_DIR = path.join(process.cwd(), '.data');
const STORE_FILE = path.join(DATA_DIR, 'report-shares.json');

async function readAll(): Promise<Record<string, SharedReportRecord>> {
  try {
    const raw = await fs.readFile(STORE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

async function writeAll(data: Record<string, SharedReportRecord>): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STORE_FILE, JSON.stringify(data, null, 2), 'utf8');
}

export async function saveSharedReport(caseData: Record<string, unknown>, token: string): Promise<SharedReportRecord> {
  const all = await readAll();
  const record: SharedReportRecord = {
    token,
    createdAt: new Date().toISOString(),
    caseData,
  };
  all[token] = record;
  await writeAll(all);
  return record;
}

export async function getSharedReport(token: string): Promise<SharedReportRecord | null> {
  const all = await readAll();
  return all[token] ?? null;
}
