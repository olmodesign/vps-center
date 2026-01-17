import Docker from 'dockerode';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

export const docker = new Docker({
  socketPath: config.dockerSocket,
});

export const checkDockerConnection = async () => {
  try {
    const info = await docker.info();
    logger.info('Docker connected successfully', {
      containers: info.Containers,
      running: info.ContainersRunning,
    });
    return true;
  } catch (error) {
    logger.error('Docker connection failed:', error.message);
    return false;
  }
};

export default docker;
