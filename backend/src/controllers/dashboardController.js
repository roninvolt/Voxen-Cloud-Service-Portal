const documentModel = require('../models/documentModel');
const activityModel = require('../models/activityModel');

const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const stats = await documentModel.getUserStats(userId);
    const recentActivities = await activityModel.getRecentActivities({
      userId,
      isAdmin: false,
      limit: 6,
    });

    return res.json({
      success: true,
      data: {
        ...stats,
        recentActivities,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
};
