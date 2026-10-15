import app from './app.js';
import { env, validateEnv } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { logger } from './utils/logger.js';

let server;

async function startServer() {
  try {
    // Validate and log environment diagnostics (safely redacted)
    validateEnv();

    // Connect to MongoDB Atlas
    await connectDB();

    // Start Express listener
    server = app.listen(env.PORT, () => {
      logger.info(`=======================================================`);
      logger.info(`  EduAccess AI Server running in [${env.NODE_ENV}] mode`);
      logger.info(`  Port: ${env.PORT}`);
      logger.info(`  Client Origin: ${env.CLIENT_ORIGIN}`);
      logger.info(`  AI Provider: ${env.AI_PROVIDER || 'none'} (${env.AI_MODEL || 'default'})`);
      logger.info(`  Health Endpoint: http://localhost:${env.PORT}/api/health`);
      logger.info(`=======================================================`);
    });
  } catch (err) {
    logger.error('Failed to start server:', { error: err.message });
    process.exit(1);
  }
}

// Graceful Shutdown
async function handleShutdown(signal) {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed.');
      await disconnectDB();
      logger.info('Database connection closed. Exiting process.');
      process.exit(0);
    });

    // Force close after 10s if connections linger
    setTimeout(() => {
      logger.error('Forceful shutdown timeout reached. Terminating.');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection:', { reason });
});

startServer();
