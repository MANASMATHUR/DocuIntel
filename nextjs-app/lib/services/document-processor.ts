import mammoth from 'mammoth';
import { readFile } from 'fs/promises';
import { extname } from 'path';

export class DocumentProcessor {
    /**
     * Extracts text from a file based on its extension.
     */
    static async extractText(filePath: string): Promise<string> {
        const ext = extname(filePath).toLowerCase();
        const buffer = await readFile(filePath);

        try {
            if (ext === '.pdf') {
                return await DocumentProcessor.extractPdfText(buffer);
            } else if (ext === '.docx') {
                const result = await mammoth.extractRawText({ buffer });
                return result.value;
            } else if (ext === '.txt') {
                return buffer.toString('utf-8');
            } else {
                throw new Error(`Unsupported file extension: ${ext}`);
            }
        } catch (error: any) {
            console.error(`Error extracting text from ${filePath}:`, error.message);
            throw new Error(`Failed to process document: ${error.message}`);
        }
    }

    /**
     * Extract text from a PDF buffer using pdf-parse v1 (no worker, no DOMMatrix).
     */
    private static async extractPdfText(buffer: Buffer): Promise<string> {
        const pdfParse = require('pdf-parse/lib/pdf-parse');
        const result = await pdfParse(buffer);
        return result.text;
    }

    /**
     * Simple segmentation of text into clauses based on double newlines or common headers.
     */
    static segmentClauses(text: string): string[] {
        return text
            .split(/\n\s*\n/)
            .map(chunk => chunk.trim())
            .filter(chunk => chunk.length > 50);
    }
}
