/**
 * Calculates commission amount for a single order line.
 * Commission is based on the product's commission_percent at time of sale,
 * applied to the line total (unit_price * quantity), NOT including shipping.
 */
function calculateCommission(unitPrice, quantity, commissionPercent) {
  const lineTotal = Number(unitPrice) * Number(quantity);
  const amount = (lineTotal * Number(commissionPercent)) / 100;
  return Math.round(amount * 100) / 100; // round to 2 decimals
}

/**
 * Parses the affiliate attribution cookie set by the /r/:shortCode redirect.
 * Cookie format: "affiliateId:affiliateLinkId:visitorCookieId"
 */
function parseAffiliateCookie(cookieValue) {
  if (!cookieValue) return null;
  const [affiliateId, affiliateLinkId, visitorCookieId] = cookieValue.split(':');
  if (!affiliateId || !affiliateLinkId) return null;
  return {
    affiliateId: Number(affiliateId),
    affiliateLinkId: Number(affiliateLinkId),
    visitorCookieId,
  };
}

module.exports = { calculateCommission, parseAffiliateCookie };
