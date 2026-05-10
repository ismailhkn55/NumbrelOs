const express = require('express');
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.text({ type: ['text/plain', 'application/x-yaml', 'text/yaml', 'application/yaml'] }));
app.use(express.static(__dirname));

let networkConfig = {
  mode: 'dhcp',
  ip: '192.168.1.100',
  gateway: '192.168.1.1',
  dns: ['1.1.1.1', '8.8.8.8'],
};

app.get('/api/network', (req, res) => {
  res.json(networkConfig);
});

app.post('/api/network', (req, res) => {
  const { mode, ip, gateway, dns } = req.body;
  if (mode) networkConfig.mode = mode;
  if (ip) networkConfig.ip = ip;
  if (gateway) networkConfig.gateway = gateway;
  if (dns) {
    networkConfig.dns = dns.split(',').map((item) => item.trim()).filter(Boolean);
  }
  res.json(networkConfig);
});

app.post('/api/parse-yaml', (req, res) => {
  const document = req.body;
  if (!document || document.trim().length === 0) {
    res.status(400).json({ success: false, error: 'YAML içeriği boş olamaz.' });
    return;
  }

  try {
    const parsed = yaml.load(document);
    res.json({ success: true, data: parsed });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/api/sample-config', (req, res) => {
  const samplePath = path.join(__dirname, 'config', 'sample.yml');
  if (!fs.existsSync(samplePath)) {
    res.status(404).send('Sample config not found');
    return;
  }
  res.type('text/plain').send(fs.readFileSync(samplePath, 'utf8'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`NumbrelOs server running on http://localhost:${port}`);
});
