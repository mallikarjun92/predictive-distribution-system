"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptSecret = encryptSecret;
exports.decryptSecret = decryptSecret;
const crypto_1 = __importDefault(require("crypto"));
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits for GCM
/**
 * Encrypts a sensitive string (SMTP password, API key) using AES-256-GCM.
 * @param plaintext The text to encrypt
 * @param masterKeyHex 64-char hex string (32 bytes)
 * @returns string in format "ivHex:tagHex:ciphertextHex"
 */
function encryptSecret(plaintext, masterKeyHex) {
    if (!plaintext)
        return '';
    const iv = crypto_1.default.randomBytes(IV_LENGTH);
    const key = Buffer.from(masterKeyHex, 'hex');
    const cipher = crypto_1.default.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}
/**
 * Decrypts a ciphertext string produced by encryptSecret.
 * @param ciphertext "ivHex:tagHex:ciphertextHex"
 * @param masterKeyHex 64-char hex string (32 bytes)
 * @returns Decrypted plaintext string
 */
function decryptSecret(ciphertext, masterKeyHex) {
    if (!ciphertext)
        return '';
    const parts = ciphertext.split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid ciphertext format. Expected iv:tag:encrypted');
    }
    const [ivHex, tagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const key = Buffer.from(masterKeyHex, 'hex');
    const decipher = crypto_1.default.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
//# sourceMappingURL=crypto.js.map