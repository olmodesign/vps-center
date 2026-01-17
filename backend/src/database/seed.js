import { query } from '../config/database.js';
import { hashPassword } from '../utils/crypto.js';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

async function seed() {
  try {
    logger.info('Starting database seed...');

    const existingAdmin = await query('SELECT id FROM users WHERE email = $1', [config.admin.email]);

    if (existingAdmin.rows.length > 0) {
      logger.info('Admin user already exists, skipping seed');
      process.exit(0);
    }

    const passwordHash = await hashPassword(config.admin.password);
    await query(`INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'admin')`, [config.admin.email, passwordHash]);

    logger.info('Admin user created successfully', { email: config.admin.email });

    const projectResult = await query(
      `INSERT INTO projects (name, description, status, stack) VALUES ('VPS Center', 'Dashboard for managing VPS projects', 'active', $1) RETURNING id`,
      [['Node.js', 'React', 'PostgreSQL', 'Docker']]
    );

    await query(
      `INSERT INTO ports (project_id, port_number, protocol, service_name, description) VALUES ($1, 3100, 'tcp', 'backend', 'VPS Center API'), ($1, 443, 'tcp', 'frontend', 'VPS Center Web UI')`,
      [projectResult.rows[0].id]
    );

    logger.info('Sample project created');
    process.exit(0);
  } catch (error) {
    logger.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
