const db = require('../config/db');

const documentModel = {
  async create({
    userId,
    originalName,
    storedName,
    mimeType,
    fileSize,
    category = 'Other',
    description = '',
    storagePath,
  }) {
    const res = await db.query(
      `INSERT INTO documents (
        user_id, original_name, stored_name, mime_type, file_size, category, description, storage_path
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [userId, originalName, storedName, mimeType, fileSize, category, description, storagePath]
    );
    return res.rows[0];
  },

  async findById(id) {
    const res = await db.query(
      `SELECT d.*, u.name as owner_name, u.email as owner_email
       FROM documents d
       JOIN users u ON d.user_id = u.id
       WHERE d.id = $1`,
      [id]
    );
    return res.rows[0];
  },

  async findByUserAndId(userId, id) {
    const res = await db.query(
      `SELECT d.*, u.name as owner_name, u.email as owner_email
       FROM documents d
       JOIN users u ON d.user_id = u.id
       WHERE d.id = $1 AND d.user_id = $2`,
      [id, userId]
    );
    return res.rows[0];
  },

  async findDocuments({
    userId = null,
    isAdmin = false,
    search = '',
    category = '',
    type = '',
    sortBy = 'created_at',
    sortOrder = 'DESC',
    page = 1,
    limit = 10,
  }) {
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];

    // Filter by user if not admin or if userId specified
    if (!isAdmin || (isAdmin && userId)) {
      params.push(userId);
      conditions.push(`d.user_id = $${params.length}`);
    }

    // Search filter
    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      conditions.push(`(LOWER(d.original_name) LIKE $${params.length} OR LOWER(COALESCE(d.description, '')) LIKE $${params.length})`);
    }

    // Category filter
    if (category && category !== 'All') {
      params.push(category);
      conditions.push(`d.category = $${params.length}`);
    }

    // Type filter
    if (type && type !== 'All') {
      const typeLower = type.toLowerCase();
      if (typeLower === 'pdf') {
        conditions.push(`d.mime_type = 'application/pdf'`);
      } else if (typeLower === 'image') {
        conditions.push(`d.mime_type LIKE 'image/%'`);
      } else if (typeLower === 'word' || typeLower === 'doc') {
        conditions.push(`(d.mime_type LIKE '%word%' OR d.original_name ILIKE '%.doc%' OR d.original_name ILIKE '%.docx%')`);
      } else if (typeLower === 'spreadsheet' || typeLower === 'excel' || typeLower === 'xls') {
        conditions.push(`(d.mime_type LIKE '%sheet%' OR d.mime_type LIKE '%excel%' OR d.original_name ILIKE '%.xls%' OR d.original_name ILIKE '%.xlsx%')`);
      } else if (typeLower === 'presentation' || typeLower === 'ppt') {
        conditions.push(`(d.mime_type LIKE '%presentation%' OR d.original_name ILIKE '%.ppt%' OR d.original_name ILIKE '%.pptx%')`);
      } else if (typeLower === 'archive' || typeLower === 'zip') {
        conditions.push(`(d.mime_type LIKE '%zip%' OR d.original_name ILIKE '%.zip%')`);
      } else if (typeLower === 'text' || typeLower === 'txt') {
        conditions.push(`(d.mime_type = 'text/plain' OR d.original_name ILIKE '%.txt%')`);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Safe sorting columns
    const allowedSortFields = {
      name: 'd.original_name',
      original_name: 'd.original_name',
      date: 'd.created_at',
      created_at: 'd.created_at',
      size: 'd.file_size',
      file_size: 'd.file_size',
      category: 'd.category',
    };

    const sortColumn = allowedSortFields[sortBy.toLowerCase()] || 'd.created_at';
    const direction = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const queryText = `
      SELECT d.*, u.name as owner_name, u.email as owner_email
      FROM documents d
      JOIN users u ON d.user_id = u.id
      ${whereClause}
      ORDER BY ${sortColumn} ${direction}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const queryParams = [...params, limit, offset];
    const res = await db.query(queryText, queryParams);

    // Count query
    const countQuery = `
      SELECT COUNT(*)::int as total
      FROM documents d
      ${whereClause}
    `;
    const countRes = await db.query(countQuery, params);
    const total = countRes.rows[0].total;

    return {
      documents: res.rows,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    };
  },

  async delete(id) {
    const res = await db.query('DELETE FROM documents WHERE id = $1 RETURNING *', [id]);
    return res.rows[0];
  },

  async getUserStats(userId) {
    // Total documents and storage
    const totals = await db.query(
      `SELECT 
        COUNT(*)::int as total_documents,
        COALESCE(SUM(file_size), 0)::bigint as total_storage_bytes
       FROM documents 
       WHERE user_id = $1`,
      [userId]
    );

    // This month documents
    const thisMonth = await db.query(
      `SELECT COUNT(*)::int as count
       FROM documents
       WHERE user_id = $1 
         AND created_at >= date_trunc('month', CURRENT_DATE)`,
      [userId]
    );

    // Category breakdown
    const categories = await db.query(
      `SELECT category, COUNT(*)::int as count, COALESCE(SUM(file_size), 0)::bigint as total_size
       FROM documents
       WHERE user_id = $1
       GROUP BY category
       ORDER BY count DESC`,
      [userId]
    );

    // Recent documents (5)
    const recent = await db.query(
      `SELECT d.*, u.name as owner_name
       FROM documents d
       JOIN users u ON d.user_id = u.id
       WHERE d.user_id = $1
       ORDER BY d.created_at DESC
       LIMIT 5`,
      [userId]
    );

    return {
      totalDocuments: totals.rows[0].total_documents,
      totalStorageBytes: totals.rows[0].total_storage_bytes,
      documentsThisMonth: thisMonth.rows[0].count,
      categories: categories.rows,
      recentDocuments: recent.rows,
    };
  },

  async getAdminDocumentStats() {
    const totals = await db.query(
      `SELECT 
        COUNT(*)::int as total_documents,
        COALESCE(SUM(file_size), 0)::bigint as total_storage_bytes
       FROM documents`
    );

    const thisMonth = await db.query(
      `SELECT COUNT(*)::int as count
       FROM documents
       WHERE created_at >= date_trunc('month', CURRENT_DATE)`
    );

    const categories = await db.query(
      `SELECT category, COUNT(*)::int as count, COALESCE(SUM(file_size), 0)::bigint as total_size
       FROM documents
       GROUP BY category
       ORDER BY count DESC`
    );

    const recent = await db.query(
      `SELECT d.*, u.name as owner_name, u.email as owner_email
       FROM documents d
       JOIN users u ON d.user_id = u.id
       ORDER BY d.created_at DESC
       LIMIT 8`
    );

    return {
      totalDocuments: totals.rows[0].total_documents,
      totalStorageBytes: totals.rows[0].total_storage_bytes,
      documentsThisMonth: thisMonth.rows[0].count,
      categories: categories.rows,
      recentDocuments: recent.rows,
    };
  }
};

module.exports = documentModel;
