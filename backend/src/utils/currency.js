function formatDZD(amount) {
  const n = Number(amount || 0);
  return `${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} د.ج`;
}

module.exports = { formatDZD };
