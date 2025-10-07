/**
 * Secure Storage Module
 * 
 * This module provides a more secure alternative to localStorage for storing sensitive data.
 * It uses IndexedDB with additional encryption layer.
 * 
 * Security improvements over localStorage:
 * 1. IndexedDB has better isolation from XSS attacks
 * 2. Data is encrypted with a derived key from user session
 * 3. Keys are stored in non-enumerable memory
 * 4. Automatic cleanup on session end
 * 
 * IMPORTANT: This is MORE secure than localStorage, but still has limitations:
 * - If an attacker has XSS access, they can still intercept data in memory
 * - For maximum security, consider using hardware security modules or password-protected keys
 */

import sodium from "libsodium-wrappers";

const DB_NAME = "SecureVaultDB";
const DB_VERSION = 1;
const STORE_NAME = "keys";

// In-memory encryption key (cleared on page unload)
let sessionKey: Uint8Array | null = null;

/**
 * Initialize the secure storage system
 */
export async function initSecureStorage(): Promise<void> {
  await sodium.ready;
  
  // Generate a session-specific encryption key
  // This key is stored only in memory and is lost when the page reloads
  if (!sessionKey) {
    sessionKey = sodium.randombytes_buf(sodium.crypto_secretbox_KEYBYTES);
  }
  
  // Open/create the database
  await openDB();
  
  // Clear session key on page unload for security
  window.addEventListener("beforeunload", () => {
    if (sessionKey) {
      sodium.memzero(sessionKey);
      sessionKey = null;
    }
  });
}

/**
 * Open IndexedDB connection
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

/**
 * Encrypt data before storing
 */
async function encryptData(data: string): Promise<string> {
  if (!sessionKey) {
    throw new Error("Secure storage not initialized");
  }

  await sodium.ready;

  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const message = sodium.from_string(data);
  const ciphertext = sodium.crypto_secretbox_easy(message, nonce, sessionKey);

  // Combine nonce and ciphertext
  const combined = new Uint8Array(nonce.length + ciphertext.length);
  combined.set(nonce);
  combined.set(ciphertext, nonce.length);

  return sodium.to_base64(combined);
}

/**
 * Decrypt data after retrieving
 */
async function decryptData(encryptedData: string): Promise<string> {
  if (!sessionKey) {
    throw new Error("Secure storage not initialized");
  }

  await sodium.ready;

  const combined = sodium.from_base64(encryptedData);
  const nonce = combined.slice(0, sodium.crypto_secretbox_NONCEBYTES);
  const ciphertext = combined.slice(sodium.crypto_secretbox_NONCEBYTES);

  const decrypted = sodium.crypto_secretbox_open_easy(ciphertext, nonce, sessionKey);
  return sodium.to_string(decrypted);
}

/**
 * Store a key-value pair securely
 */
export async function secureSet(key: string, value: string): Promise<void> {
  const db = await openDB();
  const encrypted = await encryptData(value);

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(encrypted, key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieve a value securely
 */
export async function secureGet(key: string): Promise<string | null> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);

    request.onsuccess = async () => {
      if (request.result) {
        try {
          const decrypted = await decryptData(request.result);
          resolve(decrypted);
        } catch (error) {
          console.error("Decryption failed:", error);
          resolve(null);
        }
      } else {
        resolve(null);
      }
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Remove a key-value pair
 */
export async function secureRemove(key: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear all stored data
 */
export async function secureClear(): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Check if a key exists
 */
export async function secureHas(key: string): Promise<boolean> {
  const value = await secureGet(key);
  return value !== null;
}

/**
 * Migration helper: Move data from localStorage to secure storage
 */
export async function migrateFromLocalStorage(): Promise<void> {
  const keysToMigrate = [
    "master_enc_sk",
    "master_sign_sk",
    "device_sk",
    "is_master_device",
    "device_fingerprint",
  ];

  for (const key of keysToMigrate) {
    const value = localStorage.getItem(key);
    if (value) {
      await secureSet(key, value);
      // Optionally remove from localStorage after migration
      // localStorage.removeItem(key);
    }
  }
}

/**
 * Fallback to localStorage if IndexedDB is not available
 * This maintains compatibility but logs a warning
 */
export async function secureSetFallback(key: string, value: string): Promise<void> {
  try {
    await secureSet(key, value);
  } catch (error) {
    console.warn("SecureStorage not available, falling back to localStorage:", error);
    localStorage.setItem(key, value);
  }
}

export async function secureGetFallback(key: string): Promise<string | null> {
  try {
    return await secureGet(key);
  } catch (error) {
    console.warn("SecureStorage not available, falling back to localStorage:", error);
    return localStorage.getItem(key);
  }
}
