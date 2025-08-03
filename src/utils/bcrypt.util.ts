// src/utils/bcrypt.util.ts
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 5;

/**
 * Hash a string (e.g. password)
 * @param rawText - plain text to hash
 * @returns hashed string
 */
export const encrypt = async (rawText: string): Promise<string> => {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);

  const hashed = await bcrypt.hash(rawText, salt);
  return hashed;
};

/**
 * Compare a raw string with its hashed value
 * @param rawText - plain text input
 * @param hashedText - hashed version
 * @returns true if they match, false otherwise
 */
export const isMatch = async (
  rawText: string,
  hashedText: string
): Promise<boolean> => {
  return await bcrypt.compare(rawText, hashedText);
};
