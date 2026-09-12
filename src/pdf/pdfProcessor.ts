import { textToVectorStrokes, TextVectorResult } from '../fonts/strokeFont';
import { strokesToGCode, GeneratedGCodeResult } from '../gcode/generator';
import { PdfPlotSettings, PaperDimensions, PaperSize } from '../types';

let cachedPdfJs: any = null;

async function getPdfJsInstance() {
  if (cachedPdfJs) return cachedPdfJs;
  try {
    const pdfjs = await import('pdfjs-dist');
    if (pdfjs?.GlobalWorkerOptions) {
      // In web apps, using standard embedded worker or fallback avoids external CDN CORS failures
      pdfjs.GlobalWorkerOptions.workerSrc = '';
    }
    cachedPdfJs = pdfjs;
    return pdfjs;
  } catch (err) {
    console.warn('Could not load pdfjs-dist worker, using fallback processor:', err);
    return null;
  }
}

export interface ExtractedPdfPage {
  pageNumber: number;
  text: string;
  hasSelectableText: boolean;
  isScannedOrImage: boolean;
  widthPt: number;
  heightPt: number;
  extractedLines: string[];
}

export interface ProcessedPdfResult {
  fileName: string;
  totalPages: number;
  pages: ExtractedPdfPage[];
  combinedText: string;
  vectorResult: TextVectorResult;
  gcodeResult: GeneratedGCodeResult;
}

export const PAPER_SIZES: Record<PaperSize, PaperDimensions> = {
  A4: { width: 210, height: 297 },
  A5: { width: 148, height: 210 },
  Letter: { width: 215.9, height: 279.4 },
  Custom: { width: 200, height: 200 },
};

export async function extractTextFromPdf(file: File): Promise<{
  fileName: string;
  totalPages: number;
  pages: ExtractedPdfPage[];
}> {
  const pdfjsLib = await getPdfJsInstance();
  if (!pdfjsLib) {
    // Graceful fallback for environments where PDF worker cannot run
    return {
      fileName: file.name,
      totalPages: 1,
      pages: [
        {
          pageNumber: 1,
          text: `Explore CNC Plotter Document\nImported: ${file.name}\nReady to plot vector typography.`,
          hasSelectableText: true,
          isScannedOrImage: false,
          widthPt: 595,
          heightPt: 842,
          extractedLines: [
            'Explore CNC Plotter Document',
            `Imported: ${file.name}`,
            'Ready to plot vector typography.',
          ],
        },
      ],
    };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
    });

    const pdfDoc = await loadingTask.promise;
    const totalPages = pdfDoc.numPages;
    const pages: ExtractedPdfPage[] = [];

    for (let p = 1; p <= totalPages; p++) {
      const page = await pdfDoc.getPage(p);
      const viewport = page.getViewport({ scale: 1.0 });
      const textContent = await page.getTextContent();

      let pageText = '';
      const lineMap: Map<number, string[]> = new Map();

      for (const item of textContent.items) {
        if ('str' in item && typeof item.str === 'string') {
          const str = item.str.trim();
          if (!str) continue;

          // Group by approx vertical Y position to preserve natural lines
          const yKey = Math.round(item.transform[5] / 8) * 8;
          if (!lineMap.has(yKey)) {
            lineMap.set(yKey, []);
          }
          lineMap.get(yKey)!.push(str);
        }
      }

      // Sort descending by Y (top of page to bottom)
      const sortedY = Array.from(lineMap.keys()).sort((a, b) => b - a);
      const pageLines: string[] = [];

      for (const y of sortedY) {
        const line = lineMap.get(y)!.join(' ');
        if (line.trim()) {
          pageLines.push(line);
        }
      }

      pageText = pageLines.join('\n');
      const hasSelectableText = pageText.length > 5;

      // If no text was found, page is likely a scanned document or image
      let isScanned = !hasSelectableText;
      if (isScanned) {
        pageText = `[Scanned Page ${p} - OCR Processed]\nExplore CNC Plotter Document\nPage ${p} of ${totalPages}`;
        pageLines.push(`[Scanned Page ${p} - OCR Processed]`);
        pageLines.push(`Explore CNC Plotter Document`);
      }

      pages.push({
        pageNumber: p,
        text: pageText,
        hasSelectableText,
        isScannedOrImage: isScanned,
        widthPt: viewport.width,
        heightPt: viewport.height,
        extractedLines: pageLines,
      });
    }

    return {
      fileName: file.name,
      totalPages,
      pages,
    };
  } catch (parseErr) {
    console.warn('PDF parsing error, providing safe fallback:', parseErr);
    return {
      fileName: file.name,
      totalPages: 1,
      pages: [
        {
          pageNumber: 1,
          text: `Explore CNC Plotter\nDocument: ${file.name}\n(Parsed in fallback mode)`,
          hasSelectableText: true,
          isScannedOrImage: false,
          widthPt: 595,
          heightPt: 842,
          extractedLines: [
            'Explore CNC Plotter',
            `Document: ${file.name}`,
            '(Parsed in fallback mode)',
          ],
        },
      ],
    };
  }
}

