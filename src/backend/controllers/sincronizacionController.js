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

  if (!config.servidor_central.habilitado) {
    return res.status(400).json({
      success: false,
      error: 'Servidor central no habilitado'
    });
  }

  try {
    const pool = await getConnection();

    // Obtener ventas del día que no han sido sincronizadas
    const ventasResult = await pool.request()
      .query(`
        SELECT v.VentaID, v.FechaVenta, v.Total, v.CodigoSucursal, v.UsuarioID,
               u.NombreCompleto as NombreVendedor
        FROM Ventas v
        INNER JOIN Usuarios u ON v.UsuarioID = u.UsuarioID
        WHERE CAST(v.FechaVenta AS DATE) = CAST(GETDATE() AS DATE)
          AND (v.Sincronizada IS NULL OR v.Sincronizada = 0)
      `);

    const ventas = ventasResult.recordset;

    if (ventas.length === 0) {
      return res.json({
        success: true,
        message: 'No hay ventas pendientes de sincronizar',
        ventasSincronizadas: 0
      });
    }

    // Obtener detalles de cada venta con información completa del producto
    for (let venta of ventas) {
      const detallesResult = await pool.request()
        .input('ventaID', sql.NVarChar, venta.VentaID)
        .query(`
          SELECT d.DetalleID, d.ProductoID, d.Cantidad, d.PrecioUnitario, d.Subtotal,
                 p.Nombre as ProductoNombre, p.CodigoSucursal as ProductoCodigo,
                 p.Descripcion as ProductoDescripcion, p.Categoria as ProductoCategoria,
                 p.PrecioVenta as ProductoPrecioVenta, p.Stock as ProductoStock
          FROM DetalleVenta d
          INNER JOIN Productos p ON d.ProductoID = p.ProductoID
          WHERE d.VentaID = @ventaID
        `);

      venta.Detalles = detallesResult.recordset;
    }

    // Enviar ventas al servidor central
    const centralUrl = `http://${config.servidor_central.host}:${config.servidor_central.puerto}/api/sincronizacion/recibir`;

    const fetch = require('node-fetch');
    const response = await fetch(centralUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sucursal: config.sucursal_instalacion,
        nombreSucursal: config.nombre_sucursal,
        ventas: ventas
      })
    });

    if (!response.ok) {
      throw new Error(`Error del servidor central: ${response.status}`);
    }

    const resultado = await response.json();

    if (!resultado.success) {
      throw new Error(resultado.error || 'Error desconocido del servidor central');
    }

    // Marcar ventas como sincronizadas
    const ventasIDs = ventas.map(v => v.VentaID);
    const updateRequest = pool.request();
    const placeholders = ventasIDs.map((id, i) => {
      updateRequest.input(`id${i}`, sql.NVarChar, id);
      return `@id${i}`;
    }).join(',');

    await updateRequest.query(`
      UPDATE Ventas
      SET Sincronizada = 1, FechaSincronizacion = GETDATE()
      WHERE VentaID IN (${placeholders})
    `);

    // Registrar log exitoso
    await pool.request()
      .input('tipo', sql.NVarChar, 'ENVIO')
      .input('estado', sql.NVarChar, 'EXITOSA')
      .input('mensaje', sql.NVarChar, `Se sincronizaron ${ventas.length} ventas con ${config.nombre_sucursal}`)
      .query(`
        INSERT INTO LogSincronizacion (TipoSincronizacion, Estado, Mensaje)
        VALUES (@tipo, @estado, @mensaje)
      `);

    res.json({
      success: true,
      message: `Sincronizacion exitosa. ${ventas.length} ventas enviadas a Lima`,
      ventasSincronizadas: ventas.length
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
      error: 'Error al sincronizar datos: ' + error.message
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

const receiveSync = async (req, res) => {
  const config = loadConfig();

  if (config.tipo !== 'CENTRAL') {
    return res.status(400).json({
      success: false,
      error: 'Este endpoint solo esta disponible en el servidor central'
    });
  }

  try {
    const { sucursal, nombreSucursal, ventas } = req.body;

    if (!sucursal || !ventas || !Array.isArray(ventas)) {
      return res.status(400).json({
        success: false,
        error: 'Datos invalidos'
      });
    }

    const pool = await getConnection();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    let ventasInsertadas = 0;

    try {
      for (const venta of ventas) {
        // Verificar si la venta ya existe
        const checkRequest = new sql.Request(transaction);
        const existingVenta = await checkRequest
          .input('ventaID', sql.NVarChar, venta.VentaID)
          .query('SELECT VentaID FROM Ventas WHERE VentaID = @ventaID');

        if (existingVenta.recordset.length > 0) {
          console.log(`Venta ${venta.VentaID} ya existe, omitiendo...`);
          continue;
        }

        // Verificar y crear productos faltantes
        if (venta.Detalles && venta.Detalles.length > 0) {
          for (const detalle of venta.Detalles) {
            const checkProducto = new sql.Request(transaction);
            const existingProducto = await checkProducto
              .input('productoID', sql.NVarChar, detalle.ProductoID)
              .query('SELECT ProductoID FROM Productos WHERE ProductoID = @productoID');

            if (existingProducto.recordset.length === 0) {
              // Producto no existe, crearlo
              console.log(`Creando producto faltante: ${detalle.ProductoID} - ${detalle.ProductoNombre}`);
              const createProducto = new sql.Request(transaction);
              await createProducto
                .input('productoID', sql.NVarChar, detalle.ProductoID)
                .input('codigoSucursal', sql.NVarChar, detalle.ProductoCodigo)
                .input('nombre', sql.NVarChar, detalle.ProductoNombre || 'Producto sincronizado')
                .input('descripcion', sql.NVarChar, detalle.ProductoDescripcion || '')
                .input('categoria', sql.NVarChar, detalle.ProductoCategoria || 'General')
                .input('precioVenta', sql.Decimal(10, 2), detalle.ProductoPrecioVenta || detalle.PrecioUnitario)
                .input('stock', sql.Int, 0)  // Stock 0 en central, ya que se vendió en sucursal
                .query(`
                  INSERT INTO Productos (ProductoID, CodigoSucursal, Nombre, Descripcion, Categoria, PrecioVenta, Stock)
                  VALUES (@productoID, @codigoSucursal, @nombre, @descripcion, @categoria, @precioVenta, @stock)
                `);
            }
          }
        }

        // Insertar venta
        const ventaRequest = new sql.Request(transaction);
        await ventaRequest
          .input('ventaID', sql.NVarChar, venta.VentaID)
          .input('codigoSucursal', sql.NVarChar, venta.CodigoSucursal)
          .input('usuarioID', sql.Int, venta.UsuarioID)
          .input('total', sql.Decimal(10, 2), venta.Total)
          .input('fechaVenta', sql.DateTime, venta.FechaVenta)
          .query(`
            INSERT INTO Ventas (VentaID, CodigoSucursal, UsuarioID, Total, FechaVenta, Sincronizada, FechaSincronizacion)
            VALUES (@ventaID, @codigoSucursal, @usuarioID, @total, @fechaVenta, 1, GETDATE())
          `);

        // Insertar detalles
        if (venta.Detalles && venta.Detalles.length > 0) {
          for (const detalle of venta.Detalles) {
            const detalleRequest = new sql.Request(transaction);
            await detalleRequest
              .input('detalleID', sql.NVarChar, detalle.DetalleID)
              .input('ventaID', sql.NVarChar, venta.VentaID)
              .input('productoID', sql.NVarChar, detalle.ProductoID)
              .input('cantidad', sql.Int, detalle.Cantidad)
              .input('precioUnitario', sql.Decimal(10, 2), detalle.PrecioUnitario)
              .input('subtotal', sql.Decimal(10, 2), detalle.Subtotal)
              .query(`
                INSERT INTO DetalleVenta (DetalleID, VentaID, ProductoID, Cantidad, PrecioUnitario, Subtotal)
                VALUES (@detalleID, @ventaID, @productoID, @cantidad, @precioUnitario, @subtotal)
              `);
          }
        }

        ventasInsertadas++;
      }

      // Registrar log
      const logRequest = new sql.Request(transaction);
      await logRequest
        .input('tipo', sql.NVarChar, 'RECEPCION')
        .input('estado', sql.NVarChar, 'EXITOSA')
        .input('mensaje', sql.NVarChar, `Recibidas ${ventasInsertadas} ventas de ${nombreSucursal}`)
        .query(`
          INSERT INTO LogSincronizacion (TipoSincronizacion, Estado, Mensaje)
          VALUES (@tipo, @estado, @mensaje)
        `);

      await transaction.commit();

      res.json({
        success: true,
        message: `Se recibieron ${ventasInsertadas} ventas de ${nombreSucursal}`,
        ventasRecibidas: ventasInsertadas
      });

    } catch (error) {
      if (transaction.rolledBack === false) {
        await transaction.rollback();
      }
      throw error;
    }

  } catch (error) {
    console.error('Error al recibir sincronizacion:', error);

    try {
      const pool = await getConnection();
      await pool.request()
        .input('tipo', sql.NVarChar, 'RECEPCION')
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
      error: 'Error al recibir datos de sincronizacion: ' + error.message
    });
  }
};

module.exports = {
  getSyncLogs,
  executeSync,
  getSyncStatus,
  receiveSync
};
