import CryptoJS from 'crypto-js';

/**
 * Enkripsi pesan dengan AES-128-CBC
 * @param {string} plaintext - Pesan asli
 * @param {string} key - Key 16 karakter
 * @returns {{ ciphertext: string, iv: string }}
 */
export function encryptMessage(plaintext, key) {
  // Generate IV random (16 bytes = 128 bits)
  const iv = CryptoJS.lib.WordArray.random(16);

  // Parse key menjadi WordArray
  const keyWordArray = CryptoJS.enc.Utf8.parse(key);

  // Enkripsi dengan AES-128-CBC, padding PKCS7
  const encrypted = CryptoJS.AES.encrypt(plaintext, keyWordArray, {
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
    iv: iv
  });

  // Return ciphertext (string) dan iv (string hex)
  return {
    ciphertext: encrypted.ciphertext.toString(CryptoJS.enc.Base64),
    iv: iv.toString(CryptoJS.enc.Hex)
  };
}

/**
 * Dekripsi pesan dengan AES-128-CBC
 * @param {string} ciphertext
 * @param {string} iv - hex string
 * @param {string} key - Key 16 karakter
 * @returns {string|null} plaintext atau null jika gagal
 */
export function decryptMessage(ciphertext, iv, key) {
  try {
    // Parse iv dari hex ke WordArray
    const ivWordArray = CryptoJS.enc.Hex.parse(iv);

    // Parse key menjadi WordArray
    const keyWordArray = CryptoJS.enc.Utf8.parse(key);

    // Parse ciphertext dari Base64
    const ciphertextWordArray = CryptoJS.enc.Base64.parse(ciphertext);

    // Buat CipherParams object seperti yang dihasilkan oleh encrypt
    const cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: ciphertextWordArray
    });

    // Dekripsi dengan AES-128-CBC
    const decrypted = CryptoJS.AES.decrypt(cipherParams, keyWordArray, {
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
      iv: ivWordArray
    });

    // Convert ke UTF-8 string
    const plaintext = decrypted.toString(CryptoJS.enc.Utf8);

    // Jika hasil dekripsi kosong (key salah atau data corrupt), return null
    if (!plaintext) {
      return null;
    }

    return plaintext;
  } catch (e) {
    // Jika gagal (key salah, data corrupt), return null
    return null;
  }
}

/**
 * Validasi panjang key
 * @param {string} key
 * @returns {boolean} true jika tepat 16 karakter
 */
export function validateKey(key) {
  // AES-128 butuh key tepat 128 bit = 16 karakter
  return typeof key === 'string' && key.length === 16;
}

/**
 * Encode key untuk disimpan di URL fragment
 * @param {string} key
 * @returns {string} Base64 encoded
 */
export function encodeKeyForURL(key) {
  // Gunakan btoa() untuk encode ke Base64
  return btoa(key);
}

/**
 * Decode key dari URL fragment
 * @param {string} encoded - Base64 string
 * @returns {string} key asli
 */
export function decodeKeyFromURL(encoded) {
  // Gunakan atob() untuk decode dari Base64
  return atob(encoded);
}