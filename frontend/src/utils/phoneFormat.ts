/**
 * Format a phone number for display
 * Input: raw digits like "1234567890" or already formatted "+1(123)-(456)-(7890)"
 * Output: "+1 (123) 456-7890"
 */
export const formatPhoneDisplay = (phone: string | null | undefined): string => {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Handle different lengths
  if (digits.length === 0) return '';
  
  // If starts with 1 and has 11 digits, it includes country code
  if (digits.length === 11 && digits.startsWith('1')) {
    const areaCode = digits.slice(1, 4);
    const firstPart = digits.slice(4, 7);
    const secondPart = digits.slice(7);
    return `+1 (${areaCode}) ${firstPart}-${secondPart}`;
  }
  
  // If 10 digits, assume US number without country code
  if (digits.length === 10) {
    const areaCode = digits.slice(0, 3);
    const firstPart = digits.slice(3, 6);
    const secondPart = digits.slice(6);
    return `+1 (${areaCode}) ${firstPart}-${secondPart}`;
  }
  
  // Return original if we can't format it
  return phone;
};

/**
 * Extract raw digits from a formatted phone number
 */
export const extractPhoneDigits = (phone: string | null | undefined): string => {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
};

/**
 * Phone format pattern for react-number-format PatternFormat
 */
export const PHONE_FORMAT_PATTERN = '+1 (###) ###-####';
export const PHONE_FORMAT_MASK = '_';
