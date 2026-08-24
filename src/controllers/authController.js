const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { signJwt } = require('../middleware/auth');

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password || password.length < 8) return res.status(400).json({ error: 'name, email, dan password minimal 8 karakter wajib diisi' });
    const exists = await db.query(`SELECT id FROM users WHERE LOWER(email)=LOWER($1)`, [email]);
    if (exists.rows[0]) return res.status(409).json({ error: 'Email sudah terdaftar' });
    const hash = await bcrypt.hash(password, 12);
    const { rows } = await db.query(`INSERT INTO users(name,email,password_hash) VALUES($1,$2,$3) RETURNING id,name,email,role,created_at`, [name.trim(), email.toLowerCase(), hash]);
    const user = rows[0];
    res.status(201).json({ user, token: signJwt(user) });
  } catch (e) { next(e); }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    const { rows } = await db.query(`SELECT * FROM users WHERE LOWER(email)=LOWER($1)`, [email || '']);
    if (!rows[0] || !(await bcrypt.compare(password || '', rows[0].password_hash))) return res.status(401).json({ error: 'Email atau password salah' });
    const user = { id: rows[0].id, name: rows[0].name, email: rows[0].email, role: rows[0].role };
    res.json({ user, token: signJwt(user) });
  } catch (e) { next(e); }
}

async function me(req, res, next) {
  try {
    const { rows } = await db.query(`SELECT id,name,email,role,created_at FROM users WHERE id=$1`, [req.user.sub]);
    if (!rows[0]) return res.status(404).json({ error: 'User tidak ditemukan' });
    res.json(rows[0]);
  } catch (e) { next(e); }
}
module.exports = { register, login, me };
