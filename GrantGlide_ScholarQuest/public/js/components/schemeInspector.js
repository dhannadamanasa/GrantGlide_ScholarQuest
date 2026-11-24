/**
 * Detailed Scholarship Scheme Inspector Modal Component
 */

window.SchemeInspectorComponent = {
  render(scholarship) {
    const esc = (s) => window.Sanitizer.escapeHTML(s);
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'inspector-modal';
    modalOverlay.className = 'modal-backdrop';

    const rules = scholarship.rules || {};
    const conflictList = scholarship.conflictsWith || [];

    modalOverlay.innerHTML = `
      <div class="modal-box inspector-modal-box">
        <div class="modal-header">
          <div>
            <span class="category-pill">${esc(scholarship.category)}</span>
            <h3 class="modal-title" style="margin-top: 6px;">${esc(scholarship.title)}</h3>
            <p class="modal-subtitle">Administering Body: <strong>${esc(scholarship.provider)}</strong></p>
          </div>
          <button class="btn-close" id="btn-close-inspector">&times;</button>
        </div>

        <div class="modal-body">
          <!-- Award Banner -->
          <div class="inspector-stat-grid">
            <div class="stat-card">
              <span class="stat-label">Grant Amount</span>
              <span class="stat-value text-success">₹${Number(scholarship.awardAmount).toLocaleString('en-IN')}</span>
              <span class="stat-sub">${esc(scholarship.awardFrequency)}</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">Deadline Countdown</span>
              <span class="stat-value text-primary">${scholarship.daysRemaining} Days</span>
              <span class="stat-sub">Online Portal Closes Soon</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">Minimum Eligibility</span>
              <span class="stat-value">${rules.minGpa ? rules.minGpa.toFixed(1) + ' CGPA' : 'Pass'}</span>
              <span class="stat-sub">Income &le; ₹${Number(rules.maxIncome || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>

          <!-- Policy Conflict Warning Badge if any -->
          ${conflictList.length > 0 ? `
            <div class="alert-box alert-conflict">
              ⚠️ <strong>Policy Conflict Notice (Dual Availing Prevention):</strong>
              <p>Under statutory guidelines, beneficiaries receiving this scheme <em>cannot</em> simultaneously claim financial benefits from the following schemes: <strong>${conflictList.join(', ')}</strong>. Availing both will trigger automated deduplication and recovery proceedings.</p>
            </div>
          ` : ''}

          <!-- Detailed Criteria Grid -->
          <div class="detail-section">
            <h4>📋 Eligibility Criteria Rules:</h4>
            <div class="criteria-table-wrap">
              <table class="table-criteria">
                <tr><th>Eligible Genders</th><td>${(rules.allowedGenders || []).join(', ')}</td></tr>
                <tr><th>Social Categories (Caste)</th><td>${(rules.allowedCastes || []).join(', ')}</td></tr>
                <tr><th>Income Ceiling</th><td>₹${Number(rules.maxIncome || 0).toLocaleString('en-IN')} per annum</td></tr>
                <tr><th>State of Domicile</th><td>${(rules.allowedStates || []).join(', ')}</td></tr>
                <tr><th>Eligible Degrees</th><td>${(rules.allowedDegrees || []).join(', ')}</td></tr>
                <tr><th>Minimum GPA Required</th><td>${rules.minGpa ? rules.minGpa.toFixed(2) : 'No cut-off'}</td></tr>
                <tr><th>Special Qualifications</th><td>${rules.specialConditions || 'None'}</td></tr>
              </table>
            </div>
          </div>

          <!-- Renewal Conditions -->
          <div class="detail-section">
            <h4>🔄 Annual Renewal Conditions:</h4>
            <div class="info-callout">
              ${esc(scholarship.renewalConditions || 'Students must pass all exams and submit progressive semester marksheets annually.')}
            </div>
          </div>

          <!-- Required Documents -->
          <div class="detail-section">
            <h4>📁 Mandatory Documentation:</h4>
            <ul class="doc-tags-list">
              ${(scholarship.documents || []).map(d => `
                <li class="doc-tag">${esc(d.name)} ${d.isMandatory ? '★' : ''}</li>
              `).join('')}
            </ul>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" id="btn-cancel-inspector">Close</button>
          <a href="${scholarship.officialUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-outline" style="text-decoration:none;">
            🌐 Open Official Portal Link ↗
          </a>
          <button class="btn btn-primary" id="btn-proceed-checklist">
            Proceed to Document Checklist →
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modalOverlay);

    const close = () => modalOverlay.remove();
    modalOverlay.querySelector('#btn-close-inspector').addEventListener('click', close);
    modalOverlay.querySelector('#btn-cancel-inspector').addEventListener('click', close);
    modalOverlay.querySelector('#btn-proceed-checklist').addEventListener('click', () => {
      close();
      window.DocumentChecklistComponent.render(scholarship);
    });
  }
};
