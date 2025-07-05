import CryptoJS from 'crypto-js';

const ITERATIONS = 100000;

export interface EncryptedData {
  encrypted: string;
  salt: string;
  iv: string;
}

export function encryptWithPassword(text: string, password: string): EncryptedData {
  // Generate random salt and IV
  const salt = CryptoJS.lib.WordArray.random(32); // 32 bytes = 256 bits
  const iv = CryptoJS.lib.WordArray.random(16);   // 16 bytes = 128 bits
  
  // Derive key from password using PBKDF2
  const key = CryptoJS.PBKDF2(password, salt, {
    keySize: 8, // 8 words = 32 bytes = 256 bits
    iterations: ITERATIONS,
    hasher: CryptoJS.algo.SHA256
  });
  
  // Encrypt the text using AES
  const encrypted = CryptoJS.AES.encrypt(text, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  
  return {
    encrypted: encrypted.toString(),
    salt: salt.toString(CryptoJS.enc.Hex),
    iv: iv.toString(CryptoJS.enc.Hex)
  };
}

export function decryptWithPassword(encryptedData: EncryptedData, password: string): string {
  // Convert hex strings back to WordArrays
  const salt = CryptoJS.enc.Hex.parse(encryptedData.salt);
  const iv = CryptoJS.enc.Hex.parse(encryptedData.iv);
  
  // Derive key from password using PBKDF2
  const key = CryptoJS.PBKDF2(password, salt, {
    keySize: 8, // 8 words = 32 bytes = 256 bits
    iterations: ITERATIONS,
    hasher: CryptoJS.algo.SHA256
  });
  
  // Decrypt the text
  const decrypted = CryptoJS.AES.decrypt(encryptedData.encrypted, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  
  return decrypted.toString(CryptoJS.enc.Utf8);
}

export function hashWithSHA256(data: string): string {
  return CryptoJS.SHA256(data).toString(CryptoJS.enc.Hex);
}