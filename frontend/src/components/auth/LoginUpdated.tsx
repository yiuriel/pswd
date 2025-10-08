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
} from "@mui/material";
import { useNavigate, Link as RouterLink } from "react-router";
import { generateDeviceFingerprint, getMasterKeys } from "../../helpers/SecureCrypto";
import { loginUser } from "../../helpers/api";

export const LoginUpdated: React.FC = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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
      <Paper elevation={3} sx={{ p: 4, width: "100%", maxWidth: 400 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Unlock Vault
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
          sx={{ mb: 3 }}
        >
          Sign in to access your secure vault
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
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
          />

          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
            autoComplete="current-password"
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={isLoading}
            sx={{ mt: 3, mb: 2, py: 1.5 }}
          >
            {isLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Sign In"
            )}
          </Button>

          <Box sx={{ textAlign: "center" }}>
            <Typography variant="body2">
              Don't have a vault?{" "}
              <Link component={RouterLink} to="/register" underline="hover">
                Create one here
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};
