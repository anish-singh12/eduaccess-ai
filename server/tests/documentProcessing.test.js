import { describe, it, expect } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';
import { parseUploadedDocument } from '../src/services/documentParserService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMP_DIR = path.resolve(__dirname, '../uploads/temp');

// Helper to construct a minimal valid DOCX zip archive in memory
function createMinimalDocxBuffer(paragraphText) {
  const contentTypesXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>';
  const relsXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>';
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>${paragraphText}</w:t></w:r></w:p></w:body></w:document>`;

  // Build standard uncompressed ZIP structure
  const files = [
    { name: '[Content_Types].xml', content: Buffer.from(contentTypesXml) },
    { name: '_rels/.rels', content: Buffer.from(relsXml) },
    { name: 'word/document.xml', content: Buffer.from(documentXml) }
  ];

  const localHeaders = [];
  const centralDirs = [];
  let offset = 0;

  for (const f of files) {
    const nameBuf = Buffer.from(f.name);
    const crc = zlib.crc32(f.content);

    // Local file header (30 bytes + name)
    const lh = Buffer.alloc(30 + nameBuf.length);
    lh.writeUInt32LE(0x04034b50, 0); // signature
    lh.writeUInt16LE(20, 4); // version needed
    lh.writeUInt16LE(0, 6); // general flags
    lh.writeUInt16LE(0, 8); // compression method (0 = store)
    lh.writeUInt16LE(0, 10); // mod time
    lh.writeUInt16LE(0, 12); // mod date
    lh.writeUInt32LE(crc, 14); // crc32
    lh.writeUInt32LE(f.content.length, 18); // comp size
    lh.writeUInt32LE(f.content.length, 22); // uncomp size
    lh.writeUInt16LE(nameBuf.length, 26); // name length
    lh.writeUInt16LE(0, 28); // extra field length
    nameBuf.copy(lh, 30);

    localHeaders.push(lh, f.content);

    // Central directory header (46 bytes + name)
    const cd = Buffer.alloc(46 + nameBuf.length);
    cd.writeUInt32LE(0x02014b50, 0); // signature
    cd.writeUInt16LE(20, 4); // version made by
    cd.writeUInt16LE(20, 6); // version needed
    cd.writeUInt16LE(0, 8); // flags
    cd.writeUInt16LE(0, 10); // method
    cd.writeUInt16LE(0, 12); // time
    cd.writeUInt16LE(0, 14); // date
    cd.writeUInt32LE(crc, 16); // crc32
    cd.writeUInt32LE(f.content.length, 20); // comp size
    cd.writeUInt32LE(f.content.length, 24); // uncomp size
    cd.writeUInt16LE(nameBuf.length, 28); // name length
    cd.writeUInt16LE(0, 30); // extra length
    cd.writeUInt16LE(0, 32); // comment length
    cd.writeUInt16LE(0, 34); // disk start
    cd.writeUInt16LE(0, 36); // internal attrs
    cd.writeUInt32LE(0, 38); // external attrs
    cd.writeUInt32LE(offset, 42); // local header offset
    nameBuf.copy(cd, 46);

    centralDirs.push(cd);
    offset += lh.length + f.content.length;
  }

  const cdOffset = offset;
  let cdSize = 0;
  for (const cd of centralDirs) cdSize += cd.length;

  // End of central directory record (22 bytes)
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // signature
  eocd.writeUInt16LE(0, 4); // disk num
  eocd.writeUInt16LE(0, 6); // start disk
  eocd.writeUInt16LE(files.length, 8); // entries on disk
  eocd.writeUInt16LE(files.length, 10); // total entries
  eocd.writeUInt32LE(cdSize, 12); // cd size
  eocd.writeUInt32LE(cdOffset, 16); // cd offset
  eocd.writeUInt16LE(0, 20); // comment length

  return Buffer.concat([...localHeaders, ...centralDirs, eocd]);
}

describe('Document Processing Pipeline - DOCX and PDF', () => {
  it('correctly extracts text and metadata from a standard text PDF without xref errors', async () => {
    const pdfPath = path.join(TEMP_DIR, `test_physics_${Date.now()}.pdf`);

    const textPdf = `%PDF-1.4
1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj
2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj
3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources <</Font <</F1 5 0 R>>>>>> endobj
4 0 obj <</Length 78>> stream
BT /F1 18 Tf 50 720 Td (Classical Mechanics: Newtons Laws of Motion and Gravitation) Tj ET
endstream
endobj
5 0 obj <</Type /Font /Subtype /Type1 /BaseFont /Helvetica>> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000373 00000 n 
trailer <</Size 6 /Root 1 0 R>>
startxref
450
%%EOF`;

    await fs.writeFile(pdfPath, textPdf);

    const result = await parseUploadedDocument({
      path: pdfPath,
      originalname: 'physics_notes.pdf',
      mimetype: 'application/pdf'
    });

    expect(result.text).toContain('Newtons Laws of Motion');
    expect(result.fileType).toBe('pdf');
    expect(result.topic).toContain('Physics notes');
    expect(result.numPages).toBeGreaterThanOrEqual(1);

    const exists = await fs.access(pdfPath).then(() => true).catch(() => false);
    expect(exists).toBe(false);
  });

  it('correctly extracts text from Word .docx documents using mammoth', async () => {
    const docxPath = path.join(TEMP_DIR, `test_biology_${Date.now()}.docx`);
    const docxBuf = createMinimalDocxBuffer('Cellular Biology: Mitochondria is the powerhouse of the eukaryotic cell.');
    await fs.writeFile(docxPath, docxBuf);

    const result = await parseUploadedDocument({
      path: docxPath,
      originalname: 'cellular_biology.docx',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });

    expect(result.text).toContain('Cellular Biology: Mitochondria');
    expect(result.fileType).toBe('docx');
    expect(result.topic).toContain('Cellular biology');
    expect(result.charCount).toBeGreaterThan(20);

    const exists = await fs.access(docxPath).then(() => true).catch(() => false);
    expect(exists).toBe(false);
  });

  it('rejects legacy .doc files with an informative error message', async () => {
    const docPath = path.join(TEMP_DIR, `test_ancient_${Date.now()}.doc`);
    await fs.writeFile(docPath, 'Legacy binary word content');

    await expect(
      parseUploadedDocument({
        path: docPath,
        originalname: 'ancient_history.doc',
        mimetype: 'application/msword'
      })
    ).rejects.toThrow(/Legacy \.doc format is not supported/i);

    const exists = await fs.access(docPath).then(() => true).catch(() => false);
    expect(exists).toBe(false);
  });

  it('detects scanned / empty PDFs and instructs user about OCR', async () => {
    const emptyPdfPath = path.join(TEMP_DIR, `test_empty_${Date.now()}.pdf`);

    const blankPdf = `%PDF-1.4
1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj
2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj
3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources <<>>>> endobj
4 0 obj <</Length 0>> stream
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000216 00000 n 
trailer <</Size 5 /Root 1 0 R>>
startxref
267
%%EOF`;

    await fs.writeFile(emptyPdfPath, blankPdf);

    await expect(
      parseUploadedDocument({
        path: emptyPdfPath,
        originalname: 'empty_scan.pdf',
        mimetype: 'application/pdf'
      })
    ).rejects.toThrow(/scanned image or contains no extractable text/i);

    const exists = await fs.access(emptyPdfPath).then(() => true).catch(() => false);
    expect(exists).toBe(false);
  });
});
