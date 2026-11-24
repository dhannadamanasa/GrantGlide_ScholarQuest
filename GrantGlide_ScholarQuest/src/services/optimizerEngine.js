/**
 * Financial Aid Optimization Engine.
 * Evaluates student tuition deficit (tuition + living costs - existing grants)
 * and determines the mathematically optimal portfolio of non-conflicting scholarships.
 */

const ConflictEngine = require('./conflictEngine');

class OptimizerEngine {
  /**
   * Computes tuition deficit and recommends the optimal non-conflicting combination.
   * @param {Object} params - { tuitionFee, livingCost, existingAid, eligibleScholarships, allScholarships }
   * @returns {Object} - { totalCost, existingAid, deficit, optimalCombination, totalAwardAmount, coveragePercent, remainingDeficit }
   */
  static optimize(params) {
    const tuition = Math.max(0, Number(params.tuitionFee) || 0);
    const living = Math.max(0, Number(params.livingCost) || 0);
    const existing = Math.max(0, Number(params.existingAid) || 0);
    const eligible = Array.isArray(params.eligibleScholarships) ? params.eligibleScholarships : [];
    const allScholarships = Array.isArray(params.allScholarships) ? params.allScholarships : eligible;

    const totalCost = tuition + living;
    const deficit = Math.max(0, totalCost - existing);

    if (eligible.length === 0 || deficit === 0) {
      return {
        totalCost,
        existingAid: existing,
        deficit,
        optimalCombination: [],
        totalAwardAmount: 0,
        coveragePercent: 0,
        remainingDeficit: deficit,
        explanation: deficit === 0 ? 'No remaining financial deficit.' : 'No matching eligible scholarships found.'
      };
    }

    // Find all valid non-conflicting subsets
    // Since eligible scholarships are typically 3-15 items, power set search with conflict pruning is optimal
    const candidates = eligible.slice(0, 14); // Safety cap for subset search
    let bestCombination = [];
    let bestTotalAmount = 0;

    const isNonConflicting = (subset) => {
      const ids = subset.map(s => s.id);
      const conflictRes = ConflictEngine.detectConflicts(ids, allScholarships);
      return !conflictRes.hasConflicts;
    };

    const subsetsCount = 1 << candidates.length;

    for (let mask = 1; mask < subsetsCount; mask++) {
      const currentSubset = [];
      let currentTotal = 0;

      for (let i = 0; i < candidates.length; i++) {
        if ((mask & (1 << i)) !== 0) {
          currentSubset.push(candidates[i]);
          currentTotal += Number(candidates[i].awardAmount) || 0;
        }
      }

      // Check if subset is valid without policy conflicts
      if (isNonConflicting(currentSubset)) {
        // We want to maximize funding up to deficit, or if exceeded, get closest or maximum allowable
        if (currentTotal > bestTotalAmount) {
          bestTotalAmount = currentTotal;
          bestCombination = currentSubset;
        } else if (currentTotal === bestTotalAmount && currentSubset.length < bestCombination.length) {
          // Prefer fewer schemes for lower documentation overhead
          bestCombination = currentSubset;
        }
      }
    }

    const coveragePercent = deficit > 0 ? Math.min(100, Math.round((bestTotalAmount / deficit) * 100)) : 100;
    const remainingDeficit = Math.max(0, deficit - bestTotalAmount);

    return {
      totalCost,
      existingAid: existing,
      deficit,
      optimalCombination: bestCombination.map(s => ({
        id: s.id,
        title: s.title,
        provider: s.provider,
        awardAmount: s.awardAmount,
        awardFrequency: s.awardFrequency,
        daysRemaining: s.daysRemaining
      })),
      totalAwardAmount: bestTotalAmount,
      coveragePercent,
      remainingDeficit,
      explanation: `Recommended ${bestCombination.length} non-conflicting scholarship(s) securing ₹${bestTotalAmount.toLocaleString('en-IN')}, covering ${coveragePercent}% of your net financial deficit.`
    };
  }
}

module.exports = OptimizerEngine;
