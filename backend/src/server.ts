import App from './app';
import Logger from './utils/logger';
import env from './config/env';
import database from './config/database';

const app = new App();
const server = app.getApp();

const PORT = env.port || 3000;

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  Logger.error(`Uncaught Exception: ${error.message}`);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on(
  'unhandledRejection',
  (reason: unknown, promise: Promise<unknown>) => {
    Logger.error(`Unhandled Rejection at: ${promise} - reason: ${reason}`);
    process.exit(1);
  },
);

async function startServer() {
  try {
    await database.ready();
    server.listen(PORT, () => {
      Logger.info(`?? Server is running on port ${PORT}`);
    });
  } catch (error) {
    Logger.error(`Failed to start server: ${error}`);
    process.exit(1);
  }
}

startServer();
