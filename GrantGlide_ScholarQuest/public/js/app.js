/**
 * GrantGlide: ScholarQuest - Main Application Controller
 * Connects decoupled components, orchestrates Observer state updates,
 * manages tab transitions and search/category filter pills.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const store = window.store;

  // 1. Initial Data Fetch
  try {
    const allScholarships = await window.API.fetchScholarships();
    store.dispatch('SET_ALL_SCHOLARSHIPS', allScholarships);

    const apps = await window.API.fetchApplications();
    store.dispatch('SET_APPLICATIONS', apps);
  } catch (err) {
    console.error('Initialization error:', err);
  }

  // 2. Component Initializations
  window.IntakeFormComponent.render('intake-container');
  window.PipelineTrackerComponent.render('pipeline-container');
  window.FinancialAidCalculatorComponent.render('calculator-container');
  window.WhatsAppSimulatorComponent.render('whatsapp-container');

  // 3. Render Scholarship Feed based on Store State
  function renderScholarshipFeed() {
    const feedContainer = document.getElementById('feed-container');
    if (!feedContainer) return;

    const state = store.getState();
    const activeCategory = state.activeFilterCategory;
    const searchKw = state.searchKeyword.toLowerCase();

    // Determine candidate list (eligible or all)
    let candidates = state.matchedResult.eligible.length > 0
      ? state.matchedResult.eligible
      : state.allScholarships;

    // Apply Category Filter Pill
    if (activeCategory !== 'All') {
      candidates = candidates.filter(s => s.category.toLowerCase() === activeCategory.toLowerCase());
    }

    // Apply Search Keyword Filter
    if (searchKw) {
      candidates = candidates.filter(s =>
        s.title.toLowerCase().includes(searchKw) ||
        s.provider.toLowerCase().includes(searchKw) ||
        s.category.toLowerCase().includes(searchKw)
      );
    }

    const countHeader = document.getElementById('feed-count-header');
    if (countHeader) {
      countHeader.innerText = `${candidates.length} Scholarships Found`;
    }

    // Check for Policy Conflicts Alert
    const conflicts = state.matchedResult.conflicts;
    const conflictBanner = document.getElementById('conflict-alert-banner');
    if (conflictBanner) {
      if (conflicts && conflicts.hasConflicts) {
        conflictBanner.style.display = 'block';
        conflictBanner.innerHTML = `
          <div class="alert-box alert-conflict">
            <h4>⚠️ Regulatory Policy Conflict Warning (Dual Availing Prevention)</h4>
            <p>Our intelligent deduplication engine detected mutually exclusive government scholarship schemes in your qualifying feed:</p>
            <ul>
              ${conflicts.conflictPairs.map(cp => `
                <li><strong>${cp.schemeA.title}</strong> cannot be availed alongside <strong>${cp.schemeB.title}</strong> (${cp.reason})</li>
              `).join('')}
            </ul>
          </div>
        `;
      } else {
        conflictBanner.style.display = 'none';
      }
    }

    if (candidates.length === 0) {
      feedContainer.innerHTML = `
        <div class="empty-feed-card">
          <p>No scholarships match the selected filters. Try choosing 'All' categories or adjusting search keywords.</p>
        </div>
      `;
      return;
    }

    feedContainer.innerHTML = candidates.map(sch => {
      const isEligible = state.matchedResult.eligible.length === 0 ||
        state.matchedResult.eligible.some(e => e.id === sch.id);
      return window.ScholarshipCardComponent.render(sch, isEligible);
    }).join('');

    // Attach card event listeners
    bindCardEvents(feedContainer);
  }

  function bindCardEvents(container) {
    // Scheme Inspector
    container.querySelectorAll('.btn-inspect').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        const sch = store.getState().allScholarships.find(s => s.id === id);
        if (sch) window.SchemeInspectorComponent.render(sch);
      });
    });

    // Document Checklist & Apply
    container.querySelectorAll('.btn-checklist').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        const sch = store.getState().allScholarships.find(s => s.id === id);
        if (sch) window.DocumentChecklistComponent.render(sch);
      });
    });

    // Bookmark / Unbookmark
    container.querySelectorAll('.btn-bookmark').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');
        const sch = store.getState().allScholarships.find(s => s.id === id);
        if (!sch) return;

        const currentApp = store.getState().applications.find(a => a.scholarshipId === id);
        if (currentApp) {
          // Already tracked, toggle or update
          store.dispatch('SHOW_TOAST', { type: 'info', message: `'${sch.title}' is already in your application pipeline.` });
        } else {
          await window.API.saveApplication({
            scholarshipId: sch.id,
            scholarshipTitle: sch.title,
            provider: sch.provider,
            awardAmount: sch.awardAmount,
            stage: 'Bookmarked',
            notes: 'Bookmarked for later review'
          });
          const updated = await window.API.fetchApplications();
          store.dispatch('SET_APPLICATIONS', updated);
          store.dispatch('SHOW_TOAST', { type: 'success', message: `Bookmarked '${sch.title}'!` });
          renderScholarshipFeed();
          window.PipelineTrackerComponent.render('pipeline-container');
        }
      });
    });
  }

  // 4. Tab Navigation Management
  const navTabs = document.querySelectorAll('.nav-tab');
  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');
      navTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      document.querySelectorAll('.tab-view').forEach(view => {
        view.style.display = 'none';
      });

      const activeView = document.getElementById(`tab-view-${targetTab}`);
      if (activeView) activeView.style.display = 'block';

      store.dispatch('SET_CURRENT_TAB', targetTab);
    });
  });

  // 5. Category Filter Pills
  const filterPills = document.querySelectorAll('.filter-pill');
  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const category = pill.getAttribute('data-category');
      store.dispatch('SET_FILTER_CATEGORY', category);
      renderScholarshipFeed();
    });
  });

  // 6. Search Bar Input
  const searchInput = document.getElementById('search-scholarships');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      store.dispatch('SET_SEARCH_KEYWORD', e.target.value);
      renderScholarshipFeed();
    });
  }

  // 7. Language Selector
  const langSelect = document.getElementById('select-language');
  if (langSelect) {
    langSelect.addEventListener('change', (e) => {
      window.I18N.setLanguage(e.target.value);
    });
  }

  document.addEventListener('languageChanged', () => {
    window.IntakeFormComponent.render('intake-container');
    renderScholarshipFeed();
  });

  // 8. Global Toast Handler
  const toastContainer = document.getElementById('toast-container');
  function showToast(toast) {
    if (!toast || !toastContainer) return;
    const toastEl = document.createElement('div');
    toastEl.className = `toast toast-${toast.type || 'info'} animated-slide`;
    toastEl.innerText = toast.message;
    toastContainer.appendChild(toastEl);

    setTimeout(() => {
      toastEl.classList.add('toast-fade');
      setTimeout(() => toastEl.remove(), 400);
    }, 3500);
  }

  // 9. Observer Pattern Store Subscription
  store.subscribe((state, action) => {
    if (action === 'SET_MATCHED_RESULTS' || action === 'SET_ALL_SCHOLARSHIPS') {
      renderScholarshipFeed();
    }
    if (action === 'SHOW_TOAST' && state.toast) {
      showToast(state.toast);
    }
  });

  // 10. Auto-trigger Initial Matching for the Benchmark Profile
  const initialProfile = store.getState().studentProfile;
  try {
    const initialMatch = await window.API.matchProfile(initialProfile);
    store.dispatch('SET_MATCHED_RESULTS', {
      eligible: initialMatch.eligibleScholarships || [],
      ineligible: initialMatch.ineligibleScholarships || [],
      conflicts: initialMatch.conflicts || {}
    });
  } catch (err) {
    renderScholarshipFeed();
  }
});
