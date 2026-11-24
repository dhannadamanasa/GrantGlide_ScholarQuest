/**
 * WhatsApp Deadline Alert Simulator Component
 * Provides an interactive simulated mobile device showing WhatsApp notification dispatch.
 */

window.WhatsAppSimulatorComponent = {
  render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="card whatsapp-card">
        <div class="card-header">
          <div>
            <h2 class="card-title">📱 WhatsApp Deadline Alert Simulator</h2>
            <p class="card-subtitle">Simulate real-time push alerts sent directly to students' registered WhatsApp numbers for critical deadlines and document renewals.</p>
          </div>
        </div>

        <div class="whatsapp-layout">
          <!-- Control Panel -->
          <div class="wa-controls">
            <div class="form-group">
              <label for="wa-student-name">Student Full Name:</label>
              <input type="text" id="wa-student-name" class="form-control" value="Pooja Reddy">
            </div>

            <div class="form-group">
              <label for="wa-student-phone">Registered WhatsApp Mobile Number:</label>
              <input type="text" id="wa-student-phone" class="form-control" value="+91 98480 12345">
            </div>

            <div class="form-group">
              <label for="wa-select-scheme">Select Target Scholarship Scheme:</label>
              <select id="wa-select-scheme" class="form-control">
                <option value="SCH-001">Pragati Scholarship for Girls (AICTE) - 12 Days Left</option>
                <option value="SCH-004">Kotak Kanya Scholarship for Meritorious Girls - 9 Days Left</option>
                <option value="SCH-002">Telangana ePASS Post-Matric BC Scholarship - 18 Days Left</option>
                <option value="SCH-003">Reliance Foundation Undergraduate Scholarship - 24 Days Left</option>
              </select>
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" id="wa-include-doc-warning" checked>
                <span>Include '⚠️ Income Certificate Needs Renewal' Alert</span>
              </label>
            </div>

            <button id="btn-dispatch-wa" class="btn btn-success btn-block" style="margin-top: 15px;">
              📲 Dispatch Simulated WhatsApp Alert
            </button>
          </div>

          <!-- Smartphone Mockup Preview -->
          <div class="phone-mockup">
            <div class="phone-screen">
              <div class="wa-header">
                <div class="wa-avatar">🎓</div>
                <div class="wa-contact-info">
                  <span class="wa-contact-name">GrantGlide: ScholarQuest</span>
                  <span class="wa-contact-status">Official Verified Bot ✓</span>
                </div>
              </div>

              <div class="wa-chat-body" id="wa-chat-messages">
                <div class="wa-bubble wa-received" id="wa-sample-msg">
                  <div class="wa-msg-text">
                    🎓 <strong>GrantGlide: ScholarQuest Alert</strong><br><br>
                    Hello Pooja Reddy!<br><br>
                    ⏰ <strong>URGENT:</strong> Application Deadline for <strong>Pragati Scholarship Scheme for Girl Students</strong> closes in <strong>12 days</strong>!<br><br>
                    💰 <strong>Award Value:</strong> ₹50,000 (per year)<br>
                    🏛️ <strong>Administered by:</strong> AICTE<br><br>
                    📄 <strong>Action Required on Documents:</strong><br>
                    • MeeSeva Income Certificate (⚠️ Needs Renewal - 15 days left)<br><br>
                    🔗 <strong>Portal Link:</strong> <a href="https://scholarships.gov.in" target="_blank" style="color:#027eb5;">scholarships.gov.in</a><br><br>
                    <small style="color:#777;"><em>Tip: Ensure your income certificate is current. Keep Aadhaar-linked bank account active for DBT transfer.</em></small>
                  </div>
                  <span class="wa-time" id="wa-msg-time">Just now ✓✓</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents(container);
  },

  bindEvents(container) {
    const btn = container.querySelector('#btn-dispatch-wa');
    btn.addEventListener('click', async () => {
      const name = document.getElementById('wa-student-name').value;
      const phone = document.getElementById('wa-student-phone').value;
      const schemeId = document.getElementById('wa-select-scheme').value;
      const includeDocWarn = document.getElementById('wa-include-doc-warning').checked;

      const pendingDocs = includeDocWarn
        ? [{ name: 'MeeSeva Income Certificate', status: 'expiring_soon' }]
        : [];

      try {
        const alert = await window.API.simulateWhatsApp({
          student: { name, phone },
          scholarshipId: schemeId,
          pendingDocs
        });

        // Update the phone mockup screen with clean HTML formatted message
        const chatBody = document.getElementById('wa-chat-messages');
        const formatted = window.Sanitizer.escapeHTML(alert.content)
          .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
          .replace(/_(.*?)_/g, '<em>$1</em>')
          .replace(/\n/g, '<br>');

        chatBody.innerHTML = `
          <div class="wa-bubble wa-received animated-pop">
            <div class="wa-msg-text">${formatted}</div>
            <span class="wa-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓</span>
          </div>
        `;

        window.store.dispatch('SHOW_TOAST', {
          type: 'success',
          message: `Simulated WhatsApp alert dispatched to ${phone}!`
        });
      } catch (err) {
        console.error('WhatsApp simulation error:', err);
      }
    });
  }
};
