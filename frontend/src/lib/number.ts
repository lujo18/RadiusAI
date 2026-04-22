export type CompactNumberOptions = {
  locale?: string;
  maximumFractionDigits?: number;
};

const formatBaseNumber = (
  value: number,
  locale?: string,
  maximumFractionDigits = 1,
): string => {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(value);
};

/**
 * Converts large numbers to compact string format.
 *
 * Examples:
 * - 1_000 -> "1k"
 * - 12_300 -> "12.3k"
 * - 1_000_000 -> "1m"
 * - 12_300_000 -> "12.3m"
 */
export const formatCompactNumber = (
  value: number | null | undefined,
  options: CompactNumberOptions = {},
): string => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "0";
  }

  const { locale, maximumFractionDigits = 1 } = options;
  const absoluteValue = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (absoluteValue < 1_000) {
    return formatBaseNumber(value, locale, maximumFractionDigits);
  }

  if (absoluteValue < 1_000_000) {
    return `${sign}${formatBaseNumber(
      absoluteValue / 1_000,
      locale,
      maximumFractionDigits,
    )}k`;
  }

  return `${sign}${formatBaseNumber(
    absoluteValue / 1_000_000,
    locale,
    maximumFractionDigits,
  )}m`;
};

export default formatCompactNumber;
