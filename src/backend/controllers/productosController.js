const sql = require('mssql');
const { connect: getConnection } = require('../../../database/connection');

const { generateProductId, getBranchCode } = require('../utils/idGenerator');

const getAllProductos = async (req, res) => {
  try {
    const { search } = req.query;
    const pool = await getConnection();
    const request = pool.request();

    let query = 'SELECT TOP 50 ProductoID, CodigoSucursal AS Codigo, Nombre, Descripcion, Imagen, PrecioCompra, PrecioVenta, Stock, StockMinimo, Categoria FROM Productos';

    if (search) {
      query += ' WHERE (Nombre LIKE @search OR CodigoSucursal LIKE @search)';
      request.input('search', sql.NVarChar, `%${search}%`);
    }

    query += ' ORDER BY Nombre';

    const result = await request.query(query);

    res.json({
      success: true,
      productos: result.recordset
    });
  } catch (error) {
    console.error('Error al obtener productos:', error.message);
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
      .input('id', sql.NVarChar, id)
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
    const { Nombre, Descripcion, Imagen, PrecioCompra, PrecioVenta, Stock, StockMinimo, Categoria } = req.body;

    if (!Nombre || !PrecioVenta) {
      return res.status(400).json({
        success: false,
        error: 'Nombre y PrecioVenta son requeridos'
      });
    }

    const pool = await getConnection();
    const codigo = await generateProductId();
    const branchCode = getBranchCode();

    await pool.request()
      .input('codigo', sql.NVarChar, codigo)
      .input('branchCode', sql.NVarChar, branchCode)
      .input('nombre', sql.NVarChar, Nombre)
      .input('descripcion', sql.NVarChar, Descripcion || '')
      .input('imagen', sql.NVarChar, Imagen || null)
      .input('precioCompra', sql.Decimal(10, 2), PrecioCompra || 0)
      .input('precioVenta', sql.Decimal(10, 2), PrecioVenta)
      .input('stock', sql.Int, Stock || 0)
      .input('stockMinimo', sql.Int, StockMinimo || 5)
      .input('categoria', sql.NVarChar, Categoria || null)
      .query(`
        INSERT INTO Productos (ProductoID, CodigoSucursal, Nombre, Descripcion, Imagen, PrecioCompra, PrecioVenta, Stock, StockMinimo, Categoria)
        VALUES (@codigo, @branchCode, @nombre, @descripcion, @imagen, @precioCompra, @precioVenta, @stock, @stockMinimo, @categoria);
      `);

    const newProduct = await pool.request()
      .input('id', sql.NVarChar, codigo)
      .query('SELECT ProductoID, CodigoSucursal AS Codigo, Nombre, Descripcion, Imagen, PrecioCompra, PrecioVenta, Stock, StockMinimo, Categoria FROM Productos WHERE ProductoID = @id');

    res.status(201).json({
      success: true,
      producto: newProduct.recordset[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al crear producto'
    });
  }
};

const updateProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { Nombre, Descripcion, PrecioCompra, PrecioVenta, Stock, StockMinimo } = req.body;

    const pool = await getConnection();

    await pool.request()
      .input('id', sql.NVarChar, id)
      .input('nombre', sql.NVarChar, Nombre)
      .input('descripcion', sql.NVarChar, Descripcion)
      .input('precioCompra', sql.Decimal(10, 2), PrecioCompra || 0)
      .input('precioVenta', sql.Decimal(10, 2), PrecioVenta)
      .input('stock', sql.Int, Stock)
      .input('stockMinimo', sql.Int, StockMinimo)
      .query(`
        UPDATE Productos
        SET Nombre = @nombre,
            Descripcion = @descripcion,
            PrecioCompra = @precioCompra,
            PrecioVenta = @precioVenta,
            Stock = @stock,
            StockMinimo = @stockMinimo,
            FechaModificacion = GETDATE()
        WHERE ProductoID = @id
      `);

    res.json({ success: true });
  } catch (error) {
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

    await pool.request()
      .input('id', sql.NVarChar, id)
      .query('DELETE FROM Productos WHERE ProductoID = @id');

    res.json({
      success: true,
      message: 'Producto eliminado correctamente'
    });
  } catch (error) {
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

