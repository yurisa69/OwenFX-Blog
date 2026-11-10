export const MAX_DISPLAY_NAME_LENGTH = 12;

// Count Unicode code points so Chinese characters and supplementary characters
// are not incorrectly counted as two UTF-16 code units.
export function getDisplayNameLength(value: string) {
  return Array.from(value).length;
}

export function limitDisplayName(value: string) {
  return Array.from(value).slice(0, MAX_DISPLAY_NAME_LENGTH).join('');
}
