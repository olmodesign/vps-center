import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, query } from '../config/database.js';
import { logger } from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, '../../../database/migrations');

async function migrate() {
  try {
    logger.info('Starting database migrations...');
    
    await query(`CREATE TABLE IF NOT EXISTS migrations (id SERIAL PRIMARY KEY, name VARCHAR(255) UNIQUE NOT NULL, executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
    
    const executedResult = await query('SELECT name FROM migrations ORDER BY id');
    const executedMigrations = executedResult.rows.map((row) => row.name);
    
    const files = fs.readdirSync(migrationsDir).filter((file) => file.endsWith('.sql')).sort();
    let migrationsRun = 0;

    for (const file of files) {
      if (!executedMigrations.includes(file)) {
        const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          await client.query(content);
          await client.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
          await client.query('COMMIT');
          logger.info(`Migration executed: ${file}`);
          migrationsRun++;
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      }
    }

    logger.info(migrationsRun === 0 ? 'No new migrations to run' : `Successfully ran ${migrationsRun} migration(s)`);
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
