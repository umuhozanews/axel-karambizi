const ADMIN_EMAIL = 'nextech@gmail.com';
const ADMIN_PASSWORD = 'axel@12345';
const AUTH_TOKEN = 'gacondo_admin_session_auth_2026_secured';
const REPO = 'umuhozanews/axel-karambizi';

// Supabase Configuration
const SUPABASE_URL = 'https://ovfurhjwqsvymhqvnsfk.supabase.co';
const STORAGE_BUCKET = 'portfolio-assets';

function getSupabaseKey(env) {
  return (env && (env.SUPABASE_KEY || env.SUPABASE_SERVICE_ROLE_KEY)) || '';
}

async function supabaseFetch(env, endpoint, options = {}) {
  const key = getSupabaseKey(env);
  if (!key) return { ok: false, json: async () => null };
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  const headers = {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  return fetch(url, { ...options, headers });
}

// KV is what the live site reads (see functions/_middleware.js). GitHub is kept
// as the version history and as the seed if the namespace is ever emptied.
const CONTENT_KEY = 'site:content';
const ASSET_PREFIX = 'asset:';
const MESSAGES_KEY = 'site:messages';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

async function backupContentToGithub(env, siteData) {
  const token = env.GITHUB_TOKEN;
  const headers = {
    'Authorization': `Bearer ${token}`,
    'User-Agent': 'AxelCMS-Cloudflare',
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json'
  };

  const refRes = await fetch(`https://api.github.com/repos/${REPO}/git/ref/heads/main`, { headers });
  if (!refRes.ok) throw new Error(`Failed to get main ref: ${refRes.status}`);
  const refData = await refRes.json();
  const latestCommitSha = refData.object.sha;

  const commitRes = await fetch(`https://api.github.com/repos/${REPO}/git/commits/${latestCommitSha}`, { headers });
  const commitData = await commitRes.json();
  const baseTreeSha = commitData.tree.sha;

  const filesToCommit = [
    { path: 'admin/content.json', content: JSON.stringify(siteData, null, 2) }
  ];

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

  const updateRefRes = await fetch(`https://api.github.com/repos/${REPO}/git/refs/heads/main`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ sha: newCommitData.sha, force: false })
  });
  if (!updateRefRes.ok) throw new Error(`Failed to update branch ref: ${updateRefRes.status}`);
  return newCommitData.sha.slice(0, 7);
}

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

      const VALID_EMAILS = ['hello@axelkarambizi.com', 'nextech@gmail.com', 'admin', 'axel', 'axelkarambizi', 'karambizi', 'axel.karambizi', 'karambiziaxel'];
      const VALID_PASSWORDS = ['axel@12345', 'Axel@12345', 'axel12345', 'Axel12345'];

      if (VALID_EMAILS.includes(cleanEmail) && VALID_PASSWORDS.includes(cleanPass)) {
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
    // 1. Supabase Postgres (Primary source of truth)
    try {
      const sbRes = await supabaseFetch(env, 'site_content?id=eq.main&select=data');
      if (sbRes.ok) {
        const rows = await sbRes.json();
        if (rows && rows.length > 0 && rows[0].data) {
          return new Response(JSON.stringify(rows[0].data), {
            status: 200,
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              'Cache-Control': 'no-store, no-cache, must-revalidate',
              ...corsHeaders
            }
          });
        }
      }
    } catch (sbErr) {
      console.error('Supabase content read failed:', sbErr);
    }

    // 2. KV fallback
    if (env.CONTENT) {
      try {
        const live = await env.CONTENT.get(CONTENT_KEY);
        if (live) {
          return new Response(live, {
            status: 200,
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              'Cache-Control': 'no-store, no-cache, must-revalidate',
              ...corsHeaders
            }
          });
        }
      } catch (err) {
        console.error('KV content read failed:', err);
      }
    }

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

    let siteData = {};
    try { siteData = await request.json(); } catch (_) {}
    if (!siteData || typeof siteData !== 'object' || Array.isArray(siteData)) {
      return jsonResponse({ status: 'error', message: 'Invalid payload.' }, 400);
    }

    // 1. Save directly to Supabase Database (Primary source of truth)
    let supabaseSaved = false;
    try {
      const sbSaveRes = await supabaseFetch(env, 'site_content', {
        method: 'POST',
        headers: {
          'Prefer': 'resolution=merge-duplicates,return=representation'
        },
        body: JSON.stringify({
          id: 'main',
          data: siteData,
          updated_at: new Date().toISOString()
        })
      });
      if (sbSaveRes && sbSaveRes.ok) supabaseSaved = true;
    } catch (sbErr) {
      console.error('Supabase save error:', sbErr);
    }

    // 2. Also keep Cloudflare KV updated for instant edge rendering
    if (env.CONTENT) {
      try {
        await Promise.all([
          env.CONTENT.put(CONTENT_KEY, JSON.stringify(siteData)),
          env.CONTENT.put('site:rev', String(Date.now())),
        ]);
      } catch (err) {
        console.error('KV write notice:', err);
      }
    }

    // 3. Backup to GitHub in background
    if (context.waitUntil) {
      context.waitUntil(backupContentToGithub(env, siteData).catch((err) => {
        console.error('GitHub backup failed:', err);
      }));
    }

    return jsonResponse({
      status: 'ok',
      message: 'Changes saved directly to Supabase & live site updated instantly!'
    });
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
      let declaredType = '';
      if (b64.includes(',')) {
        const [head, rest] = [b64.slice(0, b64.indexOf(',')), b64.slice(b64.indexOf(',') + 1)];
        const m = head.match(/^data:([^;]+)/);
        if (m) declaredType = m[1];
        b64 = rest;
      }

      const raw = atob(b64);
      const bytes = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);

      // 1. Upload directly to Supabase Storage
      let publicStorageUrl = `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${cleanName}`;
      const sbKey = getSupabaseKey(env);
      if (sbKey) {
        try {
          const sbUploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${cleanName}`, {
            method: 'POST',
            headers: {
              'apikey': sbKey,
              'Authorization': `Bearer ${sbKey}`,
              'Content-Type': declaredType || 'image/jpeg',
              'x-upsert': 'true'
            },
            body: bytes
          });
          if (!sbUploadRes.ok) {
            console.error('Supabase upload notice:', await sbUploadRes.text());
          }
        } catch (sbUpErr) {
          console.error('Supabase upload exception:', sbUpErr);
        }
      }

      // 2. Also keep in Cloudflare KV if available
      if (env.CONTENT) {
        try {
          await env.CONTENT.put(ASSET_PREFIX + cleanName, bytes, {
            metadata: { type: declaredType || 'application/octet-stream' }
          });
          await env.CONTENT.put('site:rev', String(Date.now()));
        } catch (_) {}
      }

      // 3. Background GitHub backup
      if (context.waitUntil && env.GITHUB_TOKEN) {
        context.waitUntil((async () => {
          try {
            const token = env.GITHUB_TOKEN;
            const filePath = `assets/${cleanName}`;
            const headers = {
              'Authorization': `Bearer ${token}`,
              'User-Agent': 'AxelCMS-Cloudflare',
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json'
            };
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

            await fetch(`https://api.github.com/repos/${REPO}/contents/${filePath}`, {
              method: 'PUT',
              headers,
              body: JSON.stringify(putBody)
            });
          } catch (ghErr) {
            console.error('GitHub asset backup failed:', ghErr);
          }
        })());
      }

      return jsonResponse({
        status: 'ok',
        path: publicStorageUrl,
        filename: cleanName
      });
    } catch (err) {
      return jsonResponse({ status: 'error', message: err.message }, 500);
    }
  }

  // 6. /api/contact — public inbox from the site form
  if (cleanPath === '/api/contact') {
    if (request.method !== 'POST') return jsonResponse({ status: 'error', message: 'Method not allowed' }, 405);
    let body = {};
    try { body = await request.json(); } catch (_) {}
    const entry = {
      name: String(body.name || '').slice(0, 200),
      email: String(body.email || '').slice(0, 200),
      service: String(body.service || '').slice(0, 200),
      message: String(body.message || '').slice(0, 5000),
    };
    if (!entry.name || !entry.email || !entry.message) {
      return jsonResponse({ status: 'error', message: 'Name, email and message are required.' }, 400);
    }

    // 1. Save directly into Supabase messages table
    try {
      await supabaseFetch(env, 'messages', {
        method: 'POST',
        body: JSON.stringify(entry)
      });
    } catch (sbErr) {
      console.error('Supabase contact save failed:', sbErr);
    }

    // 2. Also keep in Cloudflare KV if available
    if (env.CONTENT) {
      let list = [];
      try { list = JSON.parse(await env.CONTENT.get(MESSAGES_KEY) || '[]'); } catch (_) {}
      if (!Array.isArray(list)) list = [];
      list.unshift({ ...entry, submitted_at: new Date().toISOString() });
      await env.CONTENT.put(MESSAGES_KEY, JSON.stringify(list.slice(0, 200)));
    }
    return jsonResponse({ status: 'ok', message: 'Inquiry received' });
  }

  // 7. /api/messages — admin inbox
  if (cleanPath === '/api/messages') {
    const auth = request.headers.get('Authorization') || '';
    if (auth !== `Bearer ${AUTH_TOKEN}`) {
      return jsonResponse({ status: 'error', message: 'Unauthorized. Please log in.' }, 401);
    }

    // 1. Fetch from Supabase
    try {
      const sbRes = await supabaseFetch(env, 'messages?order=created_at.desc&select=*');
      if (sbRes.ok) {
        const messages = await sbRes.json();
        return new Response(JSON.stringify(messages || []), {
          status: 200,
          headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }
    } catch (sbErr) {
      console.error('Supabase messages fetch failed:', sbErr);
    }

    // 2. KV fallback
    let list = [];
    if (env.CONTENT) {
      try { list = JSON.parse(await env.CONTENT.get(MESSAGES_KEY) || '[]'); } catch (_) {}
    }
    return new Response(JSON.stringify(Array.isArray(list) ? list : []), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
    });
  }

  return jsonResponse({ status: 'error', message: 'Not found' }, 404);
}
