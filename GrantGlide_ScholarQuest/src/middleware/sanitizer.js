/**
 * XSS Sanitization & Input Defense Utility.
 * Strips script tags, rogue HTML, javascript: pseudoprotocols, and event handler injections.
 */

class Sanitizer {
  /**
   * Sanitizes a single string against Cross-Site Scripting (XSS).
   * @param {string} str 
   * @returns {string}
   */
  static cleanString(str) {
    if (typeof str !== 'string') return str;

    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Strip script tags
      .replace(/<[^>]+>/g, '') // Strip all HTML tags
      .replace(/javascript:/gi, '') // Strip javascript: URIs
      .replace(/on\w+\s*=/gi, '') // Strip inline event handlers (onerror=, onclick=)
      .replace(/["'<>`]/g, (char) => {
        const entityMap = {
          '"': '&quot;',
          "'": '&#39;',
          '<': '&lt;',
          '>': '&gt;',
          '`': '&#96;'
        };
        return entityMap[char] || char;
      })
      .trim();
  }

  /**
   * Recursively sanitizes object payload.
   * @param {Object} obj 
   */
  static cleanObject(obj) {
    if (!obj || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
      return obj.map(item => this.cleanObject(item));
    }

    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        cleaned[key] = this.cleanString(value);
      } else if (typeof value === 'object' && value !== null) {
        cleaned[key] = this.cleanObject(value);
      } else {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }

  /**
   * Express middleware to sanitize req.body, req.query, and req.params automatically.
   */
  static middleware() {
    return (req, res, next) => {
      if (req.body) req.body = Sanitizer.cleanObject(req.body);
      if (req.query) req.query = Sanitizer.cleanObject(req.query);
      if (req.params) req.params = Sanitizer.cleanObject(req.params);
      next();
    };
  }
}

module.exports = Sanitizer;
