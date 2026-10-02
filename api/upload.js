import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  const auth = req.headers.authorization || '';
  const AUTH_TOKEN = 'gacondo_admin_session_auth_2026_secured';
  if (auth !== `Bearer ${AUTH_TOKEN}`) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized. Please log in.' });
  }

  try {
    let body = req.body || {};
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (_) {}
    }
    const { filename, data } = body;
    if (!data) {
      return res.status(400).json({ status: 'error', message: 'No file data received.' });
    }

    const rawFilename = filename || 'uploaded_image.jpg';
    const cleanName = path.basename(rawFilename).replace(/[^a-zA-Z0-9._-]/g, '_');
    let b64 = data;
    if (b64.includes(',')) {
      b64 = b64.split(',', 2)[1];
    }

    const token = process.env.GITHUB_TOKEN;
    const repo = 'umuhozanews/axel-karambizi';
    const filePath = `assets/${cleanName}`;

    // Check if file already exists on GitHub to obtain its SHA
    let existingSha = null;
    try {
      const getFileRes = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'AxelCMS',
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      if (getFileRes.ok) {
        const fileInfo = await getFileRes.json();
        existingSha = fileInfo.sha;
      }
    } catch (_) {}

    // Upload to GitHub
    const putBody = {
      message: `Upload asset ${cleanName} via Admin Portal`,
      content: b64,
      branch: 'main'
    };
    if (existingSha) {
      putBody.sha = existingSha;
    }

    const putRes = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'AxelCMS',
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(putBody)
    });

    if (!putRes.ok) {
      const errText = await putRes.text();
      console.warn('GitHub upload failed, falling back to local file:', errText);
    }

    // Also write locally if writable
    try {
      const localDest = path.join(process.cwd(), 'assets', cleanName);
      fs.writeFileSync(localDest, Buffer.from(b64, 'base64'));
    } catch (_) {}

    return res.status(200).json({
      status: 'ok',
      path: `./assets/${cleanName}`,
      filename: cleanName
    });

  } catch (error) {
    console.error('Upload handler error:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
}
