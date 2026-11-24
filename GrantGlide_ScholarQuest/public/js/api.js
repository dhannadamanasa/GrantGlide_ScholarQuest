/**
 * HTTP API Service Layer
 * Encapsulates network operations, global error boundaries, and fallback caching.
 */

window.API = {
  baseUrl: window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
    ? ''
    : '',

  async fetchScholarships(query = {}) {
    try {
      const params = new URLSearchParams(query);
      const res = await fetch(`/api/scholarships?${params.toString()}`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const json = await res.json();
      return json.data || [];
    } catch (err) {
      console.warn('Network API failure, falling back to local cache or offline store:', err);
      window.store.dispatch('SHOW_TOAST', {
        type: 'warning',
        message: 'Running in offline / local fallback mode.'
      });
      return [];
    }
  },

  async matchProfile(profile) {
    try {
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || `Server responded with ${res.status}`);
      }
      return json;
    } catch (err) {
      console.error('API Error during profile matching:', err);
      window.store.dispatch('SHOW_TOAST', {
        type: 'error',
        message: `Matching API error: ${err.message}`
      });
      throw err;
    }
  },

  async fetchApplications() {
    try {
      const res = await fetch('/api/applications');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.data || [];
    } catch (err) {
      console.warn('Failed to fetch applications from server:', err);
      return [];
    }
  },

  async saveApplication(appData) {
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appData)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save application');
      return json.data;
    } catch (err) {
      console.error('Error saving application:', err);
      window.store.dispatch('SHOW_TOAST', {
        type: 'error',
        message: `Save error: ${err.message}`
      });
      throw err;
    }
  },

  async deleteApplication(id) {
    try {
      const res = await fetch(`/api/applications/${id}`, { method: 'DELETE' });
      const json = await res.json();
      return json.success;
    } catch (err) {
      console.error('Error deleting application:', err);
      return false;
    }
  },

  async evaluateDocuments(scholarshipId, studentDocuments) {
    try {
      const res = await fetch('/api/documents/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scholarshipId, studentDocuments })
      });
      const json = await res.json();
      return json.checklist;
    } catch (err) {
      console.error('Error evaluating documents:', err);
      return null;
    }
  },

  async optimizeFinancialAid(params) {
    try {
      const res = await fetch('/api/optimize-aid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      const json = await res.json();
      return json.optimization;
    } catch (err) {
      console.error('Error running financial aid optimizer:', err);
      throw err;
    }
  },

  async simulateWhatsApp(params) {
    try {
      const res = await fetch('/api/whatsapp-simulator/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      const json = await res.json();
      return json.alert;
    } catch (err) {
      console.error('Error simulating WhatsApp alert:', err);
      throw err;
    }
  }
};
