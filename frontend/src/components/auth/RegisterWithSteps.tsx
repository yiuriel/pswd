import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Paper,
  Link,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Chip,
} from "@mui/material";
import { useNavigate, Link as RouterLink } from "react-router";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import {
  generateMasterKeys,
  generateDeviceKeys,
  generateDeviceFingerprint,
  storeMasterKeys,
  initCrypto,
} from "../../helpers/crypto";
import { registerUser } from "../../helpers/api";

interface RegistrationStep {
  label: string;
  description: string;
  status: "pending" | "in_progress" | "completed" | "error";
  details?: string;
}

export const RegisterWithSteps: React.FC = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
      const masterKeys = await generateMasterKeys();
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
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          bgcolor: "grey.50",
          p: 2,
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: "100%", maxWidth: 600 }}>
          <Typography variant="h5" gutterBottom>
            Setting Up Your Secure Vault
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
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
            <Alert severity="error" sx={{ mt: 2 }}>
              Registration failed. Please try again.
              <Button
                size="small"
                onClick={() => window.location.reload()}
                sx={{ ml: 2 }}
              >
                Retry
              </Button>
            </Alert>
          )}
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        bgcolor: "grey.50",
        p: 2,
      }}
    >
      <Paper elevation={3} sx={{ p: 4, width: "100%", maxWidth: 450 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Create Master Vault
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
          sx={{ mb: 3 }}
        >
          This device will become your master vault controller
        </Typography>

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
          />

          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={!!errors.password}
            helperText={errors.password}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword}
            margin="normal"
            required
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
          />

          <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
            <Typography variant="body2">
              <strong>Master Device:</strong> This device will store your
              encryption keys and act as the primary vault controller. Keep it
              secure!
            </Typography>
          </Alert>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            sx={{ mt: 2, mb: 2, py: 1.5 }}
          >
            Create Vault
          </Button>

          <Box sx={{ textAlign: "center" }}>
            <Typography variant="body2">
              Already have a vault?{" "}
              <Link component={RouterLink} to="/login" underline="hover">
                Sign in here
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};