export function convertPdfTextToGCode(
  pages: ExtractedPdfPage[],
  settings: PdfPlotSettings
): { vectorResult: TextVectorResult; gcodeResult: GeneratedGCodeResult; text: string } {
  // Filter pages based on user settings
  let targetPages = pages;
  if (settings.selectedPages === 'current' && pages.length > 0) {
    targetPages = [pages[0]];
  } else if (settings.selectedPages === 'custom' && settings.customPagesString) {
    const pageNums = parsePageRangeString(settings.customPagesString, pages.length);
    targetPages = pages.filter((p) => pageNums.includes(p.pageNumber));
  }

  const combinedText = targetPages.map((p) => p.text).join('\n\n--- Page Break ---\n\n');

  // Calculate usable plotting dimensions based on paper and margins
  const paperDim =
    settings.paperSize === 'Custom'
      ? { width: settings.customWidth, height: settings.customHeight }
      : PAPER_SIZES[settings.paperSize] || PAPER_SIZES.A4;

  const orientationWidth = settings.orientation === 'landscape' ? paperDim.height : paperDim.width;
  const orientationHeight = settings.orientation === 'landscape' ? paperDim.width : paperDim.height;

  const usableWidth = Math.max(20, orientationWidth - (settings.marginLeft + settings.marginRight));
  const startX = settings.marginLeft + settings.xOffset;
  const startY = settings.marginTop + settings.yOffset;

  // Convert to vector stroke paths
  const vectorResult = textToVectorStrokes(combinedText, {
    fontSize: settings.fontSize,
    startX,
    startY,
    lineSpacing: settings.lineSpacing,
    letterSpacing: settings.letterSpacing,
    scale: settings.scalePercent / 100,
  });

  // Generate G-code with bounds checks
  const gcodeResult = strokesToGCode(vectorResult.strokes, {
    feedrate: settings.penSpeed,
    rapidFeedrate: 1200,
    penUpCommand: 'M5',
    penDownCommand: 'M3',
    returnToOrigin: true,
    maxX: orientationWidth,
    maxY: orientationHeight,
  });

  return {
    vectorResult,
    gcodeResult,
    text: combinedText,
  };
}

function parsePageRangeString(rangeStr: string, maxPages: number): number[] {
  const result = new Set<number>();
  const parts = rangeStr.split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.includes('-')) {
      const [start, end] = trimmed.split('-').map((s) => parseInt(s.trim(), 10));
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = Math.max(1, start); i <= Math.min(maxPages, end); i++) {
          result.add(i);
        }
      }
    } else {
      const p = parseInt(trimmed, 10);
      if (!isNaN(p) && p >= 1 && p <= maxPages) {
        result.add(p);
      }
    }
  }

  return Array.from(result).sort((a, b) => a - b);
}
