import { projectsService } from './projects.service.js';
import { asyncHandler } from '../../middleware/errorHandler.js';

export const getAll = asyncHandler(async (req, res) => {
  const result = await projectsService.getAll(req.query);
  res.status(200).json({ success: true, data: result });
});

export const getStats = asyncHandler(async (req, res) => {
  const stats = await projectsService.getStats();
  res.status(200).json({ success: true, data: stats });
});

export const getAllPorts = asyncHandler(async (req, res) => {
  const ports = await projectsService.getAllUsedPorts();
  res.status(200).json({ success: true, data: ports });
});

export const checkPort = asyncHandler(async (req, res) => {
  const { port } = req.params;
  const { protocol = 'tcp' } = req.query;
  const result = await projectsService.checkPortAvailability(parseInt(port, 10), protocol);
  res.status(200).json({ success: true, data: result });
});

export const getById = asyncHandler(async (req, res) => {
  const project = await projectsService.getById(req.params.id);
  res.status(200).json({ success: true, data: project });
});

export const create = asyncHandler(async (req, res) => {
  const project = await projectsService.create(req.body);
  res.status(201).json({ success: true, data: project });
});

export const update = asyncHandler(async (req, res) => {
  const project = await projectsService.update(req.params.id, req.body);
  res.status(200).json({ success: true, data: project });
});

export const remove = asyncHandler(async (req, res) => {
  await projectsService.delete(req.params.id);
  res.status(200).json({ success: true, message: 'Project deleted successfully' });
});

export const addPort = asyncHandler(async (req, res) => {
  const port = await projectsService.addPort(req.params.id, req.body);
  res.status(201).json({ success: true, data: port });
});

export const removePort = asyncHandler(async (req, res) => {
  await projectsService.removePort(req.params.id, req.params.portId);
  res.status(200).json({ success: true, message: 'Port removed successfully' });
});

export const addContainer = asyncHandler(async (req, res) => {
  const container = await projectsService.addContainer(req.params.id, req.body);
  res.status(201).json({ success: true, data: container });
});

export const removeContainer = asyncHandler(async (req, res) => {
  await projectsService.removeContainer(req.params.id, req.params.containerId);
  res.status(200).json({ success: true, message: 'Container removed successfully' });
});
