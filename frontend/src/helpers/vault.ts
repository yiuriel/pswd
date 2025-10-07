import sodium from "libsodium-wrappers";

// genera un vault cifrado
async function createVault(masterKey: Uint8Array, data: any) {
  await sodium.ready;
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const plaintext = JSON.stringify(data);
  const ciphertext = sodium.crypto_secretbox_easy(
    sodium.from_string(plaintext),
    nonce,
    masterKey
  );

  return {
    nonce: sodium.to_base64(nonce),
    ciphertext: sodium.to_base64(ciphertext),
  };
}

// subir vault
async function uploadVault(username: string, vault: any) {
  await fetch("http://localhost:8080/vault/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      vault_blob: new TextEncoder().encode(JSON.stringify(vault)),
    }),
  });
}

export { createVault, uploadVault };