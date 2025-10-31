const express = require('express');
const router = express.Router();
const {
  getVentasPorFecha,
  getProductosMasVendidos,
  getVentasPorVendedor,
  getProductosBajoStock
} = require('../controllers/reportesController');

router.get('/ventas-por-fecha', getVentasPorFecha);
router.get('/productos-mas-vendidos', getProductosMasVendidos);
router.get('/ventas-por-vendedor', getVentasPorVendedor);
router.get('/productos-bajo-stock', getProductosBajoStock);

module.exports = router;
