import { dockerService } from '../../services/docker.service.js';
import { asyncHandler } from '../../middleware/errorHandler.js';

export const getAll = asyncHandler(async (req, res) => {
  const { all = 'true' } = req.query;
  const containers = await dockerService.getAllContainers(all === 'true');
  res.json({ success: true, data: containers });
});

export const getById = asyncHandler(async (req, res) => {
  const container = await dockerService.getContainer(req.params.id);
  res.json({ success: true, data: container });
});

export const getStats = asyncHandler(async (req, res) => {
  const stats = await dockerService.getContainerStats(req.params.id);
  res.json({ success: true, data: stats });
});

export const getLogs = asyncHandler(async (req, res) => {
  const logs = await dockerService.getContainerLogs(req.params.id, req.query);
  res.json({ success: true, data: logs });
});

export const start = asyncHandler(async (req, res) => {
  const result = await dockerService.startContainer(req.params.id);
  res.json({ success: true, data: result });
});

export const stop = asyncHandler(async (req, res) => {
  const result = await dockerService.stopContainer(req.params.id);
  res.json({ success: true, data: result });
});

export const restart = asyncHandler(async (req, res) => {
  const result = await dockerService.restartContainer(req.params.id);
  res.json({ success: true, data: result });
});

export const getSystemInfo = asyncHandler(async (req, res) => {
  const info = await dockerService.getSystemInfo();
  res.json({ success: true, data: info });
});

export const getImages = asyncHandler(async (req, res) => {
  const images = await dockerService.getAllImages();
  res.json({ success: true, data: images });
});

export const getNetworks = asyncHandler(async (req, res) => {
  const networks = await dockerService.getAllNetworks();
  res.json({ success: true, data: networks });
});

export const getVolumes = asyncHandler(async (req, res) => {
  const volumes = await dockerService.getAllVolumes();
  res.json({ success: true, data: volumes });
});

export const detectProjects = asyncHandler(async (req, res) => {
  const projects = await dockerService.detectProjects();
  res.json({ success: true, data: projects });
});

export const getAllPorts = asyncHandler(async (req, res) => {
  const ports = await dockerService.getAllPorts();
  res.json({ success: true, data: ports });
});
