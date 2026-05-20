const roundToKZT = (amount) => {
  return Math.round(Number(amount) * 100) / 100;
};

const calculateLateFee = (unpaidAmount, daysLate) => {
  const rate = 0.001; // 0.1% per day
  return roundToKZT(unpaidAmount * (Math.pow(1 + rate, daysLate) - 1));
};

module.exports = { roundToKZT, calculateLateFee };