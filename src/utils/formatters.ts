export const inr = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export const pct = (value: number) => `${Math.round(value)}%`;

export const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));
