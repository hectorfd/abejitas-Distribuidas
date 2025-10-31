// Database connection module for SQL Server

const sql = require('mssql');
const fs = require('fs');
const path = require('path');

let pool = null;

function loadConfig() {
  const configPath = path.join(__dirname, '../config/config.json');

  if (!fs.existsSync(configPath)) {
    throw new Error('config.json not found. Run: npm run setup');
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  return {
    server: config.base_datos.servidor,
    database: config.base_datos.bd,
    user: config.base_datos.usuario,
    password: config.base_datos.password,
    port: config.base_datos.puerto,
    options: config.base_datos.opciones || {
      encrypt: false,
      trustServerCertificate: true
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000
    }
  };
}

async function connect() {
  try {
    if (pool) {
      return pool;
    }

    const config = loadConfig();
    pool = await sql.connect(config);

    console.log('Connected to SQL Server');
    console.log('Database:', config.database);

    return pool;
  } catch (err) {
    console.error('Database connection error:', err.message);
    throw err;
  }
}

async function query(queryString, params = {}) {
  try {
    const connection = await connect();
    const request = connection.request();

    for (const [key, value] of Object.entries(params)) {
      request.input(key, value);
    }

    const result = await request.query(queryString);
    return result.recordset;
  } catch (err) {
    console.error('Query error:', err.message);
    throw err;
  }
}

async function close() {
  if (pool) {
    await pool.close();
    pool = null;
    console.log('Database connection closed');
  }
}

function getConfig() {
  return loadConfig();
}

module.exports = {
  connect,
  query,
  close,
  getConfig,
  sql
};

// Test connection if run directly
if (require.main === module) {
  (async () => {
    try {
      await connect();
      console.log('Connection test successful');
      await close();
    } catch (err) {
      console.error('Connection test failed:', err.message);
      process.exit(1);
    }
  })();
}
