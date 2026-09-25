const db = require('../config/db');
const logger = require('../utils/logger');

const activityModel = {
  async log({ userId, action, documentId = null, metadata = {} }) {
    try {
      const res = await db.query(
        `INSERT INTO activity_logs (user_id, action, document_id, metadata)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [userId, action, documentId, JSON.stringify(metadata)]
      );
      return res.rows[0];
    } catch (err) {
      // Activity logging failure shouldn't crash the main transaction
      logger.warn('Failed to insert activity log', { action, error: err.message });
      return null;
    }
  },

  async getRecentActivities({ userId = null, isAdmin = false, limit = 10 }) {
    let queryText = `
      SELECT a.*, u.name as user_name, u.email as user_email, d.original_name as document_name
      FROM activity_logs a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN documents d ON a.document_id = d.id
    `;
    const params = [];

    if (!isAdmin || (isAdmin && userId)) {
      params.push(userId);
      queryText += ` WHERE a.user_id = $${params.length}`;
    }

    queryText += ` ORDER BY a.created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const res = await db.query(queryText, params);
    return res.rows;
  }
};

module.exports = activityModel;
