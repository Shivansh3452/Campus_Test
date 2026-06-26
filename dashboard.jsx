import React, { useMemo } from 'react';
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
  useTheme,
  Skeleton
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useNotifications } from './context/NotificationContext';
import { getNotificationStats } from './services/priorityService';

const Dashboard = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { notifications, priorityNotifications, loading, refresh } = useNotifications();

  const stats = useMemo(() => {
    return getNotificationStats(notifications);
  }, [notifications]);

  const handleViewAll = () => navigate('/notifications');
  const handleViewPriority = () => navigate('/priority-inbox');
  const handleRefresh = () => refresh();

  const StatCard = ({ icon, title, value, subtitle, color, action, loading = false }) => (
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
              color: `${color}.main`
            }}
          >
            {icon}
          </Box>
          <Typography variant="h6" color="textSecondary" sx={{ mb: 0 }}>
            {title}
          </Typography>
        </Box>
        
        {loading ? (
          <Skeleton variant="text" width="60%" height={40} />
        ) : (
          <Typography variant="h3" component="div" sx={{ mb: 1 }}>
            {value}
          </Typography>
        )}
        
        {subtitle && !loading && (
          <Typography variant="body2" color="textSecondary">
            {subtitle}
          </Typography>
        )}
        
        {action && !loading && (
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={loading}
          size="small"
        >
          Refresh
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <StatCard
            icon={<NotificationsIcon />}
            title="Total"
            value={stats?.total || 0}
            subtitle={`${stats?.unread || 0} unread`}
            color="primary"
            loading={loading}
            action={{
              label: 'View All',
              onClick: handleViewAll,
              icon: <NotificationsIcon />
            }}
          />
        </Grid>

        <Grid item xs={12} md={3}>
          <StatCard
            icon={<StarIcon />}
            title="Priority"
            value={priorityNotifications.length}
            subtitle={`Top ${priorityNotifications.length} unread`}
            color="warning"
            loading={loading}
            action={{
              label: 'View Priority',
              onClick: handleViewPriority,
              icon: <StarIcon />
            }}
          />
        </Grid>

        <Grid item xs={12} md={3}>
          <StatCard
            icon={<TrendingUpIcon />}
            title="Read Rate"
            value={stats?.total > 0 ? `${Math.round((stats.read / stats.total) * 100)}%` : '0%'}
            subtitle={`${stats?.read || 0} read`}
            color="success"
            loading={loading}
          />
        </Grid>

        <Grid item xs={12} md={3}>
          <StatCard
            icon={<ScheduleIcon />}
            title="Avg. Age"
            value={`${stats?.avgAge || 0}h`}
            subtitle="Average notification age"
            color="info"
            loading={loading}
          />
        </Grid>
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Recent Priority Notifications
            </Typography>
            {priorityNotifications.length > 0 && (
              <Chip label={`${priorityNotifications.length} items`} size="small" color="warning" />
            )}
          </Box>
          <Divider sx={{ mb: 2 }} />
          
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Box key={i} sx={{ py: 1.5 }}>
                <Skeleton variant="text" width="60%" height={24} />
                <Skeleton variant="text" width="30%" height={16} />
              </Box>
            ))
          ) : priorityNotifications.length === 0 ? (
            <Typography color="textSecondary" sx={{ py: 2, textAlign: 'center' }}>
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
                    label={`Score: ${notification.priorityScore?.toFixed(1) || 'N/A'}`}
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
