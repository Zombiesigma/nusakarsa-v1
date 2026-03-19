import { NextResponse } from 'next/server';

/**
 * API Route untuk mengunggah file ke GitHub Repository.
 * Menjamin respons selalu dalam format JSON untuk mencegah SyntaxError di client.
 */

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO_OWNER = process.env.GITHUB_REPO_OWNER;
const GITHUB_REPO_NAME = process.env.GITHUB_REPO_NAME;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'uploads';

    if (!file) {
      return NextResponse.json({ success: false, error: 'File tidak ditemukan.' }, { status: 400 });
    }

    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ 
        success: false, 
        error: 'File terlalu besar untuk GitHub API (Maksimal 20MB).' 
      }, { status: 413 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Content = buffer.toString('base64');

    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}-${cleanFileName}`;
    const filePath = `${folder}/${fileName}`;

    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/${filePath}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Nusakarsa-App',
      },
      body: JSON.stringify({
        message: `Upload ${fileName} from Nusakarsa`,
        content: base64Content,
        branch: 'main'
      }),
      signal: AbortSignal.timeout(110000),
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok) {
      return NextResponse.json({ 
        success: false, 
        error: data.message || `GitHub Error (${response.status})` 
      }, { status: response.status });
    }

    const rawUrl = `https://raw.githubusercontent.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/main/${filePath}`;

    return NextResponse.json({
      success: true,
      url: rawUrl,
    });

  } catch (error: any) {
    console.error('[GitHub API Route Error]', error.message);
    return NextResponse.json({ 
      success: false, 
      error: `Server Error: ${error.message}` 
    }, { status: 500 });
  }
}
