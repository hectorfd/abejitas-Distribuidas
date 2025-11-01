// ID generator with branch prefixes for distributed system

const sql = require('mssql');
const { connect: getConnection } = require('../../../database/connection');
const fs = require('fs');
const path = require('path');

function getBranchCode() {
  const configPath = path.join(__dirname, '../../../config/config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  return config.sucursal_instalacion;
}

function formatDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

function padNumber(num, length = 3) {
  return String(num).padStart(length, '0');
}

async function generateSaleId() {
  const branchCode = getBranchCode();
  const dateStr = formatDate();
  const pool = await getConnection();

  const pattern = `${branchCode}-${dateStr}-%`;
  const result = await pool.request()
    .input('pattern', sql.NVarChar, pattern)
    .query('SELECT COUNT(*) as total FROM Ventas WHERE VentaID LIKE @pattern');

  const consecutive = result.recordset[0].total + 1;
  return `${branchCode}-${dateStr}-${padNumber(consecutive)}`;
}

async function generateProductId() {
  const branchCode = getBranchCode();
  const pool = await getConnection();

  const result = await pool.request()
    .input('branchCode', sql.NVarChar, branchCode)
    .query('SELECT COUNT(*) as total FROM Productos WHERE CodigoSucursal = @branchCode');

  const consecutive = result.recordset[0].total + 1;
  return `${branchCode}-PROD-${padNumber(consecutive)}`;
}

async function generateDetailId(saleId) {
  const pool = await getConnection();

  const result = await pool.request()
    .input('saleId', sql.NVarChar, saleId)
    .query('SELECT COUNT(*) as total FROM DetalleVenta WHERE VentaID = @saleId');

  const consecutive = result.recordset[0].total + 1;
  return `${saleId}-${consecutive}`;
}

module.exports = {
  generateSaleId,
  generateProductId,
  generateDetailId,
  getBranchCode
};
