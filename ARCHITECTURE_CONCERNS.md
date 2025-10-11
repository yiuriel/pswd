# ⚠️ Architecture & Design Concerns

## 1. **Decryption Key Management Issue**
**Problem:** Your vault entries are encrypted with a key derived from the master encryption private key:

```typescript
const privateKeyBytes = sodium.from_base64(keys.encPrivateKey);
const key = sodium.crypto_generichash(32, privateKeyBytes);
```

**Issue:** The `encPrivateKey` stored in IndexedDB is **itself encrypted** (during registration):
```typescript
const encPrivKeyEncrypted = sodium.crypto_secretbox_easy(
    encKeyPair.privateKey, encNonce, masterKey
);
```

**Problem:** You're storing the encrypted private key, but when you try to use it for vault encryption, you never decrypt it first! This means:
1. During registration, you encrypt the private key with password-derived master key ✅
2. You store the encrypted blob ✅
3. Later when encrypting vault entries, you hash the **encrypted** private key (not the plaintext) ❌

**Critical Fix Needed:**
You need to either:
- **Option A:** Decrypt the private key before using it (requires password re-entry)
- **Option B:** Store the plaintext private key in encrypted IndexedDB (current session key protects it)
- **Option C:** Derive vault encryption key directly from password (not from keypair)

**Recommended Approach:**
```typescript
// Store keys in memory after decryption during login
private vaultKey: Uint8Array | null = null;

async unlockVault(password: string) {
    const encPrivateKey = await this.storage.get("master_enc_sk");
    const salt = await this.storage.get("salt");
    
    const masterKey = await this.deriveKeyFromPassword(password, sodium.from_base64(salt));
    
    // Decrypt the private key
    const combined = sodium.from_base64(encPrivateKey);
    const nonce = combined.slice(0, sodium.crypto_secretbox_NONCEBYTES);
    const ciphertext = combined.slice(sodium.crypto_secretbox_NONCEBYTES);
    
    const privateKey = sodium.crypto_secretbox_open_easy(ciphertext, nonce, masterKey);
    
    // Derive vault encryption key
    this.vaultKey = sodium.crypto_generichash(32, privateKey);
}
```

---

## 2. **Password Not Re-requested After Page Reload**
**Problem:** After page reload, the app can't decrypt private keys because:
- Password is not stored anywhere ✅ (correct!)
- Master key is derived from password
- But you need master key to decrypt private keys

**Current Behavior:** Likely broken - you can't decrypt vault entries after reload.

**Fix:** Implement "unlock vault" flow:
1. User logs in → gets session cookie
2. App loads → prompts for password to unlock vault
3. Derive master key from password
4. Decrypt private keys
5. Store decrypted keys in memory (not IndexedDB)

---

## 3. **No Device Approval Mechanism**
**Missing:** Master device should approve secondary devices.

**Recommended Flow:**
1. Secondary device registers → gets pending status
2. Master device receives notification
3. Master device approves → encrypts vault key for secondary device using its public key
4. Secondary device can now access vault

---

## 4. **No Vault Key Rotation**
**Missing:** If a device is compromised, you can't rotate encryption keys.

**Fix:** Implement key versioning:
```sql
ALTER TABLE vault_entries ADD COLUMN key_version INTEGER DEFAULT 1;
```

---

## 5. **Database Security Missing**
**Location:** `/backend/cmd/server/main.go:30`
```go
sslmode=disable
```

**Fix:**
- Enable SSL for database connections in production
- Use connection pooling with limits
- Implement database audit logging
