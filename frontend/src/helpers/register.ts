import sodium from "libsodium-wrappers";

type RegisterResponse = {
  userId: string;
  message: string;
};

export async function registerUser(username: string): Promise<RegisterResponse> {
  await sodium.ready;

  // 1. Generar par de claves para cifrado (X25519)
  const encKeyPair = sodium.crypto_kx_keypair();

  // 2. Generar par de claves para firmas (Ed25519)
  const signKeyPair = sodium.crypto_sign_keypair();

  // 3. Guardar las claves privadas de forma segura (ej: IndexedDB, SecureStorage)
  localStorage.setItem("enc_sk", sodium.to_base64(encKeyPair.privateKey));
  localStorage.setItem("sign_sk", sodium.to_base64(signKeyPair.privateKey));

  // 4. Preparar payload solo con claves públicas
  const payload = {
    Username: username,
    PkEncrypt: sodium.to_base64(encKeyPair.publicKey),
    PkSign: sodium.to_base64(signKeyPair.publicKey),
  };

  // 5. Enviar al backend
  const res = await fetch("http://localhost:8080/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("Error registering user");
  }

  return res.json();
}
