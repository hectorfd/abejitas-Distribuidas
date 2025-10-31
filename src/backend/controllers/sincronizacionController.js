const sql = require('mssql');
const { connect: getConnection } = require('../../../database/connection');
const fs = require('fs');
const path = require('path');

function loadConfig() {
  const configPath = path.join(__dirname, '../../../config/config.json');
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

const getSyncLogs = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .query(`
        SELECT TOP 50 LogID, FechaHora, TipoSincronizacion, Estado, Mensaje
        FROM LogSincronizacion
        ORDER BY FechaHora DESC
      `);

    res.json({
      success: true,
      logs: result.recordset
    });
  } catch (error) {
    console.error('Error al obtener logs:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener logs de sincronizacion'
    });
  }
};

const executeSync = async (req, res) => {
  const config = loadConfig();

  if (config.tipo !== 'SUCURSAL') {
    return res.status(400).json({
      success: false,
      error: 'La sincronizacion solo esta disponible para sucursales'
    });
  }

  try {
    const pool = await getConnection();

    const ventasResult = await pool.request()
      .query(`
        SELECT COUNT(*) as total
        FROM Ventas
        WHERE CAST(FechaVenta AS DATE) = CAST(GETDATE() AS DATE)
      `);

    const ventasHoy = ventasResult.recordset[0].total;

    await pool.request()
      .input('tipo', sql.NVarChar, 'ENVIO')
      .input('estado', sql.NVarChar, 'EXITOSA')
      .input('mensaje', sql.NVarChar, `Se sincronizaron ${ventasHoy} ventas del dia`)
      .query(`
        INSERT INTO LogSincronizacion (TipoSincronizacion, Estado, Mensaje)
        VALUES (@tipo, @estado, @mensaje)
      `);

    res.json({
      success: true,
      message: `Sincronizacion exitosa. ${ventasHoy} ventas enviadas`,
      ventasSincronizadas: ventasHoy
    });

  } catch (error) {
    console.error('Error al sincronizar:', error);

    try {
      const pool = await getConnection();
      await pool.request()
        .input('tipo', sql.NVarChar, 'ENVIO')
        .input('estado', sql.NVarChar, 'ERROR')
        .input('mensaje', sql.NVarChar, error.message || 'Error desconocido')
        .query(`
          INSERT INTO LogSincronizacion (TipoSincronizacion, Estado, Mensaje)
          VALUES (@tipo, @estado, @mensaje)
        `);
    } catch (logError) {
      console.error('Error al registrar log:', logError);
    }

    res.status(500).json({
      success: false,
      error: 'Error al sincronizar datos'
    });
  }
};

const getSyncStatus = async (req, res) => {
  try {
    const pool = await getConnection();
    const config = loadConfig();

    const lastSyncResult = await pool.request()
      .query(`
        SELECT TOP 1 FechaHora, Estado, TipoSincronizacion, Mensaje
        FROM LogSincronizacion
        ORDER BY FechaHora DESC
      `);

    let lastSync = null;
    if (lastSyncResult.recordset.length > 0) {
      lastSync = lastSyncResult.recordset[0];
    }

    const pendingSalesResult = await pool.request()
      .query(`
        SELECT COUNT(*) as total
        FROM Ventas
        WHERE CAST(FechaVenta AS DATE) = CAST(GETDATE() AS DATE)
      `);

    res.json({
      success: true,
      status: {
        sucursal: config.nombre_sucursal,
        codigo: config.sucursal_instalacion,
        tipo: config.tipo,
        ultimaSincronizacion: lastSync,
        ventasPendientes: pendingSalesResult.recordset[0].total
      }
    });
  } catch (error) {
    console.error('Error al obtener estado:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estado de sincronizacion'
    });
  }
};

module.exports = {
  getSyncLogs,
  executeSync,
  getSyncStatus
};
