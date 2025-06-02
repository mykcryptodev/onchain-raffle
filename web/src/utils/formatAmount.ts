/**
 * Formats a number into a human-readable format with appropriate suffixes
 * @param value - The numeric value to format (as string or number)
 * @returns Formatted string like "35.4K", "2.1M", "1B", etc.
 */
export function formatCompactNumber(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return '0';
  
  if (num < 1000) {
    // For small numbers, show up to 2 decimal places
    return num % 1 === 0 ? num.toString() : num.toFixed(2).replace(/\.?0+$/, '');
  }
  
  const units = ['', 'K', 'M', 'B', 'T'];
  const unitIndex = Math.floor(Math.log10(Math.abs(num)) / 3);
  const scaledNum = num / Math.pow(1000, unitIndex);
  
  // Format with 1 decimal place for readability
  const formatted = scaledNum.toFixed(1);
  
  // Remove trailing .0 for whole numbers
  const cleanFormatted = formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted;
  
  return cleanFormatted + units[Math.min(unitIndex, units.length - 1)];
} 