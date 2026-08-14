/**
 * Formats a number as Algerian Dinar, e.g. formatDZD(1234.5) -> "1,234.50 د.ج"
 */
export function formatDZD(amount) {
  const n = Number(amount || 0);
  return `${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} د.ج`;
}
