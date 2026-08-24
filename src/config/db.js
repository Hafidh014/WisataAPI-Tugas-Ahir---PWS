const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// Mendukung POSTGRES_URL untuk Vercel
// maupun format .env manual PostgreSQL
const databaseConfig = process.env.POSTGRES_URL
  ? { connectionString: process.env.POSTGRES_URL }
  : {
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_DATABASE,
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 5432),
    };

const pool = new Pool({
  ...databaseConfig,
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};