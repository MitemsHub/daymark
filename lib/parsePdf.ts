// PDF statement parsing. Extracts per-page text with Mozilla's PDF.js and
// rebuilds table rows from the text geometry (words with x/y positions),
// so column boundaries survive. Bank-agnostic: the user maps columns if
// auto-detection guesses wrong. pdfjs-dist is imported dynamically.

export interface PdfWord {
  text: string;
  x: number;
  y: number;
  width: number;
}

export interface PdfRow {
  y: number;
  page: number;
  words: PdfWord[];
  /** text of the row joined with single spaces */
  line: string;
}

export interface PdfParseResult {
  rows: PdfRow[];
  pageCount: number;
  fullText: string;
}

// pdf.js ships a worker; point it at our self-hosted copy. The base path
// comes from the build (NEXT_PUBLIC_BASE_PATH) so it works on GitHub Pages.
function workerUrl(): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
  return `${base}/pdf/pdf.worker.min.mjs`;
}

/** Group words into visual rows by y position, with a tolerance band. */
function groupRows(words: PdfWord[], page: number, yTolerance = 3): PdfRow[] {
  const sorted = [...words].sort((a, b) => a.y - b.y || a.x - b.x);
  const rows: PdfRow[] = [];
  let current: PdfWord[] = [];
  let currentY = Number.NaN;
  for (const w of sorted) {
    if (!Number.isNaN(currentY) && Math.abs(w.y - currentY) > yTolerance) {
      if (current.length > 0) {
        current.sort((a, b) => a.x - b.x);
        rows.push({ y: currentY, page, words: current, line: current.map((c) => c.text).join(" ") });
      }
      current = [];
    }
    if (Number.isNaN(currentY)) currentY = w.y;
    // Track the row's y as the first word's y for stable grouping.
    if (current.length === 0) currentY = w.y;
    current.push(w);
  }
  if (current.length > 0) {
    current.sort((a, b) => a.x - b.x);
    rows.push({ y: currentY, page, words: current, line: current.map((c) => c.text).join(" ") });
  }
  return rows;
}

/**
 * Extract text rows from a PDF. Returns visual rows per page, in reading
 * order. Columns are preserved as word positions; a row's words can be
 * bucketed by x-ranges when the caller needs table columns.
 */
export async function parsePdfRows(data: ArrayBuffer): Promise<PdfParseResult> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl();
  const doc = await pdfjs.getDocument({ data }).promise;
  const rows: PdfRow[] = [];
  const textParts: string[] = [];

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    const words: PdfWord[] = [];
    for (const item of content.items) {
      if (!("str" in item)) continue;
      const str = (item as { str: string; transform: number[]; width: number }).str;
      if (!str.trim()) continue;
      const t = item as { str: string; transform: number[]; width: number };
      // transform: [a, b, c, d, e, f]; e = x, f = y in PDF points.
      words.push({ text: t.str, x: t.transform[4], y: t.transform[5], width: t.width });
    }
    rows.push(...groupRows(words, pageNum));
    textParts.push(rows.filter((r) => r.page === pageNum).map((r) => r.line).join("\n"));
  }

  return { rows, pageCount: doc.numPages, fullText: textParts.join("\n") };
}

/**
 * Bucket a row's words into table columns given x boundaries. Boundaries
 * are midpoints between column starts, provided by the caller.
 */
export function bucketRow(row: PdfRow, boundaries: number[]): string[] {
  const cells: string[] = new Array(boundaries.length + 1).fill("");
  for (const w of row.words) {
    let idx = boundaries.findIndex((b) => w.x < b);
    if (idx === -1) idx = boundaries.length;
    cells[idx] = (cells[idx] ? cells[idx] + " " : "") + w.text;
  }
  return cells.map((c) => c.trim());
}

/**
 * Guess column boundaries from the header row: each header word's x start
 * becomes a column; boundaries sit midway to the next header word.
 */
export function boundariesFromHeader(headerRow: PdfRow): { names: string[]; boundaries: number[] } {
  const words = [...headerRow.words].sort((a, b) => a.x - b.x);
  const names = words.map((w) => w.text);
  const boundaries: number[] = [];
  for (let i = 0; i < words.length - 1; i++) {
    boundaries.push((words[i].x + words[i + 1].x) / 2);
  }
  return { names, boundaries };
}
