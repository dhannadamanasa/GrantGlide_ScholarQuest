/**
 * WhatsApp Deadline Alert & Notification Simulator.
 * Formats structured WhatsApp alert messages and simulates dispatch
 * to student mobile devices with deadline countdowns and document checklist warnings.
 */

class NotificationEngine {
  /**
   * Generates a realistic WhatsApp message for an upcoming scholarship deadline.
   * @param {Object} student - { name, phone }
   * @param {Object} scholarship - { title, daysRemaining, awardAmount, provider }
   * @param {Array} pendingDocs - List of missing or expiring documents
   */
  static generateWhatsAppAlert(student, scholarship, pendingDocs = []) {
    const studentName = student.name || 'Scholar';
    const phone = student.phone || '+91 98765 43210';
    const days = scholarship.daysRemaining;

    let urgencyIcon = '🟡';
    if (days <= 3) urgencyIcon = '🚨 CRITICAL:';
    else if (days <= 10) urgencyIcon = '⏰ URGENT:';

    let docNotice = '';
    if (pendingDocs && pendingDocs.length > 0) {
      docNotice = `\n📄 *Action Required on Documents:*\n` +
        pendingDocs.map(d => ` • ${d.name || d} (${d.status === 'expiring_soon' ? '⚠️ Needs Renewal' : '❌ Not Uploaded'})`).join('\n') +
        `\n`;
    }

    const messageText = 
`🎓 *GrantGlide: ScholarQuest Alert*
Hello ${studentName}!

${urgencyIcon} Application Deadline for *${scholarship.title}* closes in *${days} days*!

💰 *Award Value:* ₹${Number(scholarship.awardAmount).toLocaleString('en-IN')} (${scholarship.awardFrequency})
🏛️ *Administered by:* ${scholarship.provider}
${docNotice}
🔗 *Portal Link:* ${scholarship.officialUrl}

_Tip: Ensure your income certificate is current. Keep Aadhaar-linked bank account active for DBT transfer._

Reply STOP to unsubscribe.`;

    return {
      recipient: phone,
      studentName,
      scholarshipId: scholarship.id,
      scholarshipTitle: scholarship.title,
      daysRemaining: days,
      timestamp: new Date().toISOString(),
      status: 'DELIVERED',
      messageId: `WA-MSG-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      content: messageText
    };
  }

  /**
   * Generates a batch digest for all bookmarked or applied scholarships approaching deadlines.
   */
  static generateWeeklyDigest(student, trackedScholarships) {
    const studentName = student.name || 'Scholar';
    const activeList = trackedScholarships.filter(s => s.daysRemaining <= 30);

    const summaries = activeList.map(s => 
      `• *${s.title}* (₹${Number(s.awardAmount).toLocaleString('en-IN')}) - ⏳ *${s.daysRemaining} days left*`
    ).join('\n');

    const digestText = 
`📢 *ScholarQuest Weekly Scholarship Digest*
Hello ${studentName}, here is your application roadmap:

${summaries}

Keep documents verified and submit well ahead of deadline server rush!`;

    return {
      recipient: student.phone || '+91 98765 43210',
      timestamp: new Date().toISOString(),
      trackedCount: activeList.length,
      content: digestText,
      status: 'SENT'
    };
  }
}

module.exports = NotificationEngine;
