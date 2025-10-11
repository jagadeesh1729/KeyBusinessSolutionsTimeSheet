import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import { errorHandler, requestLogger } from './middleware/loggerMiddleware';
import projectRoutes from './routes/projectRoutes';
import userRoutes from './routes/userRoutes';
import { time } from 'console';
import timesheetRoutes from './routes/timesheetRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import { google } from "googleapis";
dotenv.config();
const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
   process.env.REDIRECT_URI
);
class App {
  public app: express.Application;
  public tokens:any;
  constructor() {
    this.app = express();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(requestLogger);
  }

  private initializeRoutes(): void {
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/projects', projectRoutes);
    this.app.use('/api/users',userRoutes);
    this.app.use('/api/timesheets',timesheetRoutes);
    this.app.use('/api/dashboard', dashboardRoutes);

    // Health check route
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
      });
    });

    // Your existing test route
    this.app.get('/', (req, res) => {
      res.send('Hello World! Check the console for logs.');
    });
    this.app.get("/google", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/calendar.events"],
  });
  res.redirect(url);
});
this.app.get("/auth/google/callback", async (req, res) => {
  const code = req.query.code as string;
  const { tokens: newTokens } = await oauth2Client.getToken(code);
  this.tokens = newTokens; // save to DB later
  oauth2Client.setCredentials(newTokens);
  res.send("✅ Super Admin authorized successfully. Tokens saved!");
});


  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
  }

  public getApp(): express.Application {
    return this.app;
  }
}

export default App;
