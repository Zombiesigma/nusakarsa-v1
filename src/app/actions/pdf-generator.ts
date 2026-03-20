'use server';

import { PDFDocument as PDFLib, StandardFonts, rgb, degrees } from 'pdf-lib';
import type { PDFFont, PDFImage, PDFPage } from 'pdf-lib';
import { promises as fs } from 'fs';
import path from 'path';
import { initializeFirebase } from '@/firebase';
import { collection, query, orderBy, getDocs, doc, getDoc, where } from 'firebase/firestore';
import type { Book, Chapter, User } from '@/lib/types';

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 72;

// --- THEME ASSETS ---
const POEM_PAPER_TEXTURE_URL = "https://media.istockphoto.com/id/654922866/photo/old-yellowed-stained-paper-texture.jpg?s=612x612&w=0&k=20&c=uInwuGGMQMw2RKMillvZz5suVDgIcKD7yvrOmoPVt-k=";
const WATERMARK_URL = 'https://raw.githubusercontent.com/Zombiesigma/nusakarsa-v2/main/public/logo/copyright.png';

// --- THEME COLORS ---
const nusakarsaPrimary = rgb(0.45, 0.56, 0.22);
const nusakarsaBackground = rgb(0.97, 0.98, 0.96);
const defaultTextDark = rgb(0.1, 0.1, 0.1);
const textMuted = rgb(0.4, 0.4, 0.4);
const poemTextDark = rgb(0.24, 0.15, 0.14); // #3e2723

interface PageTheme {
    textColor: ReturnType<typeof rgb>;
    paperTexture?: PDFImage;
}

function removeUnsupportedChars(text: string): string {
    return text.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{FE00}-\u{FE0F}]|[\u{1F900}-\u{1F9FF}]/gu, '');
}

function addPageBackground(page: PDFPage, texture?: PDFImage, fallbackColor?: ReturnType<typeof rgb>) {
    const { width, height } = page.getSize();
    if (texture) {
        page.drawImage(texture, { x: 0, y: 0, width, height });
    } else if (fallbackColor) {
        page.drawRectangle({ x: 0, y: 0, width, height, color: fallbackColor });
    }
}

function addWatermarkToPage(page: PDFPage, watermarkImage: PDFImage) {
    const { width, height } = page.getSize();
    const watermarkDims = watermarkImage.scale(0.8);
    page.drawImage(watermarkImage, {
        x: width / 2 - watermarkDims.width / 2,
        y: height / 2 - watermarkDims.height / 2,
        width: watermarkDims.width,
        height: watermarkDims.height,
        opacity: 0.05,
        rotate: degrees(-45),
    });
}

function sanitizePath(str: string): string {
  return str.replace(/[^a-z0-9]/gi, '_').toLowerCase().trim();
}

