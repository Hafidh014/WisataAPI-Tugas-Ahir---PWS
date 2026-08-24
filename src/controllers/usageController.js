const db = require('../config/db');
async function summary(req,res,next){
  try{
    const totals = await db.query(`SELECT COUNT(*)::int AS requests, COUNT(*) FILTER (WHERE status_code >= 200 AND status_code < 400)::int AS successful, COUNT(*) FILTER (WHERE status_code >= 400)::int AS failed, COALESCE(AVG(response_ms),0)::numeric(10,2) AS avg_response_ms FROM api_usage_logs l JOIN api_keys k ON k.id=l.api_key_id WHERE k.user_id=$1`,[req.user.sub]);
    const recent = await db.query(`SELECT l.route,l.method,l.status_code,l.response_ms,l.created_at,k.name AS key_name FROM api_usage_logs l JOIN api_keys k ON k.id=l.api_key_id WHERE k.user_id=$1 ORDER BY l.created_at DESC LIMIT 20`,[req.user.sub]);
    res.json({summary:totals.rows[0],recent:recent.rows});
  }catch(e){next(e)}
}
module.exports={summary};
