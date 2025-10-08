import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Container, Paper, Card, CardContent } from '@mui/material';
import { useNavigate } from 'react-router';
import LockIcon from '@mui/icons-material/Lock';
import SecurityIcon from '@mui/icons-material/Security';
import DevicesIcon from '@mui/icons-material/Devices';
import KeyIcon from '@mui/icons-material/Key';
import { isMasterDevice } from '../helpers/SecureCrypto';
import { useAuth } from '../contexts/AuthContext';
import { FuturisticBackground } from '../components/ui/FuturisticUI';

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
    <FuturisticBackground>
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Box sx={{ 
            display: 'inline-block',
            animation: 'float 3s ease-in-out infinite',
            '@keyframes float': {
              '0%, 100%': { transform: 'translateY(0px)' },
              '50%': { transform: 'translateY(-20px)' },
            }
          }}>
            <LockIcon sx={{ 
              fontSize: 100, 
              color: '#6366f1',
              filter: 'drop-shadow(0 0 20px rgba(99, 102, 241, 0.8))',
              mb: 3
            }} />
          </Box>
          
          <Typography 
            variant="h1" 
            gutterBottom 
            sx={{
              fontWeight: 900,
              fontSize: { xs: '2.5rem', md: '4rem' },
              background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 40px rgba(99, 102, 241, 0.3)',
              mb: 2,
              letterSpacing: '-0.02em',
            }}
          >
            SECURE VAULT
          </Typography>
          
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 6, 
              maxWidth: 700, 
              mx: 'auto',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: { xs: '1rem', md: '1.25rem' },
              lineHeight: 1.6,
            }}
          >
            Next-generation password manager with quantum-ready encryption. 
            Your keys never leave your device, ensuring absolute privacy and security.
          </Typography>

        {!isLoggedIn ? (
          <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', mb: 8 }}>
            <Button 
              variant="contained" 
              size="large" 
              onClick={() => navigate('/register')}
              sx={{ 
                px: 5,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                border: '2px solid transparent',
                borderRadius: '12px',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                  transition: 'left 0.5s ease',
                },
                '&:hover': {
                  transform: 'translateY(-3px) scale(1.05)',
                  boxShadow: '0 10px 40px rgba(99, 102, 241, 0.6)',
                  '&::before': {
                    left: '100%',
                  }
                },
                '&:active': {
                  transform: 'translateY(-1px) scale(1.02)',
                }
              }}
            >
              Create Vault
            </Button>
            <Button 
              variant="outlined" 
              size="large" 
              onClick={() => navigate('/login')}
              sx={{ 
                px: 5,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 700,
                border: '2px solid #6366f1',
                borderRadius: '12px',
                color: '#6366f1',
                background: 'rgba(99, 102, 241, 0.05)',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '12px',
                  padding: '2px',
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor',
                  maskComposite: 'exclude',
                  opacity: 0,
                  transition: 'opacity 0.3s ease',
                },
                '&:hover': {
                  transform: 'translateY(-3px) scale(1.05)',
                  background: 'rgba(99, 102, 241, 0.15)',
                  borderColor: '#a855f7',
                  color: '#a855f7',
                  boxShadow: '0 10px 40px rgba(168, 85, 247, 0.4)',
                  '&::after': {
                    opacity: 1,
                  }
                },
                '&:active': {
                  transform: 'translateY(-1px) scale(1.02)',
                }
              }}
            >
              Sign In
            </Button>
          </Box>
        ) : (
          <Box sx={{ mb: 8 }}>
            <Paper sx={{ 
              p: 4, 
              maxWidth: 550, 
              mx: 'auto',
              background: isMaster 
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%)'
                : 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.1) 100%)',
              border: `2px solid ${isMaster ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
              borderRadius: '16px',
              backdropFilter: 'blur(20px)',
              boxShadow: `0 8px 32px ${isMaster ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`,
            }}>
              <Typography variant="h5" gutterBottom sx={{ 
                color: isMaster ? '#10b981' : '#f59e0b',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
              }}>
                {isMaster ? '✓ Master Device Active' : '⚠ Non-Master Device'}
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, color: 'rgba(255, 255, 255, 0.8)' }}>
                {isMaster 
                  ? 'This device has full vault access and encryption keys.'
                  : 'This device does not have master keys. Use your master device to access the vault.'
                }
              </Typography>
              <Button 
                variant="contained" 
                size="large"
                onClick={() => navigate('/vault')}
                disabled={!isMaster}
                sx={{
                  px: 5,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  borderRadius: '12px',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-3px) scale(1.05)',
                    boxShadow: '0 10px 40px rgba(16, 185, 129, 0.6)',
                  },
                  '&:disabled': {
                    background: 'rgba(107, 114, 128, 0.3)',
                    color: 'rgba(255, 255, 255, 0.3)',
                  }
                }}
              >
                Open Vault
              </Button>
            </Paper>
          </Box>
        )}

        <Typography 
          variant="h3" 
          gutterBottom 
          sx={{ 
            mt: 10, 
            mb: 6,
            fontWeight: 800,
            color: 'white',
            textAlign: 'center',
          }}
        >
          Key Features
        </Typography>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 4, mb: 8 }}>
          <Card sx={{
            background: 'rgba(30, 35, 60, 0.6)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            borderRadius: '20px',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
              transform: 'scaleX(0)',
              transition: 'transform 0.4s ease',
            },
            '&:hover': {
              transform: 'translateY(-12px) scale(1.02)',
              boxShadow: '0 20px 60px rgba(99, 102, 241, 0.4)',
              border: '1px solid rgba(99, 102, 241, 0.5)',
              '&::before': {
                transform: 'scaleX(1)',
              }
            }
          }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ 
                display: 'inline-block',
                p: 2,
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2))',
                mb: 3,
                transition: 'transform 0.3s ease',
                '.MuiCard-root:hover &': {
                  transform: 'rotate(360deg) scale(1.1)',
                }
              }}>
                <SecurityIcon sx={{ fontSize: 50, color: '#6366f1' }} />
              </Box>
              <Typography variant="h5" gutterBottom sx={{ color: 'white', fontWeight: 700 }}>
                End-to-End Encryption
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.7 }}>
                Military-grade encryption using libsodium. All data is encrypted locally before 
                transmission. Your passwords never exist in plain text on our servers.
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{
            background: 'rgba(30, 35, 60, 0.6)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(168, 85, 247, 0.2)',
            borderRadius: '20px',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #8b5cf6, #a855f7)',
              transform: 'scaleX(0)',
              transition: 'transform 0.4s ease',
            },
            '&:hover': {
              transform: 'translateY(-12px) scale(1.02)',
              boxShadow: '0 20px 60px rgba(168, 85, 247, 0.4)',
              border: '1px solid rgba(168, 85, 247, 0.5)',
              '&::before': {
                transform: 'scaleX(1)',
              }
            }
          }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ 
                display: 'inline-block',
                p: 2,
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(168, 85, 247, 0.2))',
                mb: 3,
                transition: 'transform 0.3s ease',
                '.MuiCard-root:hover &': {
                  transform: 'rotate(360deg) scale(1.1)',
                }
              }}>
                <DevicesIcon sx={{ fontSize: 50, color: '#a855f7' }} />
              </Box>
              <Typography variant="h5" gutterBottom sx={{ color: 'white', fontWeight: 700 }}>
                Master Device Control
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.7 }}>
                Designate your primary device as the vault controller. Master device holds 
                encryption keys with multi-device sync capability.
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{
            background: 'rgba(30, 35, 60, 0.6)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(236, 72, 153, 0.2)',
            borderRadius: '20px',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #a855f7, #ec4899)',
              transform: 'scaleX(0)',
              transition: 'transform 0.4s ease',
            },
            '&:hover': {
              transform: 'translateY(-12px) scale(1.02)',
              boxShadow: '0 20px 60px rgba(236, 72, 153, 0.4)',
              border: '1px solid rgba(236, 72, 153, 0.5)',
              '&::before': {
                transform: 'scaleX(1)',
              }
            }
          }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ 
                display: 'inline-block',
                p: 2,
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.2))',
                mb: 3,
                transition: 'transform 0.3s ease',
                '.MuiCard-root:hover &': {
                  transform: 'rotate(360deg) scale(1.1)',
                }
              }}>
                <KeyIcon sx={{ fontSize: 50, color: '#ec4899' }} />
              </Box>
              <Typography variant="h5" gutterBottom sx={{ color: 'white', fontWeight: 700 }}>
                Client-Side Keys
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.7 }}>
                Private keys never leave your device. Zero-knowledge architecture ensures 
                complete privacy. We can't access your data even if we wanted to.
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Paper sx={{ 
          p: 6, 
          mt: 8, 
          mb: 6,
          background: 'rgba(30, 35, 60, 0.4)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          borderRadius: '24px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}>
          <Typography variant="h4" gutterBottom sx={{ 
            color: 'white',
            fontWeight: 800,
            textAlign: 'center',
            mb: 5,
          }}>
            How It Works
          </Typography>
          <Box sx={{ textAlign: 'left', maxWidth: 800, mx: 'auto' }}>
            <Box sx={{ 
              mb: 4, 
              p: 3, 
              borderLeft: '4px solid #6366f1',
              background: 'rgba(99, 102, 241, 0.05)',
              borderRadius: '8px',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'rgba(99, 102, 241, 0.1)',
                transform: 'translateX(8px)',
              }
            }}>
              <Typography variant="h6" sx={{ color: '#6366f1', fontWeight: 700, mb: 1 }}>
                1. Registration
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.8 }}>
                Generate encryption and signing keypairs (X25519 & Ed25519) on your device. 
                Public keys are sent to the server, private keys stay with you.
              </Typography>
            </Box>
            
            <Box sx={{ 
              mb: 4, 
              p: 3, 
              borderLeft: '4px solid #8b5cf6',
              background: 'rgba(139, 92, 246, 0.05)',
              borderRadius: '8px',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'rgba(139, 92, 246, 0.1)',
                transform: 'translateX(8px)',
              }
            }}>
              <Typography variant="h6" sx={{ color: '#8b5cf6', fontWeight: 700, mb: 1 }}>
                2. Master Device
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.8 }}>
                Your first device becomes the master controller, storing all encryption keys 
                securely in encrypted IndexedDB storage.
              </Typography>
            </Box>
            
            <Box sx={{ 
              mb: 4, 
              p: 3, 
              borderLeft: '4px solid #a855f7',
              background: 'rgba(168, 85, 247, 0.05)',
              borderRadius: '8px',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'rgba(168, 85, 247, 0.1)',
                transform: 'translateX(8px)',
              }
            }}>
              <Typography variant="h6" sx={{ color: '#a855f7', fontWeight: 700, mb: 1 }}>
                3. Vault Storage
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.8 }}>
                Create password entries that are encrypted locally before being stored on the server. 
                Only your master device can decrypt them.
              </Typography>
            </Box>
            
            <Box sx={{ 
              p: 3, 
              borderLeft: '4px solid #ec4899',
              background: 'rgba(236, 72, 153, 0.05)',
              borderRadius: '8px',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'rgba(236, 72, 153, 0.1)',
                transform: 'translateX(8px)',
              }
            }}>
              <Typography variant="h6" sx={{ color: '#ec4899', fontWeight: 700, mb: 1 }}>
                4. Secure Access
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.8 }}>
                Use JWT authentication to access your vault. Device fingerprinting ensures 
                only registered devices can connect.
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
    </FuturisticBackground>
  );
};
