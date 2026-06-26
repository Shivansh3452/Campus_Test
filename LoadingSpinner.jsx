import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '50vh',
        gap: 2
      }}
    >
      <CircularProgress size={40} />
      <Typography variant="body2" color="textSecondary">
        {message}
      </Typography>
    </Box>
  );
};

export default LoadingSpinner;