import { syncIndex, syncProjects, syncExplore, syncAbout, syncBlogs } from '../_sync.js';

const ADMIN_EMAIL = 'nextech@gmail.com';
const ADMIN_PASSWORD = 'axel@12345';
const AUTH_TOKEN = 'gacondo_admin_session_auth_2026_secured';
const REPO = 'umuhozanews/axel-karambizi';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders,
      ...extraHeaders
    }
  });
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const cleanPath = url.pathname.replace(/\/+$/, ''); // e.g. /api/login or /api/save

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  // 1. /api/login
  if (cleanPath === '/api/login') {
    if (request.method !== 'POST') return jsonResponse({ status: 'error', message: 'Method not allowed' }, 405);
    try {
      let body = {};
      try { body = await request.json(); } catch (_) {}
      const cleanEmail = String(body.email || '').trim().toLowerCase();
      const cleanPass = String(body.password || '').trim();

      if (cleanEmail === ADMIN_EMAIL && cleanPass === ADMIN_PASSWORD) {
        return jsonResponse({
          status: 'ok',
          token: AUTH_TOKEN,
          user: {
            email: ADMIN_EMAIL,
            name: 'Axel Karambizi',
            role: 'Super Administrator',
            access: 'Full Privilege'
          }
        });
      }
      return jsonResponse({ status: 'error', message: 'Invalid email or password. Access denied.' }, 401);
    } catch (e) {
      return jsonResponse({ status: 'error', message: 'Invalid JSON request' }, 400);
    }
  }

  // 2. /api/verify
  if (cleanPath === '/api/verify') {
    const auth = request.headers.get('Authorization') || '';
    if (auth === `Bearer ${AUTH_TOKEN}`) {
      return jsonResponse({ authenticated: true, email: ADMIN_EMAIL, role: 'Super Admin' });
    }
    return jsonResponse({ authenticated: false }, 401);
  }

  // 3. /api/content
  if (cleanPath === '/api/content') {
    const token = env.GITHUB_TOKEN;
    try {
      const ghRes = await fetch(`https://api.github.com/repos/${REPO}/contents/admin/content.json?ref=main`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'AxelCMS-Cloudflare',
          'Accept': 'application/vnd.github.v3.raw'
        }
      });
      if (ghRes.ok) {
        const text = await ghRes.text();
        return new Response(text, {
          status: 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            ...corsHeaders
          }
        });
      }
    } catch (err) {
      console.error('GitHub fetch failed:', err);
    }
    return jsonResponse({ status: 'error', message: 'Content not found' }, 404);
  }

  // 4. /api/save
  if (cleanPath === '/api/save') {
    if (request.method !== 'POST') return jsonResponse({ status: 'error', message: 'Method not allowed' }, 405);
    const auth = request.headers.get('Authorization') || '';
    if (auth !== `Bearer ${AUTH_TOKEN}`) {
      return jsonResponse({ status: 'error', message: 'Unauthorized. Please log in.' }, 401);
    }

    try {
      let siteData = {};
      try { siteData = await request.json(); } catch (_) {}
      if (!siteData || typeof siteData !== 'object') {
        return jsonResponse({ status: 'error', message: 'Invalid payload.' }, 400);
      }

      const token = env.GITHUB_TOKEN;
      const headers = {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'AxelCMS-Cloudflare',
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      };

      // Fetch latest commit
      const refRes = await fetch(`https://api.github.com/repos/${REPO}/git/ref/heads/main`, { headers });
      if (!refRes.ok) throw new Error(`Failed to get main ref: ${refRes.status}`);
      const refData = await refRes.json();
      const latestCommitSha = refData.object.sha;

      const commitRes = await fetch(`https://api.github.com/repos/${REPO}/git/commits/${latestCommitSha}`, { headers });
      const commitData = await commitRes.json();
      const baseTreeSha = commitData.tree.sha;

      async function getRawFile(filePath) {
        try {
          const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${filePath}?ref=main`, {
            headers: { ...headers, 'Accept': 'application/vnd.github.v3.raw' }
          });
          if (res.ok) return await res.text();
        } catch (_) {}
        return null;
      }

      const [rawIndex, rawProjects, rawExplore, rawAbout, rawBlogs] = await Promise.all([
        getRawFile('index.html'),
        getRawFile('projects/index.html'),
        getRawFile('explore/index.html'),
        getRawFile('about/index.html'),
        getRawFile('blogs/index.html')
      ]);

      const filesToCommit = [
        { path: 'admin/content.json', content: JSON.stringify(siteData, null, 2) }
      ];
      if (rawIndex) filesToCommit.push({ path: 'index.html', content: syncIndex(rawIndex, siteData) });
      if (rawProjects) filesToCommit.push({ path: 'projects/index.html', content: syncProjects(rawProjects, siteData) });
      if (rawExplore) filesToCommit.push({ path: 'explore/index.html', content: syncExplore(rawExplore, siteData) });
      if (rawAbout) filesToCommit.push({ path: 'about/index.html', content: syncAbout(rawAbout, siteData) });
      if (rawBlogs) filesToCommit.push({ path: 'blogs/index.html', content: syncBlogs(rawBlogs, siteData) });

      // Create tree
      const treeRes = await fetch(`https://api.github.com/repos/${REPO}/git/trees`, {
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
      if (!treeRes.ok) throw new Error(`Failed to create tree: ${treeRes.status}`);
      const treeData = await treeRes.json();

      // Create commit
      const newCommitRes = await fetch(`https://api.github.com/repos/${REPO}/git/commits`, {
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
      if (!newCommitRes.ok) throw new Error(`Failed to create commit: ${newCommitRes.status}`);
      const newCommitData = await newCommitRes.json();

      // Update ref
      const updateRefRes = await fetch(`https://api.github.com/repos/${REPO}/git/refs/heads/main`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          sha: newCommitData.sha,
          force: false
        })
      });
      if (!updateRefRes.ok) throw new Error(`Failed to update branch ref: ${updateRefRes.status}`);

      return jsonResponse({
        status: 'ok',
        commit: newCommitData.sha.slice(0, 7),
        message: `Changes saved and committed to GitHub (${newCommitData.sha.slice(0, 7)})! Live site is automatically building and updating at https://axelkarambizi.com/`
      });

    } catch (err) {
      return jsonResponse({ status: 'error', message: `Failed to save: ${err.message}` }, 500);
    }
  }

  // 5. /api/upload
  if (cleanPath === '/api/upload') {
    if (request.method !== 'POST') return jsonResponse({ status: 'error', message: 'Method not allowed' }, 405);
    const auth = request.headers.get('Authorization') || '';
    if (auth !== `Bearer ${AUTH_TOKEN}`) {
      return jsonResponse({ status: 'error', message: 'Unauthorized. Please log in.' }, 401);
    }

    try {
      let body = {};
      try { body = await request.json(); } catch (_) {}
      const { filename, data } = body || {};
      if (!data) return jsonResponse({ status: 'error', message: 'No file data received.' }, 400);

      const rawFilename = filename || 'uploaded_image.jpg';
      const cleanName = rawFilename.split(/[/\\]/).pop().replace(/[^a-zA-Z0-9._-]/g, '_');
      let b64 = data;
      if (b64.includes(',')) {
        b64 = b64.split(',', 2)[1];
      }

      const token = env.GITHUB_TOKEN;
      const filePath = `assets/${cleanName}`;
      const headers = {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'AxelCMS-Cloudflare',
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      };

      // Check existing sha
      let existingSha = null;
      try {
        const getFileRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${filePath}`, { headers });
        if (getFileRes.ok) {
          const fileInfo = await getFileRes.json();
          existingSha = fileInfo.sha;
        }
      } catch (_) {}

      const putBody = {
        message: `Upload asset ${cleanName} via Admin Portal`,
        content: b64,
        branch: 'main'
      };
      if (existingSha) putBody.sha = existingSha;

      const putRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${filePath}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(putBody)
      });
      if (!putRes.ok) {
        throw new Error(`GitHub asset upload failed: ${putRes.status}`);
      }

      return jsonResponse({
        status: 'ok',
        path: `./assets/${cleanName}`,
        filename: cleanName
      });
    } catch (err) {
      return jsonResponse({ status: 'error', message: err.message }, 500);
    }
  }

  return jsonResponse({ status: 'error', message: 'Not found' }, 404);
}
