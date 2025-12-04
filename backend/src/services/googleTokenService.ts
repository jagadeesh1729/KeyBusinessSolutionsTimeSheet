import database from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface GoogleTokens {
  access_token?: string;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  expiry_date?: number; // ms epoch
}

export class GoogleTokenService {
  private async ensureTable() {
    await database.query(`
      CREATE TABLE IF NOT EXISTS google_oauth_tokens (
        id INT PRIMARY KEY AUTO_INCREMENT,
        access_token TEXT NULL,
        refresh_token TEXT NULL,
        scope TEXT NULL,
        token_type VARCHAR(50) NULL,
        expiry_date BIGINT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  }

  public async saveTokens(tokens: GoogleTokens): Promise<void> {
    await this.ensureTable();
    const rows = (await database.query('SELECT id FROM google_oauth_tokens LIMIT 1')) as RowDataPacket[];
    if (rows.length > 0) {
      await database.query(
        'UPDATE google_oauth_tokens SET access_token=?, refresh_token=COALESCE(?, refresh_token), scope=?, token_type=?, expiry_date=? WHERE id=?',
        [
          (tokens.access_token ?? '') as string,
          (tokens.refresh_token ?? '') as string,
          (tokens.scope ?? '') as string,
          (tokens.token_type ?? '') as string,
          (tokens.expiry_date ?? 0) as number,
          rows[0].id as number,
        ] as (string | number)[]
      );
    } else {
      await database.query(
        'INSERT INTO google_oauth_tokens (access_token, refresh_token, scope, token_type, expiry_date) VALUES (?, ?, ?, ?, ?)',
        [
          (tokens.access_token ?? '') as string,
          (tokens.refresh_token ?? '') as string,
          (tokens.scope ?? '') as string,
          (tokens.token_type ?? '') as string,
          (tokens.expiry_date ?? 0) as number,
        ] as (string | number)[]
      );
    }
  }

  public async getTokens(): Promise<GoogleTokens | null> {
    await this.ensureTable();
    const rows = (await database.query('SELECT * FROM google_oauth_tokens LIMIT 1')) as RowDataPacket[];
    if (rows.length === 0) return null;
    const r = rows[0] as any;
    return {
      access_token: r.access_token || undefined,
      refresh_token: r.refresh_token || undefined,
      scope: r.scope || undefined,
      token_type: r.token_type || undefined,
      expiry_date: r.expiry_date || undefined,
    };
  }
}




