// Express server for POS backend

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth');

const app = express();

function loadConfig() {
  const configPath = path.join(__dirname, '../../config/config.json');
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sessions = {};

app.use((req, res, next) => {
  const sessionId = req.headers['x-session-id'] || 'default';
  req.session = sessions[sessionId] || null;

  const originalJson = res.json.bind(res);
  res.json = function(data) {
    if (req.session) {
      sessions[sessionId] = req.session;
    }
    return originalJson(data);
  };

  next();
});

app.use('/api/auth', authRoutes);

app.get('/api/health', (req, res) => {
  const config = loadConfig();
  res.json({
    status: 'ok',
    branch: config.sucursal_instalacion,
    name: config.nombre_sucursal,
    type: config.tipo
  });
});

function startServer() {
  const config = loadConfig();
  const port = config.servidor_app.puerto;
  const host = config.servidor_app.host;

  app.listen(port, host, () => {
    console.log('========================================');
    console.log('  ABARROTES LAS ABEJITAS - SERVER');
    console.log('========================================');
    console.log(`Branch: ${config.nombre_sucursal}`);
    console.log(`Code: ${config.sucursal_instalacion}`);
    console.log(`Server: http://${host}:${port}`);
    console.log(`Database: ${config.base_datos.bd}`);
    console.log('========================================');
  });
}

if (require.main === module) {
  startServer();
}

module.exports = app;
