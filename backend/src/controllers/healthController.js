const db = require('../config/db');

const checkHealth = async (req, res) => {
  try {
    const dbStart = Date.now();
    await db.query('SELECT 1');
    const dbLatency = `${Date.now() - dbStart}ms`;

    return res.status(200).json({
      status: 'ok',
      service: 'Voxen Cloud Services API',
      database: 'connected',
      databaseLatency: dbLatency,
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(process.uptime())}s`,
      environment: process.env.NODE_ENV || 'development',
      storageProvider: process.env.STORAGE_PROVIDER || 'local',
    });
  } catch (error) {
    return res.status(503).json({
      status: 'error',
      service: 'Voxen Cloud Services API',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

module.exports = {
  checkHealth,
};
