/**
 * Saved & Applied Scholarship Application Pipeline Tracker Component
 * Kanban-style board organizing applications across 4 stages: Bookmarked, Applied, Under Review, Awarded.
 */

window.PipelineTrackerComponent = {
  render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const esc = (s) => window.Sanitizer.escapeHTML(s);
    const store = window.store;
    const apps = store.getState().applications || [];

    const stages = [
      { id: 'Bookmarked', label: '⭐ Bookmarked', color: 'stage-bookmarked' },
      { id: 'Applied', label: '📝 Applied', color: 'stage-applied' },
      { id: 'Under Review', label: '🔍 Under Review', color: 'stage-review' },
      { id: 'Awarded', label: '🎉 Awarded', color: 'stage-awarded' }
    ];

    container.innerHTML = `
      <div class="pipeline-section">
        <div class="section-header">
          <div>
            <h2 class="section-title">📋 'My Applications' Pipeline Dashboard</h2>
            <p class="section-subtitle">Track and organize your scholarship applications across all lifecycle stages.</p>
          </div>
          <button class="btn btn-secondary btn-sm" id="btn-refresh-pipeline">🔄 Refresh Applications</button>
        </div>

        <div class="kanban-board">
          ${stages.map(stage => {
            const stageApps = apps.filter(a => a.stage === stage.id);
            return `
              <div class="kanban-column ${stage.color}">
                <div class="column-header">
                  <h3 class="column-title">${stage.label}</h3>
                  <span class="column-count">${stageApps.length}</span>
                </div>

                <div class="column-cards">
                  ${stageApps.length === 0 ? `
                    <div class="empty-column-placeholder">No applications in this stage.</div>
                  ` : stageApps.map(app => `
                    <div class="kanban-card" data-id="${app.scholarshipId}">
                      <div class="card-title-row">
                        <h4 class="app-title">${esc(app.scholarshipTitle)}</h4>
                      </div>
                      <p class="app-provider">🏛️ ${esc(app.provider)}</p>
                      <div class="app-amount">Grant: <strong>₹${Number(app.awardAmount).toLocaleString('en-IN')}</strong></div>

                      ${app.applicationRef ? `
                        <div class="app-ref-tag">Ref: <code>${esc(app.applicationRef)}</code></div>
                      ` : ''}

                      ${app.notes ? `<p class="app-notes"><em>"${esc(app.notes)}"</em></p>` : ''}

                      <div class="card-stage-actions">
                        <label>Stage:</label>
                        <select class="stage-selector" data-id="${app.scholarshipId}">
                          ${stages.map(s => `
                            <option value="${s.id}" ${s.id === app.stage ? 'selected' : ''}>${s.label}</option>
                          `).join('')}
                        </select>
                        <button class="btn-delete-app" data-id="${app.scholarshipId}" title="Delete Application">&times;</button>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    this.bindEvents(container);
  },

  bindEvents(container) {
    // Stage Selector dropdowns
    container.querySelectorAll('.stage-selector').forEach(sel => {
      sel.addEventListener('change', async (e) => {
        const schId = e.target.getAttribute('data-id');
        const newStage = e.target.value;

        window.store.dispatch('UPDATE_APPLICATION_STAGE', { scholarshipId: schId, stage: newStage });

        // Persist to backend
        const currentApp = window.store.getState().applications.find(a => a.scholarshipId === schId);
        if (currentApp) {
          await window.API.saveApplication({ ...currentApp, stage: newStage });
        }

        window.store.dispatch('SHOW_TOAST', {
          type: 'info',
          message: `Application moved to '${newStage}' stage.`
        });

        this.render('pipeline-container');
      });
    });

    // Delete application
    container.querySelectorAll('.btn-delete-app').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const schId = e.target.getAttribute('data-id');
        await window.API.deleteApplication(schId);
        const apps = await window.API.fetchApplications();
        window.store.dispatch('SET_APPLICATIONS', apps);
        this.render('pipeline-container');

        window.store.dispatch('SHOW_TOAST', {
          type: 'warning',
          message: 'Application removed from pipeline.'
        });
      });
    });

    // Refresh button
    const refreshBtn = container.querySelector('#btn-refresh-pipeline');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        const apps = await window.API.fetchApplications();
        window.store.dispatch('SET_APPLICATIONS', apps);
        this.render('pipeline-container');
      });
    }
  }
};
