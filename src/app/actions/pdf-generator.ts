'use server';

import { PDFDocument as PDFLib, StandardFonts, rgb, degrees } from 'pdf-lib';
import type { PDFFont, PDFImage, PDFPage } from 'pdf-lib';
import { promises as fs } from 'fs';
import path from 'path';
import { initializeFirebase } from '@/firebase';
import { collection, query, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import type { Book, Chapter, User } from '@/lib/types';

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 72;

// --- THEME COLORS & ASSETS ---
const nusakarsaPrimary = rgb(0.45, 0.56, 0.22);
const nusakarsaBackground = rgb(0.97, 0.98, 0.96);
const textDark = rgb(0.1, 0.1, 0.1);
const textMuted = rgb(0.4, 0.4, 0.4);
const poemTextColor = rgb(0.2, 0.1, 0.1);
const POEM_PAPER_TEXTURE_URL = "https://media.istockphoto.com/id/654922866/photo/old-yellowed-stained-paper-texture.jpg?s=612x612&w=0&k=20&c=uInwuGGMQMw2RKMillvZz5suVDgIcKD7yvrOmoPVt-k=";
const WATERMARK_PATH = path.join(process.cwd(), 'https://raw.githubusercontent.com/Zombiesigma/nusakarsa-v1/main/public/logo/copyright.png');

// --- UTILITY FUNCTIONS ---

function addWatermarkToPage(page: PDFPage, watermarkImage: PDFImage, opacity: number) {
    const { width, height } = page.getSize();
    const watermarkDims = watermarkImage.scale(0.8);
    page.drawImage(watermarkImage, {
        x: width / 2 - watermarkDims.width / 2,
        y: height / 2 - watermarkDims.height / 2,
        width: watermarkDims.width,
        height: watermarkDims.height,
        opacity: opacity, // Use dynamic opacity
        rotate: degrees(-45),
    });
}

function sanitizePath(str: string): string {
  return str.replace(/[^a-z0-9]/gi, '_').toLowerCase().trim();
}

function addPageHeader(page: PDFPage, bookTitle: string, font: PDFFont) {
    const { width, height } = page.getSize();
    page.drawText('NUSAKARSA DIGITAL', { x: MARGIN, y: height - 40, size: 7, font, color: rgb(0.7, 0.7, 0.7) });
    page.drawText(bookTitle.toUpperCase(), { x: width - MARGIN - font.widthOfTextAtSize(bookTitle.toUpperCase(), 7), y: height - 40, size: 7, font, color: rgb(0.7, 0.7, 0.7) });
}

function addPageFooter(page: PDFPage, pageNum: number, font: PDFFont) {
    const { width } = page.getSize();
    const pageNumText = `${pageNum}`;
    page.drawText(pageNumText, { x: width / 2 - font.widthOfTextAtSize(pageNumText, 10) / 2, y: 40, size: 10, font, color: textMuted });
}

// Draws a line of text, respecting markdown and wrapping if necessary.
async function drawProseLine(
  page: PDFPage,
  text: string,
  y: number,
  pdfDoc: PDFLib,
  fonts: Record<string, PDFFont>,
  watermarkImage: PDFImage,
  pageBg: any,
  bookTitle: string,
  watermarkOpacity: number
): Promise<{ y: number, page: PDFPage }> {
    let currentPage = page;
    let currentY = y;
    const contentWidth = PAGE_WIDTH - MARGIN * 2;

    let baseFont = fonts.serifRegular;
    let baseSize = 12;
    let xOffset = 0;

    // Block-level markdown detection for the line
    if (text.startsWith('# ')) { baseSize = 20; baseFont = fonts.serifBold; text = text.substring(2); }
    else if (text.startsWith('## ')) { baseSize = 16; baseFont = fonts.serifBold; text = text.substring(3); }
    else if (text.startsWith('### ')) { baseSize = 14; baseFont = fonts.serifBold; text = text.substring(4); }
    else if (text.startsWith('> ')) {
        baseFont = fonts.serifItalic;
        text = text.substring(2);
        xOffset = 20;
        currentPage.drawRectangle({ x: MARGIN, y: currentY - baseSize * 1.2, width: 3, height: baseSize * 1.4, color: nusakarsaPrimary, opacity: 0.4 });
    }
    
    const lineHeight = baseSize * 1.5;
    const tokens = text.split(/(\*\*.*?\*\*|\*.*?\*)/g).filter(Boolean);
    let currentX = MARGIN + xOffset;

    const checkPageBreak = async () => {
        if (currentY < MARGIN + lineHeight) {
            currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
            if (pageBg.texture) currentPage.drawImage(pageBg.texture, {x:0,y:0,width:PAGE_WIDTH,height:PAGE_HEIGHT}); else currentPage.drawRectangle({x:0,y:0,width:PAGE_WIDTH,height:PAGE_HEIGHT, color: pageBg.color});
            addWatermarkToPage(currentPage, watermarkImage, watermarkOpacity);
            addPageHeader(currentPage, bookTitle, fonts.regular);
            addPageFooter(currentPage, pdfDoc.getPageCount(), fonts.regular);
            currentY = PAGE_HEIGHT - MARGIN - 40;
            currentX = MARGIN + xOffset;
        }
    }

    for (const token of tokens) {
        let font = baseFont;
        let content = token;

        if (token.startsWith('**') && token.endsWith('**')) { font = fonts.serifBold; content = token.slice(2, -2); }
        else if (token.startsWith('*') && token.endsWith('*')) { font = fonts.serifItalic; content = token.slice(1, -1); }

        const words = content.split(' ');
        for (const word of words) {
            if (!word) continue;

            const wordWidth = font.widthOfTextAtSize(word, baseSize);
            if (currentX + wordWidth > PAGE_WIDTH - MARGIN) {
                currentY -= lineHeight;
                currentX = MARGIN + xOffset;
            }

            await checkPageBreak();

            currentPage.drawText(word, { x: currentX, y: currentY, font, size: baseSize, color: textDark });
            currentX += wordWidth + font.widthOfTextAtSize(' ', baseSize);
        }
    }
    
    currentY -= lineHeight; // Move to the next line after the whole line is drawn
    return { y: currentY, page: currentPage };
}

export async function generateBookPdf(bookId: string): Promise<string> {
  const { firestore } = initializeFirebase();
  if (!firestore) throw new Error('Firestore not initialized');

  // --- DATA FETCHING ---
  const bookRef = doc(firestore, 'books', bookId);
  const bookSnap = await getDoc(bookRef);
  if (!bookSnap.exists()) throw new Error('Book not found');
  const book = { id: bookSnap.id, ...bookSnap.data() } as Book;

  const authorUserRef = doc(firestore, 'users', book.authorId);
  const authorUserSnap = await getDoc(authorUserRef);
  const authorProfile = authorUserSnap.exists() ? authorUserSnap.data() as User : null;

  const chaptersQuery = query(collection(firestore, 'books', bookId, 'chapters'), orderBy('order', 'asc'));
  const chaptersSnap = await getDocs(chaptersQuery);
  const chapters = chaptersSnap.docs.map(d => ({ id: d.id, ...d.data() } as Chapter));

  const pdfDoc = await PDFLib.create();
  
  // --- ASSET & FONT LOADING ---
  const watermarkBytes = await fs.readFile(WATERMARK_PATH);
  const watermarkImage = await pdfDoc.embedPng(watermarkBytes);

  const isPoem = book.type === 'poem';
  const watermarkOpacity = isPoem ? 0.12 : 0.04;

  const pageBg = { color: nusakarsaBackground, texture: null as PDFImage | null };
  if (isPoem) {
      try {
          const paperBytes = await fetch(POEM_PAPER_TEXTURE_URL).then(res => res.arrayBuffer());
          pageBg.texture = await pdfDoc.embedJpg(paperBytes);
      } catch (e) { console.warn("Could not fetch poem paper texture."); }
  }

  const fonts = {
      bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
      regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
      italic: await pdfDoc.embedFont(StandardFonts.HelveticaOblique),
      serifBold: await pdfDoc.embedFont(StandardFonts.TimesRomanBold),
      serifRegular: await pdfDoc.embedFont(StandardFonts.TimesRoman),
      serifItalic: await pdfDoc.embedFont(StandardFonts.TimesRomanItalic),
  }

  // --- COVER PAGE ---
  let coverPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const { width, height } = coverPage.getSize();
  
  coverPage.drawRectangle({ x: 0, y: 0, width, height, color: nusakarsaBackground });
  addWatermarkToPage(coverPage, watermarkImage, watermarkOpacity);
  coverPage.drawRectangle({ x: 0, y: height - 20, width, height: 20, color: nusakarsaPrimary });

  coverPage.drawText(book.title, { x: MARGIN, y: height - 200, size: 40, font: fonts.bold, color: textDark, maxWidth: width - (MARGIN * 2), lineHeight: 48 });
  coverPage.drawText(book.genre.toUpperCase(), { x: MARGIN, y: height - 230, size: 10, font: fonts.bold, color: nusakarsaPrimary, characterSpacing: 2 });
  coverPage.drawText('Oleh:', { x: MARGIN, y: height - 300, size: 12, font: fonts.italic, color: textMuted });
  coverPage.drawText(book.authorName, { x: MARGIN, y: height - 325, size: 24, font: fonts.serifBold, color: textDark });

  const synopsisYStart = height - 400;
  coverPage.drawText("Sinopsis", { x: MARGIN, y: synopsisYStart, size: 12, font: fonts.bold, color: textDark });
  
  const synopsisLines = wrapText(book.synopsis, width - (MARGIN * 2), fonts.serifRegular, 11);
  let currentY_cover = synopsisYStart - 20;
  for (const line of synopsisLines) {
      if (currentY_cover < 150) break;
      coverPage.drawText(line, { x: MARGIN, y: currentY_cover, size: 11, font: fonts.serifItalic, color: textMuted, lineHeight: 15 });
      currentY_cover -= 15;
  }
  
  const footerY = 80;
  coverPage.drawLine({ start: { x: MARGIN, y: footerY + 20 }, end: { x: width - MARGIN, y: footerY + 20 }, thickness: 0.5, color: nusakarsaPrimary, opacity: 0.5 });

  if (authorProfile) {
    const contactText = [authorProfile.email, authorProfile.domicile].filter(Boolean).join(' • ');
    coverPage.drawText(contactText, { x: MARGIN, y: footerY, size: 9, font: fonts.regular, color: textMuted });
  }
  
  const footerright = `Diterbitkan melalui Nusakarsa © ${new Date().getFullYear()}`;
  coverPage.drawText(footerCopyright, { x: width - MARGIN - fonts.regular.widthOfTextAtSize(footerCopyright, 9), y: footerY, size: 9, font: fonts.regular, color: textMuted });

  // --- CONTENT PAGES ---
  let contentPage: PDFPage | null = null;

  for (const chapter of chapters) {
    contentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    if (pageBg.texture) contentPage.drawImage(pageBg.texture, {x:0,y:0,width,height}); else contentPage.drawRectangle({x:0,y:0,width,height, color: pageBg.color});
    addWatermarkToPage(contentPage, watermarkImage, watermarkOpacity);
    addPageHeader(contentPage, book.title, fonts.regular);
    addPageFooter(contentPage, pdfDoc.getPageCount(), fonts.regular);

    let currentY = height - 120;

    const chapterTitleX = isPoem ? (width - fonts.serifBold.widthOfTextAtSize(chapter.title.toUpperCase(), 16)) / 2 : MARGIN;
    contentPage.drawText(isPoem ? chapter.title.toUpperCase() : chapter.title, {
      x: chapterTitleX, y: currentY, size: isPoem ? 16 : 22, font: fonts.serifBold, color: textDark,
    });
    currentY -= (isPoem ? 16 : 22) * 2.5;

    if (isPoem) {
      const lines = chapter.content.split('\n');
      for (const line of lines) {
          if (currentY < MARGIN) {
              contentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
              if (pageBg.texture) contentPage.drawImage(pageBg.texture, {x:0,y:0,width,height}); else contentPage.drawRectangle({x:0,y:0,width,height, color: pageBg.color});
              addWatermarkToPage(contentPage, watermarkImage, watermarkOpacity);
              addPageHeader(contentPage, book.title, fonts.regular);
              addPageFooter(contentPage, pdfDoc.getPageCount(), fonts.regular);
              currentY = height - MARGIN - 40;
          }
          
          if (!line.trim()) { currentY -= 14 * 0.7; continue; }

          const font = fonts.serifItalic;
          const size = 14;
          const textWidth = font.widthOfTextAtSize(line, size);
          contentPage.drawText(line, {
              x: (width - textWidth) / 2,
              y: currentY,
              font,
              size,
              color: poemTextColor
          });
          currentY -= size * 1.6;
      }
    } else {
        // --- NEW, CORRECTED LOGIC AS PER USER'S INSTRUCTIONS ---
        const lines = chapter.content.split('\n');
        for (const line of lines) {
            // If the line is empty, it's a paragraph break. Add vertical space.
            if (!line.trim()) {
                currentY -= 12; // Add spacing for empty lines
                continue;
            }
            // Process the line, which will be word-wrapped if it's too long.
            const { y: newY, page: newPage } = await drawProseLine(contentPage, line, currentY, pdfDoc, fonts, watermarkImage, pageBg, book.title, watermarkOpacity);
            currentY = newY;
            contentPage = newPage;
        }
    }
  }

  const pdfBytes = await pdfDoc.save();
  const pdfBuffer = Buffer.from(pdfBytes);
  const safeFileName = `${sanitizePath(book.title)}.pdf`;
  const typeFolder = isPoem ? 'puisi' : 'buku';
  const folderPath = `pdf/${typeFolder}/${sanitizePath(book.title)}`;

  return await uploadPdf(pdfBuffer, `${Date.now()}-${safeFileName}`, folderPath);
}

// --- UPLOAD FUNCTIONS ---
async function uploadPdf(buffer: Buffer, fileName: string, folderPath: string): Promise<string> {
  const publicDir = path.join(process.cwd(), 'public', 'uploads');
  const finalFolderPath = path.join(publicDir, folderPath);
  
  try {
    await fs.mkdir(finalFolderPath, { recursive: true });
    const filePath = path.join(finalFolderPath, fileName);
    await fs.writeFile(filePath, buffer);
    const fileUrl = `/uploads/${folderPath}/${fileName}`;
    console.log(`[PDF Generator] PDF saved to: ${fileUrl}`);
    return fileUrl;
  } catch (error) {
    console.error("[PDF Generator] Failed to save PDF locally:", error);
    throw new Error("Gagal menyimpan file PDF secara lokal.");
  }
}

function wrapText(text: string, maxWidth: number, font: any, fontSize: number): string[] {
  if (!text) return [""];
  const lines: string[] = [];
  const paragraphs = text.split('\n');
  for (const para of paragraphs) {
      const words = para.split(' ');
      let currentLine = '';
      for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const testWidth = font.widthOfTextAtSize(testLine, fontSize);
          if (testWidth > maxWidth && currentLine !== '') {
              lines.push(currentLine);
              currentLine = word;
          } else {
              currentLine = testLine;
          }
      }
      lines.push(currentLine);
  }
  return lines;
}
