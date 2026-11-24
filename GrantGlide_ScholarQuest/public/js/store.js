/**
 * Observer Pattern Reactive State Store
 * Centralizes state management across the application, decoupling UI rendering from state mutations.
 */

class StateStore {
  constructor(initialState = {}) {
    this.state = {
      studentProfile: {
        gender: 'Female',
        caste: 'BC',
        income: 150000,
        state: 'Telangana',
        degree: 'Engineering',
        gpa: 8.5,
        isSingleGirlChild: false,
        isSpeciallyAbled: false,
        isOrphan: false,
        phone: '+91 98480 12345',
        name: 'Pooja Reddy'
      },
      allScholarships: [],
      matchedResult: {
        eligible: [],
        ineligible: [],
        conflicts: { hasConflicts: false, conflictPairs: [], warnings: [] }
      },
      activeFilterCategory: 'All',
      searchKeyword: '',
      applications: [],
      // Document upload and expiration status tracker
      studentDocuments: {
        'DOC-INC': {
          isUploaded: true,
          // Expiration in 15 days for the canonical demo test case!
          expiryDate: new Date(Date.now() + (15 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
          name: 'MeeSeva Income Certificate'
        },
        'DOC-CAS': {
          isUploaded: true,
          expiryDate: new Date(Date.now() + (400 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
          name: 'Integrated Caste Certificate'
        },
        'DOC-BON': {
          isUploaded: true,
          expiryDate: new Date(Date.now() + (60 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
          name: 'College Bonafide Letter'
        },
        'DOC-ADM': {
          isUploaded: false,
          expiryDate: null,
          name: 'Allotment Order'
        },
        'DOC-MRK': {
          isUploaded: false,
          expiryDate: null,
          name: 'Marksheets'
        }
      },
      currentTab: 'match', // 'match' | 'track' | 'optimizer' | 'whatsapp'
      selectedScholarship: null,
      activeModal: null, // 'checklist' | 'inspector' | null
      toast: null,
      ...initialState
    };

    this.listeners = new Set();
  }

  getState() {
    return this.state;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener); // Unsubscribe fn
  }

  notify(actionType) {
    for (const listener of this.listeners) {
      try {
        listener(this.state, actionType);
      } catch (err) {
        console.error('Error in store listener:', err);
      }
    }
  }

  dispatch(action, payload) {
    switch (action) {
      case 'SET_STUDENT_PROFILE':
        this.state.studentProfile = { ...this.state.studentProfile, ...payload };
        break;

      case 'SET_ALL_SCHOLARSHIPS':
        this.state.allScholarships = payload;
        break;

      case 'SET_MATCHED_RESULTS':
        this.state.matchedResult = payload;
        break;

      case 'SET_FILTER_CATEGORY':
        this.state.activeFilterCategory = payload;
        break;

      case 'SET_SEARCH_KEYWORD':
        this.state.searchKeyword = payload;
        break;

      case 'SET_APPLICATIONS':
        this.state.applications = payload;
        break;

      case 'UPDATE_APPLICATION_STAGE': {
        const { scholarshipId, stage } = payload;
        const app = this.state.applications.find(a => a.scholarshipId === scholarshipId);
        if (app) app.stage = stage;
        break;
      }

      case 'TOGGLE_DOCUMENT_STATUS': {
        const { docId, isUploaded } = payload;
        if (!this.state.studentDocuments[docId]) {
          this.state.studentDocuments[docId] = { isUploaded: false, expiryDate: null };
        }
        this.state.studentDocuments[docId].isUploaded = isUploaded;
        break;
      }

      case 'SET_CURRENT_TAB':
        this.state.currentTab = payload;
        break;

      case 'OPEN_MODAL':
        this.state.activeModal = payload.modalName;
        this.state.selectedScholarship = payload.scholarship;
        break;

      case 'CLOSE_MODAL':
        this.state.activeModal = null;
        this.state.selectedScholarship = null;
        break;

      case 'SHOW_TOAST':
        this.state.toast = payload;
        break;

      case 'CLEAR_TOAST':
        this.state.toast = null;
        break;

      default:
        console.warn(`Unknown action dispatched: ${action}`);
        return;
    }

    this.notify(action);
  }
}

window.store = new StateStore();
