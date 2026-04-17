import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "crypto";
import { promisify } from "util";
import jwt from "jsonwebtoken";

const scrypt = promisify(scryptCallback);
const TOKEN_SECRET = process.env.AUTH_SECRET ?? "dev-only-change-this-secret";

export type AuthUser = {
  userId: string;
  email: string;
};

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const key = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${key.toString("hex")}`;
}

export async function verifyPassword(password: string, hash: string) {
  const [salt, storedHex] = hash.split(":");
  if (!salt || !storedHex) {
    return false;
  }
  const key = (await scrypt(password, salt, 64)) as Buffer;
  const stored = Buffer.from(storedHex, "hex");
  if (stored.length !== key.length) {
    return false;
  }
  return timingSafeEqual(stored, key);
}

export function signAuthToken(user: AuthUser) {
  return jwt.sign(user, TOKEN_SECRET, { expiresIn: "14d" });
}

export function verifyAuthToken(token: string): AuthUser | null {
  try {
    const payload = jwt.verify(token, TOKEN_SECRET);
    if (!payload || typeof payload !== "object") {
      return null;
    }
    const userId = String((payload as { userId?: string }).userId ?? "");
    const email = String((payload as { email?: string }).email ?? "");
    if (!userId || !email) {
      return null;
    }
    return { userId, email };
  } catch {
    return null;
  }
}

export function readBearerToken(headerValue: unknown): string | null {
  if (!headerValue || typeof headerValue !== "string") {
    return null;
  }
  const [prefix, token] = headerValue.split(" ");
  if (prefix?.toLowerCase() !== "bearer" || !token) {
    return null;
  }
  return token.trim();
}

export function hashEmailForName(email: string) {
  return `User-${createHash("md5").update(email).digest("hex").slice(0, 6)}`;
}

