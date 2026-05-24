function scoreTransaction(txn) {
  const {
    amount          = 0,
    hour            = 12,
    velocity1h      = 0,
    merchantScore   = 0.5,
    deviceAgeDays   = 365,
    locationAnomaly = 0,
    newBeneficiary  = 0,
    amountDeviation = 0
  } = txn;

  let score = 0;
  const reasons = [];

  if (amount > 50000)      { score += 30; reasons.push('Very high amount (>₹50,000)'); }
  else if (amount > 15000) { score += 20; reasons.push('High amount (>₹15,000)'); }
  else if (amount > 8000)  { score += 10; }

  if (velocity1h > 5)      { score += 25; reasons.push('Too many transactions in 1 hour'); }
  else if (velocity1h > 3) { score += 15; reasons.push('High transaction frequency'); }

  if (locationAnomaly)     { score += 20; reasons.push('Payment from unusual location'); }
  if (newBeneficiary)      { score += 15; reasons.push('First time paying this person'); }

  if (merchantScore < 0.2)      { score += 10; reasons.push('Merchant has very low trust score'); }
  else if (merchantScore < 0.4) { score += 5;  reasons.push('Merchant trust score is low'); }

  if (hour >= 1 && hour <= 4)   { score += 8; reasons.push('Transaction at unusual hour (1am–4am)'); }
  if (deviceAgeDays < 7)        { score += 10; reasons.push('Payment from a brand new device'); }
  if (amountDeviation > 2.5)    { score += 8;  reasons.push('Amount is unusual for this account'); }

  const riskScore = Math.min(Math.round(score), 100);
  const decision  = riskScore >= 80 ? 'BLOCKED' : riskScore >= 50 ? 'REVIEW' : 'APPROVED';
  const confidence= riskScore >= 80 ? 'HIGH' : riskScore >= 50 ? 'MEDIUM' : 'LOW';

  return { riskScore, decision, reasons, confidence };
}

module.exports = { scoreTransaction };