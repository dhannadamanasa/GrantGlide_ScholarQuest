/**
 * Student Intake Profile Validator Middleware.
 * Defensively checks parameter types, realistic ranges, and valid enumeration limits.
 */

class ProfileValidator {
  static validateStudentProfile(profile) {
    const errors = [];

    if (!profile || typeof profile !== 'object') {
      return { isValid: false, errors: ['Request body must contain a student profile object.'] };
    }

    // Gender check
    const validGenders = ['Female', 'Male', 'Other'];
    if (!profile.gender || !validGenders.includes(profile.gender)) {
      errors.push(`Invalid gender '${profile.gender}'. Must be one of: ${validGenders.join(', ')}.`);
    }

    // Caste check
    const validCastes = ['General', 'OBC', 'BC', 'SC', 'ST', 'Minority', 'EWS'];
    if (!profile.caste || !validCastes.includes(profile.caste)) {
      errors.push(`Invalid caste category '${profile.caste}'. Must be one of: ${validCastes.join(', ')}.`);
    }

    // Income check
    const income = Number(profile.income);
    if (isNaN(income) || income < 0 || income > 50000000) {
      errors.push(`Annual family income must be a valid positive number up to ₹5 Crores. Received: '${profile.income}'.`);
    }

    // State check
    if (!profile.state || typeof profile.state !== 'string' || profile.state.trim().length < 2) {
      errors.push('State of domicile is required.');
    }

    // Degree check
    const validDegrees = ['Engineering', 'Medical', 'Arts/Science', 'Commerce', 'Diploma', 'Law', 'Architecture', 'Pharmacy', 'Management', 'Other'];
    if (!profile.degree || !validDegrees.includes(profile.degree)) {
      errors.push(`Invalid degree '${profile.degree}'. Must be one of approved disciplines.`);
    }

    // GPA check
    const gpa = Number(profile.gpa);
    if (isNaN(gpa) || gpa < 0.0 || gpa > 10.0) {
      errors.push(`Academic GPA / CGPA must be a decimal between 0.00 and 10.00. Received: '${profile.gpa}'.`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static middleware() {
    return (req, res, next) => {
      const result = ProfileValidator.validateStudentProfile(req.body);
      if (!result.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Student Profile Validation Failed',
          details: result.errors
        });
      }
      next();
    };
  }
}

module.exports = ProfileValidator;
