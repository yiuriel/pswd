import sodium from "libsodium-wrappers";
import { 
  initSecureStorage, 
  secureSet, 
  secureRemove,
  secureSetFallback,
  secureGetFallback 
} from "./secureStorage";

/**
 * Initialize libsodium and secure storage
 */
export async function initCrypto() {
  await sodium.ready;
  await initSecureStorage();
}

/**
 * Generate a unique device fingerprint
 * This combines browser info and a random component to create a stable device ID
 */
export async function generateDeviceFingerprint(): Promise<string> {
  // Try secure storage first, fallback to localStorage
  const stored = await secureGetFallback("device_fingerprint");
  if (stored) return stored;

  const nav = window.navigator;
  const screen = window.screen;
  
  const components = [
    nav.userAgent,
    nav.language,
    screen.colorDepth.toString(),
    screen.width.toString() + "x" + screen.height.toString(),
    new Date().getTimezoneOffset().toString(),
    // Add a random component that persists
    Math.random().toString(36).substring(2, 15),
  ];

  const fingerprint = btoa(components.join("|"));
  await secureSetFallback("device_fingerprint", fingerprint);
  return fingerprint;
}

/**
 * Generate master device keys (encryption and signing keypairs)
 */
export async function generateMasterKeys() {
  await initCrypto();

  // Generate encryption keypair (X25519)
  const encKeyPair = sodium.crypto_kx_keypair();

  // Generate signing keypair (Ed25519)
  const signKeyPair = sodium.crypto_sign_keypair();

  return {
    encKeyPair: {
      publicKey: sodium.to_base64(encKeyPair.publicKey),
      privateKey: sodium.to_base64(encKeyPair.privateKey),
    },
    signKeyPair: {
      publicKey: sodium.to_base64(signKeyPair.publicKey),
      privateKey: sodium.to_base64(signKeyPair.privateKey),
    },
  };
}

/**
 * Generate device-specific keypair
 */
export async function generateDeviceKeys() {
  await initCrypto();

  const deviceKeyPair = sodium.crypto_box_keypair();

  return {
    publicKey: sodium.to_base64(deviceKeyPair.publicKey),
    privateKey: sodium.to_base64(deviceKeyPair.privateKey),
  };
}

/**
 * Store master keys securely using IndexedDB with encryption
 * This is MORE secure than localStorage as it uses:
 * - IndexedDB for better isolation
 * - Additional encryption layer
 * - Session-based keys that are cleared on page unload
 */
export async function storeMasterKeys(
  encPrivateKey: string,
  signPrivateKey: string,
  devicePrivateKey: string
): Promise<void> {
  try {
    await secureSet("master_enc_sk", encPrivateKey);
    await secureSet("master_sign_sk", signPrivateKey);
    await secureSet("device_sk", devicePrivateKey);
    await secureSet("is_master_device", "true");
  } catch (error) {
    console.error("Failed to store in secure storage, using fallback:", error);
    // Fallback to localStorage if IndexedDB fails
    localStorage.setItem("master_enc_sk", encPrivateKey);
    localStorage.setItem("master_sign_sk", signPrivateKey);
    localStorage.setItem("device_sk", devicePrivateKey);
    localStorage.setItem("is_master_device", "true");
  }
}

/**
 * Retrieve master keys from secure storage
 * Uses fallback to localStorage for compatibility
 */
export async function getMasterKeys() {
  return {
    encPrivateKey: await secureGetFallback("master_enc_sk"),
    signPrivateKey: await secureGetFallback("master_sign_sk"),
    devicePrivateKey: await secureGetFallback("device_sk"),
    isMasterDevice: (await secureGetFallback("is_master_device")) === "true",
  };
}

/**
 * Check if this device is the master device
 * Synchronous version that checks localStorage for immediate UI updates
 * For security-critical operations, use getMasterKeys() instead
 */
export function isMasterDevice(): boolean {
  // Quick check in localStorage for UI rendering
  // Secure storage check happens during actual crypto operations
  return localStorage.getItem("is_master_device") === "true";
}

/**
 * Encrypt data using the master encryption key
 */
