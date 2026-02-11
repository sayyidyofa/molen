/**
 * Authentication Middleware
 * Validates sessions and provides user context to routes
 */

import { Elysia } from 'elysia';
import type { ISessionStore } from '@molen/core';

/**
 * Session cookie name
 */
export const SESSION_COOKIE_NAME = 'molen_session';

/**
 * Session cookie configuration
 */
export interface SessionCookieConfig {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  maxAge: number; // seconds
  path: string;
}

/**
 * Get default session cookie config from environment
 */
export function getSessionCookieConfig(): SessionCookieConfig {
  return {
    httpOnly: process.env.SESSION_COOKIE_HTTPONLY !== 'false',
    secure: process.env.SESSION_COOKIE_SECURE === 'true',
    sameSite: (process.env.SESSION_COOKIE_SAMESITE as 'strict' | 'lax' | 'none') || 'strict',
    maxAge: parseInt(process.env.SESSION_TTL || '86400', 10),
    path: '/',
  };
}

/**
 * Create authentication middleware
 */
export function createAuthMiddleware(sessionStore: ISessionStore) {
  return new Elysia()
    .derive(async ({ cookie, set }) => {
      const sessionId = cookie[SESSION_COOKIE_NAME]?.value;
      
      if (!sessionId) {
        return {
          user: null,
          sessionId: null,
          isAuthenticated: false,
        };
      }

      const session = await sessionStore.get(sessionId);
      
      if (!session) {
        // Invalid or expired session, clear cookie
        cookie[SESSION_COOKIE_NAME].remove();
        return {
          user: null,
          sessionId: null,
          isAuthenticated: false,
        };
      }

      return {
        user: {
          id: session.userId,
          email: session.email,
          fullName: session.fullName,
        },
        sessionId,
        isAuthenticated: true,
      };
    });
}

/**
 * Require authentication guard
 */
export function requireAuth() {
  return new Elysia()
    .derive(({ user, isAuthenticated, set }) => {
      if (!isAuthenticated || !user) {
        set.status = 401;
        throw new Error('Authentication required');
      }
      
      return { user };
    });
}

/**
 * Set session cookie
 */
export function setSessionCookie(cookie: any, sessionId: string) {
  const config = getSessionCookieConfig();
  
  cookie[SESSION_COOKIE_NAME].set({
    value: sessionId,
    httpOnly: config.httpOnly,
    secure: config.secure,
    sameSite: config.sameSite,
    maxAge: config.maxAge,
    path: config.path,
  });
}

/**
 * Clear session cookie
 */
export function clearSessionCookie(cookie: any) {
  cookie[SESSION_COOKIE_NAME].remove();
}
