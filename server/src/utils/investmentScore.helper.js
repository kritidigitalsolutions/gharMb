/**
 * Investment Score Helper Utilities
 * Pure admin-curated calculation helpers for project investment metrics and grades.
 */

/**
 * Rounds a number to 1 decimal place (e.g. 8.92 -> 8.9)
 */
const roundToOneDecimal = (num) => {
  if (num === null || num === undefined || num === '') return 0;
  const val = Number(num);
  if (isNaN(val)) return 0;
  return Math.round(val * 10) / 10;
};

/**
 * Maps an overall numeric score (0 to 10) to a qualitative grade
 * >= 8.0: Excellent
 * >= 6.5: Good
 * >= 5.0: Average
 * < 5.0: Below Average
 */
const calculateGrade = (overall) => {
  if (!overall || overall <= 0) return 'Not Rated';
  if (overall >= 8.0) return 'Excellent';
  if (overall >= 6.5) return 'Good';
  if (overall >= 5.0) return 'Average';
  return 'Below Average';
};

/**
 * Calculates overall score from 5 individual metric values
 */
const calculateOverallFromMetrics = (metrics) => {
  if (!metrics) return 0;
  const values = [
    Number(metrics.connectivity) || 0,
    Number(metrics.rentalPotential) || 0,
    Number(metrics.growthPotential) || 0,
    Number(metrics.familyLiving) || 0,
    Number(metrics.futureDemand) || 0,
  ];
  const sum = values.reduce((acc, val) => acc + val, 0);
  return roundToOneDecimal(sum / values.length);
};

module.exports = {
  roundToOneDecimal,
  calculateGrade,
  calculateOverallFromMetrics,
};
