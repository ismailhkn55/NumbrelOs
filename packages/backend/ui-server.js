import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// Serve static files
app.use(express.static(path.join(__dirname, '../ui-custom')));

// Root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../ui-custom/index.html'));
});

app.listen(port, () => {
  console.log(`🌐 NumbrelOs Frontend çalışıyor: http://localhost:${port}`);
  console.log(`📡 Backend API: http://localhost:4000`);
});
