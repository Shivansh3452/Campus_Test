import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Chip,
  useTheme
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { useNotifications } from '../context/NotificationContext';
import { getNotificationStats } from '../services/priorityService';
import logger from '../services/logger';

const Dashboard = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { notifications, priorityNotifications } = useNotifications();

  const stats = getNotificationStats(notifications);

  const handleViewAll = () => {
    logger.info('Navigating to all notifications from dashboard');
    navigate('/notifications');
  };

  const handleViewPriority = () => {
    logger.info('Navigating to priority inbox from dashboard');
    navigate('/priority-inbox');
  };

  const StatCard = ({ icon, title, value, subtitle, color, action }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              backgroundColor: `${color}.light`,
              borderRadius: '50%',
              p: 1,
              display: 'flex',
              mr: 2,
            }}
          >
            {icon}
          </Box>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            {title}
          </Typography>
        </Box>
        <Typography variant="h3" component="div" sx={{ mb: 1 }}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="textSecondary">
            {subtitle}
          </Typography>
        )}
        {action && (
          <Button
            size="small"
            onClick={action.onClick}
            sx={{ mt: 2 }}
            startIcon={action.icon}
          >
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <StatCard
            icon={<NotificationsIcon sx={{ color: theme.palette.primary.main }} />}
            title="Total Notifications"
            value={stats?.total || 0}
            subtitle={`${stats?.unread || 0} unread`}
            color="primary"
            action={{
              label: 'View All',
              onClick: handleViewAll,
              icon: <NotificationsIcon />
            }}
          />
        </Grid>

        <Grid item xs={12} md={3}>
          <StatCard
            icon={<StarIcon sx={{ color: theme.palette.warning.main }} />}
            title="Priority Items"
            value={priorityNotifications.length}
            subtitle={`Top ${priorityNotifications.length} unread`}
            color="warning"
            action={{
              label: 'View Priority',
              onClick: handleViewPriority,
              icon: <StarIcon />
            }}
          />
        </Grid>

        <Grid item xs={12} md={3}>
          <StatCard
            icon={<TrendingUpIcon sx={{ color: theme.palette.success.main }} />}
            title="Read Rate"
            value={stats?.total > 0 ? `${Math.round((stats.read / stats.total) * 100)}%` : '0%'}
            subtitle={`${stats?.read || 0} read messages`}
            color="success"
          />
        </Grid>

        <Grid item xs={12} md={3}>
          <StatCard
            icon={<ScheduleIcon sx={{ color: theme.palette.info.main }} />}
            title="Avg. Age"
            value={`${stats?.avgAge || 0}h`}
            subtitle="Average notification age"
            color="info"
          />
        </Grid>
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Recent Priority Notifications
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {priorityNotifications.length === 0 ? (
            <Typography color="textSecondary">
              No priority notifications at the moment
            </Typography>
          ) : (
            <Box>
              {priorityNotifications.slice(0, 5).map((notification, index) => (
                <Box
                  key={notification.ID}
                  sx={{
                    py: 1.5,
                    borderBottom: index < 4 ? `1px solid ${theme.palette.divider}` : 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Box>
                    <Typography variant="body1">
                      {notification.Message}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {notification.Type} • {new Date(notification.Timestamp).toLocaleString()}
                    </Typography>
                  </Box>
                  <Chip
                    label="Priority"
                    size="small"
                    color="warning"
                    icon={<StarIcon />}
                  />
                </Box>
              ))}
            </Box>
          )}
          {priorityNotifications.length > 5 && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button onClick={handleViewPriority}>
                View all {priorityNotifications.length} priority items
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default Dashboard;