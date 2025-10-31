// ID generator with branch prefixes for distributed system

const db = require('../../../database/connection');
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

  const query = `
    SELECT COUNT(*) as total
    FROM Ventas
    WHERE VentaID LIKE @pattern
  `;

  const pattern = `${branchCode}-${dateStr}-%`;
  const result = await db.query(query, { pattern });

  const consecutive = result[0].total + 1;
  return `${branchCode}-${dateStr}-${padNumber(consecutive)}`;
}

async function generateProductId() {
  const branchCode = getBranchCode();

  const query = `
    SELECT COUNT(*) as total
    FROM Productos
    WHERE CodigoSucursal = @branchCode
  `;

  const result = await db.query(query, { branchCode });
  const consecutive = result[0].total + 1;

  return `${branchCode}-PROD-${padNumber(consecutive)}`;
}

async function generateDetailId(saleId) {
  const query = `
    SELECT COUNT(*) as total
    FROM DetalleVenta
    WHERE VentaID = @saleId
  `;

  const result = await db.query(query, { saleId });
  const consecutive = result[0].total + 1;

  return `${saleId}-${consecutive}`;
}

module.exports = {
  generateSaleId,
  generateProductId,
  generateDetailId,
  getBranchCode
};
