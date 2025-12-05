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
  private initPromise: Promise<void>;

  constructor() {
    this.pool = mysql.createPool(dbConfig);
    this.initPromise = this.initialize();
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

  private async ensureUsersColumns(): Promise<void> {
    const dbName = env.db.database;
    if (!dbName) {
      Logger.warn('DB_NAME is not set; skipping automatic users column check.');
      return;
    }

    const requiredColumns = [
      { name: 'first_name', definition: 'VARCHAR(255) DEFAULT NULL' },
      { name: 'last_name', definition: 'VARCHAR(255) DEFAULT NULL' },
      { name: 'reset_token', definition: 'VARCHAR(255) DEFAULT NULL' },
      { name: 'location', definition: 'VARCHAR(255) DEFAULT NULL' },
      { name: 'no_of_hours', definition: 'INT DEFAULT NULL' },
    ];

    for (const column of requiredColumns) {
      try {
        const existing = await this.query<RowDataPacket[]>(
          `SELECT 1 FROM information_schema.columns WHERE table_schema = ? AND table_name = 'users' AND column_name = ? LIMIT 1`,
          [dbName, column.name],
        );
        if (!Array.isArray(existing) || existing.length === 0) {
          Logger.warn(`Missing column '${column.name}' in users table. Adding it now.`);
          await this.query(`ALTER TABLE users ADD COLUMN ${column.name} ${column.definition}`);
        }
      } catch (error) {
        Logger.error(`Failed to verify or add column '${column.name}' on users table: ${error}`);
        throw error;
      }
    }
  }

  getPool(): mysql.Pool {
    return this.pool;
  }

  private async initialize(): Promise<void> {
    await this.testConnectionWithRetry();
    await this.ensureUsersColumns();
  }

  async ready(): Promise<void> {
    return this.initPromise;
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
