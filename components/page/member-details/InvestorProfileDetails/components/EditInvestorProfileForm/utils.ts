/**
 * Formats a number to currency format
 */
export const formatNumberToCurrency = (value?: string | number): string => {
  if (!value) return '';

  // Convert to number if it's a string
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;

  // Return empty string if not a valid number
  if (isNaN(numericValue)) return '';

  // Format as currency
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numericValue);
};
