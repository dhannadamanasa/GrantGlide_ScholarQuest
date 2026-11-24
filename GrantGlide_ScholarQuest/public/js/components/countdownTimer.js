/**
 * Live Deadline Countdown Timer Utility
 */

window.CountdownTimer = {
  getUrgencyBadge(daysRemaining) {
    if (daysRemaining <= 3) {
      return {
        cls: 'badge-danger',
        label: `🚨 Critical: ${daysRemaining} Days Left`,
        isCritical: true
      };
    } else if (daysRemaining <= 15) {
      return {
        cls: 'badge-warning',
        label: `⏰ Urgent: ${daysRemaining} Days Remaining`,
        isCritical: false
      };
    } else {
      return {
        cls: 'badge-success',
        label: `⏳ ${daysRemaining} Days Remaining`,
        isCritical: false
      };
    }
  },

  formatTimeBreakdown(daysRemaining) {
    const hours = (daysRemaining * 24);
    return `${daysRemaining}d ${Math.floor(hours % 24)}h left`;
  }
};
