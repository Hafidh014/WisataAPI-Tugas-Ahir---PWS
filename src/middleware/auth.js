const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/db');

function signJwt(user) {
  return jwt.sign({ sub: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });
}

function requireJwt(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'JWT token diperlukan' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'JWT tidak valid atau sudah kedaluwarsa' });
  }
}

function hashApiKey(key) { return crypto.createHash('sha256').update(key).digest('hex'); }
function newApiKey() {
  const prefix = process.env.API_KEY_PREFIX || 'wisata_live_';
  const secret = crypto.randomBytes(24).toString('base64url');
  return prefix + secret;
}

async function requireApiKey(req, res, next) {
  const started = Date.now();
  const raw = req.headers['x-api-key'];
  if (!raw) return res.status(401).json({ error: 'x-api-key diperlukan' });
  try {
    const result = await db.query(
      `SELECT id, user_id, name FROM api_keys WHERE key_hash = $1 AND revoked_at IS NULL`,
      [hashApiKey(raw)]
    );
    if (!result.rows[0]) return res.status(401).json({ error: 'API key tidak valid' });
    req.apiKey = result.rows[0];
    res.on('finish', () => {
      db.query(`UPDATE api_keys SET last_used_at = NOW() WHERE id = $1`, [req.apiKey.id]).catch(() => {});
      db.query(
        `INSERT INTO api_usage_logs(api_key_id, route, method, status_code, response_ms, ip_address, user_agent)
         VALUES($1,$2,$3,$4,$5,$6,$7)`,
        [req.apiKey.id, req.originalUrl, req.method, res.statusCode, Date.now() - started, req.ip, req.get('user-agent') || null]
      ).catch(() => {});
    });
    next();
  } catch (error) { next(error); }
}

module.exports = { requireJwt, requireApiKey, signJwt, hashApiKey, newApiKey };
