const express = require('express');
const router  = express.Router();
const { scoreTransaction } = require('../mlEngine'); // fallback

const transactions = [];

// Try Flask ML service first, fall back to rule engine
async function getScore(txn) {
  const ML_SERVICE = process.env.ML_SERVICE_URL || 'http://localhost:5001';
  try {
    const response = await fetch(`${ML_SERVICE}/predict`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(txn),
      signal:  AbortSignal.timeout(3000) // 3 second timeout
    });
    if (response.ok) {
      const result = await response.json();
      console.log(`  [ML Service] score ${result.riskScore} → ${result.decision}`);
      return { ...result, scoredBy: 'ml-model' };
    }
  } catch (e) {
    console.log(`  [Fallback] ML service unavailable, using rule engine`);
  }
  // Fallback to rule-based engine
  return { ...scoreTransaction(txn), scoredBy: 'rule-engine' };
}

router.post('/score', async (req, res) => {
  const txn = req.body;
  if (!txn.amount || !txn.upiId) {
    return res.status(400).json({ error: 'amount and upiId are required' });
  }

  const result = await getScore(txn);
  const record = {
    id:         'TXN' + Date.now(),
    upiId:      txn.upiId,
    senderName: txn.senderName || 'Customer',
    amount:     txn.amount,
    note:       txn.note || '',
    ...result,
    timestamp:  new Date().toISOString(),
    reviewed:   false
  };

  transactions.push(record);
  console.log(`  [${record.decision}] ${record.upiId} ₹${record.amount} → score ${record.riskScore} via ${record.scoredBy}`);
  res.json(record);
});

router.get('/', (req, res) => {
  res.json(transactions.slice(-100).reverse());
});

router.get('/stats', (req, res) => {
  const total    = transactions.length;
  const blocked  = transactions.filter(t => t.decision === 'BLOCKED').length;
  const review   = transactions.filter(t => t.decision === 'REVIEW').length;
  const approved = transactions.filter(t => t.decision === 'APPROVED').length;
  res.json({
    total, blocked, review, approved,
    fraudRate: total ? ((blocked / total) * 100).toFixed(1) + '%' : '0%'
  });
});

router.patch('/:id/review', (req, res) => {
  const txn = transactions.find(t => t.id === req.params.id);
  if (!txn) return res.status(404).json({ error: 'Transaction not found' });
  txn.reviewed       = true;
  txn.reviewDecision = req.body.decision;
  txn.reviewNote     = req.body.note || '';
  res.json(txn);
});

module.exports = router;
