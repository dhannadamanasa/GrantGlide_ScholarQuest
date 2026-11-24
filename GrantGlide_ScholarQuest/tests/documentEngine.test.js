/**
 * Unit Tests: Document Engine & Expiration Alert System
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');

const DocumentEngine = require('../src/services/documentEngine');

describe('Document Normalizer & Expiration Alert Tests', () => {
  it('should flag certificates expiring within 30 days with a yellow renewal warning', () => {
    const requiredDocs = [
      { id: 'DOC-INC', name: 'MeeSeva Income Certificate', canonicalType: 'income_proof', isMandatory: true },
      { id: 'DOC-CAS', name: 'Caste Certificate', canonicalType: 'caste_proof', isMandatory: true }
    ];

    // Simulate an income certificate expiring in 15 days
    const now = new Date();
    const expiryIn15Days = new Date(now.getTime() + (15 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
    const expiryIn60Days = new Date(now.getTime() + (60 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];

    const studentDocs = {
      'DOC-INC': { isUploaded: true, expiryDate: expiryIn15Days },
      'DOC-CAS': { isUploaded: true, expiryDate: expiryIn60Days }
    };

    const result = DocumentEngine.evaluateChecklist(requiredDocs, studentDocs);

    assert.strictEqual(result.hasExpiringDocs, true);
    assert.strictEqual(result.expirationWarnings.length, 1);
    assert.strictEqual(result.expirationWarnings[0].status, 'expiring_soon');
    assert.ok(result.expirationWarnings[0].message.includes('Prompt renewal needed'));
  });

  it('should flag expired certificates with an error status', () => {
    const requiredDocs = [
      { id: 'DOC-INC', name: 'Income Certificate', canonicalType: 'income_proof', isMandatory: true }
    ];

    const yesterday = new Date(Date.now() - (24 * 60 * 60 * 1000)).toISOString().split('T')[0];
    const studentDocs = {
      'DOC-INC': { isUploaded: true, expiryDate: yesterday }
    };

    const result = DocumentEngine.evaluateChecklist(requiredDocs, studentDocs);
    assert.strictEqual(result.expirationWarnings[0].status, 'expired');
  });

  it('should normalize diverse state-specific document names into canonical schemas', () => {
    const rawDoc = { id: 'DOC-TS-INC', name: 'Tahsildar Income Patra', canonicalType: 'income_proof' };
    const normalized = DocumentEngine.normalizeDocument(rawDoc);

    assert.strictEqual(normalized.canonicalName, 'Proof of Family Income');
    assert.ok(normalized.issuingAuthority.includes('Tahsildar'));
  });
});
