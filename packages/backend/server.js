import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import Docker from 'dockerode';
import si from 'systeminformation';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 4000;
const docker = new Docker();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.text());

// System Stats API
app.get('/api/system/stats', async (req, res) => {
  try {
    const cpu = await si.currentLoad();
    const mem = await si.mem();
    const disk = await si.disksIO();
    const network = await si.networkStats();
    const os = await si.osInfo();

    res.json({
      success: true,
      data: {
        cpu: {
          usage: cpu.currentLoad.toFixed(2),
          cores: cpu.cores,
          model: cpu.brand,
        },
        memory: {
          total: (mem.total / 1024 / 1024 / 1024).toFixed(2),
          used: (mem.used / 1024 / 1024 / 1024).toFixed(2),
          free: (mem.free / 1024 / 1024 / 1024).toFixed(2),
          percent: mem.percent.toFixed(2),
        },
        disk: {
          io: disk,
        },
        network: {
          interfaces: network,
        },
        os: {
          platform: os.platform,
          distro: os.distro,
          release: os.release,
          arch: os.arch,
          uptime: os.uptime,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Docker Containers API
app.get('/api/docker/containers', async (req, res) => {
  try {
    const containers = await docker.listContainers({ all: true });
    const containerDetails = await Promise.all(
      containers.map(async (container) => {
        const containerInfo = docker.getContainer(container.Id);
        const inspect = await containerInfo.inspect();
        return {
          id: container.Id,
          name: container.Names[0]?.replace('/', ''),
          image: container.Image,
          status: container.State,
          state: container.Status,
          created: container.Created,
          ports: container.Ports,
          mounts: inspect.Mounts,
          config: inspect.Config,
        };
      })
    );

    res.json({
      success: true,
      data: {
        total: containerDetails.length,
        containers: containerDetails,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start Container
app.post('/api/docker/container/:id/start', async (req, res) => {
  try {
    const container = docker.getContainer(req.params.id);
    await container.start();
    res.json({ success: true, message: `Container başlatıldı` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Stop Container
app.post('/api/docker/container/:id/stop', async (req, res) => {
  try {
    const container = docker.getContainer(req.params.id);
    await container.stop();
    res.json({ success: true, message: `Container durduruldu` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Remove Container
app.post('/api/docker/container/:id/remove', async (req, res) => {
  try {
    const container = docker.getContainer(req.params.id);
    await container.remove({ force: true });
    res.json({ success: true, message: `Container silindi` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Docker Images API
app.get('/api/docker/images', async (req, res) => {
  try {
    const images = await docker.listImages();
    res.json({
      success: true,
      data: {
        total: images.length,
        images: images,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'NumbrelOs Backend API çalışıyor',
    version: '1.0.0',
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'NumbrelOs Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      system: '/api/system/stats',
      docker: {
        containers: '/api/docker/containers',
        images: '/api/docker/images',
        startContainer: 'POST /api/docker/container/:id/start',
        stopContainer: 'POST /api/docker/container/:id/stop',
        removeContainer: 'POST /api/docker/container/:id/remove',
      },
    },
  });
});

app.listen(port, () => {
  console.log(`🚀 NumbrelOs Backend API çalışıyor: http://localhost:${port}`);
});
