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

  let body = req.body || {};
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (_) {}
  }
  const { email, password } = body;
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanPass = String(password || '').trim();

  const VALID_EMAILS = ['hello@axelkarambizi.com', 'nextech@gmail.com', 'admin', 'axel', 'axelkarambizi', 'karambizi', 'axel.karambizi', 'karambiziaxel'];
  const VALID_PASSWORDS = ['axel@12345', 'Axel@12345', 'axel12345', 'Axel12345'];
  const ADMIN_EMAIL = 'nextech@gmail.com';
  const AUTH_TOKEN = 'gacondo_admin_session_auth_2026_secured';

  if (VALID_EMAILS.includes(cleanEmail) && VALID_PASSWORDS.includes(cleanPass)) {
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
