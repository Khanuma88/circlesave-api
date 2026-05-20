const { roundToKZT, calculateLateFee } = require('../../src/utils/decimal');

describe('Decimal Utils', () => {
  describe('roundToKZT', () => {
    it('should round to 2 decimal places', () => {
      expect(roundToKZT(10000.555)).toBe(10000.56);
    });

    it('should handle whole numbers', () => {
      expect(roundToKZT(10000)).toBe(10000);
    });

    it('should handle string input', () => {
      expect(roundToKZT('5000.5')).toBe(5000.5);
    });

    it('should handle zero', () => {
      expect(roundToKZT(0)).toBe(0);
    });
  });

  describe('calculateLateFee', () => {
    it('should return 0 for 0 days late', () => {
      expect(calculateLateFee(10000, 0)).toBe(0);
    });

    it('should calculate fee for 1 day late', () => {
      const fee = calculateLateFee(10000, 1);
      expect(fee).toBeGreaterThan(0);
      expect(fee).toBeCloseTo(10, 0); // ~0.1% of 10000
    });

    it('should compound for multiple days', () => {
      const fee1 = calculateLateFee(10000, 5);
      const fee2 = calculateLateFee(10000, 10);
      expect(fee2).toBeGreaterThan(fee1);
    });

    it('should scale with unpaid amount', () => {
      const feeSmall = calculateLateFee(5000, 3);
      const feeLarge = calculateLateFee(10000, 3);
      expect(feeLarge).toBeGreaterThan(feeSmall);
    });
  });
});