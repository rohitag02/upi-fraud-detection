const router = require('express').Router();

router.get('/', (_, res) => res.json({
  status:  'healthy',
  service: 'UPI Fraud Detection API',
  version: '2.1.0',
  uptime:  process.uptime().toFixed(1) + 's',
  ts:      new Date().toISOString(),
}));

module.exports = router;