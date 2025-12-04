import mysql, { RowDataPacket, OkPacket } from 'mysql2/promise';
import Logger from '../utils/logger';
import env from './env';

const DB_CONNECT_MAX_RETRIES = env.db.maxRetries;
const DB_CONNECT_RETRY_DELAY_MS = env.db.retryDelayMs;

const dbConfig = {
  host: env.db.host,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  port: env.db.port,
  connectTimeout: 10000,
  enableKeepAlive: true,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

class Database {
  private pool: mysql.Pool;

  constructor() {
    this.pool = mysql.createPool(dbConfig);
    this.testConnectionWithRetry().catch((e) => {
      Logger.error(`Database initial check failed unexpectedly: ${e}`);
    });
  }

  async testConnection(): Promise<void> {
    try {
      const connection = await this.pool.getConnection();
      Logger.info('✅ Database connected successfully');
      connection.release();
    } catch (error) {
      Logger.error(`❌ Database connection failed: ${error}`);
      process.exit(1);
    }
  }

  private async sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async testConnectionWithRetry(): Promise<void> {
    for (let attempt = 1; attempt <= DB_CONNECT_MAX_RETRIES; attempt++) {
      try {
        const connection = await this.pool.getConnection();
        await connection.ping();
        connection.release();
        Logger.info(`Database connected successfully (attempt ${attempt})`);
        return;
      } catch (error: any) {
        const message = error?.message || String(error);
        if (attempt >= DB_CONNECT_MAX_RETRIES) {
          Logger.error(`Database connection failed after ${attempt} attempts: ${message}`);
          process.exit(1);
        }
        Logger.warn(`Database not ready (attempt ${attempt}/${DB_CONNECT_MAX_RETRIES}): ${message}. Retrying in ${DB_CONNECT_RETRY_DELAY_MS}ms...`);
        await this.sleep(DB_CONNECT_RETRY_DELAY_MS);
      }
    }
  }

  getPool(): mysql.Pool {
    return this.pool;
  }
  

  async query<T extends RowDataPacket[] | OkPacket>(
    sql: string,
    params?: (string | number)[],
  ): Promise<T> {
    try {
      const [results] = await this.pool.execute<T>(sql, params);
      return results;
    } catch (error) {
      Logger.error(`Database query error: ${error}`);
      throw error;
    }
  }
}

export default new Database();
