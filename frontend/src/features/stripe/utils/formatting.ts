/**
 * Formatting utilities for billing/subscription display
 */

export const getStatusBadgeColor = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'active':
    case 'trialing':
      return 'bg-green-500';
    case 'past_due':
      return 'bg-yellow-500';
    case 'canceled':
    case 'cancelled':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

export const formatDate = (timestamp: number | string | null): string => {
  if (!timestamp) return 'N/A';
  const ts = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
  return new Date(ts * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatCurrency = (amount: number | null, currency: string): string => {
  if (amount === null || amount === undefined) return '$0.00';
  const formatted = (amount / 100).toFixed(2);
  const symbol = currency?.toLowerCase() === 'usd' ? '$' : '';
  return `${symbol}${formatted}`;
};
