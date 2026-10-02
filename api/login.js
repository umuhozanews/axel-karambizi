export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  const { email, password } = req.body || {};
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanPass = String(password || '').trim();

  const ADMIN_EMAIL = 'nextech@gmail.com';
  const ADMIN_PASSWORD = 'axel@12345';
  const AUTH_TOKEN = 'gacondo_admin_session_auth_2026_secured';

  if (cleanEmail === ADMIN_EMAIL && cleanPass === ADMIN_PASSWORD) {
    return res.status(200).json({
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

  return res.status(401).json({
    status: 'error',
    message: 'Invalid email or password. Access denied.'
  });
}
