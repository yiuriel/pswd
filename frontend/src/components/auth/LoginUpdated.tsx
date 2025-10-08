import React, { useState } from "react";
import {
  Box,
  TextField,
  Typography,
  Alert,
  Link,
  CircularProgress,
  Container,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { useNavigate, Link as RouterLink } from "react-router";
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { generateDeviceFingerprint, getMasterKeys } from "../../helpers/SecureCrypto";
import { loginUser } from "../../helpers/api";
import { FuturisticBackground, FuturisticButton, GlassContainer } from '../ui/FuturisticUI';

export const LoginUpdated: React.FC = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const deviceFingerprint = await generateDeviceFingerprint();

      const response = await loginUser({
        username,
        password,
        device_fingerprint: deviceFingerprint,
      });

      // No need to store token - it's in an HTTP-only cookie now!
      // Just check if keys exist for this device
      const masterKeys = await getMasterKeys();
      const hasKeys = masterKeys.encPrivateKey;

      if (!hasKeys && !response.is_master) {
        setError(
          "This device is not registered. Please use your master device or register this device.",
        );
        return;
      }

      if (!hasKeys && response.is_master) {
        setError(
          "Master device keys not found on this device. You may need to set up a new master device.",
        );
        return;
      }

      navigate("/vault");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Login failed. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FuturisticBackground>
      <Container maxWidth="sm">
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
            py: 4,
          }}
        >
          <GlassContainer sx={{ p: 5, width: "100%" }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Box sx={{ 
                display: 'inline-block',
                p: 2,
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2))',
                mb: 3,
              }}>
                <LockIcon sx={{ fontSize: 48, color: '#6366f1' }} />
              </Box>
              
              <Typography variant="h2" component="h1" sx={{ 
                fontSize: { xs: '2rem', md: '2.5rem' }, 
                mb: 1,
                fontWeight: 900,
                background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.02em',
              }}>
                UNLOCK VAULT
              </Typography>
              
              <Typography
                variant="body1"
                sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
              >
                Sign in to access your secure vault
              </Typography>
            </Box>

            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3,
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '12px',
                }}
              >
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleLogin} noValidate>
              <TextField
                fullWidth
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                margin="normal"
                required
                autoFocus
                autoComplete="username"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: '#6366f1' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    background: 'rgba(30, 35, 60, 0.5)',
                    borderRadius: '12px',
                    '& fieldset': {
                      borderColor: 'rgba(99, 102, 241, 0.3)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(99, 102, 241, 0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#6366f1',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                    '&.Mui-focused': {
                      color: '#6366f1',
                    }
                  },
                }}
              />

              <TextField
                fullWidth
                label="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
                autoComplete="current-password"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: '#6366f1', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    background: 'rgba(30, 35, 60, 0.5)',
                    borderRadius: '12px',
                    '& fieldset': {
                      borderColor: 'rgba(99, 102, 241, 0.3)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(99, 102, 241, 0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#6366f1',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                    '&.Mui-focused': {
                      color: '#6366f1',
                    }
                  },
                }}
              />

              <FuturisticButton
                type="submit"
                fullWidth
                disabled={isLoading}
                sx={{ mt: 4, mb: 3 }}
              >
                {isLoading ? (
                  <CircularProgress size={24} sx={{ color: 'white' }} />
                ) : (
                  "Sign In"
                )}
              </FuturisticButton>

              <Box sx={{ textAlign: "center" }}>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Don't have a vault?{" "}
                  <Link 
                    component={RouterLink} 
                    to="/register" 
                    sx={{ 
                      color: '#a855f7',
                      fontWeight: 600,
                      textDecoration: 'none',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        color: '#ec4899',
                        textDecoration: 'underline',
                      }
                    }}
                  >
                    Create one here
                  </Link>
                </Typography>
              </Box>
            </Box>
          </GlassContainer>
        </Box>
      </Container>
    </FuturisticBackground>
  );
};
