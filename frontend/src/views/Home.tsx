import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Container, Paper, Card, CardContent } from '@mui/material';
import { useNavigate } from 'react-router';
import LockIcon from '@mui/icons-material/Lock';
import SecurityIcon from '@mui/icons-material/Security';
import DevicesIcon from '@mui/icons-material/Devices';
import KeyIcon from '@mui/icons-material/Key';
import { isMasterDevice } from '../helpers/SecureCrypto';
import { useAuth } from '../contexts/AuthContext';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isLoggedIn = !!user;
  const [isMaster, setIsMaster] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      checkMasterDevice();
    }
  }, [isLoggedIn]);

  const checkMasterDevice = async () => {
    const masterStatus = await isMasterDevice();
    setIsMaster(masterStatus);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 6, textAlign: 'center' }}>
        <LockIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
        <Typography variant="h2" gutterBottom fontWeight="bold">
          Secure Vault Storage
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
          A decentralized password manager with master device architecture. 
          Your keys never leave your device, ensuring complete privacy and security.
        </Typography>

        {!isLoggedIn ? (
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 6 }}>
            <Button 
              variant="contained" 
              size="large" 
              onClick={() => navigate('/register')}
              sx={{ px: 4 }}
            >
              Create Vault
            </Button>
            <Button 
              variant="outlined" 
              size="large" 
              onClick={() => navigate('/login')}
              sx={{ px: 4 }}
            >
              Sign In
            </Button>
          </Box>
        ) : (
          <Box sx={{ mb: 6 }}>
            <Paper sx={{ p: 3, maxWidth: 500, mx: 'auto', bgcolor: isMaster ? 'success.light' : 'warning.light' }}>
              <Typography variant="h6" gutterBottom>
                {isMaster ? '✓ Master Device Active' : '⚠ Non-Master Device'}
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {isMaster 
                  ? 'This device has full vault access and encryption keys.'
                  : 'This device does not have master keys. Use your master device to access the vault.'
                }
              </Typography>
              <Button 
                variant="contained" 
                onClick={() => navigate('/vault')}
                disabled={!isMaster}
              >
                Open Vault
              </Button>
            </Paper>
          </Box>
        )}

        <Typography variant="h4" gutterBottom sx={{ mt: 8, mb: 4 }}>
          Key Features
        </Typography>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
          <Card>
            <CardContent>
              <SecurityIcon sx={{ fontSize: 50, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                End-to-End Encryption
              </Typography>
              <Typography variant="body2" color="text.secondary">
                All data is encrypted locally using libsodium before being sent to the server. 
                Your passwords are never transmitted in plain text.
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <DevicesIcon sx={{ fontSize: 50, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Master Device Control
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Designate one device as your master vault controller. This device holds 
                the encryption keys and acts as the primary access point.
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <KeyIcon sx={{ fontSize: 50, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Client-Side Keys
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Private keys are stored only on your master device. The server never has 
                access to your encryption keys or unencrypted data.
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Paper sx={{ p: 4, mt: 6, bgcolor: 'grey.50' }}>
          <Typography variant="h5" gutterBottom>
            How It Works
          </Typography>
          <Box sx={{ textAlign: 'left', maxWidth: 700, mx: 'auto' }}>
            <Typography variant="body1" paragraph>
              <strong>1. Registration:</strong> Generate encryption and signing keypairs (X25519 & Ed25519) 
              on your device. Public keys are sent to the server, private keys stay with you.
            </Typography>
            <Typography variant="body1" paragraph>
              <strong>2. Master Device:</strong> Your first device becomes the master controller, 
              storing all encryption keys securely in the browser.
            </Typography>
            <Typography variant="body1" paragraph>
              <strong>3. Vault Storage:</strong> Create password entries that are encrypted locally 
              before being stored on the server. Only your master device can decrypt them.
            </Typography>
            <Typography variant="body1" paragraph>
              <strong>4. Secure Access:</strong> Use JWT authentication to access your vault. 
              Device fingerprinting ensures only registered devices can connect.
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};
