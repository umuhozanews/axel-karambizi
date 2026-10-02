import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. Try fetching latest content directly from GitHub repo main branch
  const token = process.env.GITHUB_TOKEN;
  const repo = 'umuhozanews/axel-karambizi';

  try {
    const ghRes = await fetch(`https://api.github.com/repos/${repo}/contents/admin/content.json?ref=main`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'AxelCMS',
        'Accept': 'application/vnd.github.v3.raw'
      }
    });

    if (ghRes.ok) {
      const text = await ghRes.text();
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.status(200).send(text);
    }
  } catch (err) {
    console.error('GitHub fetch failed, falling back to local file:', err);
  }

  // 2. Fallback to local admin/content.json in deployment filesystem
  try {
    const filePath = path.join(process.cwd(), 'admin', 'content.json');
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.status(200).send(content);
    }
  } catch (err2) {
    console.error('Local file read failed:', err2);
  }

  return res.status(404).json({ status: 'error', message: 'Content not found' });
}
