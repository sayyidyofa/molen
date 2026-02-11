/**
 * Password Hashing Utilities using Argon2id
 * 
 * Argon2id is the most secure password hashing algorithm (Winner of PHC 2015)
 * - Resistant to side-channel attacks
 * - Memory-hard (prevents GPU/ASIC attacks)
 * - Recommended by OWASP, NSA, and security experts
 */

import * as argon2 from 'argon2';

/**
 * Argon2id configuration (OWASP recommended settings)
 */
const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id, // Hybrid of Argon2i and Argon2d
  memoryCost: 65536, // 64 MiB memory cost
  timeCost: 3, // 3 iterations
  parallelism: 4, // 4 parallel threads
};

/**
 * Hash a password using Argon2id
 * @param password - Plain text password
 * @returns Hashed password string (includes salt and parameters)
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length === 0) {
    throw new Error('Password cannot be empty');
  }
  
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }
  
  return argon2.hash(password, ARGON2_OPTIONS);
}

/**
 * Verify a password against a hash
 * @param hash - Stored password hash
 * @param password - Plain text password to verify
 * @returns True if password matches, false otherwise
 */
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch (error) {
    // Invalid hash format or verification error
    return false;
  }
}

/**
 * Check if a password hash needs rehashing (parameters changed)
 * @param hash - Stored password hash
 * @returns True if hash needs to be updated
 */
export function needsRehash(hash: string): boolean {
  return argon2.needsRehash(hash, ARGON2_OPTIONS);
}

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns Error message if invalid, null if valid
 */
export function validatePasswordStrength(password: string): string | null {
  if (!password) {
    return 'Password is required';
  }
  
  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  
  if (password.length > 128) {
    return 'Password must not exceed 128 characters';
  }
  
  // Check for at least one lowercase, one uppercase, one digit, one special char
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password);
  
  const strength = [hasLowercase, hasUppercase, hasDigit, hasSpecial].filter(Boolean).length;
  
  if (strength < 3) {
    return 'Password must contain at least 3 of: lowercase, uppercase, digit, special character';
  }
  
  return null;
}
