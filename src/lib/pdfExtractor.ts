/**
 * Client-side document and PDF text extractor.
 * Reads .txt, .md, and .pdf files directly in the user's browser without uploading files to any external server.
 */

// Dynamically load PDF.js from cdnjs if not already present
let pdfjsPromise: Promise<any> | null = null;

function loadPdfJs(): Promise<any> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('PDF.js can only be loaded in a browser environment'));
  }

  if ((window as any).pdfjsLib) {
    return Promise.resolve((window as any).pdfjsLib);
  }

  if (pdfjsPromise) {
    return pdfjsPromise;
  }

  pdfjsPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.async = true;
    script.onload = () => {
      const lib = (window as any).pdfjsLib;
      if (lib) {
        lib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(lib);
      } else {
        reject(new Error('PDF.js loaded but pdfjsLib object not found'));
      }
    };
    script.onerror = () => {
      pdfjsPromise = null;
      reject(new Error('Failed to load PDF.js library from CDN'));
    };
    document.head.appendChild(script);
  });

  return pdfjsPromise;
}

/**
 * Extract text and individual page strings from a PDF file.
 */
export async function extractTextFromPdf(file: File): Promise<{ pages: string[]; totalText: string }> {
  const arrayBuffer = await file.arrayBuffer();

  try {
    const pdfjsLib = await loadPdfJs();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    const pages: string[] = [];
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageString = textContent.items
        .map((item: any) => (item.str !== undefined ? item.str : ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      pages.push(pageString);
    }

    return {
      pages,
      totalText: pages.join('\n\n--- Page Break ---\n\n')
    };
  } catch (err) {
    console.warn('PDF.js extraction failed or timed out, using binary stream scanner fallback', err);
    // Fallback: simple binary scan for ASCII / UTF-8 text strings inside stream objects
    return extractTextFromPdfBinaryFallback(arrayBuffer);
  }
}

/**
 * Fallback binary text scanner for simple unencrypted PDFs if CDN is offline
 */
function extractTextFromPdfBinaryFallback(buffer: ArrayBuffer): { pages: string[]; totalText: string } {
  const bytes = new Uint8Array(buffer);
  let asciiText = '';
  // Convert buffer to string in chunks
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    asciiText += String.fromCharCode(...chunk);
  }

  // Find strings inside parentheses (...) Tj or [(...)] TJ
  const regex = /\(([^)]+)\)\s*Tj/g;
  const matches: string[] = [];
  let match;
  while ((match = regex.exec(asciiText)) !== null) {
    if (match[1] && match[1].length > 1) {
      matches.push(match[1]);
    }
  }

  const rawText = matches.join(' ').replace(/\\[nrt]/g, ' ').trim();
  const pages = [rawText.length > 0 ? rawText : 'เอกสาร PDF (ไม่พบข้อความธรรมดาที่แยกได้โดยตรง)'];

  return {
    pages,
    totalText: pages[0]
  };
}

/**
 * High-level parser for any supported learning file (.txt, .md, .pdf)
 */
export async function extractTextFromFile(file: File): Promise<{
  title: string;
  text: string;
  pages?: string[];
  fileType: 'pdf' | 'slide' | 'note' | 'paper' | 'text';
}> {
  const filename = file.name;
  const lowerName = filename.toLowerCase();

  // Clean title without file extension
  const title = filename.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');

  if (lowerName.endsWith('.pdf')) {
    const { pages, totalText } = await extractTextFromPdf(file);
    return {
      title,
      text: totalText,
      pages,
      fileType: 'pdf'
    };
  }

  // For text/markdown files (.txt, .md, .json, .csv)
  const text = await file.text();
  const fileType = lowerName.endsWith('.md') ? 'note' : 'text';

  return {
    title,
    text,
    fileType
  };
}
