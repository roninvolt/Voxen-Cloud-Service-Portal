const { ALLOWED_CATEGORIES } = require('../config/storage');
const db = require('../config/db');

const getCategories = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    // Count user documents per category
    const countRes = await db.query(
      `SELECT category, COUNT(*)::int as count
       FROM documents
       WHERE ${isAdmin ? '1=1' : 'user_id = $1'}
       GROUP BY category`,
      isAdmin ? [] : [userId]
    );

    const countsMap = {};
    countRes.rows.forEach((row) => {
      countsMap[row.category] = row.count;
    });

    const categoriesWithCount = ALLOWED_CATEGORIES.map((cat) => ({
      name: cat,
      count: countsMap[cat] || 0,
    }));

    return res.json({
      success: true,
      categories: categoriesWithCount,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
};
