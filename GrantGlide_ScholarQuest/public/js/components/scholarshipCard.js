/**
 * Scholarship Card Renderer Component
 */

window.ScholarshipCardComponent = {
  render(scholarship, isEligible = true) {
    const esc = (s) => window.Sanitizer.escapeHTML(s);
    const urgency = window.CountdownTimer.getUrgencyBadge(scholarship.daysRemaining);
    const matchScore = scholarship.matchScore || (isEligible ? 85 : 40);
    const formattedAmount = Number(scholarship.awardAmount).toLocaleString('en-IN');

    // Multilingual summary snippet if available
    const curLang = window.I18N.currentLang;
    const summary = (scholarship.summaryMultiLingual && scholarship.summaryMultiLingual[curLang])
      || (scholarship.summaryMultiLingual && scholarship.summaryMultiLingual.en)
      || scholarship.title;

    // Check if already in applications
    const apps = window.store.getState().applications;
    const appRecord = apps.find(a => a.scholarshipId === scholarship.id);
    const currentStage = appRecord ? appRecord.stage : null;

    return `
      <div class="scholarship-card ${isEligible ? 'card-eligible' : 'card-ineligible'}" data-id="${scholarship.id}">
        <div class="card-top-row">
          <span class="badge ${urgency.cls}">${urgency.label}</span>
          <span class="category-pill">${esc(scholarship.category)}</span>
          <div class="match-score-badge" title="Algorithmic Eligibility Match Score">
            <span class="score-num">${matchScore}%</span> Match
          </div>
        </div>

        <div class="card-body">
          <h3 class="scheme-title">${esc(scholarship.title)}</h3>
          <p class="scheme-provider">🏛️ <strong>Administered by:</strong> ${esc(scholarship.provider)}</p>

          <div class="award-highlight">
            <span class="award-label">Financial Award:</span>
            <span class="award-value">₹${formattedAmount}</span>
            <span class="award-frequency">/ ${esc(scholarship.awardFrequency)}</span>
          </div>

          <p class="scheme-desc">${esc(summary)}</p>

          <!-- Match / Fail reasons preview -->
          ${scholarship.matchReasons && scholarship.matchReasons.length > 0 ? `
            <div class="reasons-box success-reasons">
              <strong>✓ Why you qualify:</strong>
              <ul>
                ${scholarship.matchReasons.slice(0, 2).map(r => `<li>${esc(r)}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          ${scholarship.failReasons && scholarship.failReasons.length > 0 ? `
            <div class="reasons-box fail-reasons">
              <strong>❌ Ineligibility reasons:</strong>
              <ul>
                ${scholarship.failReasons.slice(0, 2).map(r => `<li>${esc(r)}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          ${currentStage ? `
            <div class="application-status-banner">
              📌 Status: <strong>${esc(currentStage)}</strong>
            </div>
          ` : ''}
        </div>

        <div class="card-footer">
          <button class="btn btn-outline btn-sm btn-inspect" data-id="${scholarship.id}">
            🔍 Scheme Inspector
          </button>

          <button class="btn btn-primary btn-sm btn-checklist" data-id="${scholarship.id}">
            📄 Document Checklist & Apply
          </button>

          <button class="btn btn-secondary btn-sm btn-bookmark" data-id="${scholarship.id}">
            ${currentStage === 'Bookmarked' ? '★ Bookmarked' : '☆ Bookmark'}
          </button>
        </div>
      </div>
    `;
  }
};
