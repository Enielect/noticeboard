import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

export function generateToken(userId: string, email: string) {
  return jwt.sign({ userId, email, type: "access" }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });
}

interface TokenPayload {
  userId: string;
  email: string;
  type: string;
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateVerificationToken() {
  return uuidv4();
}

export function isValidEmail(email: string): boolean {
  // const allowedDomains = process.env.ALLOWED_EMAIL_DOMAINS?.split(",") || [];
  const allowedDomains = ['live.unilag.edu.ng', 'unilag.edu.ng', 'college.edu', 'gmail.com']; //only adding this for testing purposes
  const domain = email.split("@")[1];
  return allowedDomains.includes(domain);
}

export function isValidStudentId(studentId: string): boolean {
  // Example: Check if student ID follows pattern (e.g., 2024001234)
  return /^\d{9}$/.test(studentId);
}
