const userModel = require('../models/userModel');
const documentModel = require('../models/documentModel');
const activityModel = require('../models/activityModel');
const logger = require('../utils/logger');

const getUsers = async (req, res, next) => {
  try {
    const { search = '', page = 1, limit = 10 } = req.query;

    const result = await userModel.getAllUsers({
      search,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 10,
    });

    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

const getStats = async (req, res, next) => {
  try {
    const userStats = await userModel.getAdminStats();
    const docStats = await documentModel.getAdminDocumentStats();
    const recentActivities = await activityModel.getRecentActivities({
      isAdmin: true,
      limit: 10,
    });

    return res.json({
      success: true,
      data: {
        totalUsers: userStats.totalUsers,
        activeUsers: userStats.activeUsers,
        totalDocuments: docStats.totalDocuments,
        totalStorageBytes: docStats.totalStorageBytes,
        documentsThisMonth: docStats.documentsThisMonth,
        categories: docStats.categories,
        recentDocuments: docStats.recentDocuments,
        recentActivities,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive boolean is required in request body.',
      });
    }

    // Prevent deactivating own account
    if (req.user.id === id && !isActive) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own administrative account.',
      });
    }

    const updated = await userModel.updateStatus(id, isActive);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    await activityModel.log({
      userId: req.user.id,
      action: 'USER_STATUS_CHANGE',
      metadata: { targetUserId: id, newStatus: isActive ? 'ACTIVE' : 'DEACTIVATED' },
    });

    logger.info(`User ${id} status updated to ${isActive ? 'ACTIVE' : 'DEACTIVATED'} by admin ${req.user.email}`);

    return res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully.`,
      user: updated,
    });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Prevent deleting own account
    if (req.user.id === id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own administrative account.',
      });
    }

    const targetUser = await userModel.findById(id);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    await userModel.delete(id);

    await activityModel.log({
      userId: req.user.id,
      action: 'USER_DELETE',
      metadata: { deletedUserId: id, deletedUserEmail: targetUser.email },
    });

    logger.info(`User ${targetUser.email} (${id}) deleted by admin ${req.user.email}`);

    return res.json({
      success: true,
      message: 'User and all associated documents deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getStats,
  updateUserStatus,
  deleteUser,
};
