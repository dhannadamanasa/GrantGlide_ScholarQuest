/**
 * GrantGlide: ScholarQuest - Unified Backend Server
 * Provides full Express REST API when Express is installed,
 * with an automatic built-in Node.js HTTP server fallback for zero-dependency execution.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

// Services & Middleware
const MatchingEngine = require('./src/services/matchingEngine');
const ConflictEngine = require('./src/services/conflictEngine');
const OptimizerEngine = require('./src/services/optimizerEngine');
const DocumentEngine = require('./src/services/documentEngine');
const NotificationEngine = require('./src/services/notificationEngine');
const Sanitizer = require('./src/middleware/sanitizer');
const ProfileValidator = require('./src/middleware/validator');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const SCHOLARSHIPS_FILE = path.join(__dirname, 'src', 'data', 'scholarships.json');
const APPLICATIONS_FILE = path.join(__dirname, 'src', 'data', 'defaultStudentApplications.json');

// In-Memory & File-backed Store
let scholarships = [];
let applications = [];

function loadData() {
  try {
    if (fs.existsSync(SCHOLARSHIPS_FILE)) {
      scholarships = JSON.parse(fs.readFileSync(SCHOLARSHIPS_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Failed to load scholarships data:', err);
    scholarships = [];
  }

  try {
    if (fs.existsSync(APPLICATIONS_FILE)) {
      applications = JSON.parse(fs.readFileSync(APPLICATIONS_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Failed to load applications data:', err);
    applications = [];
  }
}

function saveApplications() {
  try {
    fs.writeFileSync(APPLICATIONS_FILE, JSON.stringify(applications, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Failed to persist applications:', err);
    return false;
  }
}

loadData();

// Core Route Handlers (Reusable across Express & Native HTTP)
const handlers = {
  getScholarships: (query = {}) => {
    let result = [...scholarships];
    if (query.category && query.category !== 'All') {
      result = result.filter(s => s.category.toLowerCase() === query.category.toLowerCase());
    }
    if (query.search) {
      const q = query.search.toLowerCase();
      result = result.filter(s =>
        s.title.toLowerCase().includes(q) ||
        s.provider.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
      );
    }
    return { success: true, count: result.length, data: result };
  },

  getScholarshipById: (id) => {
    const sch = scholarships.find(s => s.id === id);
    if (!sch) return { status: 404, payload: { success: false, error: `Scholarship with ID '${id}' not found.` } };
    return { status: 200, payload: { success: true, data: sch } };
  },

  matchProfile: (rawProfile) => {
    const profile = Sanitizer.cleanObject(rawProfile);
    const validation = ProfileValidator.validateStudentProfile(profile);
    if (!validation.isValid) {
      return { status: 400, payload: { success: false, error: 'Validation Error', details: validation.errors } };
    }

    const matchResults = MatchingEngine.matchAll(profile, scholarships);
    const eligibleIds = matchResults.eligible.map(s => s.id);
    const conflictAnalysis = ConflictEngine.detectConflicts(eligibleIds, scholarships);

    return {
      status: 200,
      payload: {
        success: true,
        student: profile,
        totalEvaluated: matchResults.totalEvaluated,
        eligibleCount: matchResults.eligibleCount,
        eligibleScholarships: matchResults.eligible,
        ineligibleScholarships: matchResults.ineligible,
        conflicts: conflictAnalysis
      }
    };
  },

  getApplications: () => {
    return { success: true, count: applications.length, data: applications };
  },

  saveApplication: (rawApp) => {
    const app = Sanitizer.cleanObject(rawApp);
    if (!app.scholarshipId) {
      return { status: 400, payload: { success: false, error: 'scholarshipId is required.' } };
    }

    const sch = scholarships.find(s => s.id === app.scholarshipId);
    const existingIndex = applications.findIndex(a => a.scholarshipId === app.scholarshipId);

    const newApp = {
      id: app.id || `APP-${Date.now().toString(36).toUpperCase()}`,
      scholarshipId: app.scholarshipId,
      scholarshipTitle: sch ? sch.title : (app.scholarshipTitle || 'Scholarship'),
      provider: sch ? sch.provider : (app.provider || 'Administering Body'),
      awardAmount: sch ? sch.awardAmount : (app.awardAmount || 0),
      appliedDate: app.appliedDate || new Date().toISOString().split('T')[0],
      stage: app.stage || 'Bookmarked', // 'Bookmarked' | 'Applied' | 'Under Review' | 'Awarded'
      applicationRef: app.applicationRef || '',
      notes: app.notes || '',
      documentsUploaded: Array.isArray(app.documentsUploaded) ? app.documentsUploaded : []
    };

    if (existingIndex >= 0) {
      applications[existingIndex] = { ...applications[existingIndex], ...newApp };
    } else {
      applications.unshift(newApp);
    }

    saveApplications();
    return { status: 200, payload: { success: true, message: 'Application recorded successfully.', data: newApp } };
  },

  deleteApplication: (id) => {
    const initialLen = applications.length;
    applications = applications.filter(a => a.id !== id && a.scholarshipId !== id);
    if (applications.length === initialLen) {
      return { status: 404, payload: { success: false, error: `Application '${id}' not found.` } };
    }
    saveApplications();
    return { status: 200, payload: { success: true, message: 'Application removed successfully.' } };
  },

  evaluateDocuments: (rawPayload) => {
    const payload = Sanitizer.cleanObject(rawPayload);
    const scholarshipId = payload.scholarshipId;
    const sch = scholarships.find(s => s.id === scholarshipId);
    const requiredDocs = sch ? sch.documents : (payload.documents || []);

    const checklist = DocumentEngine.evaluateChecklist(requiredDocs, payload.studentDocuments || {});
    return { status: 200, payload: { success: true, scholarshipId, checklist } };
  },

  optimizeFinancialAid: (rawPayload) => {
    const payload = Sanitizer.cleanObject(rawPayload);
    const result = OptimizerEngine.optimize({
      tuitionFee: payload.tuitionFee,
      livingCost: payload.livingCost,
      existingAid: payload.existingAid,
      eligibleScholarships: payload.eligibleScholarships || scholarships,
      allScholarships: scholarships
    });
    return { status: 200, payload: { success: true, optimization: result } };
  },

  simulateWhatsApp: (rawPayload) => {
    const payload = Sanitizer.cleanObject(rawPayload);
    const sch = scholarships.find(s => s.id === payload.scholarshipId) || {
      id: 'SCH-DEMO',
      title: payload.scholarshipTitle || 'Pragati Scholarship for Girls',
      daysRemaining: payload.daysRemaining || 12,
      awardAmount: payload.awardAmount || 50000,
      awardFrequency: 'per year',
      provider: 'AICTE',
      officialUrl: 'https://scholarships.gov.in'
    };

    const alert = NotificationEngine.generateWhatsAppAlert(
      payload.student || { name: 'Pooja Reddy', phone: '+91 98480 12345' },
      sch,
      payload.pendingDocs || [{ name: 'Income Certificate', status: 'expiring_soon' }]
    );

    return { status: 200, payload: { success: true, alert } };
  },

  getHealth: () => {
    return {
      success: true,
      service: 'GrantGlide: ScholarQuest API',
      version: '1.0.0',
      scholarshipsCount: scholarships.length,
      applicationsCount: applications.length,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString()
    };
  }
};

// Try initializing Express; fallback to native HTTP
let serverInstance = null;

try {
  const express = require('express');
  const app = express();

  // Try loading cors if available
  try {
    const cors = require('cors');
    app.use(cors());
  } catch (e) {}

  app.use(express.json());
  app.use(Sanitizer.middleware());
  app.use(express.static(PUBLIC_DIR));

  // Express API Routes
  app.get('/api/scholarships', (req, res) => res.json(handlers.getScholarships(req.query)));
  app.get('/api/scholarships/:id', (req, res) => {
    const r = handlers.getScholarshipById(req.params.id);
    res.status(r.status).json(r.payload);
  });
  app.post('/api/match', (req, res) => {
    const r = handlers.matchProfile(req.body);
    res.status(r.status).json(r.payload);
  });
  app.get('/api/applications', (req, res) => res.json(handlers.getApplications()));
  app.post('/api/applications', (req, res) => {
    const r = handlers.saveApplication(req.body);
    res.status(r.status).json(r.payload);
  });
  app.delete('/api/applications/:id', (req, res) => {
    const r = handlers.deleteApplication(req.params.id);
    res.status(r.status).json(r.payload);
  });
  app.post('/api/documents/evaluate', (req, res) => {
    const r = handlers.evaluateDocuments(req.body);
    res.status(r.status).json(r.payload);
  });
  app.post('/api/optimize-aid', (req, res) => {
    const r = handlers.optimizeFinancialAid(req.body);
    res.status(r.status).json(r.payload);
  });
  app.post('/api/whatsapp-simulator/send', (req, res) => {
    const r = handlers.simulateWhatsApp(req.body);
    res.status(r.status).json(r.payload);
  });
  app.get('/api/health', (req, res) => res.json(handlers.getHealth()));

  // Fallback to index.html for SPA
  app.get('*', (req, res) => {
    const indexPath = path.join(PUBLIC_DIR, 'index.html');
    if (fs.existsSync(indexPath)) res.sendFile(indexPath);
    else res.status(404).send('ScholarQuest UI loading...');
  });

  if (require.main === module) {
    serverInstance = app.listen(PORT, () => {
      console.log(`[Express Engine] ScholarQuest Server running at http://localhost:${PORT}`);
    });
  }

} catch (err) {
  // Built-in Native HTTP Fallback Server (Zero external dependencies)
  console.log('[Native HTTP Engine] Express not found; launching zero-dependency fallback server.');

  const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
  };

  const server = http.createServer((req, res) => {
    const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = urlObj.pathname;
    const method = req.method;

    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const sendJson = (status, data) => {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    };

    const getRequestBody = (callback) => {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          callback(null, parsed);
        } catch (e) {
          callback(e, null);
        }
      });
    };

    // API Router
    if (pathname === '/api/health' && method === 'GET') {
      return sendJson(200, handlers.getHealth());
    }

    if (pathname === '/api/scholarships' && method === 'GET') {
      const q = Object.fromEntries(urlObj.searchParams.entries());
      return sendJson(200, handlers.getScholarships(q));
    }

    if (pathname.startsWith('/api/scholarships/') && method === 'GET') {
      const id = pathname.replace('/api/scholarships/', '');
      const r = handlers.getScholarshipById(id);
      return sendJson(r.status, r.payload);
    }

    if (pathname === '/api/match' && method === 'POST') {
      return getRequestBody((err, body) => {
        if (err) return sendJson(400, { success: false, error: 'Malformed JSON payload.' });
        const r = handlers.matchProfile(body);
        return sendJson(r.status, r.payload);
      });
    }

    if (pathname === '/api/applications' && method === 'GET') {
      return sendJson(200, handlers.getApplications());
    }

    if (pathname === '/api/applications' && method === 'POST') {
      return getRequestBody((err, body) => {
        if (err) return sendJson(400, { success: false, error: 'Malformed JSON payload.' });
        const r = handlers.saveApplication(body);
        return sendJson(r.status, r.payload);
      });
    }

    if (pathname.startsWith('/api/applications/') && method === 'DELETE') {
      const id = pathname.replace('/api/applications/', '');
      const r = handlers.deleteApplication(id);
      return sendJson(r.status, r.payload);
    }

    if (pathname === '/api/documents/evaluate' && method === 'POST') {
      return getRequestBody((err, body) => {
        if (err) return sendJson(400, { success: false, error: 'Malformed JSON payload.' });
        const r = handlers.evaluateDocuments(body);
        return sendJson(r.status, r.payload);
      });
    }

    if (pathname === '/api/optimize-aid' && method === 'POST') {
      return getRequestBody((err, body) => {
        if (err) return sendJson(400, { success: false, error: 'Malformed JSON payload.' });
        const r = handlers.optimizeFinancialAid(body);
        return sendJson(r.status, r.payload);
      });
    }

    if (pathname === '/api/whatsapp-simulator/send' && method === 'POST') {
      return getRequestBody((err, body) => {
        if (err) return sendJson(400, { success: false, error: 'Malformed JSON payload.' });
        const r = handlers.simulateWhatsApp(body);
        return sendJson(r.status, r.payload);
      });
    }

    // Static Asset Serving
    let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
    if (safePath === '/' || safePath === '\\') safePath = '/index.html';
    const filePath = path.join(PUBLIC_DIR, safePath);

    fs.stat(filePath, (err, stats) => {
      if (!err && stats.isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(filePath).pipe(res);
      } else {
        const indexPath = path.join(PUBLIC_DIR, 'index.html');
        if (fs.existsSync(indexPath)) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          fs.createReadStream(indexPath).pipe(res);
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('ScholarQuest: Resource Not Found');
        }
      }
    });
  });

  if (require.main === module) {
    serverInstance = server.listen(PORT, () => {
      console.log(`[Native HTTP Engine] ScholarQuest Server running at http://localhost:${PORT}`);
    });
  }
}

module.exports = { handlers, serverInstance };
