const express = require('express');
const router = express.Router();
const {
  getSyncLogs,
  executeSync,
  getSyncStatus,
  receiveSync
} = require('../controllers/sincronizacionController');

router.get('/logs', getSyncLogs);
router.post('/ejecutar', executeSync);
router.get('/estado', getSyncStatus);
router.post('/recibir', receiveSync);

module.exports = router;
