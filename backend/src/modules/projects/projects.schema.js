import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(1000).optional(),
  githubUrl: z.string().url().optional().or(z.literal('')),
  domain: z.string().max(255).optional().or(z.literal('')),
  stack: z.array(z.string()).optional().default([]),
  status: z.enum(['active', 'inactive', 'maintenance', 'archived']).optional().default('active'),
});

export const updateProjectSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(1000).optional(),
  githubUrl: z.string().url().optional().or(z.literal('')),
  domain: z.string().max(255).optional().or(z.literal('')),
  stack: z.array(z.string()).optional(),
  status: z.enum(['active', 'inactive', 'maintenance', 'archived']).optional(),
});

export const addPortSchema = z.object({
  portNumber: z.number().int().min(1).max(65535),
  protocol: z.enum(['tcp', 'udp']).optional().default('tcp'),
  serviceName: z.string().max(100).optional(),
  description: z.string().max(255).optional(),
});

export const addContainerSchema = z.object({
  containerId: z.string().min(1),
  isShared: z.boolean().optional().default(false),
});

export const projectQuerySchema = z.object({
  status: z.enum(['active', 'inactive', 'maintenance', 'archived', 'all']).optional().default('all'),
  search: z.string().optional(),
  page: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().positive()).optional().default('1'),
  limit: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().positive().max(100)).optional().default('20'),
});
