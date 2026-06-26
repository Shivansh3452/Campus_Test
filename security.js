export function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input.replace(/[<>]/g, '').trim().slice(0, 100);
}

export function safeText(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function validateNotification(data) {
  const errors = [];
  
  if (!data || typeof data !== 'object') {
    errors.push('Invalid notification data');
    return { isValid: false, errors };
  }
  
  if (!data.ID || typeof data.ID !== 'string') {
    errors.push('Invalid notification ID');
  }
  
  if (!data.Type || !['Placement', 'Result', 'Event'].includes(data.Type)) {
    errors.push('Invalid notification type');
  }
  
  if (!data.Message || typeof data.Message !== 'string') {
    errors.push('Invalid notification message');
  }
  
  if (!data.Timestamp || isNaN(new Date(data.Timestamp).getTime())) {
    errors.push('Invalid timestamp');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function sanitizeObject(obj, sensitiveKeys = []) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const defaultSensitiveKeys = ['password', 'token', 'authorization', 'apiKey', 'secret'];
  const keysToCheck = [...defaultSensitiveKeys, ...sensitiveKeys];
  
  const sanitized = Array.isArray(obj) ? [] : {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (keysToCheck.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value, sensitiveKeys);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}