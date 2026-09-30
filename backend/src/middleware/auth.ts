import { NextFunction, Request, Response } from 'express';
import { admin } from '../config/firebase';

// Extends Express's Request with the verified Firebase identity.
// LEARNING POINT: middleware = a function that runs BEFORE the controller
// and can attach data (here: req.user) or reject the request early.
export interface AuthenticatedRequest extends Request {
  user?: { uid: string; email?: string };
}

function extractBearerToken(header: string | undefined): string | null {
  if (!header || !header.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length).trim();
  return token.length > 0 ? token : null;
}

// Verifies the Firebase ID token so the server NEVER trusts a userId
// sent by the client. All downstream code uses req.user.uid.
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const token = extractBearerToken(req.headers.authorization);
  if (!token) {
    res.status(401).json({ message: 'Missing Authorization Bearer token' });
    return;
  }
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = { uid: decoded.uid, email: decoded.email };
    next();
  } catch {
    // Deliberately generic: don't leak why verification failed.
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}
