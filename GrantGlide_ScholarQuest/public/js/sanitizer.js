/**
 * Client-Side XSS Sanitizer Utility
 */
window.Sanitizer = {
  escapeHTML(str) {
    if (typeof str !== 'string') return str;
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  stripHTML(str) {
    if (typeof str !== 'string') return str;
    const div = document.createElement('div');
    div.innerHTML = str;
    return div.textContent || div.innerText || '';
  }
};