async function drawMarkdownParagraph(
  page: PDFPage,
  paragraph: string,
  y: number,
  doc: PDFLib,
  watermarkImage: PDFImage,
  theme: PageTheme
): Promise<{ y: number, page: PDFPage }> {
    let currentPage = page;
    let currentY = y;
    const contentWidth = PAGE_WIDTH - MARGIN * 2;

    const fontRegular = await doc.embedFont(StandardFonts.TimesRoman);
    const fontBold = await doc.embedFont(StandardFonts.TimesRomanBold);
    const fontItalic = await doc.embedFont(StandardFonts.TimesRomanItalic);

    let text = paragraph;
    let baseFont = fontRegular;
    let baseSize = 12;
    let xOffset = 0;

    if (text.startsWith('# ')) { baseSize = 20; baseFont = fontBold; text = text.substring(2); }
    else if (text.startsWith('## ')) { baseSize = 16; baseFont = fontBold; text = text.substring(3); }
    else if (text.startsWith('### ')) { baseSize = 14; baseFont = fontBold; text = text.substring(4); }
    else if (text.startsWith('> ')) { baseFont = fontItalic; text = text.substring(2); xOffset = 20; }
    
    const lineHeight = baseSize * 1.4;
    const tokens = text.split(/(\*\*.*?\*\*|\*.*?\*)/g).filter(Boolean);
    let currentX = MARGIN + xOffset;

    for (const token of tokens) {
        let font = baseFont;
        let content = token;

        if (token.startsWith('**') && token.endsWith('**')) { font = fontBold; content = token.slice(2, -2); }
        else if (token.startsWith('*') && token.endsWith('*')) { font = fontItalic; content = token.slice(1, -1); }

        const words = content.replace(/\n/g, ' \n ').split(' ');
        for (const word of words) {
             if (word === '\n') {
                currentY -= lineHeight;
                currentX = MARGIN + xOffset;
                if (currentY < MARGIN) {
                    currentPage = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
                    addPageBackground(currentPage, theme.paperTexture);
                    addWatermarkToPage(currentPage, watermarkImage);
                    addFooter(currentPage, doc.getPageCount(), fontRegular, PAGE_WIDTH);
                    currentY = PAGE_HEIGHT - MARGIN;
                }
                continue;
            }
            
            if (!word) continue;

            const wordWidth = font.widthOfTextAtSize(word, baseSize);
            
            if (currentX + wordWidth > PAGE_WIDTH - MARGIN && currentX > MARGIN + xOffset) {
                currentY -= lineHeight;
                currentX = MARGIN + xOffset;
            }

            if (currentY < MARGIN) {
                currentPage = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
                addPageBackground(currentPage, theme.paperTexture);
                addWatermarkToPage(currentPage, watermarkImage);
                addFooter(currentPage, doc.getPageCount(), fontRegular, PAGE_WIDTH);
                currentY = PAGE_HEIGHT - MARGIN;
                currentX = MARGIN + xOffset;
            }

            const safeWord = removeUnsupportedChars(word);
            currentPage.drawText(safeWord + ' ', {
                x: currentX, y: currentY, font, size: baseSize, color: theme.textColor,
            });
            currentX += font.widthOfTextAtSize(safeWord + ' ', baseSize);
        }
    }
    
    currentY -= lineHeight;
    return { y: currentY, page: currentPage };
}


