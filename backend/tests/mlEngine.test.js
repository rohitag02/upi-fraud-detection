const { scoreTransaction } = require('../src/mlEngine');

describe('ML Fraud Scoring Engine', () => {

  // ─── APPROVED cases ───────────────────────────────────────────
  describe('APPROVED transactions', () => {

    test('clean low-value transaction should be APPROVED with low score', () => {
      const result = scoreTransaction({
        amount: 500,
        hour: 14,
        velocity1h: 1,
        merchantScore: 0.9,
        deviceAgeDays: 365,
        locationAnomaly: 0,
        newBeneficiary: 0,
        amountDeviation: 0
      });
      expect(result.decision).toBe('APPROVED');
      expect(result.riskScore).toBeLessThan(50);
      expect(result.confidence).toBe('LOW');
      expect(result.reasons).toHaveLength(0);
    });

    test('medium amount known beneficiary should be APPROVED', () => {
      const result = scoreTransaction({
        amount: 3000,
        hour: 10,
        velocity1h: 1,
        merchantScore: 0.8,
        deviceAgeDays: 200,
        locationAnomaly: 0,
        newBeneficiary: 0,
      });
      expect(result.decision).toBe('APPROVED');
      expect(result.riskScore).toBeLessThan(50);
    });

  });

  // ─── REVIEW cases ─────────────────────────────────────────────
  describe('REVIEW transactions', () => {

    test('high amount new beneficiary should be REVIEW', () => {
  const result = scoreTransaction({
    amount: 20000,
    hour: 14,
    velocity1h: 4,
    merchantScore: 0.3,
    deviceAgeDays: 90,
    locationAnomaly: 0,
    newBeneficiary: 1,
  });
      expect(result.decision).toBe('REVIEW');
      expect(result.riskScore).toBeGreaterThanOrEqual(50);
      expect(result.riskScore).toBeLessThan(80);
      expect(result.confidence).toBe('MEDIUM');
    });

    test('location anomaly with high amount should trigger REVIEW', () => {
  const result = scoreTransaction({
    amount: 16000,
    hour: 12,
    velocity1h: 4,
    merchantScore: 0.3,
    deviceAgeDays: 180,
    locationAnomaly: 1,
    newBeneficiary: 0,
  });
  expect(result.decision).toBe('REVIEW');
      expect(result.decision).toBe('REVIEW');
      expect(result.reasons).toContain('Payment from unusual location');
    });

  });

  // ─── BLOCKED cases ────────────────────────────────────────────
  describe('BLOCKED transactions', () => {

    test('high risk transaction should be BLOCKED with score 100', () => {
      const result = scoreTransaction({
        amount: 60000,
        hour: 3,
        velocity1h: 6,
        merchantScore: 0.1,
        deviceAgeDays: 2,
        locationAnomaly: 1,
        newBeneficiary: 1,
        amountDeviation: 3,
      });
      expect(result.decision).toBe('BLOCKED');
      expect(result.riskScore).toBe(100);
      expect(result.confidence).toBe('HIGH');
      expect(result.reasons.length).toBeGreaterThan(3);
    });

    test('very high amount with multiple signals should be BLOCKED', () => {
      const result = scoreTransaction({
        amount: 55000,
        hour: 3,
        velocity1h: 6,
        merchantScore: 0.1,
        locationAnomaly: 1,
        newBeneficiary: 1,
        deviceAgeDays: 3,
      });
      expect(result.decision).toBe('BLOCKED');
      expect(result.riskScore).toBeGreaterThanOrEqual(80);
    });

  });

  // ─── Risk score boundary tests ────────────────────────────────
  describe('Risk score boundaries', () => {

    test('risk score should never exceed 100', () => {
      const result = scoreTransaction({
        amount: 999999,
        hour: 3,
        velocity1h: 99,
        merchantScore: 0.0,
        deviceAgeDays: 0,
        locationAnomaly: 1,
        newBeneficiary: 1,
        amountDeviation: 99,
      });
      expect(result.riskScore).toBeLessThanOrEqual(100);
    });

    test('risk score should never be negative', () => {
      const result = scoreTransaction({
        amount: 0,
        hour: 12,
        velocity1h: 0,
        merchantScore: 1.0,
        deviceAgeDays: 999,
        locationAnomaly: 0,
        newBeneficiary: 0,
      });
      expect(result.riskScore).toBeGreaterThanOrEqual(0);
    });

  });

  // ─── Individual fraud signal tests ───────────────────────────
  describe('Individual fraud signals', () => {

    test('late night transaction 1am-4am should add risk', () => {
      const dayResult   = scoreTransaction({ amount: 1000, hour: 14 });
      const nightResult = scoreTransaction({ amount: 1000, hour: 3  });
      expect(nightResult.riskScore).toBeGreaterThan(dayResult.riskScore);
      expect(nightResult.reasons).toContain('Transaction at unusual hour (1am–4am)');
    });

    test('new device should add risk', () => {
      const oldDevice = scoreTransaction({ amount: 1000, deviceAgeDays: 365 });
      const newDevice = scoreTransaction({ amount: 1000, deviceAgeDays: 3   });
      expect(newDevice.riskScore).toBeGreaterThan(oldDevice.riskScore);
      expect(newDevice.reasons).toContain('Payment from a brand new device');
    });

    test('high velocity should add significant risk', () => {
      const lowVelocity  = scoreTransaction({ amount: 1000, velocity1h: 1 });
      const highVelocity = scoreTransaction({ amount: 1000, velocity1h: 6 });
      expect(highVelocity.riskScore).toBeGreaterThan(lowVelocity.riskScore);
      expect(highVelocity.reasons).toContain('Too many transactions in 1 hour');
    });

    test('low merchant score should add risk', () => {
      const result = scoreTransaction({ amount: 1000, merchantScore: 0.1 });
      expect(result.reasons).toContain('Merchant has very low trust score');
    });

    test('new beneficiary should add risk', () => {
      const known   = scoreTransaction({ amount: 1000, newBeneficiary: 0 });
      const unknown = scoreTransaction({ amount: 1000, newBeneficiary: 1 });
      expect(unknown.riskScore).toBeGreaterThan(known.riskScore);
      expect(unknown.reasons).toContain('First time paying this person');
    });

  });

  // ─── Response structure tests ─────────────────────────────────
  describe('Response structure', () => {

    test('should always return riskScore, decision, reasons, confidence', () => {
      const result = scoreTransaction({ amount: 1000 });
      expect(result).toHaveProperty('riskScore');
      expect(result).toHaveProperty('decision');
      expect(result).toHaveProperty('reasons');
      expect(result).toHaveProperty('confidence');
    });

    test('decision should always be APPROVED REVIEW or BLOCKED', () => {
      const result = scoreTransaction({ amount: 1000 });
      expect(['APPROVED', 'REVIEW', 'BLOCKED']).toContain(result.decision);
    });

    test('confidence should always be LOW MEDIUM or HIGH', () => {
      const result = scoreTransaction({ amount: 1000 });
      expect(['LOW', 'MEDIUM', 'HIGH']).toContain(result.confidence);
    });

    test('reasons should always be an array', () => {
      const result = scoreTransaction({ amount: 1000 });
      expect(Array.isArray(result.reasons)).toBe(true);
    });

    test('should handle missing fields without crashing', () => {
      expect(() => scoreTransaction({})).not.toThrow();
      expect(() => scoreTransaction({ amount: 5000 })).not.toThrow();
    });

  });

});
