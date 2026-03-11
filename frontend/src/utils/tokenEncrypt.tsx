import CryptoJS from "crypto-js";

const SECRET_KEY = "SUPERCLAVE1234"; 
export function encryptToken(token: string): string {
  return CryptoJS.AES.encrypt(token, SECRET_KEY).toString();
}

export function decryptToken(encrypted: string | null): string | null {
  if (!encrypted) return null;
  try {
    const bytes = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch {
    return null;
  }
}