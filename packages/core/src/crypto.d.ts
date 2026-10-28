/**
 * Encrypts a sensitive string (SMTP password, API key) using AES-256-GCM.
 * @param plaintext The text to encrypt
 * @param masterKeyHex 64-char hex string (32 bytes)
 * @returns string in format "ivHex:tagHex:ciphertextHex"
 */
export declare function encryptSecret(plaintext: string, masterKeyHex: string): string;
/**
 * Decrypts a ciphertext string produced by encryptSecret.
 * @param ciphertext "ivHex:tagHex:ciphertextHex"
 * @param masterKeyHex 64-char hex string (32 bytes)
 * @returns Decrypted plaintext string
 */
export declare function decryptSecret(ciphertext: string, masterKeyHex: string): string;
//# sourceMappingURL=crypto.d.ts.map