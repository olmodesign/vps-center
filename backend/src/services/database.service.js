import { dockerService } from './docker.service.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../middleware/errorHandler.js';
import fs from 'fs/promises';
import path from 'path';

const BACKUP_DIR = '/tmp/vps-center-backups';

class DatabaseBackupService {
  constructor() {
    this.ensureBackupDir();
  }

  async ensureBackupDir() {
    try {
      await fs.mkdir(BACKUP_DIR, { recursive: true });
    } catch (error) {
      logger.error('Failed to create backup directory:', error);
    }
  }

  async backupPostgres(containerId, database, user) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${database}_${timestamp}.sql`;
      const containerPath = `/tmp/${filename}`;
      
      // Ejecutar pg_dump dentro del contenedor
      const cmd = `pg_dump -U ${user} -d ${database} -f ${containerPath}`;
      await dockerService.execInContainer(containerId, cmd);
      
      // Copiar el archivo fuera del contenedor
      const localPath = path.join(BACKUP_DIR, filename);
      const copyCmd = `cat ${containerPath}`;
      const content = await dockerService.execInContainer(containerId, copyCmd);
      
      await fs.writeFile(localPath, content);
      
      // Limpiar archivo temporal en contenedor
      await dockerService.execInContainer(containerId, `rm -f ${containerPath}`);
      
      // Obtener tamaño del archivo
      const stats = await fs.stat(localPath);
      
      logger.info('Database backup created', { database, filename, size: stats.size });
      
      return {
        success: true,
        filename,
        path: localPath,
        size: stats.size,
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Failed to backup PostgreSQL:', error);
      throw new AppError('Failed to create database backup', 500, 'BACKUP_ERROR');
    }
  }

  async restorePostgres(containerId, database, user, backupPath) {
    try {
      // Leer el contenido del backup
      const content = await fs.readFile(backupPath, 'utf8');
      const containerPath = '/tmp/restore.sql';
      
      // Crear archivo temporal en el contenedor
      // Usamos echo con base64 para evitar problemas con caracteres especiales
      const base64Content = Buffer.from(content).toString('base64');
      await dockerService.execInContainer(containerId, `echo "${base64Content}" | base64 -d > ${containerPath}`);
      
      // Ejecutar restore
      const cmd = `psql -U ${user} -d ${database} -f ${containerPath}`;
      const result = await dockerService.execInContainer(containerId, cmd);
      
      // Limpiar archivo temporal
      await dockerService.execInContainer(containerId, `rm -f ${containerPath}`);
      
      logger.info('Database restored', { database, backupPath });
      
      return { success: true, message: 'Database restored successfully', output: result };
    } catch (error) {
      logger.error('Failed to restore PostgreSQL:', error);
      throw new AppError('Failed to restore database', 500, 'RESTORE_ERROR');
    }
  }

  async queryPostgres(containerId, database, user, query) {
    try {
      // Solo permitir SELECT para seguridad
      const normalizedQuery = query.trim().toUpperCase();
      if (!normalizedQuery.startsWith('SELECT')) {
        throw new AppError('Only SELECT queries are allowed', 400, 'INVALID_QUERY');
      }
      
      // Sanitizar la query (básico - evitar inyecciones obvias)
      if (query.includes(';') && query.split(';').filter(s => s.trim()).length > 1) {
        throw new AppError('Multiple statements not allowed', 400, 'INVALID_QUERY');
      }
      
      const cmd = `psql -U ${user} -d ${database} -t -A -F',' -c "${query.replace(/"/g, '\\"')}"`;
      const result = await dockerService.execInContainer(containerId, cmd);
      
      // Parsear resultado CSV
      const lines = result.trim().split('\n').filter(l => l.trim());
      
      return {
        success: true,
        rowCount: lines.length,
        data: lines,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to query PostgreSQL:', error);
      throw new AppError('Failed to execute query: ' + error.message, 500, 'QUERY_ERROR');
    }
  }

  async getPostgresTables(containerId, database, user) {
    try {
      const cmd = `psql -U ${user} -d ${database} -t -A -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"`;
      const result = await dockerService.execInContainer(containerId, cmd);
      
      const tables = result.trim().split('\n').filter(t => t.trim());
      
      return { success: true, tables };
    } catch (error) {
      logger.error('Failed to get tables:', error);
      throw new AppError('Failed to get database tables', 500, 'QUERY_ERROR');
    }
  }

  async getPostgresSize(containerId, database, user) {
    try {
      const cmd = `psql -U ${user} -d ${database} -t -A -c "SELECT pg_size_pretty(pg_database_size('${database}'))"`;
      const result = await dockerService.execInContainer(containerId, cmd);
      
      return { success: true, size: result.trim() };
    } catch (error) {
      logger.error('Failed to get database size:', error);
      throw new AppError('Failed to get database size', 500, 'QUERY_ERROR');
    }
  }

  async listBackups(projectName) {
    try {
      const files = await fs.readdir(BACKUP_DIR);
      const backups = [];
      
      for (const file of files) {
        if (projectName && !file.toLowerCase().includes(projectName.toLowerCase())) {
          continue;
        }
        
        const filePath = path.join(BACKUP_DIR, file);
        const stats = await fs.stat(filePath);
        
        backups.push({
          filename: file,
          path: filePath,
          size: stats.size,
          createdAt: stats.birthtime,
        });
      }
      
      return backups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      logger.error('Failed to list backups:', error);
      return [];
    }
  }

  async getBackupContent(filename) {
    try {
      const filePath = path.join(BACKUP_DIR, filename);
      const content = await fs.readFile(filePath);
      const stats = await fs.stat(filePath);
      
      return { content, size: stats.size, filename };
    } catch (error) {
      logger.error('Failed to get backup:', error);
      throw new AppError('Backup not found', 404, 'BACKUP_NOT_FOUND');
    }
  }

  async deleteBackup(filename) {
    try {
      const filePath = path.join(BACKUP_DIR, filename);
      await fs.unlink(filePath);
      
      logger.info('Backup deleted', { filename });
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete backup:', error);
      throw new AppError('Failed to delete backup', 500, 'DELETE_ERROR');
    }
  }
}

export const databaseService = new DatabaseBackupService();
export default databaseService;