export async function generateBookPdf(bookId: string): Promise<string> {
  const { firestore } = initializeFirebase();
  if (!firestore) throw new Error('Firestore not initialized');

  const bookSnap = await getDoc(doc(firestore, 'books', bookId));
  if (!bookSnap.exists()) throw new Error('Book not found');
  const book = { id: bookSnap.id, ...bookSnap.data() } as Book;

  const chaptersQuery = query(collection(firestore, 'books', bookId, 'chapters'), orderBy('order', 'asc'));
  const chaptersSnap = await getDocs(chaptersQuery);
  const chapters = chaptersSnap.docs.map(d => ({ id: d.id, ...d.data() } as Chapter));

  const pdfDoc = await PDFLib.create();
  
  // --- ASSET FETCHING ---
  const watermarkRes = await fetch(WATERMARK_URL);
  if (!watermarkRes.ok) throw new Error("Failed to fetch watermark");
  const watermarkBytes = await watermarkRes.arrayBuffer();
  const watermarkImage = await pdfDoc.embedPng(watermarkBytes);

  const isPoem = book.type === 'poem';
  let pageTheme: PageTheme = { textColor: defaultTextDark };
  if (isPoem) {
      try {
        const paperBytes = await fetch(POEM_PAPER_TEXTURE_URL).then(res => res.arrayBuffer());
        pageTheme.paperTexture = await pdfDoc.embedJpg(paperBytes);
        pageTheme.textColor = poemTextDark;
      } catch(e) { console.warn("Failed to embed poem paper texture.", e); }
  }

  const fontHeadline = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontSerifRegular = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const fontSerifBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  // --- PROFESSIONAL COVER PAGE ---
  let coverPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const { width, height } = coverPage.getSize();

  // Background & Border
  coverPage.drawRectangle({ x: 0, y: 0, width, height, color: nusakarsaBackground });
  coverPage.drawRectangle({ x: 20, y: 20, width: width - 40, height: height - 40, borderColor: nusakarsaPrimary, borderWidth: 1.5, opacity: 0.6 });

  // Header
  const headerText = 'Nusakarsa Digital Publishing';
  const headerWidth = fontSerifBold.widthOfTextAtSize(headerText, 14);
  coverPage.drawText(headerText, {
    x: width / 2 - headerWidth / 2,
    y: height - 60,
    font: fontSerifBold,
    size: 14,
    color: nusakarsaPrimary,
  });

  // Book Cover Image
  let imageY = height - 380;
  if (book.coverImageUrl) {
    try {
        const coverImageBytes = await fetch(book.coverImageUrl).then(res => {
            if (!res.ok) throw new Error(`Failed to fetch cover image: ${res.statusText}`);
            return res.arrayBuffer();
        });
        const coverImage = book.coverImageUrl.toLowerCase().includes('.png') 
            ? await pdfDoc.embedPng(coverImageBytes) 
            : await pdfDoc.embedJpg(coverImageBytes);
        
        const imgDim = coverImage.scaleToFit(width * 0.55, height * 0.38);
        coverPage.drawImage(coverImage, {
            x: width / 2 - imgDim.width / 2,
            y: height - 120 - imgDim.height,
            width: imgDim.width,
            height: imgDim.height,
        });
        imageY = height - 120 - imgDim.height - 20;
    } catch (e) {
        console.warn("Could not embed book cover image:", e);
    }
  }

  // Title & Author
  let titleY = imageY - 40;
  const titleLines = wrapText(book.title, width - (MARGIN * 2.5), fontHeadline, 32);
  for (const line of titleLines) {
      const titleWidth = fontHeadline.widthOfTextAtSize(line, 32);
      coverPage.drawText(line, {
        x: width/2 - titleWidth/2,
        y: titleY,
        font: fontHeadline,
        size: 32,
        color: defaultTextDark,
      });
      titleY -= 38; 
  }
  
  titleY -= 10;
  
  const authorWidth = fontSerifRegular.widthOfTextAtSize(book.authorName, 16);
  coverPage.drawText(book.authorName, {
      x: width/2 - authorWidth/2,
      y: titleY,
      font: fontSerifRegular,
      size: 16,
      color: textMuted,
  });

  // Genre
  if (book.genre) {
    const genreText = book.genre.toUpperCase();
    const genreWidth = fontSerifBold.widthOfTextAtSize(genreText, 10);
    coverPage.drawText(genreText, {
        x: width/2 - genreWidth/2,
        y: MARGIN + 60,
        font: fontSerifBold,
        size: 10,
        color: nusakarsaPrimary,
        letterSpacing: 1.5,
    });
  }

  // Footer Logo
  const logoDims = watermarkImage.scale(0.25);
  coverPage.drawImage(watermarkImage, {
      x: width / 2 - logoDims.width / 2,
      y: MARGIN - 10,
      width: logoDims.width,
      height: logoDims.height,
      opacity: 0.7
  });

  // --- BACK COVER PAGE ---
  const backCoverPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  backCoverPage.drawRectangle({ x: 0, y: 0, width, height, color: nusakarsaBackground });
  
  let backY = height - MARGIN * 1.5;

  if (book.description) {
      backCoverPage.drawText('Sinopsis', {
        x: MARGIN,
        y: backY,
        font: fontSerifBold,
        size: 18,
        color: defaultTextDark,
      });
      backY -= 30;

      const descLines = wrapText(book.description, width - (MARGIN * 2), fontSerifRegular, 11);
      for (const line of descLines) {
          if (backY < MARGIN * 3) break;
          backCoverPage.drawText(line, {
              x: MARGIN,
              y: backY,
              font: fontSerifRegular,
              size: 11,
              color: textMuted,
              lineHeight: 16
          });
          backY -= 16;
      }
  }

  // Author Bio Section
  let authorSectionY = MARGIN * 3.5;
  if (book.authorAvatarUrl) {
    try {
        const avatarBytes = await fetch(book.authorAvatarUrl).then(res => res.arrayBuffer());
        const avatarImage = book.authorAvatarUrl.toLowerCase().includes('.png') ? await pdfDoc.embedPng(avatarBytes) : await pdfDoc.embedJpg(avatarBytes);
        const avatarSize = 80;
        backCoverPage.drawImage(avatarImage, {
            x: width / 2 - avatarSize / 2,
            y: authorSectionY,
            width: avatarSize,
            height: avatarSize,
        });
        
        const authorNameText = book.authorName;
        const authorNameWidth = fontSerifBold.widthOfTextAtSize(authorNameText, 14);
        backCoverPage.drawText(authorNameText, {
            x: width / 2 - authorNameWidth / 2,
            y: authorSectionY - 20,
            font: fontSerifBold,
            size: 14,
            color: defaultTextDark,
        });
        
        const authorRoleText = 'Penulis';
        const authorRoleWidth = fontSerifRegular.widthOfTextAtSize(authorRoleText, 10);
        backCoverPage.drawText(authorRoleText, {
            x: width / 2 - authorRoleWidth / 2,
            y: authorSectionY - 35,
            font: fontSerifRegular,
            size: 10,
            color: textMuted,
        });

    } catch (e) { console.warn("Could not embed author avatar:", e); }
  }
  
  // Footer
  const footerTextBack = `Diterbitkan melalui Nusakarsa © ${new Date().getFullYear()}`;
  const footerBackWidth = fontSerifRegular.widthOfTextAtSize(footerTextBack, 9);
  backCoverPage.drawText(footerTextBack, {
      x: width / 2 - footerBackWidth/2,
      y: MARGIN,
      size: 9,
      font: fontSerifRegular,
      color: textMuted,
  });

  // --- CONTENT PAGES ---
  let contentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  addPageBackground(contentPage, pageTheme.paperTexture);
  addWatermarkToPage(contentPage, watermarkImage);
  addFooter(contentPage, pdfDoc.getPageCount(), fontSerifRegular, width);

  let contentY = height - MARGIN;

  for (const chapter of chapters) {
    const spaceNeeded = 22 /* title */ + 20 /* margin */ + 24 /* first line estimate */ ;
    if (contentY < MARGIN + spaceNeeded) {
        contentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        addPageBackground(contentPage, pageTheme.paperTexture);
        addWatermarkToPage(contentPage, watermarkImage);
        addFooter(contentPage, pdfDoc.getPageCount(), fontSerifRegular, width);
        contentY = height - MARGIN;
    }

    const chapterTitleLines = wrapText(chapter.title, width - MARGIN*2, fontSerifBold, 22);
    for(const line of chapterTitleLines) {
        contentPage.drawText(line, {
          x: MARGIN, y: contentY, size: 22, font: fontSerifBold, color: pageTheme.textColor
        });
        contentY -= 28;
    }
    
    contentY -= 30;

    const paragraphs = chapter.content.replace(/\r\n/g, '\n').split(/\n\s*\n/);
    for (const para of paragraphs) {
      if (!para.trim()) continue;
      
      const { y: newY, page: newPage } = await drawMarkdownParagraph(contentPage, para, contentY, pdfDoc, watermarkImage, pageTheme);
      contentY = newY;
      contentPage = newPage;
      contentY -= 12; // Space between paragraphs

      if (contentY < MARGIN) {
        contentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        addPageBackground(contentPage, pageTheme.paperTexture);
        addWatermarkToPage(contentPage, watermarkImage);
        addFooter(contentPage, pdfDoc.getPageCount(), fontSerifRegular, width);
        contentY = height - MARGIN;
      }
    }
    contentY -= 20; // Extra space after chapter
  }

  const pdfBytes = await pdfDoc.save();
  const pdfBuffer = Buffer.from(pdfBytes);
  const safeFileName = `${sanitizePath(book.title)}.pdf`;
  const typeFolder = isPoem ? 'puisi' : 'buku';
  const folderPath = `${typeFolder}/${sanitizePath(book.title)}`;

  return await uploadPdf(pdfBuffer, safeFileName, folderPath);
}

