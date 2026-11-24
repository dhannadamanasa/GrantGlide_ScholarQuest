/**
 * Student Demographic Intake Form Component
 */

window.IntakeFormComponent = {
  render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const t = (k) => window.I18N.t(k);
    const state = window.store.getState();
    const profile = state.studentProfile;

    container.innerHTML = `
      <div class="card intake-card">
        <div class="card-header">
          <div class="header-content">
            <h2 class="card-title">${t('intakeTitle')}</h2>
            <p class="card-subtitle">${t('intakeSub')}</p>
          </div>
          <button id="btn-load-demo" class="btn btn-secondary btn-sm" title="Pre-loads standard demo attributes">
            ${t('btnDemoProfile')}
          </button>
        </div>

        <form id="intake-form" class="grid-form">
          <!-- Gender -->
          <div class="form-group">
            <label for="input-gender">${t('gender')} <span class="required">*</span></label>
            <select id="input-gender" class="form-control" required>
              <option value="Female" ${profile.gender === 'Female' ? 'selected' : ''}>Female</option>
              <option value="Male" ${profile.gender === 'Male' ? 'selected' : ''}>Male</option>
              <option value="Other" ${profile.gender === 'Other' ? 'selected' : ''}>Other</option>
            </select>
          </div>

          <!-- Caste / Social Category -->
          <div class="form-group">
            <label for="input-caste">${t('caste')} <span class="required">*</span></label>
            <select id="input-caste" class="form-control" required>
              <option value="BC" ${profile.caste === 'BC' ? 'selected' : ''}>Backward Classes (BC)</option>
              <option value="OBC" ${profile.caste === 'OBC' ? 'selected' : ''}>Other Backward Classes (OBC)</option>
              <option value="SC" ${profile.caste === 'SC' ? 'selected' : ''}>Scheduled Castes (SC)</option>
              <option value="ST" ${profile.caste === 'ST' ? 'selected' : ''}>Scheduled Tribes (ST)</option>
              <option value="Minority" ${profile.caste === 'Minority' ? 'selected' : ''}>Religious Minority</option>
              <option value="EWS" ${profile.caste === 'EWS' ? 'selected' : ''}>Economically Weaker Section (EWS)</option>
              <option value="General" ${profile.caste === 'General' ? 'selected' : ''}>General / Open</option>
            </select>
          </div>

          <!-- Family Income -->
          <div class="form-group">
            <label for="input-income">${t('income')} <span class="required">*</span></label>
            <input type="number" id="input-income" class="form-control" value="${profile.income}" min="0" max="10000000" step="5000" required>
            <small class="form-hint">E.g., 150000 for ₹1.5 Lakhs</small>
          </div>

          <!-- Domicile State -->
          <div class="form-group">
            <label for="input-state">${t('state')} <span class="required">*</span></label>
            <select id="input-state" class="form-control" required>
              <option value="Telangana" ${profile.state === 'Telangana' ? 'selected' : ''}>Telangana</option>
              <option value="Andhra Pradesh" ${profile.state === 'Andhra Pradesh' ? 'selected' : ''}>Andhra Pradesh</option>
              <option value="Karnataka" ${profile.state === 'Karnataka' ? 'selected' : ''}>Karnataka</option>
              <option value="Maharashtra" ${profile.state === 'Maharashtra' ? 'selected' : ''}>Maharashtra</option>
              <option value="Tamil Nadu" ${profile.state === 'Tamil Nadu' ? 'selected' : ''}>Tamil Nadu</option>
              <option value="Delhi" ${profile.state === 'Delhi' ? 'selected' : ''}>Delhi</option>
              <option value="Uttar Pradesh" ${profile.state === 'Uttar Pradesh' ? 'selected' : ''}>Uttar Pradesh</option>
              <option value="Other State" ${profile.state === 'Other State' ? 'selected' : ''}>Other State</option>
            </select>
          </div>

          <!-- Degree -->
          <div class="form-group">
            <label for="input-degree">${t('degree')} <span class="required">*</span></label>
            <select id="input-degree" class="form-control" required>
              <option value="Engineering" ${profile.degree === 'Engineering' ? 'selected' : ''}>Engineering / Technology (B.Tech/BE)</option>
              <option value="Medical" ${profile.degree === 'Medical' ? 'selected' : ''}>Medical / Healthcare (MBBS/BDS)</option>
              <option value="Arts/Science" ${profile.degree === 'Arts/Science' ? 'selected' : ''}>Pure & Applied Sciences (B.Sc/BA)</option>
              <option value="Commerce" ${profile.degree === 'Commerce' ? 'selected' : ''}>Commerce & Finance (B.Com/BBA)</option>
              <option value="Diploma" ${profile.degree === 'Diploma' ? 'selected' : ''}>Polytechnic Diploma</option>
              <option value="Law" ${profile.degree === 'Law' ? 'selected' : ''}>Law (LLB)</option>
            </select>
          </div>

          <!-- Academic GPA -->
          <div class="form-group">
            <label for="input-gpa">${t('gpa')} <span class="required">*</span></label>
            <input type="number" id="input-gpa" class="form-control" value="${profile.gpa}" min="0" max="10" step="0.1" required>
            <small class="form-hint">Scale of 0.00 to 10.00 CGPA</small>
          </div>

          <!-- Special Checkboxes -->
          <div class="form-group full-width special-options">
            <label class="checkbox-label">
              <input type="checkbox" id="chk-single-girl" ${profile.isSingleGirlChild ? 'checked' : ''}>
              <span>Single Girl Child in family</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" id="chk-pwd" ${profile.isSpeciallyAbled ? 'checked' : ''}>
              <span>Specially Abled (Benchmark PwD &ge; 40%)</span>
            </label>
          </div>

          <!-- Submit Button -->
          <div class="form-actions full-width">
            <button type="submit" class="btn btn-primary btn-lg">
              🔍 ${t('btnEvaluate')}
            </button>
          </div>
        </form>
      </div>
    `;

    this.bindEvents(container);
  },

  bindEvents(container) {
    const form = container.querySelector('#intake-form');
    const demoBtn = container.querySelector('#btn-load-demo');

    demoBtn.addEventListener('click', (e) => {
      e.preventDefault();
      // Load benchmark demo student attributes
      const demoProfile = {
        gender: 'Female',
        caste: 'BC',
        income: 150000,
        state: 'Telangana',
        degree: 'Engineering',
        gpa: 8.5,
        isSingleGirlChild: false,
        isSpeciallyAbled: false
      };
      window.store.dispatch('SET_STUDENT_PROFILE', demoProfile);
      this.render('intake-container');

      window.store.dispatch('SHOW_TOAST', {
        type: 'info',
        message: 'Loaded Benchmark Profile: Telangana, BC Female, ₹1.5L Income, 8.5 GPA'
      });

      // Trigger automatic evaluation
      this.triggerMatch(demoProfile);
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const updatedProfile = {
        gender: document.getElementById('input-gender').value,
        caste: document.getElementById('input-caste').value,
        income: Number(document.getElementById('input-income').value),
        state: document.getElementById('input-state').value,
        degree: document.getElementById('input-degree').value,
        gpa: Number(document.getElementById('input-gpa').value),
        isSingleGirlChild: document.getElementById('chk-single-girl').checked,
        isSpeciallyAbled: document.getElementById('chk-pwd').checked
      };

      window.store.dispatch('SET_STUDENT_PROFILE', updatedProfile);
      this.triggerMatch(updatedProfile);
    });
  },

  async triggerMatch(profile) {
    try {
      const matchData = await window.API.matchProfile(profile);
      window.store.dispatch('SET_MATCHED_RESULTS', {
        eligible: matchData.eligibleScholarships || [],
        ineligible: matchData.ineligibleScholarships || [],
        conflicts: matchData.conflicts || {}
      });

      window.store.dispatch('SHOW_TOAST', {
        type: 'success',
        message: `Evaluation Complete! Found ${matchData.eligibleCount} qualifying scholarships.`
      });

      // Scroll smoothly to results
      const resultsEl = document.getElementById('feed-container');
      if (resultsEl) resultsEl.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      console.error('Match failed:', err);
    }
  }
};
