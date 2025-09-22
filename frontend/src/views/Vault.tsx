import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

export const Vault: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Your Vault
      </Typography>
      <Paper sx={{ p: 2 }}>
        <Typography variant="body1" color="text.secondary">
          This is a protected area. You can load and manage your stored passwords here.
        </Typography>
      </Paper>
    </Box>
  );
};
