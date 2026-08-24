const db = require('../config/db');
const { hashApiKey, newApiKey } = require('../middleware/auth');

async function list(req,res,next){
  try {
    const { rows } = await db.query(`SELECT id,name,key_prefix,last_used_at,revoked_at,created_at FROM api_keys WHERE user_id=$1 ORDER BY created_at DESC`, [req.user.sub]);
    res.json({ data: rows });
  } catch(e){ next(e); }
}
async function create(req,res,next){
  try {
    const name = (req.body?.name || 'Default key').trim();
    const key = newApiKey();
    const hash = hashApiKey(key);
    const prefix = key.slice(0, Math.min(20, key.length));
    const { rows } = await db.query(`INSERT INTO api_keys(user_id,name,key_hash,key_prefix) VALUES($1,$2,$3,$4) RETURNING id,name,key_prefix,created_at`, [req.user.sub,name,hash,prefix]);
    res.status(201).json({ ...rows[0], api_key: key, warning: 'Simpan API key sekarang. Nilai penuh tidak disimpan dan tidak dapat ditampilkan lagi.' });
  } catch(e){ next(e); }
}
async function revoke(req,res,next){
  try {
    const { rows } = await db.query(`UPDATE api_keys SET revoked_at=NOW() WHERE id=$1 AND user_id=$2 AND revoked_at IS NULL RETURNING id,name,revoked_at`, [req.params.id,req.user.sub]);
    if (!rows[0]) return res.status(404).json({ error: 'API key tidak ditemukan atau sudah dicabut' });
    res.json(rows[0]);
  } catch(e){ next(e); }
}
module.exports = { list, create, revoke };
