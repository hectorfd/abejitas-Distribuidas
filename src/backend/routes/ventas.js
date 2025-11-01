const express = require('express');
const router = express.Router();
const {
  getAllVentas,
  getVentaById,
  createVenta,
  deleteVenta
} = require('../controllers/ventasController');

router.get('/', getAllVentas);
router.get('/:id', getVentaById);
router.post('/', createVenta);
router.delete('/:id', deleteVenta);

module.exports = router;
