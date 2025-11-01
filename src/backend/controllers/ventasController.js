const sql = require('mssql');
const { connect: getConnection } = require('../../../database/connection');
const { generateSaleId, generateDetailId, getBranchCode } = require('../utils/idGenerator');

const getAllVentas = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .query(`
        SELECT v.VentaID, v.FechaVenta, v.Total, v.CodigoSucursal,
               u.NombreCompleto as Vendedor
        FROM Ventas v
        INNER JOIN Usuarios u ON v.UsuarioID = u.UsuarioID
        ORDER BY v.FechaVenta DESC
      `);

    res.json({
      success: true,
      ventas: result.recordset.map(v => ({
        VentaID: v.VentaID,
        NumeroVenta: v.VentaID,
        FechaVenta: v.FechaVenta,
        Total: v.Total,
        Vendedor: v.Vendedor
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al obtener ventas'
    });
  }
};

const getVentaById = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    const ventaResult = await pool.request()
      .input('id', sql.NVarChar, id)
      .query(`
        SELECT v.VentaID, v.FechaVenta, v.Total, v.CodigoSucursal,
               u.NombreCompleto as Vendedor, u.UsuarioID
        FROM Ventas v
        INNER JOIN Usuarios u ON v.UsuarioID = u.UsuarioID
        WHERE v.VentaID = @id
      `);

    if (ventaResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Venta no encontrada'
      });
    }

    const detalleResult = await pool.request()
      .input('id', sql.NVarChar, id)
      .query(`
        SELECT d.DetalleID, d.ProductoID, d.Cantidad, d.PrecioUnitario, d.Subtotal,
               p.Nombre as ProductoNombre, p.CodigoSucursal as ProductoCodigo
        FROM DetalleVenta d
        INNER JOIN Productos p ON d.ProductoID = p.ProductoID
        WHERE d.VentaID = @id
      `);

    const venta = ventaResult.recordset[0];
    venta.NumeroVenta = venta.VentaID;
    venta.Detalles = detalleResult.recordset;

    res.json({
      success: true,
      venta
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al obtener venta'
    });
  }
};

const createVenta = async (req, res) => {
  try {
    const { UsuarioID, Detalles } = req.body;

    if (!UsuarioID || !Detalles || Detalles.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'UsuarioID y Detalles son requeridos'
      });
    }

    const pool = await getConnection();
    const ventaID = await generateSaleId();
    const branchCode = getBranchCode();

    let total = 0;
    for (const detalle of Detalles) {
      const productoResult = await pool.request()
        .input('id', sql.NVarChar, detalle.ProductoID)
        .query('SELECT Stock, PrecioVenta FROM Productos WHERE ProductoID = @id');

      if (productoResult.recordset.length === 0) {
        return res.status(400).json({
          success: false,
          error: `Producto ${detalle.ProductoID} no encontrado`
        });
      }

      const producto = productoResult.recordset[0];

      if (producto.Stock < detalle.Cantidad) {
        return res.status(400).json({
          success: false,
          error: `Stock insuficiente para producto ${detalle.ProductoID}`
        });
      }

      const precioUnitario = detalle.PrecioUnitario || producto.PrecioVenta;
      const subtotal = precioUnitario * detalle.Cantidad;
      total += subtotal;
    }

    await pool.request()
      .input('ventaID', sql.NVarChar, ventaID)
      .input('branchCode', sql.NVarChar, branchCode)
      .input('usuarioID', sql.Int, UsuarioID)
      .input('total', sql.Decimal(10, 2), total)
      .query(`
        INSERT INTO Ventas (VentaID, CodigoSucursal, UsuarioID, Total)
        VALUES (@ventaID, @branchCode, @usuarioID, @total)
      `);

    for (const detalle of Detalles) {
      const productoResult = await pool.request()
        .input('id', sql.NVarChar, detalle.ProductoID)
        .query('SELECT PrecioVenta FROM Productos WHERE ProductoID = @id');

      const precioUnitario = detalle.PrecioUnitario || productoResult.recordset[0].PrecioVenta;
      const subtotal = precioUnitario * detalle.Cantidad;
      const detalleID = await generateDetailId(ventaID);

      await pool.request()
        .input('detalleID', sql.NVarChar, detalleID)
        .input('ventaID', sql.NVarChar, ventaID)
        .input('productoID', sql.NVarChar, detalle.ProductoID)
        .input('cantidad', sql.Int, detalle.Cantidad)
        .input('precioUnitario', sql.Decimal(10, 2), precioUnitario)
        .input('subtotal', sql.Decimal(10, 2), subtotal)
        .query(`
          INSERT INTO DetalleVenta (DetalleID, VentaID, ProductoID, Cantidad, PrecioUnitario, Subtotal)
          VALUES (@detalleID, @ventaID, @productoID, @cantidad, @precioUnitario, @subtotal)
        `);

      await pool.request()
        .input('id', sql.NVarChar, detalle.ProductoID)
        .input('cantidad', sql.Int, detalle.Cantidad)
        .query('UPDATE Productos SET Stock = Stock - @cantidad WHERE ProductoID = @id');
    }

    const newVenta = await pool.request()
      .input('id', sql.NVarChar, ventaID)
      .query(`
        SELECT v.VentaID, v.FechaVenta, v.Total,
               u.NombreCompleto as Vendedor
        FROM Ventas v
        INNER JOIN Usuarios u ON v.UsuarioID = u.UsuarioID
        WHERE v.VentaID = @id
      `);

    res.status(201).json({
      success: true,
      venta: newVenta.recordset[0]
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al crear venta'
    });
  }
};

const deleteVenta = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    // Verificar si la venta existe y obtener los detalles
    const ventaResult = await pool.request()
      .input('id', sql.NVarChar, id)
      .query('SELECT VentaID FROM Ventas WHERE VentaID = @id');

    if (ventaResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Venta no encontrada'
      });
    }

    // Obtener los detalles de la venta para restaurar el stock
    const detallesResult = await pool.request()
      .input('id', sql.NVarChar, id)
      .query('SELECT ProductoID, Cantidad FROM DetalleVenta WHERE VentaID = @id');

    // Restaurar el stock de cada producto
    for (const detalle of detallesResult.recordset) {
      await pool.request()
        .input('productoID', sql.NVarChar, detalle.ProductoID)
        .input('cantidad', sql.Int, detalle.Cantidad)
        .query('UPDATE Productos SET Stock = Stock + @cantidad WHERE ProductoID = @productoID');
    }

    // Eliminar los detalles de la venta
    await pool.request()
      .input('id', sql.NVarChar, id)
      .query('DELETE FROM DetalleVenta WHERE VentaID = @id');

    // Eliminar la venta
    await pool.request()
      .input('id', sql.NVarChar, id)
      .query('DELETE FROM Ventas WHERE VentaID = @id');

    res.json({
      success: true,
      message: 'Venta eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar venta:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar venta'
    });
  }
};

module.exports = {
  getAllVentas,
  getVentaById,
  createVenta,
  deleteVenta
};
