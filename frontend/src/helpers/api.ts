import { secureClear } from "./SecureCrypto";

export const API_BASE_URL = "http://localhost:8080/api";

interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  pk_encrypt: string;
  pk_sign: string;
  device_name: string;
  device_fingerprint: string;
  pk_device: string;
}

interface LoginPayload {
  username: string;
  password: string;
  device_fingerprint: string;
}

interface VaultEntryPayload {
  title: string;
  encrypted_data: string;
  entry_type: string;
}

export interface VaultEntry {
  entry_id: string;
  title: string;
  encrypted_data: string;
  entry_type: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  user_id: string;
  username: string;
  email: string;
  pk_encrypt: string;
  pk_sign: string;
  is_master_device_registered: boolean;
  created_at: string;
}

// Helper to get standard headers
function getAuthHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
  };
}

export async function registerUser(payload: RegisterPayload) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include", // Send cookies
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Registration failed");
  }

  return response.json();
}

export async function loginUser(payload: LoginPayload) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include", // Send cookies
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Login failed");
  }

  return response.json();
}

export async function logoutUser() {
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Logout failed");
  }

  return response.json();
}

export async function getUserInfo(): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/user/me`, {
    method: "GET",
    headers: getAuthHeaders(),
    credentials: "include", // Send cookies
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user info");
  }

  return response.json();
}

export async function createVaultEntry(payload: VaultEntryPayload) {
  const response = await fetch(`${API_BASE_URL}/vault/entries`, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include", // Send cookies
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Failed to create vault entry");
  }

  return response.json();
}

export async function getVaultEntries(): Promise<VaultEntry[]> {
  const response = await fetch(`${API_BASE_URL}/vault/entries`, {
    method: "GET",
    headers: getAuthHeaders(),
    credentials: "include", // Send cookies
  });

  if (!response.ok) {
    throw new Error("Failed to fetch vault entries");
  }

  return response.json();
}

export async function updateVaultEntry(entryId: string, payload: VaultEntryPayload) {
  const response = await fetch(`${API_BASE_URL}/vault/entries/${entryId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    credentials: "include", // Send cookies
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Failed to update vault entry");
  }

  return response.ok;
}

export async function deleteVaultEntry(entryId: string) {
  const response = await fetch(`${API_BASE_URL}/vault/entries/${entryId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
    credentials: "include", // Send cookies
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Failed to delete vault entry");
  }

  return response.ok;
}

export async function resetDb() {
  await secureClear();

  const response = await fetch(`${API_BASE_URL}/__$RESET$`, {
    method: "POST",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Failed to delete vault entry");
  }

  return response.ok;
}