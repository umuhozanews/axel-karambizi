import fs from 'fs';
import path from 'path';
import { syncIndex, syncProjects, syncExplore } from './sync.js';

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

  // 1. Authenticate
  const auth = req.headers.authorization || '';
  const AUTH_TOKEN = 'gacondo_admin_session_auth_2026_secured';
  if (auth !== `Bearer ${AUTH_TOKEN}`) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized. Please log in.' });
  }

  let siteData = req.body;
  if (typeof siteData === 'string') {
    try {
      siteData = JSON.parse(siteData);
    } catch (_) {}
  }
  if (!siteData || typeof siteData !== 'object') {
    return res.status(400).json({ status: 'error', message: 'Invalid payload.' });
  }

  const token = process.env.GITHUB_TOKEN;
  const repo = 'umuhozanews/axel-karambizi';
  const headers = {
    'Authorization': `Bearer ${token}`,
    'User-Agent': 'AxelCMS',
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json'
  };

  try {
    // 2. Fetch current main commit & base tree
    const refRes = await fetch(`https://api.github.com/repos/${repo}/git/ref/heads/main`, { headers });
    if (!refRes.ok) {
      throw new Error(`Failed to get main branch ref: ${refRes.status} ${await refRes.text()}`);
    }
    const refData = await refRes.json();
    const latestCommitSha = refData.object.sha;

    const commitRes = await fetch(`https://api.github.com/repos/${repo}/git/commits/${latestCommitSha}`, { headers });
    const commitData = await commitRes.json();
    const baseTreeSha = commitData.tree.sha;

    // Helper to get raw file content from GitHub or local filesystem
    async function getRawFile(filePath) {
      try {
        const ghRaw = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}?ref=main`, {
          headers: { ...headers, 'Accept': 'application/vnd.github.v3.raw' }
        });
        if (ghRaw.ok) return await ghRaw.text();
      } catch (e) {
        console.warn(`GitHub raw fetch failed for ${filePath}:`, e);
      }

      const localPath = path.join(process.cwd(), filePath);
      if (fs.existsSync(localPath)) {
        return fs.readFileSync(localPath, 'utf-8');
      }
      return null;
    }

    const [rawIndex, rawProjects, rawExplore] = await Promise.all([
      getRawFile('index.html'),
      getRawFile('projects/index.html'),
      getRawFile('explore/index.html')
    ]);

    const filesToCommit = [
      {
        path: 'admin/content.json',
        content: JSON.stringify(siteData, null, 2)
      }
    ];

    if (rawIndex) {
      filesToCommit.push({
        path: 'index.html',
        content: syncIndex(rawIndex, siteData)
      });
    }
    if (rawProjects) {
      filesToCommit.push({
        path: 'projects/index.html',
        content: syncProjects(rawProjects, siteData)
      });
    }
    if (rawExplore) {
      filesToCommit.push({
        path: 'explore/index.html',
        content: syncExplore(rawExplore, siteData)
      });
    }

    // 3. Create tree on GitHub
    const treeRes = await fetch(`https://api.github.com/repos/${repo}/git/trees`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: filesToCommit.map(f => ({
          path: f.path,
          mode: '100644',
          type: 'blob',
          content: f.content
        }))
      })
    });
    if (!treeRes.ok) {
      throw new Error(`Failed to create tree: ${treeRes.status} ${await treeRes.text()}`);
    }
    const treeData = await treeRes.json();

    // 4. Create commit
    const newCommitRes = await fetch(`https://api.github.com/repos/${repo}/git/commits`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: 'Update content via Admin Portal (Published to Production)',
        tree: treeData.sha,
        parents: [latestCommitSha],
        author: {
          name: 'Axel Karambizi CMS',
          email: 'hello@axelkarambizi.com',
          date: new Date().toISOString()
        }
      })
    });
    if (!newCommitRes.ok) {
      throw new Error(`Failed to create commit: ${newCommitRes.status} ${await newCommitRes.text()}`);
    }
    const newCommitData = await newCommitRes.json();

    // 5. Update ref heads/main
    const updateRefRes = await fetch(`https://api.github.com/repos/${repo}/git/refs/heads/main`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        sha: newCommitData.sha,
        force: false
      })
    });
    if (!updateRefRes.ok) {
      throw new Error(`Failed to update branch ref: ${updateRefRes.status} ${await updateRefRes.text()}`);
    }

    // Also update local file if running locally or writable
    try {
      const localContentPath = path.join(process.cwd(), 'admin', 'content.json');
      fs.writeFileSync(localContentPath, JSON.stringify(siteData, null, 2), 'utf-8');
    } catch (_) {}

    return res.status(200).json({
      status: 'ok',
      commit: newCommitData.sha.slice(0, 7),
      message: `Changes saved and committed to GitHub (${newCommitData.sha.slice(0, 7)})! Live site is automatically building and updating at https://axelkarambizi.com/`
    });

  } catch (error) {
    console.error('Error during /api/save execution:', error);
    return res.status(500).json({
      status: 'error',
      message: `Failed to publish to production: ${error.message}`
    });
  }
}
