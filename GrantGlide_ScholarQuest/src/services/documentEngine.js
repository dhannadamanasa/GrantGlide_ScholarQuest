/**
 * Document Normalization & Expiration Alert Engine.
 * Normalizes state-specific document naming conventions into canonical categories
 * and flags certificates expiring within 30 days to prompt timely revenue authority renewal.
 */

class DocumentEngine {
  // Canonical dictionary mapping diverse state titles to standardized schemas
  static CANONICAL_TYPES = {
    income_proof: {
      canonicalName: 'Proof of Family Income',
      typicalValidityDays: 365,
      issuingAuthority: 'Tahsildar / Revenue Department / MeeSeva / SSP / Form-16'
    },
    caste_proof: {
      canonicalName: 'Proof of Caste / Social Category',
      typicalValidityDays: 1095, // ~3 years or permanent
      issuingAuthority: 'Sub-Divisional Magistrate / Revenue Divisional Officer'
    },
    domicile_proof: {
      canonicalName: 'Proof of Domicile / Native Residence',
      typicalValidityDays: 730,
      issuingAuthority: 'Tahsildar / Village Administrative Officer'
    },
    bonafide_proof: {
      canonicalName: 'Institutional Bonafide & Study Certificate',
      typicalValidityDays: 180, // 6 months (per semester/academic year)
      issuingAuthority: 'College Principal / Registrar / Head of Institution'
    },
    marksheet_proof: {
      canonicalName: 'Official Academic Marksheets & Transcripts',
      typicalValidityDays: 3650,
      issuingAuthority: 'State Board / CBSE / University Examination Cell'
    },
    admission_proof: {
      canonicalName: 'Centralized Admission Allotment Letter & Fee Receipt',
      typicalValidityDays: 365,
      issuingAuthority: 'State CET Cell / Joint Seat Allocation Authority (JoSAA)'
    },
    bank_proof: {
      canonicalName: 'Student Aadhaar-Seeded Bank Passbook',
      typicalValidityDays: 730,
      issuingAuthority: 'Nationalized / Scheduled Commercial Bank'
    },
    special_proof: {
      canonicalName: 'Special Category Verification (PwD / Defense / Orphan)',
      typicalValidityDays: 1095,
      issuingAuthority: 'District Medical Board / Zila Sainik Welfare Board'
    }
  };

  /**
   * Normalizes document names and determines canonical type.
   */
  static normalizeDocument(doc) {
    const canonicalType = doc.canonicalType || 'bonafide_proof';
    const metadata = this.CANONICAL_TYPES[canonicalType] || this.CANONICAL_TYPES.bonafide_proof;

    return {
      id: doc.id,
      originalName: doc.name,
      canonicalType,
      canonicalName: metadata.canonicalName,
      issuingAuthority: metadata.issuingAuthority,
      isMandatory: Boolean(doc.isMandatory)
    };
  }

  /**
   * Evaluates document readiness, upload status, and expiration status.
   * @param {Array} requiredDocs - List of required documents for a scholarship
   * @param {Object} studentDocsStatus - { [docId]: { isUploaded: boolean, issueDate: string, expiryDate: string, customName: string } }
   * @returns {Object} - Checklist analysis with ready count, missing count, and expiration warnings
   */
  static evaluateChecklist(requiredDocs, studentDocsStatus = {}) {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

    let readyCount = 0;
    const items = [];
    const expirationWarnings = [];

    for (const doc of requiredDocs) {
      const normalized = this.normalizeDocument(doc);
      const userDoc = studentDocsStatus[doc.id] || studentDocsStatus[doc.canonicalType] || {};

      const isUploaded = Boolean(userDoc.isUploaded);
      let expiryStatus = 'valid'; // 'valid' | 'expiring_soon' | 'expired' | 'no_date'
      let daysUntilExpiry = null;
      let alertMessage = null;

      if (userDoc.expiryDate) {
        const expDate = new Date(userDoc.expiryDate);
        if (!isNaN(expDate.getTime())) {
          const diffTime = expDate.getTime() - now.getTime();
          daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (daysUntilExpiry < 0) {
            expiryStatus = 'expired';
            alertMessage = `Expired ${Math.abs(daysUntilExpiry)} days ago. Mandatory renewal required immediately!`;
            expirationWarnings.push({
              docId: doc.id,
              name: doc.name,
              status: 'expired',
              message: alertMessage
            });
          } else if (daysUntilExpiry <= 30) {
            expiryStatus = 'expiring_soon';
            alertMessage = `Expires in ${daysUntilExpiry} days. Prompt renewal needed from local revenue office.`;
            expirationWarnings.push({
              docId: doc.id,
              name: doc.name,
              status: 'expiring_soon',
              daysRemaining: daysUntilExpiry,
              message: alertMessage
            });
          }
        }
      }

      if (isUploaded && expiryStatus !== 'expired') {
        readyCount++;
      }

      items.push({
        ...normalized,
        isUploaded,
        expiryStatus,
        daysUntilExpiry,
        expiryDate: userDoc.expiryDate || null,
        alertMessage
      });
    }

    const totalDocs = requiredDocs.length;
    const readinessPercent = totalDocs > 0 ? Math.round((readyCount / totalDocs) * 100) : 100;

    return {
      readyCount,
      totalDocs,
      readinessPercent,
      isFullyReady: readyCount === totalDocs && expirationWarnings.length === 0,
      hasExpiringDocs: expirationWarnings.length > 0,
      items,
      expirationWarnings
    };
  }
}

module.exports = DocumentEngine;