async function uploadPdf(buffer: Buffer, fileName: string, folderPath: string): Promise<string> {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GITHUB_REPO_OWNER = process.env.GITHUB_REPO_OWNER;
  const GITHUB_REPO_NAME = process.env.GITHUB_REPO_NAME;
  const errors: string[] = [];

  if (GITHUB_TOKEN && GITHUB_REPO_OWNER && GITHUB_REPO_NAME) {
    try {
      console.log("[PDF Generator] Attempting to upload to GitHub...");
      const url = await uploadPdfToGithub(buffer, fileName, folderPath, GITHUB_TOKEN, GITHUB_REPO_OWNER, GITHUB_REPO_NAME);
      console.log("[PDF Generator] GitHub upload successful.");
      return url;
    } catch (e: any) {
      console.warn("[PDF Generator] GitHub upload failed:", e.message);
      errors.push(`GitHub: ${e.message}`);
    }
  } else {
    console.log("[PDF Generator] GitHub credentials not found, skipping GitHub upload.");
  }

  try {
    console.log("[PDF Generator] Attempting to upload to public service...");
    const url = await uploadToPublicService(buffer, fileName);
    console.log("[PDF Generator] Public service upload successful.");
    return url;
  } catch (e: any) {
    console.error("[PDF Generator] Public service upload failed:", e.message);
    errors.push(`Public Mirrors: ${e.message}`);
  }

  throw new Error(`Gagal mengunggah PDF. Penyebab: ${errors.join('; ')}`);
}

