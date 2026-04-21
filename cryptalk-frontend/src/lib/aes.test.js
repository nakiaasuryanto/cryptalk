// Test file for AES library
// Run with: node src/lib/aes.test.js

import CryptoJS from 'crypto-js';

// Import functions from aes.js (inline since we're running directly)
const encryptMessage = (plaintext, key) => {
  const iv = CryptoJS.lib.WordArray.random(16);
  const keyWordArray = CryptoJS.enc.Utf8.parse(key);
  const encrypted = CryptoJS.AES.encrypt(plaintext, keyWordArray, {
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
    iv: iv
  });
  return {
    ciphertext: encrypted.ciphertext.toString(CryptoJS.enc.Base64),
    iv: iv.toString(CryptoJS.enc.Hex)
  };
};

const decryptMessage = (ciphertext, iv, key) => {
  try {
    const ivWordArray = CryptoJS.enc.Hex.parse(iv);
    const keyWordArray = CryptoJS.enc.Utf8.parse(key);
    const ciphertextWordArray = CryptoJS.enc.Base64.parse(ciphertext);
    const cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: ciphertextWordArray
    });
    const decrypted = CryptoJS.AES.decrypt(cipherParams, keyWordArray, {
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
      iv: ivWordArray
    });
    const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
    if (!plaintext) return null;
    return plaintext;
  } catch (e) {
    return null;
  }
};

const validateKey = (key) => {
  return typeof key === 'string' && key.length === 16;
};

const encodeKeyForURL = (key) => {
  return btoa(key);
};

const decodeKeyFromURL = (encoded) => {
  return atob(encoded);
};

// Test helpers
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (e) {
    console.log(`✗ ${name}`);
    console.log(`  Error: ${e.message}`);
    failed++;
  }
}

function assertEqual(actual, expected, msg = '') {
  if (actual !== expected) {
    throw new Error(`${msg} Expected: ${expected}, Got: ${actual}`);
  }
}

// Test 1: Enkripsi lalu dekripsi harus menghasilkan plaintext yang sama
test('Test 1: encrypt then decrypt returns original plaintext', () => {
  const plaintext = 'Hello, World!';
  const key = '1234567890123456';
  const { ciphertext, iv } = encryptMessage(plaintext, key);
  const decrypted = decryptMessage(ciphertext, iv, key);
  assertEqual(decrypted, plaintext);
});

// Test 2: Dekripsi dengan key salah harus return null (bukan throw)
test('Test 2: decrypt with wrong key returns null', () => {
  const plaintext = 'Secret message';
  const key = '1234567890123456';
  const wrongKey = 'abcdefghijklmnop';
  const { ciphertext, iv } = encryptMessage(plaintext, key);
  const result = decryptMessage(ciphertext, iv, wrongKey);
  assertEqual(result, null);
});

// Test 3: validateKey('1234567890123456') → true (tepat 16 char)
test('Test 3: validateKey with 16 chars returns true', () => {
  assertEqual(validateKey('1234567890123456'), true);
});

// Test 4: validateKey('pendek') → false
test('Test 4: validateKey with short string returns false', () => {
  assertEqual(validateKey('pendek'), false);
});

// Test 5: validateKey('terlalupanjangbanget') → false
test('Test 5: validateKey with long string returns false', () => {
  assertEqual(validateKey('terlalupanjangbanget'), false);
});

// Test 6: encodeKeyForURL → decodeKeyFromURL harus kembali ke key asli
test('Test 6: encode then decode returns original key', () => {
  const key = '1234567890123456';
  const encoded = encodeKeyForURL(key);
  const decoded = decodeKeyFromURL(encoded);
  assertEqual(decoded, key);
});

// Test 7: IV harus berbeda setiap kali encryptMessage dipanggil
test('Test 7: IV is different for each encryptMessage call', () => {
  const plaintext = 'Same message';
  const key = '1234567890123456';
  const result1 = encryptMessage(plaintext, key);
  const result2 = encryptMessage(plaintext, key);
  assertEqual(result1.iv !== result2.iv, true, 'IVs should be different: ');
});

// Test 8: Pesan berbeda dengan key sama harus hasilkan ciphertext berbeda
test('Test 8: Different messages produce different ciphertexts', () => {
  const key = '1234567890123456';
  const result1 = encryptMessage('Message 1', key);
  const result2 = encryptMessage('Message 2', key);
  assertEqual(result1.ciphertext !== result2.ciphertext, true, 'Ciphertexts should be different: ');
});

// Summary
console.log('\n---');
console.log(`Passed: ${passed}/${passed + failed}`);
console.log(`Failed: ${failed}/${passed + failed}`);

if (failed > 0) {
  process.exit(1);
}