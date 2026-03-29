/**
 * Format a number as currency
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency code (default: USD)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
};

/**
 * Format a date string
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date string (e.g., "Jan 15, 2025")
 */
export const formatDate = (date) => {
  if (!date) return "";
  return new Intl.DateFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
};

/**
 * Get badge color classes based on expense status
 * @param {string} status - The status (PENDING, APPROVED, REJECTED)
 * @returns {string} Tailwind CSS classes for the badge
 */
export const getStatusBadgeColor = (status) => {
  switch (status?.toUpperCase()) {
    case "PENDING":
      return "bg-warning/10 text-warning";
    case "APPROVED":
      return "bg-success/10 text-success";
    case "REJECTED":
      return "bg-danger/10 text-danger";
    default:
      return "bg-secondary text-textSecondary";
  }
};

/**
 * Get badge color classes based on approval status
 * @param {string} status - The approval status
 * @returns {string} Tailwind CSS classes for the badge
 */
export const getApprovalStatusColor = (status) => {
  switch (status?.toUpperCase()) {
    case "PENDING":
      return "bg-warning/10 text-warning";
    case "APPROVED":
      return "bg-success/10 text-success";
    case "REJECTED":
      return "bg-danger/10 text-danger";
    default:
      return "bg-secondary text-textSecondary";
  }
};
