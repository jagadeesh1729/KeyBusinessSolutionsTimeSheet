import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import Logger from './utils/logger';
import './config/database';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT;

// Middlewares
app.use(cors());
app.use(express.json());

// A test route to check logger
app.get('/', (req: Request, res: Response) => {
  Logger.info('Received a request on the root path!');
  res.send('Hello World! Check the console for logs.');
});

// The database is initialized when imported.
// The connection test runs automatically.
app.listen(PORT, () => {
  Logger.info(`🚀 Server is running on http://localhost:${PORT}`);
});
