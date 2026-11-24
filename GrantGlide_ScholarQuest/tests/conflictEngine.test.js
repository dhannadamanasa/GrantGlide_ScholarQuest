/**
 * Unit Tests: Policy Conflict Engine & Financial Aid Optimizer
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');

const ConflictEngine = require('../src/services/conflictEngine');
const OptimizerEngine = require('../src/services/optimizerEngine');
const scholarships = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../src/data/scholarships.json'), 'utf-8')
);

describe('Policy Conflict Resolution Engine Tests', () => {
  it('should detect regulatory conflict between mutually exclusive government schemes', () => {
    // Pragati (SCH-001) conflicts with CSSS (SCH-007) and Telangana ePASS (SCH-002)
    const selectedIds = ['SCH-001', 'SCH-007'];
    const result = ConflictEngine.detectConflicts(selectedIds, scholarships);

    assert.strictEqual(result.hasConflicts, true);
    assert.strictEqual(result.conflictPairs.length, 1);
    assert.ok(result.warnings[0].includes('Regulatory Policy Conflict'));
  });

  it('should allow non-conflicting combinations of private and government scholarships', () => {
    // Pragati (SCH-001) + Reliance Foundation (SCH-003) - Allowed!
    const selectedIds = ['SCH-001', 'SCH-003'];
    const result = ConflictEngine.detectConflicts(selectedIds, scholarships);

    assert.strictEqual(result.hasConflicts, false);
    assert.strictEqual(result.conflictPairs.length, 0);
  });
});

describe('Financial Aid Optimizer Engine Tests', () => {
  it('should compute tuition deficit and recommend an optimal non-conflicting portfolio', () => {
    const params = {
      tuitionFee: 120000,
      livingCost: 40000,
      existingAid: 10000,
      eligibleScholarships: [
        { id: 'SCH-001', title: 'Pragati', awardAmount: 50000, conflictsWith: ['SCH-007', 'SCH-028'], daysRemaining: 12 },
        { id: 'SCH-003', title: 'Reliance Foundation', awardAmount: 50000, conflictsWith: [], daysRemaining: 24 },
        { id: 'SCH-007', title: 'CSSS', awardAmount: 20000, conflictsWith: ['SCH-001'], daysRemaining: 21 },
        { id: 'SCH-006', title: 'Santoor', awardAmount: 24000, conflictsWith: [], daysRemaining: 15 }
      ],
      allScholarships: scholarships
    };

    const optimization = OptimizerEngine.optimize(params);

    assert.strictEqual(optimization.totalCost, 160000);
    assert.strictEqual(optimization.deficit, 150000);
    assert.ok(optimization.optimalCombination.length >= 2, "Should select multiple non-conflicting schemes");

    // The combination should not contain both SCH-001 and SCH-007
    const comboIds = optimization.optimalCombination.map(s => s.id);
    const hasConflict = comboIds.includes('SCH-001') && comboIds.includes('SCH-007');
    assert.strictEqual(hasConflict, false, "Optimal combination must not have policy conflicts");
    assert.ok(optimization.totalAwardAmount > 0);
  });
});
