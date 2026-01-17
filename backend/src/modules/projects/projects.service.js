import { query, transaction } from '../../config/database.js';
import { logger } from '../../utils/logger.js';
import { AppError } from '../../middleware/errorHandler.js';

class ProjectsService {
  async getAll(options = {}) {
    const { status = 'all', search = '', page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (status !== 'all') {
      whereClause += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    if (search) {
      whereClause += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    const countResult = await query(`SELECT COUNT(*) FROM projects ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count, 10);
    const result = await query(`SELECT * FROM projects ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`, [...params, limit, offset]);

    return { projects: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getById(id) {
    const projectResult = await query('SELECT * FROM projects WHERE id = $1', [id]);
    if (projectResult.rows.length === 0) throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');

    const portsResult = await query('SELECT * FROM ports WHERE project_id = $1 ORDER BY port_number', [id]);
    const containersResult = await query('SELECT * FROM containers WHERE project_id = $1', [id]);

    return { ...projectResult.rows[0], ports: portsResult.rows, containers: containersResult.rows };
  }

  async create(data) {
    const { name, description, githubUrl, domain, stack, status } = data;
    const result = await query(
      `INSERT INTO projects (name, description, github_url, domain, stack, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, description || null, githubUrl || null, domain || null, stack || [], status || 'active']
    );
    logger.info('Project created', { projectId: result.rows[0].id, name });
    return result.rows[0];
  }

  async update(id, data) {
    await this.getById(id);
    const { name, description, githubUrl, domain, stack, status } = data;
    const result = await query(
      `UPDATE projects SET name = COALESCE($1, name), description = COALESCE($2, description), github_url = COALESCE($3, github_url), domain = COALESCE($4, domain), stack = COALESCE($5, stack), status = COALESCE($6, status), updated_at = NOW() WHERE id = $7 RETURNING *`,
      [name, description, githubUrl, domain, stack, status, id]
    );
    logger.info('Project updated', { projectId: id });
    return result.rows[0];
  }

  async delete(id) {
    await this.getById(id);
    await transaction(async (client) => {
      await client.query('DELETE FROM ports WHERE project_id = $1', [id]);
      await client.query('DELETE FROM containers WHERE project_id = $1', [id]);
      await client.query('DELETE FROM projects WHERE id = $1', [id]);
    });
    logger.info('Project deleted', { projectId: id });
    return { success: true };
  }

  async addPort(projectId, data) {
    await this.getById(projectId);
    const { portNumber, protocol, serviceName, description } = data;
    const existingPort = await query('SELECT * FROM ports WHERE port_number = $1 AND protocol = $2', [portNumber, protocol]);
    if (existingPort.rows.length > 0) throw new AppError(`Port ${portNumber}/${protocol} is already in use`, 409, 'PORT_CONFLICT');

    const result = await query(
      `INSERT INTO ports (project_id, port_number, protocol, service_name, description) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [projectId, portNumber, protocol, serviceName || null, description || null]
    );
    logger.info('Port added to project', { projectId, port: portNumber });
    return result.rows[0];
  }

  async removePort(projectId, portId) {
    const result = await query('DELETE FROM ports WHERE id = $1 AND project_id = $2 RETURNING *', [portId, projectId]);
    if (result.rows.length === 0) throw new AppError('Port not found', 404, 'PORT_NOT_FOUND');
    logger.info('Port removed from project', { projectId, portId });
    return { success: true };
  }

  async addContainer(projectId, data) {
    await this.getById(projectId);
    const { containerId, isShared } = data;
    const existingContainer = await query('SELECT * FROM containers WHERE container_id = $1 AND project_id = $2', [containerId, projectId]);
    if (existingContainer.rows.length > 0) throw new AppError('Container already associated', 409, 'CONTAINER_CONFLICT');

    const result = await query(`INSERT INTO containers (project_id, container_id, is_shared) VALUES ($1, $2, $3) RETURNING *`, [projectId, containerId, isShared]);
    logger.info('Container added to project', { projectId, containerId });
    return result.rows[0];
  }

  async removeContainer(projectId, containerId) {
    const result = await query('DELETE FROM containers WHERE id = $1 AND project_id = $2 RETURNING *', [containerId, projectId]);
    if (result.rows.length === 0) throw new AppError('Container not found', 404, 'CONTAINER_NOT_FOUND');
    return { success: true };
  }

  async getAllUsedPorts() {
    const result = await query(`SELECT p.*, pr.name as project_name FROM ports p JOIN projects pr ON p.project_id = pr.id ORDER BY p.port_number`);
    return result.rows;
  }

  async checkPortAvailability(portNumber, protocol = 'tcp') {
    const result = await query(`SELECT p.*, pr.name as project_name FROM ports p JOIN projects pr ON p.project_id = pr.id WHERE p.port_number = $1 AND p.protocol = $2`, [portNumber, protocol]);
    return { available: result.rows.length === 0, usedBy: result.rows[0] || null };
  }

  async getStats() {
    const result = await query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'active') as active, COUNT(*) FILTER (WHERE status = 'inactive') as inactive, COUNT(*) FILTER (WHERE status = 'maintenance') as maintenance, COUNT(*) FILTER (WHERE status = 'archived') as archived FROM projects`);
    const portsResult = await query('SELECT COUNT(*) FROM ports');
    const containersResult = await query('SELECT COUNT(DISTINCT container_id) FROM containers');
    return { ...result.rows[0], totalPorts: parseInt(portsResult.rows[0].count, 10), totalContainers: parseInt(containersResult.rows[0].count, 10) };
  }
}

export const projectsService = new ProjectsService();
export default projectsService;
