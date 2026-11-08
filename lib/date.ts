/**
 * Format published dates consistently as YYYY年MM月DD日.
 * UTC is used so the same article date is displayed identically across regions.
 */
export function formatChineseDate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}年${month}月${day}日`;
}
