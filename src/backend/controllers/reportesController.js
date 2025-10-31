const sql = require('mssql');
const { connect: getConnection } = require('../../../database/connection');

const getVentasPorFecha = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        success: false,
        error: 'fechaInicio y fechaFin son requeridos'
      });
    }

    const pool = await getConnection();
    const result = await pool.request()
      .input('fechaInicio', sql.Date, fechaInicio)
      .input('fechaFin', sql.Date, fechaFin)
      .query(`
        SELECT v.NumeroVenta, v.FechaVenta, v.Total,
               u.NombreCompleto as Vendedor
        FROM Ventas v
        INNER JOIN Usuarios u ON v.UsuarioID = u.UsuarioID
        WHERE CAST(v.FechaVenta AS DATE) BETWEEN @fechaInicio AND @fechaFin
        ORDER BY v.FechaVenta DESC
      `);

    const totalVentas = result.recordset.reduce((sum, v) => sum + parseFloat(v.Total), 0);
    const cantidadVentas = result.recordset.length;

    res.json({
      success: true,
      ventas: result.recordset,
      resumen: {
        totalVentas,
        cantidadVentas,
        promedioVenta: cantidadVentas > 0 ? totalVentas / cantidadVentas : 0
      }
    });
  } catch (error) {
    console.error('Error al obtener ventas por fecha:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener reporte de ventas'
    });
  }
};

const getProductosMasVendidos = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, limite } = req.query;

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        success: false,
        error: 'fechaInicio y fechaFin son requeridos'
      });
    }

    const topLimit = limite ? parseInt(limite) : 10;

    const pool = await getConnection();
    const result = await pool.request()
      .input('fechaInicio', sql.Date, fechaInicio)
      .input('fechaFin', sql.Date, fechaFin)
      .input('limite', sql.Int, topLimit)
      .query(`
        SELECT TOP (@limite)
               p.Codigo, p.Nombre,
               SUM(dv.Cantidad) as CantidadVendida,
               SUM(dv.Subtotal) as TotalVendido
        FROM DetalleVenta dv
        INNER JOIN Productos p ON dv.ProductoID = p.ProductoID
        INNER JOIN Ventas v ON dv.VentaID = v.VentaID
        WHERE CAST(v.FechaVenta AS DATE) BETWEEN @fechaInicio AND @fechaFin
        GROUP BY p.ProductoID, p.Codigo, p.Nombre
        ORDER BY SUM(dv.Cantidad) DESC
      `);

    res.json({
      success: true,
      productos: result.recordset
    });
  } catch (error) {
    console.error('Error al obtener productos mas vendidos:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener reporte de productos mas vendidos'
    });
  }
};

const getVentasPorVendedor = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        success: false,
        error: 'fechaInicio y fechaFin son requeridos'
      });
    }

    const pool = await getConnection();
    const result = await pool.request()
      .input('fechaInicio', sql.Date, fechaInicio)
      .input('fechaFin', sql.Date, fechaFin)
      .query(`
        SELECT u.NombreCompleto as Vendedor,
               COUNT(v.VentaID) as CantidadVentas,
               SUM(v.Total) as TotalVentas
        FROM Ventas v
        INNER JOIN Usuarios u ON v.UsuarioID = u.UsuarioID
        WHERE CAST(v.FechaVenta AS DATE) BETWEEN @fechaInicio AND @fechaFin
        GROUP BY u.UsuarioID, u.NombreCompleto
        ORDER BY SUM(v.Total) DESC
      `);

    res.json({
      success: true,
      vendedores: result.recordset
    });
  } catch (error) {
    console.error('Error al obtener ventas por vendedor:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener reporte de ventas por vendedor'
    });
  }
};

const getProductosBajoStock = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .query(`
        SELECT ProductoID, Codigo, Nombre, Stock, StockMinimo
        FROM Productos
        WHERE Stock <= StockMinimo AND Activo = 1
        ORDER BY Stock ASC
      `);

    res.json({
      success: true,
      productos: result.recordset
    });
  } catch (error) {
    console.error('Error al obtener productos bajo stock:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener reporte de stock bajo'
    });
  }
};

module.exports = {
  getVentasPorFecha,
  getProductosMasVendidos,
  getVentasPorVendedor,
  getProductosBajoStock
};
