export const getCurrencySymbol = (code?: string): string => {
  if (!code) return '$';
  const map: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    AUD: 'A$',
    CAD: 'CA$',
    JPY: '¥',
    INR: '₹',
  };
  const up = code.toUpperCase();
  if (map[up]) return map[up];
  try {
    const parts = new Intl.NumberFormat(undefined, { style: 'currency', currency: up }).formatToParts(0);
    const cur = parts.find((p) => p.type === 'currency');
    return cur?.value ?? up;
  } catch (e) {
    return up;
  }
};

export default getCurrencySymbol;

/**
 * Format an amount that is expressed in the currency's smallest unit (e.g. cents)
 * into a localized currency string using Intl.
 *
 * @param amountSmallestUnit integer amount in the currency's smallest unit (e.g. 299 for $2.99)
 * @param currency ISO 4217 currency code (e.g. 'USD')
 */
export const formatCurrency = (amountSmallestUnit: number | null | undefined, currency?: string): string => {
  if (amountSmallestUnit === null || amountSmallestUnit === undefined) return `${getCurrencySymbol(currency)}0.00`;
  const cur = (currency || 'USD').toUpperCase();
  try {
    const sample = new Intl.NumberFormat(undefined, { style: 'currency', currency: cur });
    const opts = sample.resolvedOptions();
    const fractionDigits = typeof opts.maximumFractionDigits === 'number' ? opts.maximumFractionDigits : 2;
    const major = Number(amountSmallestUnit) / Math.pow(10, fractionDigits);
    return sample.format(major);
  } catch (e) {
    // fallback: assume 2 decimal places
    const major = Number(amountSmallestUnit) / 100;
    return `${getCurrencySymbol(cur)}${major.toFixed(2)}`;
  }
};

// named export already declared above
