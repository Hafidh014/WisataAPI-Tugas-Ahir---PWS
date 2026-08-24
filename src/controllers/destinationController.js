const db = require('../config/db');

function makeSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}


// ========================================
// CREATE
// POST /api/destinations
// ========================================

exports.create = async (req, res, next) => {
  try {
    const {
      city_id,
      name,
      slug,
      category,
      description,
      address,
      latitude,
      longitude,
      rating,
      ticket_price_min,
      ticket_price_max,
      opening_hours,
      best_time,
      facilities,
      tags,
      contact_phone,
      website_url,
      featured
    } = req.body;

    // Validasi field wajib
    if (
      !city_id ||
      !name ||
      !category ||
      !description ||
      !address ||
      latitude === undefined ||
      longitude === undefined
    ) {
      return res.status(400).json({
        error: 'city_id, name, category, description, address, latitude, dan longitude wajib diisi'
      });
    }

    const finalSlug = slug || makeSlug(name);

    const result = await db.query(
      `
      INSERT INTO destinations (
        city_id,
        name,
        slug,
        category,
        description,
        address,
        latitude,
        longitude,
        rating,
        ticket_price_min,
        ticket_price_max,
        opening_hours,
        best_time,
        facilities,
        tags,
        contact_phone,
        website_url,
        featured
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
        $11,$12,$13,$14,$15,$16,$17,$18
      )
      RETURNING *
      `,
      [
        city_id,
        name,
        finalSlug,
        category,
        description,
        address,
        latitude,
        longitude,
        rating ?? null,
        ticket_price_min ?? 0,
        ticket_price_max ?? 0,
        opening_hours ?? null,
        best_time ?? null,
        JSON.stringify(facilities ?? []),
        JSON.stringify(tags ?? []),
        contact_phone ?? null,
        website_url ?? null,
        featured ?? false
      ]
    );

    res.status(201).json({
      message: 'Destinasi berhasil dibuat',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('CREATE DESTINATION ERROR:', error);

    if (error.code === '23505') {
      return res.status(409).json({
        error: 'Slug destinasi sudah digunakan'
      });
    }

    if (error.code === '23503') {
      return res.status(400).json({
        error: 'city_id tidak ditemukan'
      });
    }

    next(error);
  }
};


// ========================================
// UPDATE
// PUT /api/destinations/:id
// ========================================

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;

    const {
      city_id,
      name,
      slug,
      category,
      description,
      address,
      latitude,
      longitude,
      rating,
      ticket_price_min,
      ticket_price_max,
      opening_hours,
      best_time,
      facilities,
      tags,
      contact_phone,
      website_url,
      featured
    } = req.body;

    const result = await db.query(
      `
      UPDATE destinations
      SET
        city_id = COALESCE($1, city_id),
        name = COALESCE($2, name),
        slug = COALESCE($3, slug),
        category = COALESCE($4, category),
        description = COALESCE($5, description),
        address = COALESCE($6, address),
        latitude = COALESCE($7, latitude),
        longitude = COALESCE($8, longitude),
        rating = COALESCE($9, rating),
        ticket_price_min = COALESCE($10, ticket_price_min),
        ticket_price_max = COALESCE($11, ticket_price_max),
        opening_hours = COALESCE($12, opening_hours),
        best_time = COALESCE($13, best_time),
        facilities = COALESCE($14, facilities),
        tags = COALESCE($15, tags),
        contact_phone = COALESCE($16, contact_phone),
        website_url = COALESCE($17, website_url),
        featured = COALESCE($18, featured),
        updated_at = NOW()
      WHERE id = $19
      RETURNING *
      `,
      [
        city_id ?? null,
        name ?? null,
        slug ?? (name ? makeSlug(name) : null),
        category ?? null,
        description ?? null,
        address ?? null,
        latitude ?? null,
        longitude ?? null,
        rating ?? null,
        ticket_price_min ?? null,
        ticket_price_max ?? null,
        opening_hours ?? null,
        best_time ?? null,
        facilities !== undefined
          ? JSON.stringify(facilities)
          : null,
        tags !== undefined
          ? JSON.stringify(tags)
          : null,
        contact_phone ?? null,
        website_url ?? null,
        featured ?? null,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Destinasi tidak ditemukan'
      });
    }

    res.json({
      message: 'Destinasi berhasil diperbarui',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('UPDATE DESTINATION ERROR:', error);

    if (error.code === '23505') {
      return res.status(409).json({
        error: 'Slug destinasi sudah digunakan'
      });
    }

    if (error.code === '23503') {
      return res.status(400).json({
        error: 'city_id tidak ditemukan'
      });
    }

    next(error);
  }
};


// ========================================
// DELETE
// DELETE /api/destinations/:id
// ========================================

exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `
      DELETE FROM destinations
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Destinasi tidak ditemukan'
      });
    }

    res.json({
      message: 'Destinasi berhasil dihapus',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('DELETE DESTINATION ERROR:', error);
    next(error);
  }
};