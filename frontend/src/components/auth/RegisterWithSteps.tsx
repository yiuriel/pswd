import React, { useState } from "react";
import {
  Box,
  TextField,
  Typography,
  Alert,
  Link,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Chip,
  Container,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { useNavigate, Link as RouterLink } from "react-router";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import DevicesIcon from '@mui/icons-material/Devices';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import {
  generateMasterKeys,
  generateDeviceKeys,
  generateDeviceFingerprint,
  storeMasterKeys,
  initCrypto,
} from "../../helpers/SecureCrypto";
import { registerUser } from "../../helpers/api";
import { FuturisticBackground, FuturisticButton, GlassContainer } from '../ui/FuturisticUI';

interface RegistrationStep {
  label: string;
  description: string;
  status: "pending" | "in_progress" | "completed" | "error";
  details?: string;
}

export const RegisterWithSteps: React.FC = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("kaku");
  const [email, setEmail] = useState("kaku@kaku.com");
  const [password, setPassword] = useState("Kaku1991");
  const [confirmPassword, setConfirmPassword] = useState("Kaku1991");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [deviceName, setDeviceName] = useState(getDefaultDeviceName());

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isRegistering, setIsRegistering] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);

  const [steps, setSteps] = useState<RegistrationStep[]>([
    {
      label: "Initialize Cryptography",
      description: "Loading secure encryption libraries",
      status: "pending",
    },
    {
      label: "Generate Master Keys",
      description: "Creating encryption and signing keypairs for your account",
      status: "pending",
    },
    {
      label: "Setup Master Device",
      description: "Registering this device as your master vault controller",
      status: "pending",
    },
    {
      label: "Secure Local Storage",
      description: "Storing encryption keys securely on this device",
      status: "pending",
    },
    {
      label: "Register Account",
      description: "Creating your account on the server",
      status: "pending",
    },
  ]);

  function getDefaultDeviceName(): string {
    const nav = window.navigator;
    const platform = nav.platform || "Unknown";

    if (platform.includes("Win")) return "Windows PC";
    if (platform.includes("Mac")) return "MacBook";
    if (platform.includes("Linux")) return "Linux PC";
    if (/iPhone|iPad|iPod/.test(nav.userAgent)) return "iPhone";
    if (/Android/.test(nav.userAgent)) return "Android Phone";

    return "My Device";
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!username || username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!password || password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newErrors.password =
        "Password must contain uppercase, lowercase, and number";
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!deviceName) {
      newErrors.deviceName = "Device name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateStepStatus = (
    index: number,
    status: RegistrationStep["status"],
    details?: string,
  ) => {
    setSteps((prev) =>
      prev.map((step, i) =>
        i === index ? { ...step, status, details } : step,
      ),
    );
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsRegistering(true);
    setActiveStep(0);

    try {
      // Step 1: Initialize Cryptography
      updateStepStatus(0, "in_progress");
      await initCrypto();
      await new Promise((resolve) => setTimeout(resolve, 500)); // Brief pause for UX
      updateStepStatus(0, "completed", "Libsodium initialized");
      setActiveStep(1);

      // Step 2: Generate Master Keys
      updateStepStatus(1, "in_progress");
      const masterKeys = await generateMasterKeys(password);
      await new Promise((resolve) => setTimeout(resolve, 500));
      updateStepStatus(
        1,
        "completed",
        "Generated X25519 encryption and Ed25519 signing keypairs",
      );
      setActiveStep(2);

      // Step 3: Setup Master Device
      updateStepStatus(2, "in_progress");
      const deviceKeys = await generateDeviceKeys();
      const deviceFingerprint = await generateDeviceFingerprint();
      console.log(deviceFingerprint);
      await new Promise((resolve) => setTimeout(resolve, 500));
      updateStepStatus(
        2,
        "completed",
        `Device: ${deviceName} (Fingerprint: ${deviceFingerprint.substring(
          0,
          16,
        )}...)`,
      );
      setActiveStep(3);

      // Step 4: Secure Local Storage
      updateStepStatus(3, "in_progress");
      storeMasterKeys(
        masterKeys.encKeyPair.privateKey,
        masterKeys.signKeyPair.privateKey,
        deviceKeys.privateKey,
      );
      await new Promise((resolve) => setTimeout(resolve, 500));
      updateStepStatus(
        3,
        "completed",
        "Private keys stored securely in browser",
      );
      setActiveStep(4);

      // Step 5: Register Account
      updateStepStatus(4, "in_progress");
      await registerUser({
        username,
        email,
        password,
        pk_encrypt: masterKeys.encKeyPair.publicKey,
        pk_sign: masterKeys.signKeyPair.publicKey,
        device_name: deviceName,
        device_fingerprint: deviceFingerprint,
        pk_device: deviceKeys.publicKey,
      });

      // No need to store token - it's in an HTTP-only cookie now!
      updateStepStatus(4, "completed", "Account created successfully!");

      // Wait a moment to show completion
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Navigate to vault
      navigate("/vault");
    } catch (error) {
      const currentStep = steps.findIndex((s) => s.status === "in_progress");
      if (currentStep >= 0) {
        updateStepStatus(
          currentStep,
          "error",
          error instanceof Error ? error.message : "An error occurred",
        );
      }
    } finally {
      setIsRegistering(false);
    }
  };

  if (isRegistering || activeStep >= 0) {
    return (
      <FuturisticBackground>
        <Container maxWidth="md">
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
              <Typography variant="h4" gutterBottom sx={{ color: 'white', fontWeight: 700 }}>
                Setting Up Your Secure Vault
              </Typography>
              <Typography variant="body1" sx={{ mb: 4, color: 'rgba(255, 255, 255, 0.7)' }}>
                Please wait while we securely configure your master device...
              </Typography>

          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((step) => (
              <Step key={step.label}>
                <StepLabel
                  optional={
                    step.status === "error" ? (
                      <Typography variant="caption" color="error">
                        Error
                      </Typography>
                    ) : null
                  }
                  error={step.status === "error"}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {step.label}
                    {step.status === "completed" && (
                      <CheckCircleIcon color="success" fontSize="small" />
                    )}
                    {step.status === "in_progress" && (
                      <CircularProgress size={16} />
                    )}
                  </Box>
                </StepLabel>
                <StepContent>
                  <Typography variant="body2" color="text.secondary">
                    {step.description}
                  </Typography>
                  {step.details && (
                    <Chip
                      label={step.details}
                      size="small"
                      color={
                        step.status === "error"
                          ? "error"
                          : step.status === "completed"
                          ? "success"
                          : "default"
                      }
                      sx={{ mt: 1 }}
                    />
                  )}
                </StepContent>
              </Step>
            ))}
          </Stepper>

          {steps.some((s) => s.status === "error") && (
            <Alert 
              severity="error" 
              sx={{ 
                mt: 3,
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '12px',
              }}
            >
              Registration failed. Please try again.
              <FuturisticButton
                size="small"
                onClick={() => window.location.reload()}
                sx={{ ml: 2, py: 0.5, px: 2, fontSize: '0.875rem' }}
              >
                Retry
              </FuturisticButton>
            </Alert>
          )}
        </GlassContainer>
          </Box>
        </Container>
      </FuturisticBackground>
    );
  }

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
                <DevicesIcon sx={{ fontSize: 48, color: '#6366f1' }} />
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
                CREATE MASTER VAULT
              </Typography>
              
              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                This device will become your master vault controller
              </Typography>
            </Box>

            <Box component="form" onSubmit={handleRegister} noValidate>
              <TextField
                fullWidth
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                error={!!errors.username}
                helperText={errors.username}
                margin="normal"
                required
                autoFocus
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
                  '& .MuiFormHelperText-root': {
                    color: 'rgba(255, 255, 255, 0.6)',
                    '&.Mui-error': {
                      color: '#ef4444',
                    }
                  },
                }}
              />

              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={!!errors.email}
                helperText={errors.email}
                margin="normal"
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: '#6366f1' }} />
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
                  '& .MuiFormHelperText-root': {
                    color: 'rgba(255, 255, 255, 0.6)',
                    '&.Mui-error': {
                      color: '#ef4444',
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
                error={!!errors.password}
                helperText={errors.password}
                margin="normal"
                required
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
                  '& .MuiFormHelperText-root': {
                    color: 'rgba(255, 255, 255, 0.6)',
                    '&.Mui-error': {
                      color: '#ef4444',
                    }
                  },
                }}
              />

              <TextField
                fullWidth
                label="Confirm Password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                margin="normal"
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: '#6366f1', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                        sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
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
                  '& .MuiFormHelperText-root': {
                    color: 'rgba(255, 255, 255, 0.6)',
                    '&.Mui-error': {
                      color: '#ef4444',
                    }
                  },
                }}
              />

              <TextField
                fullWidth
                label="Device Name"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                error={!!errors.deviceName}
                helperText={
                  errors.deviceName || "Give this device a recognizable name"
                }
                margin="normal"
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <DevicesIcon sx={{ color: '#6366f1' }} />
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
                  '& .MuiFormHelperText-root': {
                    color: 'rgba(255, 255, 255, 0.6)',
                    '&.Mui-error': {
                      color: '#ef4444',
                    }
                  },
                }}
              />

              <Alert 
                severity="info" 
                sx={{ 
                  mt: 3, 
                  mb: 3,
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  color: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '12px',
                }}
              >
                <Typography variant="body2">
                  <strong>Master Device:</strong> This device will store your
                  encryption keys and act as the primary vault controller. Keep it
                  secure!
                </Typography>
              </Alert>

              <FuturisticButton
                type="submit"
                fullWidth
                sx={{ mb: 3 }}
              >
                Create Vault
              </FuturisticButton>

              <Box sx={{ textAlign: "center" }}>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Already have a vault?{" "}
                  <Link 
                    component={RouterLink} 
                    to="/login"
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
                    Sign in here
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
