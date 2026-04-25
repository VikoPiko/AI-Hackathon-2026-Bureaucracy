import mammoth from 'mammoth';

export async function extractTextFromBuffer(
  buffer: Buffer,
  options: {
    contentType?: string;
    fileName?: string;
  } = {},
): Promise<string> {
  const contentType = (options.contentType || '').toLowerCase();
  const fileName = (options.fileName || '').toLowerCase();

  if (contentType.startsWith('image/')) {
    throw new Error(
      'Image OCR is not enabled yet. Please upload a PDF, DOCX, DOC, or TXT file.',
    );
  }

  try {
    if (contentType.includes('pdf') || fileName.endsWith('.pdf')) {
      const pdfParse = (await import('pdf-parse')).default;
      const data = await pdfParse(buffer);
      return cleanText(data.text);
    }

    if (
      contentType.includes('officedocument') ||
      fileName.endsWith('.docx') ||
      fileName.endsWith('.doc')
    ) {
      const result = await mammoth.extractRawText({ buffer });
      return cleanText(result.value);
    }

    return cleanText(buffer.toString('utf-8'));
  } catch {
    return cleanText(buffer.toString('utf-8'));
  }
}

export async function extractTextFromFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());

  return extractTextFromBuffer(buffer, {
    contentType: file.type,
    fileName: file.name,
  });
}

/**
 * Extract text from PDF or DOCX files by URL.
 */
export async function extractTextFromUrl(fileUrl: string): Promise<string> {
  const res = await fetch(fileUrl);
  const buffer = Buffer.from(await res.arrayBuffer());

  return extractTextFromBuffer(buffer, {
    contentType: res.headers.get('content-type') || '',
    fileName: fileUrl,
  });
}

/**
 * Clean extracted text by normalizing whitespace
 */
function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}
