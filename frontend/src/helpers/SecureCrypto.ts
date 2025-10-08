/**
 * Secure Crypto Module
 * 
 * Unified secure cryptography and storage system using IndexedDB with encryption.
 * NO localStorage usage - everything is stored in encrypted IndexedDB.
 * 
 * Architecture:
 * - SecureStorage: Handles encrypted IndexedDB operations
 * - CryptoManager: Handles all cryptographic operations
 */

import sodium from "libsodium-wrappers";

const DB_NAME = "SecureVaultDB";
const DB_VERSION = 1;
const STORE_NAME = "keys";

/**
 * SecureStorage Class
 * Manages encrypted storage in IndexedDB without any localStorage fallbacks
 */
class SecureStorage {
  private sessionKey: Uint8Array | null = null;
  private initialized: boolean = false;

  /**
   * Initialize the secure storage system
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    await sodium.ready;
    
    // Generate a session-specific encryption key
    // This key is stored only in memory and is lost when the page reloads
    if (!this.sessionKey) {
      this.sessionKey = sodium.randombytes_buf(sodium.crypto_secretbox_KEYBYTES);
    }
    
    // Open/create the database
    await this.openDB();
    
    // Clear session key on page unload for security
    window.addEventListener("beforeunload", () => {
      if (this.sessionKey) {
        sodium.memzero(this.sessionKey);
        this.sessionKey = null;
      }
    });

    this.initialized = true;
  }

  /**
   * Open IndexedDB connection
   */
  private openDB(): Promise<IDBDatabase> {
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
  private async encryptData(data: string): Promise<string> {
    if (!this.sessionKey) {
      throw new Error("Secure storage not initialized");
    }

    await sodium.ready;

    const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
    const message = sodium.from_string(data);
    const ciphertext = sodium.crypto_secretbox_easy(message, nonce, this.sessionKey);

    // Combine nonce and ciphertext
    const combined = new Uint8Array(nonce.length + ciphertext.length);
    combined.set(nonce);
    combined.set(ciphertext, nonce.length);

    return sodium.to_base64(combined);
  }

  /**
   * Decrypt data after retrieving
   */
  private async decryptData(encryptedData: string): Promise<string> {
    if (!this.sessionKey) {
      throw new Error("Secure storage not initialized");
    }

    await sodium.ready;

    const combined = sodium.from_base64(encryptedData);
    const nonce = combined.slice(0, sodium.crypto_secretbox_NONCEBYTES);
    const ciphertext = combined.slice(sodium.crypto_secretbox_NONCEBYTES);

    const decrypted = sodium.crypto_secretbox_open_easy(ciphertext, nonce, this.sessionKey);
    return sodium.to_string(decrypted);
  }

  /**
   * Store a key-value pair securely
   */
  async set(key: string, value: string): Promise<void> {
    const db = await this.openDB();
    const encrypted = await this.encryptData(value);

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
  async get(key: string): Promise<string | null> {
    const db = await this.openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = async () => {
        if (request.result) {
          try {
            const decrypted = await this.decryptData(request.result);
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
  async remove(key: string): Promise<void> {
    const db = await this.openDB();

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
  async clear(): Promise<void> {
    const db = await this.openDB();

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
  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }
}

/**
 * CryptoManager Class
 * Manages all cryptographic operations using SecureStorage
 */
class CryptoManager {
  private storage: SecureStorage;
  private initialized: boolean = false;

  constructor() {
    this.storage = new SecureStorage();
  }

  /**
   * Initialize libsodium and secure storage
   */
  async init(): Promise<void> {
    if (this.initialized) return;
    
    await sodium.ready;
    await this.storage.init();
    this.initialized = true;
  }

  /**
   * Derive key from password and salt
   */
  async deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<Uint8Array> {
    await sodium.ready;

    const key = sodium.crypto_pwhash(
      sodium.crypto_secretbox_KEYBYTES,
      password,
      salt,
      sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
      sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
      sodium.crypto_pwhash_ALG_DEFAULT
    );

    return key;
  }

  /**
   * Generate a unique device fingerprint
   * This combines browser info and a random component to create a stable device ID
   */
  async generateDeviceFingerprint(): Promise<string> {
    // Try to get stored fingerprint
    const stored = await this.storage.get("device_fingerprint");
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
    await this.storage.set("device_fingerprint", fingerprint);
    return fingerprint;
  }

  /**
   * Generate master device keys (encryption and signing keypairs)
   * Keys are encrypted with a master key derived from the password
   */
  async generateMasterKeys(password: string) {
    await this.init();

    // Generate unique salt for deriving the master key
    const salt = sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES);

    // Derive the master key from password and salt
    const masterKey = await this.deriveKeyFromPassword(password, salt);

    // Generate keypairs
    const encKeyPair = sodium.crypto_kx_keypair();
    const signKeyPair = sodium.crypto_sign_keypair();

    // Generate nonces for encryption
    const encNonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
    const signNonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);

    // Encrypt the private keys with the masterKey before storing
    const encPrivKeyEncrypted = sodium.crypto_secretbox_easy(
      encKeyPair.privateKey,
      encNonce,
      masterKey
    );

    const signPrivKeyEncrypted = sodium.crypto_secretbox_easy(
      signKeyPair.privateKey,
      signNonce,
      masterKey
    );

    // Combine nonce + encrypted data for storage
    const encPrivKeyCombined = new Uint8Array(encNonce.length + encPrivKeyEncrypted.length);
    encPrivKeyCombined.set(encNonce);
    encPrivKeyCombined.set(encPrivKeyEncrypted, encNonce.length);

    const signPrivKeyCombined = new Uint8Array(signNonce.length + signPrivKeyEncrypted.length);
    signPrivKeyCombined.set(signNonce);
    signPrivKeyCombined.set(signPrivKeyEncrypted, signNonce.length);

    return {
      salt: sodium.to_base64(salt),
      encKeyPair: {
        publicKey: sodium.to_base64(encKeyPair.publicKey),
        privateKey: sodium.to_base64(encPrivKeyCombined),
      },
      signKeyPair: {
        publicKey: sodium.to_base64(signKeyPair.publicKey),
        privateKey: sodium.to_base64(signPrivKeyCombined),
      },
    };
  }

  /**
   * Generate device-specific keypair
   */
  async generateDeviceKeys() {
    await this.init();

    const deviceKeyPair = sodium.crypto_box_keypair();

    return {
      publicKey: sodium.to_base64(deviceKeyPair.publicKey),
      privateKey: sodium.to_base64(deviceKeyPair.privateKey),
    };
  }

  /**
   * Store master keys securely using IndexedDB with encryption
   */
  async storeMasterKeys(
    encPrivateKey: string,
    signPrivateKey: string,
    devicePrivateKey: string
  ): Promise<void> {
    await this.storage.set("master_enc_sk", encPrivateKey);
    await this.storage.set("master_sign_sk", signPrivateKey);
    await this.storage.set("device_sk", devicePrivateKey);
    await this.storage.set("is_master_device", "true");
  }

  /**
   * Retrieve master keys from secure storage
   */
  async getMasterKeys() {
    return {
      encPrivateKey: await this.storage.get("master_enc_sk"),
      signPrivateKey: await this.storage.get("master_sign_sk"),
      devicePrivateKey: await this.storage.get("device_sk"),
      isMasterDevice: (await this.storage.get("is_master_device")) === "true",
    };
  }

  /**
   * Check if this device is the master device
   */
  async isMasterDevice(): Promise<boolean> {
    return (await this.storage.get("is_master_device")) === "true";
  }

  /**
   * Encrypt data using the master encryption key
   */
  async encryptData(
    plaintext: string,
    recipientPublicKey: string
  ): Promise<string> {
    await this.init();

    const keys = await this.getMasterKeys();
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
  async decryptData(
    encryptedData: string,
    senderPublicKey: string
  ): Promise<string> {
    await this.init();

    const keys = await this.getMasterKeys();
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
  async encryptVaultEntry(data: any): Promise<string> {
    await this.init();

    const keys = await this.getMasterKeys();
    if (!keys.encPrivateKey) {
      throw new Error("Master encryption key not found");
    }

    // Derive a symmetric key from the master key
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
  async decryptVaultEntry(encryptedData: string): Promise<any> {
    await this.init();

    const keys = await this.getMasterKeys();
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
   */
  async clearStoredKeys(): Promise<void> {
    await this.storage.remove("master_enc_sk");
    await this.storage.remove("master_sign_sk");
    await this.storage.remove("device_sk");
    await this.storage.remove("is_master_device");
    await this.storage.remove("device_fingerprint");
  }

  /**
   * Generate a secure random password
   */
  async generateSecurePassword(length: number = 20): Promise<string> {
    await this.init();

    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
    const randomBytes = sodium.randombytes_buf(length);
    
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset[randomBytes[i] % charset.length];
    }
    
    return password;
  }
}

// Export singleton instance
export const cryptoManager = new CryptoManager();

// Export convenience functions that use the singleton
export const initCrypto = () => cryptoManager.init();
export const generateDeviceFingerprint = () => cryptoManager.generateDeviceFingerprint();
export const generateMasterKeys = (password: string) => cryptoManager.generateMasterKeys(password);
export const generateDeviceKeys = () => cryptoManager.generateDeviceKeys();
export const storeMasterKeys = (encPrivateKey: string, signPrivateKey: string, devicePrivateKey: string) => 
  cryptoManager.storeMasterKeys(encPrivateKey, signPrivateKey, devicePrivateKey);
export const getMasterKeys = () => cryptoManager.getMasterKeys();
export const isMasterDevice = () => cryptoManager.isMasterDevice();
export const encryptData = (plaintext: string, recipientPublicKey: string) => 
  cryptoManager.encryptData(plaintext, recipientPublicKey);
export const decryptData = (encryptedData: string, senderPublicKey: string) => 
  cryptoManager.decryptData(encryptedData, senderPublicKey);
export const encryptVaultEntry = (data: any) => cryptoManager.encryptVaultEntry(data);
export const decryptVaultEntry = (encryptedData: string) => cryptoManager.decryptVaultEntry(encryptedData);
export const clearStoredKeys = () => cryptoManager.clearStoredKeys();
export const generateSecurePassword = (length?: number) => cryptoManager.generateSecurePassword(length);

// Expose secure storage clear function
export const secureClear = () => cryptoManager['storage'].clear();

// Export the class for advanced usage
export { CryptoManager, SecureStorage };
