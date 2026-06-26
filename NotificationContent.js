import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationAPI } from '../services/api';
import logger from '../services/logger';
import { getPriorityNotifications } from '../services/priorityService';
import { validateNotification } from '../utils/security';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [priorityNotifications, setPriorityNotifications] = useState([]);

  const fetchNotifications = useCallback(async (page = 1, limit = 20) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await notificationAPI.getNotifications({ page, limit });
      
      if (!data?.notifications) {
        throw new Error('Invalid response format');
      }

      const validatedNotifications = data.notifications
        .map(n => {
          const validation = validateNotification(n);
          if (!validation.isValid) {
            logger.warn('Invalid notification skipped', { errors: validation.errors });
            return null;
          }
          
          const isRead = localStorage.getItem(`read_${n.ID}`) === 'true';
          return { ...n, isRead };
        })
        .filter(n => n !== null);
      
      setNotifications(validatedNotifications);
      setPagination({
        page,
        limit,
        total: data.total || validatedNotifications.length
      });
      
      // Update priority notifications
      const priority = getPriorityNotifications(validatedNotifications, 10);
      setPriorityNotifications(priority);
      
      logger.info('Notifications loaded', { 
        count: validatedNotifications.length, 
        page,
        limit 
      });
      
    } catch (err) {
      setError(err.message || 'Failed to fetch notifications');
      logger.error('Error fetching notifications', { error: err.message });
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback((notificationId) => {
    try {
      setNotifications(prev => 
        prev.map(n => 
          n.ID === notificationId ? { ...n, isRead: true } : n
        )
      );
      
      localStorage.setItem(`read_${notificationId}`, 'true');
      
      setPriorityNotifications(prev => 
        prev.filter(n => n.ID !== notificationId)
      );
      
      notificationAPI.markNotificationRead(notificationId)
        .catch(err => {
          logger.warn('Failed to mark as read on server', { 
            notificationId,
            error: err.message 
          });
        });
      
      logger.info('Notification marked as read', { notificationId });
      
    } catch (err) {
      logger.error('Error marking notification as read', { 
        notificationId,
        error: err.message 
      });
    }
  }, []);

  const refresh = useCallback(() => {
    logger.info('Manual refresh triggered');
    fetchNotifications(pagination.page, pagination.limit);
  }, [fetchNotifications, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchNotifications(1, 20);
  }, [fetchNotifications]);

  const value = {
    notifications,
    priorityNotifications,
    loading,
    error,
    pagination,
    fetchNotifications,
    markAsRead,
    refresh,
    setPriorityNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};