async function uploadPdfToGithub(buffer: Buffer, fileName: string, folderPath: string, token: string, owner: string, repo: string): Promise<string> {
  const base64Content = buffer.toString('base64');
  const timestamp = Date.now();
  const filePath = `${folderPath}/${timestamp}-${fileName}`;

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Nusakarsa-App',
    },
    body: JSON.stringify({
      message: `Automatic PDF Generation for ${fileName}`,
      content: base64Content,
      branch: 'main'
    }),
  });

  if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'GitHub Error');
  }

  return `https://raw.githubusercontent.com/${owner}/${repo}/main/${filePath}`;
}

async function uploadToPublicService(buffer: Buffer, fileName:string): Promise<string> {
    const POMF_MIRRORS = ['https://pomf.lain.la/upload.php', 'https://quax.moe/upload.php', 'https://pomf.cat/upload.php'];
    const errorLogs: string[] = [];

    for (const mirror of POMF_MIRRORS) {
        try {
            const formData = new FormData();
            const blob = new Blob([buffer], { type: 'application/pdf' });
            formData.append('files[]', blob, fileName);
            
            const response = await fetch(mirror, { 
                method: 'POST', 
                body: formData, 
                signal: AbortSignal.timeout(20000)
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.files && data.files[0]?.url) {
                    return data.files[0].url;
                }
                errorLogs.push(`Upload to ${mirror} was not successful: ${JSON.stringify(data)}`);
            } else {
                errorLogs.push(`Upload to ${mirror} failed with status ${response.status}`);
            }
        } catch (err: any) {
            errorLogs.push(`Upload to ${mirror} failed to connect: ${err.name} - ${err.message}`);
            continue;
        }
    }

    throw new Error(`Semua host file publik gagal. Log: ${errorLogs.join(', ')}`);
}


function addFooter(page: any, pageNum: number, font: any, width: number) {
    page.drawText(`${pageNum}.`, { x: width - MARGIN, y: 40, size: 9, font: font, color: textMuted });
}

function wrapText(text: string, maxWidth: number, font: any, fontSize: number): string[] {
  if (!text) return [""];
  const paragraphs = text.split('\n');
  const allLines: string[] = [];
  for (const para of paragraphs) {
    if (!para.trim()) { allLines.push(""); continue; }
    const words = para.split(/\s+/);
    let currentLine = '';
    for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = font.widthOfTextAtSize(testLine, fontSize);
        if (testWidth > maxWidth) {
            allLines.push(currentLine);
            currentLine = word;
        } else { currentLine = testLine; }
    }
    if (currentLine) allLines.push(currentLine);
  }
  return allLines;
}
