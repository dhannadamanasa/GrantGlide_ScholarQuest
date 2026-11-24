/**
 * Policy Conflict Resolution Engine.
 * Detects mutually exclusive government schemes and issues policy conflict warnings
 * to prevent students from violating dual-availing regulations.
 */

class ConflictEngine {
  /**
   * Evaluates a set of selected or applied scholarship IDs for regulatory policy conflicts.
   * @param {Array<string>} selectedIds - List of scholarship IDs
   * @param {Array<Object>} allScholarships - Database of all scholarships
   * @returns {Object} - { hasConflicts: boolean, conflictPairs: Array, warnings: Array }
   */
  static detectConflicts(selectedIds, allScholarships) {
    const schMap = new Map();
    allScholarships.forEach(s => schMap.set(s.id, s));

    const conflictPairs = [];
    const warnings = [];
    const seenPairs = new Set();

    for (let i = 0; i < selectedIds.length; i++) {
      const idA = selectedIds[i];
      const schA = schMap.get(idA);
      if (!schA || !schA.conflictsWith) continue;

      for (let j = i + 1; j < selectedIds.length; j++) {
        const idB = selectedIds[j];
        const schB = schMap.get(idB);
        if (!schB) continue;

        // Check if either scheme declares a conflict with the other
        const isConflict = schA.conflictsWith.includes(idB) || (schB.conflictsWith && schB.conflictsWith.includes(idA));

        if (isConflict) {
          const pairKey = [idA, idB].sort().join('<->');
          if (!seenPairs.has(pairKey)) {
            seenPairs.add(pairKey);
            conflictPairs.push({
              schemeA: { id: schA.id, title: schA.title, provider: schA.provider },
              schemeB: { id: schB.id, title: schB.title, provider: schB.provider },
              reason: 'Both schemes are centrally or state funded welfare grants that strictly prohibit dual availing under Ministry of Education / Social Welfare guidelines.'
            });
            warnings.push(
              `⚠️ Regulatory Policy Conflict: Cannot simultaneously avail '${schA.title}' and '${schB.title}'. Dual availing violates statutory regulations and leads to cancellation of both awards.`
            );
          }
        }
      }
    }

    return {
      hasConflicts: conflictPairs.length > 0,
      conflictPairs,
      warnings
    };
  }

  /**
   * Inspects a specific scholarship against a list of already applied or bookmarked schemes.
   * @param {string} candidateId 
   * @param {Array<string>} existingIds 
   * @param {Array<Object>} allScholarships 
   */
  static checkSingleConflict(candidateId, existingIds, allScholarships) {
    const combined = [...new Set([...existingIds, candidateId])];
    return this.detectConflicts(combined, allScholarships);
  }
}

module.exports = ConflictEngine;
