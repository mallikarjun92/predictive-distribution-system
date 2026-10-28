import { describe, it, expect } from 'vitest';
import { encryptSecret, decryptSecret } from '../crypto.js';

describe('AES-256-GCM Vault Crypto', () => {
  const dummyMasterKeyHex = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

  it('should encrypt and decrypt a sensitive password symmetrically', () => {
    const rawSecret = 'super-secret-smtp-password-1234!#$';
    const encrypted = encryptSecret(rawSecret, dummyMasterKeyHex);

    expect(encrypted).not.toBe(rawSecret);
    expect(encrypted.split(':')).toHaveLength(3); // iv:tag:ciphertext

    const decrypted = decryptSecret(encrypted, dummyMasterKeyHex);
    expect(decrypted).toBe(rawSecret);
  });

  it('should fail decryption if master key does not match', () => {
    const rawSecret = 'api-key-test';
    const wrongKeyHex = 'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210';
    const encrypted = encryptSecret(rawSecret, dummyMasterKeyHex);

    expect(() => decryptSecret(encrypted, wrongKeyHex)).toThrow();
  });
});
