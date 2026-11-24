/**
 * Integration Tests: REST API Routes, XSS Sanitization & Security Validation
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');

const Sanitizer = require('../src/middleware/sanitizer');
const ProfileValidator = require('../src/middleware/validator');
const { handlers } = require('../server');

describe('Security Sanitization & Validation Tests', () => {
  it('should strip malicious script tags and inline event handlers to prevent XSS', () => {
    const maliciousPayload = {
      name: '<script>alert("XSS")</script>Pooja Reddy',
      notes: '<img src="x" onerror="stealCookies()">Urgent application',
      state: 'javascript:void(0)Telangana'
    };

    const sanitized = Sanitizer.cleanObject(maliciousPayload);

    assert.strictEqual(sanitized.name.includes('<script>'), false);
    assert.strictEqual(sanitized.name.includes('alert'), false);
    assert.strictEqual(sanitized.notes.includes('onerror'), false);
    assert.strictEqual(sanitized.state.includes('javascript:'), false);
    assert.ok(sanitized.name.includes('Pooja Reddy'));
  });

  it('should reject profiles with negative income or invalid GPA', () => {
    const invalidProfile = {
      gender: 'Female',
      caste: 'BC',
      income: -50000,
      state: 'Telangana',
      degree: 'Engineering',
      gpa: 14.5 // Exceeds 10.0 scale
    };

    const val = ProfileValidator.validateStudentProfile(invalidProfile);
    assert.strictEqual(val.isValid, false);
    assert.ok(val.errors.some(e => e.includes('income')));
    assert.ok(val.errors.some(e => e.includes('GPA')));
  });
});

describe('REST API Handlers Tests', () => {
  it('GET /api/scholarships should return 30+ authentic scholarships', () => {
    const res = handlers.getScholarships();
    assert.strictEqual(res.success, true);
    assert.ok(res.count >= 30, `Expected at least 30 scholarships, got ${res.count}`);
  });

  it('GET /api/health should report online status and metrics', () => {
    const health = handlers.getHealth();
    assert.strictEqual(health.success, true);
    assert.ok(health.scholarshipsCount >= 30);
  });

  it('POST /api/match should process matching and conflict detection', () => {
    const student = {
      gender: 'Female',
      caste: 'BC',
      income: 150000,
      state: 'Telangana',
      degree: 'Engineering',
      gpa: 8.5
    };

    const res = handlers.matchProfile(student);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.payload.success, true);
    assert.ok(res.payload.eligibleScholarships.length >= 4);
    assert.ok(res.payload.conflicts);
  });

  it('POST /api/applications and GET /api/applications should persist tracked records', () => {
    const newApp = {
      scholarshipId: 'SCH-TEST-99',
      scholarshipTitle: 'Test Grant',
      stage: 'Bookmarked',
      notes: 'Test application record'
    };

    const saveRes = handlers.saveApplication(newApp);
    assert.strictEqual(saveRes.status, 200);

    const listRes = handlers.getApplications();
    assert.strictEqual(listRes.success, true);
    const found = listRes.data.find(a => a.scholarshipId === 'SCH-TEST-99');
    assert.ok(found, "Saved application should appear in persistence list");

    // Cleanup
    handlers.deleteApplication('SCH-TEST-99');
  });
});
