const express = require('express');
const router  = express.Router();

router.get('/performance', (req, res) => {
  res.json({
    accuracy: 97.8, precision: 88.1, recall: 91.7,
    f1Score: 89.8, aucRoc: 0.963, trainedOn: 10000
  });
});

router.get('/fraud-categories', (req, res) => {
  res.json([
    { category: 'Phishing',         count: 342, percentage: 34.2 },
    { category: 'Fake Merchants',   count: 228, percentage: 22.8 },
    { category: 'SIM Swap',         count: 187, percentage: 18.7 },
    { category: 'Account Takeover', count: 153, percentage: 15.3 },
    { category: 'Mule Accounts',    count:  90, percentage:  9.0 },
  ]);
});

module.exports = router;