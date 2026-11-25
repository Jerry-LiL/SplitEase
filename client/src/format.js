export function rupees(amount) {
  return '₹' + Number(amount).toFixed(2);
}

export function signedRupees(amount) {
  const value = Number(amount);
  if (value > 0) return '+' + rupees(value);
  if (value < 0) return '-' + rupees(Math.abs(value));
  return rupees(0);
}
