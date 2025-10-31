const express = require('express');
const router = express.Router();
const {
  getSyncLogs,
  executeSync,
  getSyncStatus
} = require('../controllers/sincronizacionController');

router.get('/logs', getSyncLogs);
router.post('/ejecutar', executeSync);
router.get('/estado', getSyncStatus);

module.exports = router;
