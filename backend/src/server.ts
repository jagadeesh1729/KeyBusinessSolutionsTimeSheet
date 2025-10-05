import App from './app';
import Logger from './utils/logger';

const app = new App();
const server = app.getApp();

const PORT = process.env.PORT || 3000;

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

server.listen(PORT, () => {
  Logger.info(`🚀 Server is running on http://localhost:${PORT}`);
});