export async function encryptData(
  plaintext: string,
  recipientPublicKey: string
): Promise<string> {
  await initCrypto();

  const keys = await getMasterKeys();
  if (!keys.encPrivateKey) {
    throw new Error("Master encryption key not found");
  }

  const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES);
  const privateKey = sodium.from_base64(keys.encPrivateKey);
  const publicKey = sodium.from_base64(recipientPublicKey);
  const message = sodium.from_string(plaintext);

  const ciphertext = sodium.crypto_box_easy(message, nonce, publicKey, privateKey);

  // Combine nonce and ciphertext
  const combined = new Uint8Array(nonce.length + ciphertext.length);
  combined.set(nonce);
  combined.set(ciphertext, nonce.length);

  return sodium.to_base64(combined);
}

/**
 * Decrypt data using the master encryption key
 */
export async function decryptData(
  encryptedData: string,
  senderPublicKey: string
): Promise<string> {
  await initCrypto();

  const keys = await getMasterKeys();
  if (!keys.encPrivateKey) {
    throw new Error("Master encryption key not found");
  }

  const combined = sodium.from_base64(encryptedData);
  const nonce = combined.slice(0, sodium.crypto_box_NONCEBYTES);
  const ciphertext = combined.slice(sodium.crypto_box_NONCEBYTES);

  const privateKey = sodium.from_base64(keys.encPrivateKey);
  const publicKey = sodium.from_base64(senderPublicKey);

  const decrypted = sodium.crypto_box_open_easy(ciphertext, nonce, publicKey, privateKey);

  return sodium.to_string(decrypted);
}

/**
 * Encrypt vault entry data using symmetric encryption
 * This is more efficient for encrypting user's own data
 */
export async function encryptVaultEntry(data: any): Promise<string> {
  await initCrypto();

  const keys = await getMasterKeys();
  if (!keys.encPrivateKey) {
    throw new Error("Master encryption key not found");
  }

  // Derive a symmetric key from the master key
  // In production, you might want a more sophisticated key derivation
  const privateKeyBytes = sodium.from_base64(keys.encPrivateKey);
  const key = sodium.crypto_generichash(32, privateKeyBytes);

  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const message = sodium.from_string(JSON.stringify(data));

  const ciphertext = sodium.crypto_secretbox_easy(message, nonce, key);

  // Combine nonce and ciphertext
  const combined = new Uint8Array(nonce.length + ciphertext.length);
  combined.set(nonce);
  combined.set(ciphertext, nonce.length);

  return sodium.to_base64(combined);
}

/**
 * Decrypt vault entry data
 */
export async function decryptVaultEntry(encryptedData: string): Promise<any> {
  await initCrypto();

  const keys = await getMasterKeys();
  if (!keys.encPrivateKey) {
    throw new Error("Master encryption key not found");
  }

  const privateKeyBytes = sodium.from_base64(keys.encPrivateKey);
  const key = sodium.crypto_generichash(32, privateKeyBytes);

  const combined = sodium.from_base64(encryptedData);
  const nonce = combined.slice(0, sodium.crypto_secretbox_NONCEBYTES);
  const ciphertext = combined.slice(sodium.crypto_secretbox_NONCEBYTES);

  const decrypted = sodium.crypto_secretbox_open_easy(ciphertext, nonce, key);

  return JSON.parse(sodium.to_string(decrypted));
}

/**
 * Clear all stored keys (logout)
 * Clears both secure storage and localStorage
 */
export async function clearStoredKeys(): Promise<void> {
  try {
    await secureRemove("master_enc_sk");
    await secureRemove("master_sign_sk");
    await secureRemove("device_sk");
    await secureRemove("is_master_device");
  } catch (error) {
    console.error("Failed to clear secure storage:", error);
  }
  
  // Also clear localStorage for fallback compatibility
  localStorage.removeItem("master_enc_sk");
  localStorage.removeItem("master_sign_sk");
  localStorage.removeItem("device_sk");
  localStorage.removeItem("is_master_device");
}

/**
 * Generate a secure random password
 */
export async function generateSecurePassword(length: number = 20): Promise<string> {
  await initCrypto();

  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
  const randomBytes = sodium.randombytes_buf(length);
  
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }
  
  return password;
}
