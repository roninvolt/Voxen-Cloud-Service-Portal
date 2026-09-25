const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://docuser:password@localhost:5432/docmanager',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle PostgreSQL client', err);
});

const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Executed query', { text: text.substring(0, 80), duration, rows: res.rowCount });
    return res;
  } catch (error) {
    logger.error('Database query error', { text: text.substring(0, 80), error: error.message });
    throw error;
  }
};

const testConnection = async (retries = 10, delay = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await pool.query('SELECT NOW() as now');
      logger.info('Database connected successfully', { timestamp: res.rows[0].now });
      return true;
    } catch (err) {
      logger.warn(`Database connection attempt ${i + 1}/${retries} failed: ${err.message}. Retrying in ${delay / 1000}s...`);
      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        logger.error('Could not connect to database after multiple retries.');
        throw err;
      }
    }
  }
};

/**
 * Initializes database tables if not already present,
 * and ensures default admin & demo users exist.
 */
const initDb = async () => {
  try {
    // Check if users table exists
    const checkTable = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);

    if (!checkTable.rows[0].exists) {
      logger.info('Initializing database schema from init.sql...');
      let sqlPath = path.resolve(__dirname, '../../database/init.sql');
      if (!fs.existsSync(sqlPath)) {
        sqlPath = path.resolve(__dirname, '../../../database/init.sql');
      }
      if (fs.existsSync(sqlPath)) {
        const sql = fs.readFileSync(sqlPath, 'utf8');
        await pool.query(sql);
        logger.info('Database schema created successfully.');
      } else {
        logger.warn(`init.sql not found at ${sqlPath}`);
      }
    }

    // Seed default admin if not exists (Voxen Cloud Services)
    const adminCheck = await pool.query("SELECT id FROM users WHERE email = 'admin@voxen.io'");
    if (adminCheck.rows.length === 0) {
      const adminPassHash = await bcrypt.hash('AdminPassword123!', 10);
      await pool.query(
        `INSERT INTO users (name, email, password_hash, role, is_active)
         VALUES ($1, $2, $3, 'ADMIN', true)`,
        ['System Administrator', 'admin@voxen.io', adminPassHash]
      );
      logger.info('Default admin user created: admin@voxen.io / AdminPassword123!');
    }

    // Seed demo user if not exists
    const demoCheck = await pool.query("SELECT id FROM users WHERE email = 'demo@voxen.io'");
    if (demoCheck.rows.length === 0) {
      const demoPassHash = await bcrypt.hash('DemoPassword123!', 10);
      await pool.query(
        `INSERT INTO users (name, email, password_hash, role, is_active)
         VALUES ($1, $2, $3, 'USER', true)`,
        ['Alex Morgan', 'demo@voxen.io', demoPassHash]
      );
      logger.info('Default demo user created: demo@voxen.io / DemoPassword123!');
    }

    return true;
  } catch (error) {
    logger.error('Error during database initialization/seeding', error);
    // Don't crash if already initialized
    return false;
  }
};

module.exports = {
  pool,
  query,
  testConnection,
  initDb,
};
