const express = require('express');
const router = express.Router();
const {
  getAllVentas,
  getVentaById,
  createVenta
} = require('../controllers/ventasController');

router.get('/', getAllVentas);
router.get('/:id', getVentaById);
router.post('/', createVenta);

module.exports = router;
