import mysql, { RowDataPacket, OkPacket } from 'mysql2/promise';
import dotenv from 'dotenv';
import Logger from '../utils/logger';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

class Database {
  private pool: mysql.Pool;

  constructor() {
    this.pool = mysql.createPool(dbConfig);
    this.testConnection();
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
