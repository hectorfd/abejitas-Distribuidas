const sql = require('mssql');
const { connect: getConnection } = require('../../../database/connection');
const { generateSaleId, generateDetailId, getNextDetailNumber, getBranchCode } = require('../utils/idGenerator');

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
  const { UsuarioID, Detalles } = req.body;
  if (!UsuarioID || !Detalles || !Detalles.length) {
    return res.status(400).json({ success: false, error: 'Datos incompletos' });
  }

  const pool = await getConnection();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    const productoIDs = Detalles.map(d => d.ProductoID);
    const productCheckRequest = new sql.Request(transaction);

    const productCheckQuery = `SELECT ProductoID, Stock, PrecioVenta FROM Productos WHERE ProductoID IN (${productoIDs.map((id, i) => `@id${i}`).join(',')})`;
    productoIDs.forEach((id, i) => productCheckRequest.input(`id${i}`, sql.NVarChar, id));
    const productsResult = await productCheckRequest.query(productCheckQuery);
    const productsData = new Map(productsResult.recordset.map(p => [p.ProductoID, p]));

    let total = 0;
    for (const detalle of Detalles) {
      const product = productsData.get(detalle.ProductoID);
      if (!product) {
        throw new Error(`Producto ${detalle.ProductoID} no encontrado`);
      }
      if (product.Stock < detalle.Cantidad) {
        throw new Error(`Stock insuficiente para ${detalle.ProductoID}`);
      }
      const precioUnitario = detalle.PrecioUnitario || product.PrecioVenta;
      total += precioUnitario * detalle.Cantidad;
    }

    const ventaID = await generateSaleId();
    const branchCode = getBranchCode();
    const ventaRequest = new sql.Request(transaction);
    await ventaRequest
      .input('ventaID', sql.NVarChar, ventaID)
      .input('branchCode', sql.NVarChar, branchCode)
      .input('usuarioID', sql.Int, UsuarioID)
      .input('total', sql.Decimal(10, 2), total)
      .query('INSERT INTO Ventas (VentaID, CodigoSucursal, UsuarioID, Total) VALUES (@ventaID, @branchCode, @usuarioID, @total)');

    const nextDetailNum = await getNextDetailNumber(ventaID, transaction);
    const detalleInsertRequest = new sql.Request(transaction);
    const detalleValues = [];
    for (let i = 0; i < Detalles.length; i++) {
      const detalle = Detalles[i];
      const product = productsData.get(detalle.ProductoID);
      const precioUnitario = detalle.PrecioUnitario || product.PrecioVenta;
      const subtotal = precioUnitario * detalle.Cantidad;
      const detalleID = `${ventaID}-${nextDetailNum + i}`;

      detalleInsertRequest.input(`detID${i}`, sql.NVarChar, detalleID);
      detalleInsertRequest.input(`vID${i}`, sql.NVarChar, ventaID);
      detalleInsertRequest.input(`pID${i}`, sql.NVarChar, detalle.ProductoID);
      detalleInsertRequest.input(`cant${i}`, sql.Int, detalle.Cantidad);
      detalleInsertRequest.input(`pu${i}`, sql.Decimal(10, 2), precioUnitario);
      detalleInsertRequest.input(`sub${i}`, sql.Decimal(10, 2), subtotal);
      detalleValues.push(`(@detID${i}, @vID${i}, @pID${i}, @cant${i}, @pu${i}, @sub${i})`);
    }
    await detalleInsertRequest.query(`INSERT INTO DetalleVenta (DetalleID, VentaID, ProductoID, Cantidad, PrecioUnitario, Subtotal) VALUES ${detalleValues.join(',')}`);

    const stockUpdateRequest = new sql.Request(transaction);
    let stockUpdateQuery = 'UPDATE Productos SET Stock = CASE ProductoID ';
    for (let i = 0; i < Detalles.length; i++) {
      const detalle = Detalles[i];
      stockUpdateRequest.input(`pID_u${i}`, sql.NVarChar, detalle.ProductoID);
      stockUpdateRequest.input(`cant_u${i}`, sql.Int, detalle.Cantidad);
      stockUpdateQuery += `WHEN @pID_u${i} THEN Stock - @cant_u${i} `;
    }
    stockUpdateQuery += `END WHERE ProductoID IN (${productoIDs.map((id, i) => `@pID_in${i}`).join(',')})`;
    productoIDs.forEach((id, i) => stockUpdateRequest.input(`pID_in${i}`, sql.NVarChar, id));
    await stockUpdateRequest.query(stockUpdateQuery);

    await transaction.commit();

    const finalRequest = pool.request();
    const newVenta = await finalRequest
      .input('id', sql.NVarChar, ventaID)
      .query(`SELECT v.VentaID, v.FechaVenta, v.Total, u.NombreCompleto as Vendedor FROM Ventas v INNER JOIN Usuarios u ON v.UsuarioID = u.UsuarioID WHERE v.VentaID = @id`);

    res.status(201).json({ success: true, venta: newVenta.recordset[0] });

  } catch (error) {
    if (transaction.rolledBack === false) {
        await transaction.rollback();
    }
    res.status(500).json({ success: false, error: 'Error al crear venta: ' + error.message });
  }
};

const deleteVenta = async (req, res) => {
  const { id } = req.params;
  const pool = await getConnection();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();
    const request = new sql.Request(transaction);
    request.input('id', sql.NVarChar, id);

    const ventaResult = await request.query('SELECT VentaID FROM Ventas WHERE VentaID = @id');
    if (ventaResult.recordset.length === 0) {
      throw new Error('Venta no encontrada');
    }

    const stockUpdateQuery = `
      UPDATE p
      SET p.Stock = p.Stock + dv.Cantidad
      FROM Productos p
      INNER JOIN DetalleVenta dv ON p.ProductoID = dv.ProductoID
      WHERE dv.VentaID = @id
    `;
    await request.query(stockUpdateQuery);

    await request.query('DELETE FROM DetalleVenta WHERE VentaID = @id');
    await request.query('DELETE FROM Ventas WHERE VentaID = @id');

    await transaction.commit();

    res.json({ success: true, message: 'Venta eliminada exitosamente' });

  } catch (error) {
    if (transaction.rolledBack === false) {
        await transaction.rollback();
    }
    res.status(500).json({ success: false, error: 'Error al eliminar venta: ' + error.message });
  }
};

module.exports = {
  getAllVentas,
  getVentaById,
  createVenta,
  deleteVenta
};
