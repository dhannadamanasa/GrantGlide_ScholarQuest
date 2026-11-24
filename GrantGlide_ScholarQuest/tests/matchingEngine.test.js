/**
 * Unit & Integration Tests: Matching Engine & Rule Evaluation
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');

const MatchingEngine = require('../src/services/matchingEngine');
const scholarships = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../src/data/scholarships.json'), 'utf-8')
);

describe('Matching Engine Tests', () => {
  it('should match the canonical demo female engineering student from Telangana', () => {
    // Benchmark Demo Profile from Hackathon Problem Brief
    const student = {
      gender: 'Female',
      caste: 'BC',
      income: 150000, // ₹1.5 Lakhs
      state: 'Telangana',
      degree: 'Engineering',
      gpa: 8.5
    };

    const results = MatchingEngine.matchAll(student, scholarships);

    // Must match Pragati Scholarship for Girls
    const pragati = results.eligible.find(s => s.id === 'SCH-001');
    assert.ok(pragati, "Pragati Scholarship for Girls should be eligible");
    assert.strictEqual(pragati.awardAmount, 50000);
    assert.strictEqual(pragati.daysRemaining, 12);
    assert.ok(pragati.matchScore >= 80, "Match score should be high");

    // Must also match Telangana ePASS Post-Matric BC
    const epass = results.eligible.find(s => s.id === 'SCH-002');
    assert.ok(epass, "Telangana ePASS Post-Matric BC should be eligible");

    // Must also match private merit schemes
    const reliance = results.eligible.find(s => s.id === 'SCH-003');
    assert.ok(reliance, "Reliance Foundation should be eligible");

    assert.ok(results.eligibleCount >= 4, "Should qualify for at least 4 matching schemes");
  });

  it('should reject a scholarship if family income exceeds limit', () => {
    const studentHighIncome = {
      gender: 'Female',
      caste: 'BC',
      income: 900000, // Exceeds ₹8.0L Pragati limit
      state: 'Telangana',
      degree: 'Engineering',
      gpa: 8.5
    };

    const pragati = scholarships.find(s => s.id === 'SCH-001');
    const evalRes = MatchingEngine.evaluate(studentHighIncome, pragati);

    assert.strictEqual(evalRes.isEligible, false);
    assert.ok(evalRes.failReasons.some(r => r.includes('exceeds limit')));
  });

  it('should reject a scholarship if GPA is below minimum threshold', () => {
    const studentLowGpa = {
      gender: 'Female',
      caste: 'General',
      income: 100000,
      state: 'Telangana',
      degree: 'Engineering',
      gpa: 5.5 // Below Kotak Kanya 8.0 min GPA
    };

    const kotak = scholarships.find(s => s.id === 'SCH-004');
    const evalRes = MatchingEngine.evaluate(studentLowGpa, kotak);

    assert.strictEqual(evalRes.isEligible, false);
    assert.ok(evalRes.failReasons.some(r => r.includes('GPA')));
  });

  it('should restrict gender-exclusive scholarships', () => {
    const maleStudent = {
      gender: 'Male',
      caste: 'BC',
      income: 150000,
      state: 'Telangana',
      degree: 'Engineering',
      gpa: 8.5
    };

    const pragati = scholarships.find(s => s.id === 'SCH-001');
    const evalRes = MatchingEngine.evaluate(maleStudent, pragati);

    assert.strictEqual(evalRes.isEligible, false);
    assert.ok(evalRes.failReasons.some(r => r.includes('gender')));
  });
});
