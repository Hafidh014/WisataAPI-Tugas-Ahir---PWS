const db = require('../config/db');

async function provinces(req,res,next){
  try { const { rows } = await db.query(`SELECT id,name,island_group,capital FROM provinces ORDER BY name`); res.json({ data: rows }); } catch(e){ next(e); }
}
async function cities(req,res,next){
  try { const { rows } = await db.query(`SELECT c.id,c.name,c.type,c.latitude,c.longitude,p.name AS province FROM cities c JOIN provinces p ON p.id=c.province_id ORDER BY p.name,c.name`); res.json({ data: rows }); } catch(e){ next(e); }
}
async function categories(req,res,next){
  try { const { rows } = await db.query(`SELECT category, COUNT(*)::int AS total FROM destinations GROUP BY category ORDER BY total DESC, category`); res.json({ data: rows }); } catch(e){ next(e); }
}
async function destinations(req,res,next){
  try {
    const { province, city, category, min_rating, q } = req.query;
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20',10),1),100);
    const offset = Math.max(parseInt(req.query.offset || '0',10),0);
    const params=[]; const where=[];
    if(province){params.push(`%${province}%`);where.push(`p.name ILIKE $${params.length}`)}
    if(city){params.push(`%${city}%`);where.push(`c.name ILIKE $${params.length}`)}
    if(category){params.push(category);where.push(`d.category=$${params.length}`)}
    if(min_rating){params.push(Number(min_rating));where.push(`d.rating >= $${params.length}`)}
    if(q){params.push(`%${q}%`);where.push(`(d.name ILIKE $${params.length} OR d.description ILIKE $${params.length} OR d.address ILIKE $${params.length})`)}
    const whereSql=where.length?`WHERE ${where.join(' AND ')}`:'';
    const count = await db.query(`SELECT COUNT(*)::int AS total FROM destinations d JOIN cities c ON c.id=d.city_id JOIN provinces p ON p.id=c.province_id ${whereSql}`,params);
    params.push(limit,offset);
    const { rows }=await db.query(`SELECT d.id,d.name,d.slug,d.category,d.description,d.address,d.latitude,d.longitude,d.rating,d.ticket_price_min,d.ticket_price_max,d.opening_hours,d.best_time,d.facilities,d.tags,d.contact_phone,d.website_url,d.featured,c.name AS city,p.name AS province FROM destinations d JOIN cities c ON c.id=d.city_id JOIN provinces p ON p.id=c.province_id ${whereSql} ORDER BY d.featured DESC,d.rating DESC,d.name LIMIT $${params.length-1} OFFSET $${params.length}`,params);
    res.json({ data: rows, meta: { total: count.rows[0].total, limit, offset } });
  } catch(e){ next(e); }
}
async function destination(req,res,next){
  try { const { rows }=await db.query(`SELECT d.*,c.name AS city,p.name AS province FROM destinations d JOIN cities c ON c.id=d.city_id JOIN provinces p ON p.id=c.province_id WHERE d.id=$1`,[req.params.id]); if(!rows[0])return res.status(404).json({error:'Destinasi tidak ditemukan'}); res.json({data:rows[0]}); } catch(e){next(e);}
}
module.exports={provinces,cities,categories,destinations,destination};
