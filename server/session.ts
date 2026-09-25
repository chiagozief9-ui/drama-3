import crypto from 'crypto';
import type { Request, Response } from 'express';
import dotenv from 'dotenv';

dotenv.config();

const COOKIE_NAME = 'aidrama_session';

function getSessionSecret(): string {
  return (
    process.env.SESSION_COOKIE_SECRET ||
    'ai-drama-creator-default-fallback-session-secret-change-me'
  );
}

export interface SessionData {
  uid: string;
  email: string;
  issuedAt: number;
}

export function createSignedToken(payload: { uid: string; email: string }): string {
  const data = JSON.stringify({
    ...payload,
    issuedAt: Date.now(),
  });
  const encodedData = Buffer.from(data).toString('base64url');
  const secret = getSessionSecret();
  const signature = crypto
    .createHmac('sha256', secret)
    .update(encodedData)
    .digest('base64url');
  return `${encodedData}.${signature}`;
}

export function verifySignedToken(token: string): SessionData | null {
  if (!token || !token.includes('.')) return null;

  const [encodedData, signature] = token.split('.');
  if (!encodedData || !signature) return null;

  try {
    const secret = getSessionSecret();
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(encodedData)
      .digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const raw = Buffer.from(encodedData, 'base64url').toString('utf-8');
    const session = JSON.parse(raw) as SessionData;

    // Expiration check: 14 days
    const maxAgeMs = 14 * 24 * 60 * 60 * 1000;
    if (Date.now() - session.issuedAt > maxAgeMs) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export function setSessionCookie(res: Response, payload: { uid: string; email: string }): string {
  const token = createSignedToken(payload);

  // In iframe environments (like AI Studio previews), SameSite=None and Secure=true
  // are mandatory for cookies to be accepted by Chrome and modern browsers.
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 14 * 24 * 60 * 60 * 1000,
    path: '/',
  });

  return token;
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
  });
}

export function getSessionFromRequest(req: Request): SessionData | null {
  // 1. Check Authorization Bearer header
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const session = verifySignedToken(token);
    if (session) return session;
  }

  // 2. Check X-Session-Token header
  const xToken = req.headers['x-session-token'] as string;
  if (xToken) {
    const session = verifySignedToken(xToken);
    if (session) return session;
  }

  // 3. Check cookie
  const cookieToken = req.cookies?.[COOKIE_NAME];
  if (cookieToken) {
    const session = verifySignedToken(cookieToken);
    if (session) return session;
  }

  return null;
}
