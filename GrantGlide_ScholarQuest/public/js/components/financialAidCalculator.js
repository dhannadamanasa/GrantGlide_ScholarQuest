/**
 * Financial Aid Calculator & Tuition Deficit Optimizer Component
 */

window.FinancialAidCalculatorComponent = {
  render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="card calculator-card">
        <div class="card-header">
          <div>
            <h2 class="card-title">🧮 Financial Aid & Tuition Deficit Optimizer</h2>
            <p class="card-subtitle">Calculate your annual college funding gap and discover the mathematically optimal combination of non-conflicting scholarships.</p>
          </div>
        </div>

        <div class="calculator-grid">
          <div class="calc-inputs">
            <div class="form-group">
              <label for="calc-tuition">Annual College Tuition Fee (₹):</label>
              <input type="number" id="calc-tuition" class="form-control" value="85000" min="0" step="5000">
            </div>

            <div class="form-group">
              <label for="calc-living">Annual Hostel, Mess & Books Expenses (₹):</label>
              <input type="number" id="calc-living" class="form-control" value="45000" min="0" step="5000">
            </div>

            <div class="form-group">
              <label for="calc-existing">Existing Fee Concessions or Institutional Aid (₹):</label>
              <input type="number" id="calc-existing" class="form-control" value="10000" min="0" step="5000">
            </div>

            <button id="btn-run-optimizer" class="btn btn-primary btn-block" style="margin-top: 15px;">
              ⚡ Calculate Deficit & Optimize Scholarship Portfolio
            </button>
          </div>

          <div class="calc-results" id="calc-results-view">
            <div class="results-placeholder">
              Click <strong>Calculate Deficit & Optimize</strong> to see the tailored aid recommendation.
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents(container);
  },

  bindEvents(container) {
    const btn = container.querySelector('#btn-run-optimizer');
    btn.addEventListener('click', async () => {
      const tuition = Number(document.getElementById('calc-tuition').value) || 0;
      const living = Number(document.getElementById('calc-living').value) || 0;
      const existing = Number(document.getElementById('calc-existing').value) || 0;

      const state = window.store.getState();
      const eligible = state.matchedResult.eligible && state.matchedResult.eligible.length > 0
        ? state.matchedResult.eligible
        : state.allScholarships;

      try {
        const result = await window.API.optimizeFinancialAid({
          tuitionFee: tuition,
          livingCost: living,
          existingAid: existing,
          eligibleScholarships: eligible
        });

        this.renderResults(result);
      } catch (err) {
        console.error('Optimization error:', err);
      }
    });
  },

  renderResults(opt) {
    const resultsContainer = document.getElementById('calc-results-view');
    if (!resultsContainer) return;

    const esc = (s) => window.Sanitizer.escapeHTML(s);

    resultsContainer.innerHTML = `
      <div class="optimization-card">
        <h3 class="opt-title">📊 Financial Deficit Breakdown</h3>

        <div class="deficit-metric-row">
          <div class="metric-item">
            <span class="m-label">Total Annual Cost:</span>
            <span class="m-val">₹${opt.totalCost.toLocaleString('en-IN')}</span>
          </div>
          <div class="metric-item">
            <span class="m-label">Net Financial Deficit:</span>
            <span class="m-val text-danger">₹${opt.deficit.toLocaleString('en-IN')}</span>
          </div>
          <div class="metric-item">
            <span class="m-label">Recommended Aid:</span>
            <span class="m-val text-success">₹${opt.totalAwardAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div class="coverage-bar-wrap">
          <div class="coverage-labels">
            <span>Deficit Coverage: <strong>${opt.coveragePercent}%</strong></span>
            <span>Uncovered Gap: ₹${opt.remainingDeficit.toLocaleString('en-IN')}</span>
          </div>
          <div class="progress-bar-track">
            <div class="progress-bar-fill fill-success" style="width: ${opt.coveragePercent}%;"></div>
          </div>
        </div>

        <div class="optimal-portfolio-list">
          <h4>🏆 Recommended Non-Conflicting Scheme Portfolio:</h4>
          <p class="opt-sub">These scholarships are verified safe to apply together with zero dual-availing regulatory conflicts.</p>

          ${opt.optimalCombination.length === 0 ? `
            <p>No valid combination found.</p>
          ` : `
            <ul class="combo-list">
              ${opt.optimalCombination.map((s, idx) => `
                <li class="combo-item">
                  <div class="combo-left">
                    <span class="combo-rank">#${idx + 1}</span>
                    <div>
                      <strong>${esc(s.title)}</strong>
                      <span class="combo-provider">(${esc(s.provider)})</span>
                    </div>
                  </div>
                  <span class="combo-amt">+₹${Number(s.awardAmount).toLocaleString('en-IN')}</span>
                </li>
              `).join('')}
            </ul>
          `}
        </div>

        <div class="opt-footer-note">
          ℹ️ <em>${esc(opt.explanation)}</em>
        </div>
      </div>
    `;
  }
};
