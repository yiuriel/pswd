import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Snackbar,
  InputAdornment,
  Tooltip,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import LockIcon from "@mui/icons-material/Lock";
import KeyIcon from "@mui/icons-material/Key";
import RefreshIcon from "@mui/icons-material/Refresh";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import {
  encryptVaultEntry,
  decryptVaultEntry,
  generateSecurePassword,
  isMasterDevice,
} from "../helpers/crypto";
import {
  createVaultEntry,
  getVaultEntries,
  updateVaultEntry,
  deleteVaultEntry,
  type VaultEntry,
} from "../helpers/api";

interface DecryptedEntry {
  title: string;
  username?: string;
  password?: string;
  url?: string;
  notes?: string;
}

interface VaultEntryWithDecrypted extends VaultEntry {
  decryptedData?: DecryptedEntry;
  isDecrypting?: boolean;
}

export const VaultManager: React.FC = () => {
  const [entries, setEntries] = useState<VaultEntryWithDecrypted[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [editingEntry, setEditingEntry] = useState<VaultEntryWithDecrypted | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "" });

  // Form state
  const [formData, setFormData] = useState<DecryptedEntry>({
    title: "",
    username: "",
    password: "",
    url: "",
    notes: "",
  });
  const [entryType, setEntryType] = useState("password");
  const [showPassword, setShowPassword] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedEntry, setSelectedEntry] = useState<VaultEntryWithDecrypted | null>(null);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    setIsLoading(true);
    setError("");
    try {
      const fetchedEntries = await getVaultEntries();
      setEntries(fetchedEntries);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load entries");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecryptEntry = async (entry: VaultEntryWithDecrypted) => {
    if (entry.decryptedData) return; // Already decrypted

    setEntries((prev) =>
      prev.map((e) =>
        e.entry_id === entry.entry_id ? { ...e, isDecrypting: true } : e
      )
    );

    try {
      const decrypted = await decryptVaultEntry(entry.encrypted_data);
      setEntries((prev) =>
        prev.map((e) =>
          e.entry_id === entry.entry_id
            ? { ...e, decryptedData: decrypted, isDecrypting: false }
            : e
        )
      );
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to decrypt entry. Check your master keys.",
      });
      setEntries((prev) =>
        prev.map((e) =>
          e.entry_id === entry.entry_id ? { ...e, isDecrypting: false } : e
        )
      );
    }
  };

  const handleOpenDialog = (entry?: VaultEntryWithDecrypted) => {
    if (entry) {
      setEditingEntry(entry);
      if (entry.decryptedData) {
        setFormData(entry.decryptedData);
      }
      setEntryType(entry.entry_type);
    } else {
      setEditingEntry(null);
      setFormData({
        title: "",
        username: "",
        password: "",
        url: "",
        notes: "",
      });
      setEntryType("password");
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingEntry(null);
    setShowPassword(false);
  };

  const handleSaveEntry = async () => {
    try {
      // Encrypt the data
      const encryptedData = await encryptVaultEntry(formData);

      if (editingEntry) {
        // Update existing entry
        await updateVaultEntry(editingEntry.entry_id, {
          title: formData.title,
          encrypted_data: encryptedData,
          entry_type: entryType,
        });
        setSnackbar({ open: true, message: "Entry updated successfully" });
      } else {
        // Create new entry
        await createVaultEntry({
          title: formData.title,
          encrypted_data: encryptedData,
          entry_type: entryType,
        });
        setSnackbar({ open: true, message: "Entry created successfully" });
      }

      handleCloseDialog();
      loadEntries();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : "Failed to save entry",
      });
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;

    try {
      await deleteVaultEntry(entryId);
      setSnackbar({ open: true, message: "Entry deleted successfully" });
      loadEntries();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : "Failed to delete entry",
      });
    }
    handleMenuClose();
  };

  const handleGeneratePassword = async () => {
    const password = await generateSecurePassword(20);
    setFormData({ ...formData, password });
  };

  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setSnackbar({ open: true, message: `${label} copied to clipboard` });
  };

  const togglePasswordVisibility = (entryId: string) => {
    setVisiblePasswords((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, entry: VaultEntryWithDecrypted) => {
    setAnchorEl(event.currentTarget);
    setSelectedEntry(entry);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedEntry(null);
  };

  const handleEdit = () => {
    if (selectedEntry) {
      handleOpenDialog(selectedEntry);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    if (selectedEntry) {
      handleDeleteEntry(selectedEntry.entry_id);
    }
  };

  if (!isMasterDevice()) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          This device is not configured as a master device. Please use your master device to access the vault.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Your Secure Vault
          </Typography>
          <Chip
            icon={<LockIcon />}
            label="Master Device"
            color="success"
            size="small"
          />
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Entry
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      ) : entries.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <LockIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Your vault is empty
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Start by adding your first password or secure note
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add First Entry
          </Button>
        </Paper>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
          {entries.map((entry) => (
            <Box key={entry.entry_id}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                    <Typography variant="h6" noWrap sx={{ flex: 1 }}>
                      {entry.title}
                    </Typography>
                    <IconButton size="small" onClick={(e) => handleMenuOpen(e, entry)}>
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                  
                  <Chip
                    label={entry.entry_type}
                    size="small"
                    sx={{ mt: 1, mb: 2 }}
                  />

                  {entry.isDecrypting ? (
                    <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : entry.decryptedData ? (
                    <Box>
                      {entry.decryptedData.username && (
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Username
                          </Typography>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                              {entry.decryptedData.username}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() =>
                                handleCopyToClipboard(
                                  entry.decryptedData!.username!,
                                  "Username"
                                )
                              }
                            >
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                      )}

                      {entry.decryptedData.password && (
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Password
                          </Typography>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography
                              variant="body2"
                              noWrap
                              sx={{ flex: 1, fontFamily: "monospace" }}
                            >
                              {visiblePasswords.has(entry.entry_id)
                                ? entry.decryptedData.password
                                : "••••••••"}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => togglePasswordVisibility(entry.entry_id)}
                            >
                              {visiblePasswords.has(entry.entry_id) ? (
                                <VisibilityOffIcon fontSize="small" />
                              ) : (
                                <VisibilityIcon fontSize="small" />
                              )}
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() =>
                                handleCopyToClipboard(
                                  entry.decryptedData!.password!,
                                  "Password"
                                )
                              }
                            >
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                      )}

                      {entry.decryptedData.url && (
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            URL
                          </Typography>
                          <Typography variant="body2" noWrap>
                            {entry.decryptedData.url}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  ) : (
                    <Button
                      size="small"
                      startIcon={<KeyIcon />}
                      onClick={() => handleDecryptEntry(entry)}
                      fullWidth
                    >
                      Decrypt to View
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      )}

      {/* Entry Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingEntry ? "Edit Entry" : "Add New Entry"}
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Entry Type</InputLabel>
            <Select
              value={entryType}
              label="Entry Type"
              onChange={(e) => setEntryType(e.target.value)}
            >
              <MenuItem value="password">Password</MenuItem>
              <MenuItem value="note">Secure Note</MenuItem>
              <MenuItem value="card">Credit Card</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            margin="normal"
            required
          />

          {entryType === "password" && (
            <>
              <TextField
                fullWidth
                label="Username / Email"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                margin="normal"
              />

              <TextField
                fullWidth
                label="Password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                margin="normal"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title="Generate Password">
                        <IconButton onClick={handleGeneratePassword}>
                          <RefreshIcon />
                        </IconButton>
                      </Tooltip>
                      <IconButton onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Website URL"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                margin="normal"
              />
            </>
          )}

          <TextField
            fullWidth
            label="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            margin="normal"
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSaveEntry}
            variant="contained"
            disabled={!formData.title}
          >
            {editingEntry ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Box>
  );
};
