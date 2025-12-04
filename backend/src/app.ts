import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import { errorHandler, requestLogger } from './middleware/loggerMiddleware';
import projectRoutes from './routes/projectRoutes';
import userRoutes from './routes/userRoutes';
import timesheetRoutes from './routes/timesheetRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import offerLetterRoutes from './routes/offerLetterRoutes';
import meetingRoutes from './routes/meetingRoutes'; 
import emailRoutes from './routes/emailRoutes';
import { google } from 'googleapis';
import { GoogleTokenService } from './services/googleTokenService';
import env from './config/env';
import { generalRateLimiter } from './middleware/rateLimiters';
import { securityHeaders } from './middleware/securityHeaders';
import Logger from './utils/logger';

const oauth2Client = new google.auth.OAuth2(
  env.google.clientId,
  env.google.clientSecret,
  env.google.redirectUri,
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
    const allowedOrigins = env.corsOrigins.length ? env.corsOrigins : ['http://localhost:5173'];
    this.app.set('trust proxy', env.trustProxy ? 1 : undefined);
    this.app.use(securityHeaders);
    this.app.use(
      cors({
        origin(origin, callback) {
          if (!origin) return callback(null, true);
          if (allowedOrigins.includes(origin)) return callback(null, true);
          return callback(new Error('Not allowed by CORS'), false);
        },
        credentials: true,
      }),
    );
    this.app.use(express.json({ limit: '1mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '1mb' }));
    if (env.nodeEnv !== 'production') {
      this.app.use(requestLogger);
    }
    this.app.use(generalRateLimiter);
  }

  private initializeRoutes(): void {
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/projects', projectRoutes);
    this.app.use('/api/users',userRoutes);
    this.app.use('/api/timesheets',timesheetRoutes);
    this.app.use('/api/dashboard', dashboardRoutes);
    this.app.use('/api/offerletters', offerLetterRoutes);
    this.app.use('/api/meet', meetingRoutes);
    this.app.use('/api/email', emailRoutes);
    this.app.use('/api/expiration-tracker', expirationTrackerRoutes);

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
        prompt: "consent",
        include_granted_scopes: true as any,
        scope: ["https://www.googleapis.com/auth/calendar.events"],
      });
      res.redirect(url);
    });
this.app.get("/auth/google/callback", async (req, res) => {
  const code = req.query.code as string;
  const { tokens: newTokens } = await oauth2Client.getToken(code);
  this.tokens = newTokens; // save to DB later
  oauth2Client.setCredentials(newTokens);
  try {
    const tokenSvc = new GoogleTokenService();
    await tokenSvc.saveTokens({
      access_token: (this.tokens as any).access_token,
      refresh_token: (this.tokens as any).refresh_token,
      scope: (this.tokens as any).scope,
      token_type: (this.tokens as any).token_type,
      expiry_date: (this.tokens as any).expiry_date,
    });
  } catch (e) {
    Logger.error(`Failed to persist Google tokens to DB: ${e}`);
  }
  res.send("Super Admin authorized successfully. Tokens saved to DB!");
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


