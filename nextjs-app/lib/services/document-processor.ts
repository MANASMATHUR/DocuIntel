import mammoth from 'mammoth';
import { readFile } from 'fs/promises';
import { extname } from 'path';

// Polyfill DOMMatrix for serverless environments (Vercel) where pdfjs-dist needs it
if (typeof globalThis.DOMMatrix === 'undefined') {
    (globalThis as any).DOMMatrix = class DOMMatrix {
        m11 = 1; m12 = 0; m13 = 0; m14 = 0;
        m21 = 0; m22 = 1; m23 = 0; m24 = 0;
        m31 = 0; m32 = 0; m33 = 1; m34 = 0;
        m41 = 0; m42 = 0; m43 = 0; m44 = 1;
        a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
        is2D = true; isIdentity = true;
        constructor(init?: any) {
            if (Array.isArray(init) && init.length === 6) {
                [this.a, this.b, this.c, this.d, this.e, this.f] = init;
                this.m11 = this.a; this.m12 = this.b;
                this.m21 = this.c; this.m22 = this.d;
                this.m41 = this.e; this.m42 = this.f;
            }
        }
        transformPoint() { return { x: 0, y: 0, z: 0, w: 1 }; }
        inverse() { return new DOMMatrix(); }
        multiply() { return new DOMMatrix(); }
        scale() { return new DOMMatrix(); }
        translate() { return new DOMMatrix(); }
        toString() { return 'matrix(1, 0, 0, 1, 0, 0)'; }
    };
}

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
     * Extract text from a PDF buffer using pdf-parse.
     */
    private static async extractPdfText(buffer: Buffer): Promise<string> {
        const { PDFParse } = require('pdf-parse');
        const parser = new PDFParse({ data: new Uint8Array(buffer) });
        const result = await parser.getText();
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
