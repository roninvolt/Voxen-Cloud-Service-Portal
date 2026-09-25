const db = require('../config/db');

const userModel = {
  async findByEmail(email) {
    const res = await db.query(
      'SELECT id, name, email, password_hash, role, is_active, created_at, updated_at FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );
    return res.rows[0];
  },

  async findById(id) {
    const res = await db.query(
      'SELECT id, name, email, role, is_active, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    return res.rows[0];
  },

  async create({ name, email, passwordHash, role = 'USER' }) {
    const res = await db.query(
      `INSERT INTO users (name, email, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, true)
       RETURNING id, name, email, role, is_active, created_at, updated_at`,
      [name.trim(), email.toLowerCase().trim(), passwordHash, role]
    );
    return res.rows[0];
  },

  async updateProfile(id, { name }) {
    const res = await db.query(
      `UPDATE users
       SET name = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, name, email, role, is_active, created_at, updated_at`,
      [name.trim(), id]
    );
    return res.rows[0];
  },

  async updatePassword(id, passwordHash) {
    const res = await db.query(
      `UPDATE users
       SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [passwordHash, id]
    );
    return res.rowCount > 0;
  },

  async updateStatus(id, isActive) {
    const res = await db.query(
      `UPDATE users
       SET is_active = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, name, email, role, is_active, updated_at`,
      [isActive, id]
    );
    return res.rows[0];
  },

  async delete(id) {
    const res = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    return res.rowCount > 0;
  },

  async getAllUsers({ search = '', page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;
    let queryText = `
      SELECT u.id, u.name, u.email, u.role, u.is_active, u.created_at, u.updated_at,
             COUNT(d.id)::int as document_count,
             COALESCE(SUM(d.file_size), 0)::bigint as total_storage
      FROM users u
      LEFT JOIN documents d ON d.user_id = u.id
    `;
    const params = [];

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      queryText += ` WHERE LOWER(u.name) LIKE $${params.length} OR LOWER(u.email) LIKE $${params.length}`;
    }

    queryText += ` GROUP BY u.id ORDER BY u.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const res = await db.query(queryText, params);

    // Count total
    let countQuery = 'SELECT COUNT(*)::int as total FROM users';
    const countParams = [];
    if (search) {
      countParams.push(`%${search.toLowerCase()}%`);
      countQuery += ' WHERE LOWER(name) LIKE $1 OR LOWER(email) LIKE $1';
    }
    const countRes = await db.query(countQuery, countParams);

    return {
      users: res.rows,
      total: countRes.rows[0].total,
      page,
      limit,
      totalPages: Math.ceil(countRes.rows[0].total / limit),
    };
  },

  async getAdminStats() {
    const userCount = await db.query('SELECT COUNT(*)::int as count FROM users');
    const activeUserCount = await db.query('SELECT COUNT(*)::int as count FROM users WHERE is_active = true');
    const docStats = await db.query('SELECT COUNT(*)::int as count, COALESCE(SUM(file_size), 0)::bigint as total_bytes FROM documents');
    
    return {
      totalUsers: userCount.rows[0].count,
      activeUsers: activeUserCount.rows[0].count,
      totalDocuments: docStats.rows[0].count,
      totalStorageBytes: docStats.rows[0].total_bytes,
    };
  }
};

module.exports = userModel;
