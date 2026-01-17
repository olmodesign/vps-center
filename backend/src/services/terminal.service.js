// ============================================
// VPS CENTER - Terminal Service
// ============================================

import * as pty from 'node-pty';
import { query } from '../config/database.js';
import { logger } from '../utils/logger.js';

class TerminalService {
  constructor() {
    this.sessions = new Map();
  }

  // Crear nueva sesión de terminal
  async createSession(userId, initialPath = '/root') {
    try {
      // Crear registro en BD
      const result = await query(
        `INSERT INTO terminal_sessions (user_id, initial_path, metadata)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [userId, initialPath, JSON.stringify({ startedAt: new Date() })]
      );

      const sessionId = result.rows[0].id;

      // Crear proceso PTY
      const shell = process.env.SHELL || '/bin/bash';
      const ptyProcess = pty.spawn(shell, [], {
        name: 'xterm-256color',
        cols: 80,
        rows: 24,
        cwd: initialPath,
        env: {
          ...process.env,
          TERM: 'xterm-256color',
        },
      });

      // Guardar sesión
      this.sessions.set(sessionId, {
        pty: ptyProcess,
        userId,
        recording: [],
        startedAt: new Date(),
      });

      logger.info(`Terminal session created`, { sessionId, userId });

      return { sessionId, pid: ptyProcess.pid };
    } catch (error) {
      logger.error('Failed to create terminal session:', error);
      throw error;
    }
  }

  // Obtener sesión activa
  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  // Escribir en terminal
  write(sessionId, data) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.pty.write(data);
      // Grabar input
      session.recording.push({
        type: 'input',
        data,
        timestamp: Date.now(),
      });
    }
  }

  // Redimensionar terminal
  resize(sessionId, cols, rows) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.pty.resize(cols, rows);
      logger.debug(`Terminal resized`, { sessionId, cols, rows });
    }
  }

  // Cerrar sesión
  async closeSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      try {
        // Guardar grabación en BD
        await query(
          `UPDATE terminal_sessions 
           SET ended_at = NOW(), recording = $1
           WHERE id = $2`,
          [JSON.stringify(session.recording), sessionId]
        );

        // Matar proceso
        session.pty.kill();
        this.sessions.delete(sessionId);

        logger.info(`Terminal session closed`, { sessionId });
      } catch (error) {
        logger.error('Failed to close terminal session:', error);
      }
    }
  }

  // Obtener historial de sesiones
  async getSessionHistory(userId, limit = 20) {
    const result = await query(
      `SELECT id, started_at, ended_at, initial_path, metadata
       FROM terminal_sessions
       WHERE user_id = $1
       ORDER BY started_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  }

  // Obtener grabación de sesión
  async getSessionRecording(sessionId, userId) {
    const result = await query(
      `SELECT recording FROM terminal_sessions
       WHERE id = $1 AND user_id = $2`,
      [sessionId, userId]
    );
    return result.rows[0]?.recording || [];
  }
}

export const terminalService = new TerminalService();
export default terminalService;
