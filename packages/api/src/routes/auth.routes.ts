/**
 * Authentication Routes
 * Handles user registration, login (email/password and OAuth2), logout
 */

import { Elysia, t } from 'elysia';
import { nanoid } from 'nanoid';
import type { AuthService } from '../services/auth.service';
import { setSessionCookie, clearSessionCookie, requireAuth } from '../middleware/auth.middleware';

/**
 * Register authentication routes
 */
export function authRoutes(app: Elysia, authService: AuthService) {
  return app
    // POST /auth/register - Register new user
    .post(
      '/auth/register',
      async ({ body, cookie, set }) => {
        try {
          const { email, password, fullName } = body;

          const result = await authService.register(email, password, fullName);

          // Set session cookie
          setSessionCookie(cookie, result.sessionId);

          return {
            success: true,
            user: result.user,
            message: 'Registration successful',
          };
        } catch (error) {
          set.status = 400;
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Registration failed',
          };
        }
      },
      {
        body: t.Object({
          email: t.String({ format: 'email' }),
          password: t.String({ minLength: 8 }),
          fullName: t.String({ minLength: 1 }),
        }),
      }
    )

    // POST /auth/login - Login with email/password
    .post(
      '/auth/login',
      async ({ body, cookie, set }) => {
        try {
          const result = await authService.login(body);

          // Set session cookie
          setSessionCookie(cookie, result.sessionId);

          return {
            success: true,
            user: result.user,
            message: 'Login successful',
          };
        } catch (error) {
          set.status = 401;
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Login failed',
          };
        }
      },
      {
        body: t.Object({
          email: t.String({ format: 'email' }),
          password: t.String(),
        }),
      }
    )

    // POST /auth/logout - Logout current session
    .post(
      '/auth/logout',
      async ({ cookie, sessionId }) => {
        if (sessionId) {
          await authService.logout(sessionId);
        }

        // Clear session cookie
        clearSessionCookie(cookie);

        return {
          success: true,
          message: 'Logged out successfully',
        };
      }
    )

    // POST /auth/logout-all - Logout all sessions
    .use(requireAuth())
    .post(
      '/auth/logout-all',
      async ({ user, cookie }) => {
        const count = await authService.logoutAllSessions(user.id);

        // Clear current session cookie
        clearSessionCookie(cookie);

        return {
          success: true,
          message: `Logged out from ${count} sessions`,
          count,
        };
      }
    )

    // GET /auth/me - Get current user
    .use(requireAuth())
    .get('/auth/me', async ({ user }) => {
      return {
        success: true,
        user,
      };
    })

    // POST /auth/password - Update password
    .use(requireAuth())
    .post(
      '/auth/password',
      async ({ user, body, set }) => {
        try {
          await authService.updatePassword(user.id, body.currentPassword, body.newPassword);

          return {
            success: true,
            message: 'Password updated successfully. All other sessions have been logged out.',
          };
        } catch (error) {
          set.status = 400;
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Password update failed',
          };
        }
      },
      {
        body: t.Object({
          currentPassword: t.String(),
          newPassword: t.String({ minLength: 8 }),
        }),
      }
    )

    // GET /auth/oauth2/authorize - Initiate OAuth2 flow
    .get('/auth/oauth2/authorize', ({ set, query }) => {
      try {
        // Generate state for CSRF protection
        const state = nanoid(32);

        // Store state in session or temporary storage
        // For now, we'll include it in the authorization URL
        const authUrl = authService.getOAuth2AuthorizationUrl(state);

        // Redirect to OAuth2 provider
        set.redirect = authUrl;
        return { success: true };
      } catch (error) {
        set.status = 500;
        return {
          success: false,
          error: error instanceof Error ? error.message : 'OAuth2 initialization failed',
        };
      }
    })

    // GET /auth/oauth2/callback - Handle OAuth2 callback
    .get('/auth/oauth2/callback', async ({ query, cookie, set }) => {
      try {
        const { code, state } = query;

        if (!code) {
          throw new Error('Authorization code not provided');
        }

        // Verify state (CSRF protection)
        // In production, validate state against stored value

        const result = await authService.handleOAuth2Callback(code as string);

        // Set session cookie
        setSessionCookie(cookie, result.sessionId);

        // Redirect to app
        set.redirect = process.env.OAUTH2_SUCCESS_REDIRECT || '/';
        return {
          success: true,
          user: result.user,
        };
      } catch (error) {
        set.status = 401;
        return {
          success: false,
          error: error instanceof Error ? error.message : 'OAuth2 callback failed',
        };
      }
    });
}
