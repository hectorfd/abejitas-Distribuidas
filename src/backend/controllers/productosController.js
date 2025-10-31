const sql = require('mssql');
const { getConnection } = require('../utils/database');

const getAllProductos = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .query('SELECT * FROM Productos WHERE Activo = 1 ORDER BY Nombre');

    res.json({
      success: true,
      productos: result.recordset
    });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener productos'
    });
  }
};

const getProductoById = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM Productos WHERE ProductoID = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }

    res.json({
      success: true,
      producto: result.recordset[0]
    });
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener producto'
    });
  }
};

const createProducto = async (req, res) => {
  try {
    const { Codigo, Nombre, Descripcion, PrecioCompra, PrecioVenta, Stock, StockMinimo } = req.body;

    if (!Codigo || !Nombre || !PrecioVenta) {
      return res.status(400).json({
        success: false,
        error: 'Codigo, Nombre y PrecioVenta son requeridos'
      });
    }

    const pool = await getConnection();

    const existingProduct = await pool.request()
      .input('codigo', sql.NVarChar, Codigo)
      .query('SELECT ProductoID FROM Productos WHERE Codigo = @codigo');

    if (existingProduct.recordset.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Ya existe un producto con ese codigo'
      });
    }

    const result = await pool.request()
      .input('codigo', sql.NVarChar, Codigo)
      .input('nombre', sql.NVarChar, Nombre)
      .input('descripcion', sql.NVarChar, Descripcion || '')
      .input('precioCompra', sql.Decimal(10, 2), PrecioCompra || 0)
      .input('precioVenta', sql.Decimal(10, 2), PrecioVenta)
      .input('stock', sql.Int, Stock || 0)
      .input('stockMinimo', sql.Int, StockMinimo || 0)
      .query(`
        INSERT INTO Productos (Codigo, Nombre, Descripcion, PrecioCompra, PrecioVenta, Stock, StockMinimo, Activo)
        VALUES (@codigo, @nombre, @descripcion, @precioCompra, @precioVenta, @stock, @stockMinimo, 1);
        SELECT SCOPE_IDENTITY() AS ProductoID;
      `);

    const newProductId = result.recordset[0].ProductoID;

    const newProduct = await pool.request()
      .input('id', sql.Int, newProductId)
      .query('SELECT * FROM Productos WHERE ProductoID = @id');

    res.status(201).json({
      success: true,
      producto: newProduct.recordset[0]
    });
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear producto'
    });
  }
};

const updateProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { Codigo, Nombre, Descripcion, PrecioCompra, PrecioVenta, Stock, StockMinimo } = req.body;

    const pool = await getConnection();

    const existing = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT ProductoID FROM Productos WHERE ProductoID = @id');

    if (existing.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }

    if (Codigo) {
      const duplicateCheck = await pool.request()
        .input('codigo', sql.NVarChar, Codigo)
        .input('id', sql.Int, id)
        .query('SELECT ProductoID FROM Productos WHERE Codigo = @codigo AND ProductoID != @id');

      if (duplicateCheck.recordset.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Ya existe otro producto con ese codigo'
        });
      }
    }

    await pool.request()
      .input('id', sql.Int, id)
      .input('codigo', sql.NVarChar, Codigo)
      .input('nombre', sql.NVarChar, Nombre)
      .input('descripcion', sql.NVarChar, Descripcion)
      .input('precioCompra', sql.Decimal(10, 2), PrecioCompra)
      .input('precioVenta', sql.Decimal(10, 2), PrecioVenta)
      .input('stock', sql.Int, Stock)
      .input('stockMinimo', sql.Int, StockMinimo)
      .query(`
        UPDATE Productos
        SET Codigo = @codigo,
            Nombre = @nombre,
            Descripcion = @descripcion,
            PrecioCompra = @precioCompra,
            PrecioVenta = @precioVenta,
            Stock = @stock,
            StockMinimo = @stockMinimo
        WHERE ProductoID = @id
      `);

    const updated = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM Productos WHERE ProductoID = @id');

    res.json({
      success: true,
      producto: updated.recordset[0]
    });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar producto'
    });
  }
};

const deleteProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    const existing = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT ProductoID FROM Productos WHERE ProductoID = @id');

    if (existing.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }

    await pool.request()
      .input('id', sql.Int, id)
      .query('UPDATE Productos SET Activo = 0 WHERE ProductoID = @id');

    res.json({
      success: true,
      message: 'Producto eliminado correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar producto'
    });
  }
};

module.exports = {
  getAllProductos,
  getProductoById,
  createProducto,
  updateProducto,
  deleteProducto
};
