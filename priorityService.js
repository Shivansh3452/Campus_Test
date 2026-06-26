import logger from './logger';

export const TYPE_WEIGHTS = {
  Placement: 3,
  Result: 2,
  Event: 1
};

export function calculatePriorityScore(notification) {
  try {
    if (!notification || !notification.Type) {
      logger.warn('Invalid notification for priority calculation');
      return 0;
    }

    const typeWeight = TYPE_WEIGHTS[notification.Type] || 1;
    const baseScore = typeWeight * 10;
    
    const now = new Date();
    const timestamp = new Date(notification.Timestamp);
    
    if (isNaN(timestamp.getTime())) {
      return baseScore;
    }
    
    const ageHours = Math.max(0, (now - timestamp) / (1000 * 60 * 60));
    const recencyFactor = Math.max(0, 1 - (ageHours / 24));
    const recencyScore = recencyFactor * 5;
    
    const unreadBonus = notification.isRead ? 0 : 3;
    
    return Math.round((baseScore + recencyScore + unreadBonus) * 10) / 10;
  } catch (error) {
    logger.error('Error calculating priority score', { error: error.message });
    return 0;
  }
}

export function getPriorityNotifications(notifications, topN = 10, typeFilter = null) {
  try {
    if (!Array.isArray(notifications) || notifications.length === 0) {
      return [];
    }

    let filtered = notifications.filter(n => !n.isRead);
    
    if (typeFilter && typeFilter !== 'All') {
      filtered = filtered.filter(n => n.Type === typeFilter);
    }
    
    if (filtered.length === 0) {
      return [];
    }
    
    const withScores = filtered.map(n => ({
      ...n,
      priorityScore: calculatePriorityScore(n)
    }));
    
    const sorted = withScores.sort((a, b) => b.priorityScore - a.priorityScore);
    
    return sorted.slice(0, Math.min(topN, sorted.length));
  } catch (error) {
    logger.error('Error getting priority notifications', { error: error.message });
    return [];
  }
}

export function getNotificationStats(notifications) {
  try {
    if (!Array.isArray(notifications) || notifications.length === 0) {
      return { total: 0, unread: 0, read: 0, byType: {}, avgAge: 0 };
    }

    const total = notifications.length;
    const unread = notifications.filter(n => !n.isRead).length;
    const read = total - unread;
    
    const byType = {};
    notifications.forEach(n => {
      byType[n.Type] = (byType[n.Type] || 0) + 1;
    });
    
    const now = new Date();
    const ages = notifications
      .map(n => new Date(n.Timestamp))
      .filter(ts => !isNaN(ts.getTime()))
      .map(ts => (now - ts) / (1000 * 60 * 60));
    
    const avgAge = ages.length > 0 
      ? Math.round((ages.reduce((a, b) => a + b, 0) / ages.length) * 10) / 10 
      : 0;
    
    return { total, unread, read, byType, avgAge };
  } catch (error) {
    logger.error('Error getting notification stats', { error: error.message });
    return null;
  }
}

export default {
  calculatePriorityScore,
  getPriorityNotifications,
  getNotificationStats,
  TYPE_WEIGHTS
};