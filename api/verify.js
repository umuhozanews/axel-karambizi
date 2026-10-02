export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const auth = req.headers.authorization || '';
  const AUTH_TOKEN = 'gacondo_admin_session_auth_2026_secured';

  if (auth === `Bearer ${AUTH_TOKEN}`) {
    return res.status(200).json({
      authenticated: true,
      email: 'nextech@gmail.com',
      role: 'Super Admin'
    });
  }

  return res.status(401).json({ authenticated: false });
}
