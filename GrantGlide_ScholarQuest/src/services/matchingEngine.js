/**
 * Multi-Criteria Boolean Rule & Predicate Tree Matching Engine.
 * Evaluates student profiles against complex scholarship rules.
 */

class MatchingEngine {
  /**
   * Evaluates a single student profile against a single scholarship rule set.
   * @param {Object} student - { gender, caste, income, state, degree, gpa, isSingleGirlChild, isSpeciallyAbled, isOrphan }
   * @param {Object} scholarship - Scholarship object containing rules predicate tree
   * @returns {Object} - { isEligible: boolean, matchScore: number, matchReasons: string[], failReasons: string[] }
   */
  static evaluate(student, scholarship) {
    const rules = scholarship.rules || {};
    const matchReasons = [];
    const failReasons = [];

    // 1. Gender Validation
    if (rules.allowedGenders && rules.allowedGenders.length > 0) {
      if (rules.allowedGenders.includes(student.gender)) {
        matchReasons.push(`Gender '${student.gender}' satisfies eligible genders [${rules.allowedGenders.join(', ')}]`);
      } else {
        failReasons.push(`Requires gender in [${rules.allowedGenders.join(', ')}], but profile has '${student.gender}'`);
      }
    }

    // 2. Caste / Category Validation
    if (rules.allowedCastes && rules.allowedCastes.length > 0) {
      // Normalize BC / OBC equivalence in Indian context
      const casteMatches = rules.allowedCastes.includes(student.caste) ||
        (student.caste === 'BC' && rules.allowedCastes.includes('OBC')) ||
        (student.caste === 'OBC' && rules.allowedCastes.includes('BC'));

      if (casteMatches) {
        matchReasons.push(`Caste/Category '${student.caste}' matches allowed categories`);
      } else {
        failReasons.push(`Requires caste in [${rules.allowedCastes.join(', ')}], but profile has '${student.caste}'`);
      }
    }

    // 3. Family Income Ceiling
    if (typeof rules.maxIncome === 'number') {
      const studentIncome = Number(student.income);
      if (studentIncome <= rules.maxIncome) {
        const margin = Math.round(((rules.maxIncome - studentIncome) / rules.maxIncome) * 100);
        matchReasons.push(`Annual income ₹${studentIncome.toLocaleString('en-IN')} is within ₹${rules.maxIncome.toLocaleString('en-IN')} ceiling (${margin}% buffer)`);
      } else {
        failReasons.push(`Annual income ₹${studentIncome.toLocaleString('en-IN')} exceeds limit of ₹${rules.maxIncome.toLocaleString('en-IN')}`);
      }
    }

    // 4. State of Domicile
    if (rules.allowedStates && rules.allowedStates.length > 0) {
      if (rules.allowedStates.includes('All') || rules.allowedStates.includes(student.state)) {
        matchReasons.push(`Domicile '${student.state}' is eligible`);
      } else {
        failReasons.push(`Requires domicile in [${rules.allowedStates.join(', ')}], but profile has '${student.state}'`);
      }
    }

    // 5. Degree / Discipline
    if (rules.allowedDegrees && rules.allowedDegrees.length > 0) {
      if (rules.allowedDegrees.includes('All') || rules.allowedDegrees.includes(student.degree)) {
        matchReasons.push(`Course '${student.degree}' is approved`);
      } else {
        failReasons.push(`Requires course in [${rules.allowedDegrees.join(', ')}], but profile has '${student.degree}'`);
      }
    }

    // 6. Minimum Academic GPA
    if (typeof rules.minGpa === 'number') {
      const studentGpa = Number(student.gpa);
      if (studentGpa >= rules.minGpa) {
        matchReasons.push(`Academic GPA ${studentGpa.toFixed(2)} meets required ${rules.minGpa.toFixed(2)} threshold`);
      } else {
        failReasons.push(`Academic GPA ${studentGpa.toFixed(2)} is below minimum ${rules.minGpa.toFixed(2)} requirement`);
      }
    }

    // 7. Special Conditions / Overlapping Exceptions
    if (rules.specialConditions) {
      if (rules.specialConditions === 'isSingleGirlChild' && !student.isSingleGirlChild) {
        failReasons.push('Reserved exclusively for single girl child beneficiaries');
      } else if (rules.specialConditions === 'isSpeciallyAbled' && !student.isSpeciallyAbled) {
        failReasons.push('Requires certificate of benchmark disability (PwD)');
      } else if (rules.specialConditions === 'isOrphanOrMartyrChild' && !student.isOrphan) {
        failReasons.push('Designated exclusively for orphan students or wards of martyrs');
      } else if (rules.specialConditions === 'wardOfPoliceOrMartyr' && !student.isWardOfPoliceOrMartyr) {
        failReasons.push('Restricted to wards/dependents of armed forces/CAPF personnel');
      } else {
        matchReasons.push(`Satisfies special condition: ${rules.specialConditions}`);
      }
    }

    const isEligible = failReasons.length === 0;

    // Calculate intelligent match score (0 - 100)
    let matchScore = 0;
    if (isEligible) {
      // Base score for meeting all hard constraints
      let score = 75;

      // Bonus points for higher academic GPA headroom (up to +15 points)
      if (typeof rules.minGpa === 'number') {
        const gpaDelta = Math.max(0, Number(student.gpa) - rules.minGpa);
        score += Math.min(15, Math.round(gpaDelta * 7.5));
      }

      // Bonus points for lower income headroom (up to +10 points for need)
      if (typeof rules.maxIncome === 'number') {
        const incomeBuffer = Math.max(0, rules.maxIncome - Number(student.income)) / rules.maxIncome;
        score += Math.min(10, Math.round(incomeBuffer * 10));
      }

      matchScore = Math.min(100, Math.max(75, score));
    } else {
      // Partial score indicating how close the student is
      const totalChecks = matchReasons.length + failReasons.length;
      matchScore = Math.round((matchReasons.length / Math.max(1, totalChecks)) * 60);
    }

    return {
      isEligible,
      matchScore,
      matchReasons,
      failReasons
    };
  }

  /**
   * Filters and ranks an entire dataset of scholarships for a student profile.
   * @param {Object} student 
   * @param {Array} scholarships 
   * @returns {Object} - { eligible: Array, ineligible: Array, totalEvaluated: number }
   */
  static matchAll(student, scholarships) {
    const eligible = [];
    const ineligible = [];

    for (const sch of scholarships) {
      const result = this.evaluate(student, sch);
      const enriched = {
        ...sch,
        matchScore: result.matchScore,
        matchReasons: result.matchReasons,
        failReasons: result.failReasons
      };

      if (result.isEligible) {
        eligible.push(enriched);
      } else {
        ineligible.push(enriched);
      }
    }

    // Sort eligible by match score descending, then by deadline ascending (urgency)
    eligible.sort((a, b) => b.matchScore - a.matchScore || a.daysRemaining - b.daysRemaining);

    return {
      eligible,
      ineligible,
      totalEvaluated: scholarships.length,
      eligibleCount: eligible.length
    };
  }
}

module.exports = MatchingEngine;
