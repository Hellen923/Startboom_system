/**
 * Formats a number as a currency string based on the tenant's base currency setting.
 * @param {number} value - The amount to format
 * @param {string} currencyCode - The currency code (e.g., 'USD', 'KES', 'EUR'). Defaults to 'USD'.
 * @returns {string} The formatted currency string
 */
export const formatCurrency = (value, currencyCode = 'USD') => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  } catch (error) {
    // Fallback if currency code is invalid
    console.warn(`Invalid currency code: ${currencyCode}, falling back to USD`);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  }
};
