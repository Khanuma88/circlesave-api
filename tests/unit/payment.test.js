describe('Payment Status Logic', () => {
  const getPaymentStatus = (amountPaid, amountDue) => {
    const ratio = amountPaid / amountDue;
    if (ratio >= 1) return 'PAID';
    if (ratio >= 0.7) return 'PARTIAL_70';
    return 'PARTIAL_50';
  };

  it('should return PAID when full amount is paid', () => {
    expect(getPaymentStatus(10000, 10000)).toBe('PAID');
  });

  it('should return PAID when overpaid', () => {
    expect(getPaymentStatus(12000, 10000)).toBe('PAID');
  });

  it('should return PARTIAL_70 when 70% paid', () => {
    expect(getPaymentStatus(7000, 10000)).toBe('PARTIAL_70');
  });

  it('should return PARTIAL_70 when 80% paid', () => {
    expect(getPaymentStatus(8000, 10000)).toBe('PARTIAL_70');
  });

  it('should return PARTIAL_50 when less than 70% paid', () => {
    expect(getPaymentStatus(5000, 10000)).toBe('PARTIAL_50');
  });

  it('should return PARTIAL_50 when 0 paid', () => {
    expect(getPaymentStatus(0, 10000)).toBe('PARTIAL_50');
  });

  describe('Payout calculation', () => {
    it('should sum all payments correctly', () => {
      const payments = [
        { amountPaid: '10000' },
        { amountPaid: '10000' },
        { amountPaid: '10000' },
      ];
      const total = payments.reduce((sum, p) => sum + Number(p.amountPaid), 0);
      expect(total).toBe(30000);
    });

    it('should handle partial payments in payout', () => {
      const payments = [
        { amountPaid: '10000' },
        { amountPaid: '7000' },
        { amountPaid: '5000' },
      ];
      const total = payments.reduce((sum, p) => sum + Number(p.amountPaid), 0);
      expect(total).toBe(22000);
    });
  });
});