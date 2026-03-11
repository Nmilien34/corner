import type { Request, Response, NextFunction } from 'express';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { createError } from '../middleware/errorHandler';

const FONT_SIZE = 12;
const LINE_HEIGHT = 14;
const MARGIN = 50;
const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MAX_LINE_WIDTH = PAGE_WIDTH - 2 * MARGIN;

export async function handleExportText(req: Request, res: Response, next: NextFunction): Promise<void> {
  const body = req.body as { text?: string; format?: string; fileName?: string };
  const text = typeof body.text === 'string' ? body.text : '';
  const format = body.format === 'docx' || body.format === 'pdf' ? body.format : null;
  const baseName = typeof body.fileName === 'string' && body.fileName.trim() ? body.fileName.trim() : 'export';

  if (!format) {
    next(createError(400, 'Missing or invalid format; use "pdf" or "docx"'));
    return;
  }

  try {
    if (format === 'docx') {
      const paragraphs = text
        .split(/\n{2,}/)
        .map((p) => p.replace(/\n/g, ' ').trim())
        .filter((p) => p.length > 0);
      const docParagraphs =
        paragraphs.length > 0
          ? paragraphs.map(
              (t) => new Paragraph({ children: [new TextRun({ text: t, size: 24 })] })
            )
          : [new Paragraph({ children: [new TextRun({ text: ' ', size: 24 })] })];
      const doc = new Document({ sections: [{ children: docParagraphs }] });
      const buffer = await Packer.toBuffer(doc);
      const fileName = `${baseName}.docx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(Buffer.from(buffer));
      return;
    }

    // PDF
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const lines: string[] = [];
    for (const paragraph of text.split(/\n/)) {
      const words = paragraph.split(/\s+/).filter(Boolean);
      let currentLine = '';
      for (const word of words) {
        const candidate = currentLine ? `${currentLine} ${word}` : word;
        const width = font.widthOfTextAtSize(candidate, FONT_SIZE);
        if (width <= MAX_LINE_WIDTH) {
          currentLine = candidate;
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine) lines.push(currentLine);
    }
    if (lines.length === 0) lines.push(' ');

    let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    let y = PAGE_HEIGHT - MARGIN;

    for (const line of lines) {
      if (y < MARGIN + LINE_HEIGHT) {
        page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        y = PAGE_HEIGHT - MARGIN;
      }
      page.drawText(line, {
        x: MARGIN,
        y,
        size: FONT_SIZE,
        font,
      });
      y -= LINE_HEIGHT;
    }

    const pdfBytes = await pdfDoc.save();
    const fileName = `${baseName}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    next(createError(500, err instanceof Error ? err.message : 'Export failed'));
  }
}
