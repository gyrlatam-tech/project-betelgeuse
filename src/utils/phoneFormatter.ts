/**
 * Utility for formatting and normalizing phone numbers for Google Workspace Directory API.
 * Google Workspace requires international E.164 format:
 * - Starts with a plus sign (+)
 * - Followed by Country Code + Area Code + Subscriber Number
 * - No spaces, dashes, dots, or parentheses
 * - E.g.: +5511999999999
 */

export function normalizeRecoveryPhone(rawPhone: string | undefined | null): string | undefined {
  if (!rawPhone) return undefined;

  let str = String(rawPhone).trim();
  if (!str) return undefined;

  // Replace leading international exit code '00' with '+'
  if (str.startsWith('00')) {
    str = '+' + str.slice(2);
  }

  const startsWithPlus = str.startsWith('+');

  // Extract only digits
  const digitsOnly = str.replace(/\D/g, '');

  // If there are no digits or too few digits to be any valid phone (< 7 digits), discard
  if (!digitsOnly || digitsOnly.length < 7) {
    return undefined;
  }

  // If string originally started with '+', keep '+' and strip any internal non-digits
  if (startsWithPlus) {
    return `+${digitsOnly}`;
  }

  // If it didn't start with '+':
  // 1. If it's a 10 or 11 digit Brazilian number without country code 55 (e.g. 11999999999 or 1133334444)
  // Brazilian DDDs are 11 to 99:
  if ((digitsOnly.length === 10 || digitsOnly.length === 11) && !digitsOnly.startsWith('55') && !digitsOnly.startsWith('1')) {
    const ddd = parseInt(digitsOnly.slice(0, 2), 10);
    if (ddd >= 11 && ddd <= 99) {
      return `+55${digitsOnly}`;
    }
  }

  // 2. Otherwise, automatically prepend '+' as required by E.164
  return `+${digitsOnly}`;
}
