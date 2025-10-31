const sql = require('mssql');
const { getConnection } = require('../utils/database');

const getStats = async (req, res) => {
  try {
    const pool = await getConnection();

    const productosResult = await pool.request()
      .query('SELECT COUNT(*) as total FROM Productos WHERE Activo = 1');

    const ventasResult = await pool.request()
      .query('SELECT COUNT(*) as total FROM Ventas');

    const ventasHoyResult = await pool.request()
      .query(`
        SELECT COUNT(*) as total
        FROM Ventas
        WHERE CAST(FechaVenta AS DATE) = CAST(GETDATE() AS DATE)
      `);

    const lastSyncResult = await pool.request()
      .query(`
        SELECT TOP 1 FechaHora, Estado
        FROM LogSincronizacion
        ORDER BY FechaHora DESC
      `);

    let sincronizacion = 'Nunca';
    if (lastSyncResult.recordset.length > 0) {
      const lastSync = lastSyncResult.recordset[0];
      const fecha = new Date(lastSync.FechaHora);
      sincronizacion = lastSync.Estado === 'EXITOSA' ?
        `${fecha.toLocaleDateString()}` : 'Error';
    }

    res.json({
      productos: productosResult.recordset[0].total,
      ventas: ventasResult.recordset[0].total,
      ventasHoy: ventasHoyResult.recordset[0].total,
      sincronizacion
    });

  } catch (error) {
    console.error('Error al obtener estadisticas:', error);
    res.status(500).json({
      error: 'Error al obtener estadisticas',
      productos: 0,
      ventas: 0,
      ventasHoy: 0,
      sincronizacion: 'Error'
    });
  }
};

module.exports = {
  getStats
};
