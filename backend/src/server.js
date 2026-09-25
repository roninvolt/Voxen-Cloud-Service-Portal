const app = require('./app');
const db = require('./config/db');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    logger.info('Starting Voxen Cloud Services Backend API Server...');
    
    // Test database connection with retry
    await db.testConnection();

    // Auto-initialize schema & seed default users
    await db.initDb();

    // Start listening
    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`=================================================`);
      logger.info(` Voxen Cloud Services API Server running on port ${PORT}`);
      logger.info(` Health endpoint: http://localhost:${PORT}/api/health`);
      logger.info(` Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(` Storage Provider: ${process.env.STORAGE_PROVIDER || 'local'}`);
      logger.info(`=================================================`);
    });

    // Graceful shutdown
    const handleShutdown = async (signal) => {
      logger.info(`Received ${signal}. Gracefully shutting down server...`);
      server.close(async () => {
        logger.info('HTTP server closed.');
        try {
          await db.pool.end();
          logger.info('Database pool closed.');
          process.exit(0);
        } catch (err) {
          logger.error('Error closing database pool', err);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
  } catch (error) {
    logger.error('Fatal error starting server:', error);
    process.exit(1);
  }
};

startServer();
