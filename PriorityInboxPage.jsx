import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
  Button,
  Snackbar,
  Tooltip
} from '@mui/material';
import {
  Star as StarIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useNotifications } from './context/NotificationContext';
import { getPriorityNotifications } from './services/priorityService';

const PriorityInboxPage = () => {
  const { notifications, loading, markAsRead, refresh } = useNotifications();
  const [topN, setTopN] = useState(10);
  const [typeFilter, setTypeFilter] = useState('All');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const types = ['All', 'Placement', 'Result', 'Event'];

  // Calculate priority notifications
  const priorityNotifications = getPriorityNotifications(notifications, topN, typeFilter);

  const handleMarkAsRead = (id, message) => {
    markAsRead(id);
    setSnackbar({
      open: true,
      message: `Marked "${message}" as read`,
      severity: 'success'
    });
  };

  const handleRefresh = () => {
    refresh();
    setSnackbar({
      open: true,
      message: 'Priority inbox refreshed',
      severity: 'info'
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'Placement': return 'primary';
      case 'Result': return 'success';
      case 'Event': return 'warning';
      default: return 'default';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 30) return 'error';
    if (score >= 20) return 'warning';
    return 'info';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          ⭐ Priority Inbox
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Filter Type</InputLabel>
            <Select
              value={typeFilter}
              label="Filter Type"
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              {types.map(type => (
                <MenuItem key={type} value={type}>{type}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Tooltip title="Refresh">
            <IconButton onClick={handleRefresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography gutterBottom>
          Show top priority notifications
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Box sx={{ flex: 1 }}>
            <Slider
              value={topN}
              onChange={(e, val) => setTopN(val)}
              min={5}
              max={50}
              step={5}
              valueLabelDisplay="auto"
              marks={[
                { value: 5, label: '5' },
                { value: 10, label: '10' },
                { value: 25, label: '25' },
                { value: 50, label: '50' },
              ]}
            />
          </Box>
          <Typography variant="body2" color="textSecondary">
            Showing top {topN}
          </Typography>
        </Box>
      </Paper>

      {priorityNotifications.length === 0 ? (
        <Alert severity="info" icon={<StarIcon />}>
          No priority notifications found. Try adjusting the filters or check back later.
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {priorityNotifications.map((notification, index) => (
            <Grid item xs={12} key={notification.ID}>
              <Card 
                sx={{ 
                  position: 'relative',
                  borderLeft: `4px solid ${getTypeColor(notification.Type) === 'primary' ? '#1976d2' : 
                    getTypeColor(notification.Type) === 'success' ? '#2e7d32' : '#ed6c02'}`,
                  backgroundColor: index < 3 ? 'action.hover' : 'inherit',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateX(4px)',
                    boxShadow: 3
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Chip 
                          label={notification.Type} 
                          size="small"
                          color={getTypeColor(notification.Type)}
                        />
                        <Chip
                          label={`Score: ${notification.priorityScore?.toFixed(1) || 'N/A'}`}
                          size="small"
                          color={getScoreColor(notification.priorityScore || 0)}
                          icon={<StarIcon />}
                        />
                        {index < 3 && (
                          <Chip
                            label={`Top ${index + 1}`}
                            size="small"
                            color="error"
                          />
                        )}
                      </Box>
                      <Typography variant="h6" gutterBottom>
                        {notification.Message}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {new Date(notification.Timestamp).toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleMarkAsRead(notification.ID, notification.Message)}
                        startIcon={<CheckCircleIcon />}
                      >
                        Mark as Read
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PriorityInboxPage;