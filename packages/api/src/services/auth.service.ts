/**
 * Authentication Service
 * Handles user registration, login (email/password and OAuth2), and session management
 */

import {
  type IUserRepository,
  type ISessionStore,
  type IOAuth2Client,
  type CreateUserPayload,
  type LoginCredentials,
  type OAuth2LoginData,
  type SafeUser,
  type User,
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
} from '@molen/core';

/**
 * Authentication service for managing user authentication and sessions
 */
export class AuthService {
  constructor(
    private userRepo: IUserRepository,
    private sessionStore: ISessionStore,
    private oauth2Client?: IOAuth2Client
  ) {}

  /**
   * Register a new user with email and password
   */
  async register(email: string, password: string, fullName: string): Promise<{ user: SafeUser; sessionId: string }> {
    // Validate email format
    if (!this.isValidEmail(email)) {
      throw new Error('Invalid email format');
    }

    // Validate password strength
    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      throw new Error(passwordError);
    }

    // Check if user already exists
    const existingUser = await this.userRepo.findByEmail(email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Create user
    const payload: CreateUserPayload = {
      email: email.toLowerCase(),
      password,
      full_name: fullName,
    };

    const user = await this.userRepo.create(payload);
    await this.userRepo.updateLastLogin(user.id);

    // Create session
    const sessionId = await this.createSession(user);

    return {
      user: this.toSafeUser(user),
      sessionId,
    };
  }

  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<{ user: SafeUser; sessionId: string }> {
    const { email, password } = credentials;

    // Find user
    const user = await this.userRepo.findByEmail(email.toLowerCase());
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if user has a password (might be OAuth2-only)
    if (!user.password_hash) {
      throw new Error('This account uses OAuth2 authentication. Please use the OAuth2 login button.');
    }

    // Verify password
    const isValid = await verifyPassword(user.password_hash, password);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await this.userRepo.updateLastLogin(user.id);

    // Create session
    const sessionId = await this.createSession(user);

    return {
      user: this.toSafeUser(user),
      sessionId,
    };
  }

  /**
   * Login or register user via OAuth2
   */
  async loginWithOAuth2(data: OAuth2LoginData): Promise<{ user: SafeUser; sessionId: string }> {
    // Upsert user from OAuth2 data
    const user = await this.userRepo.upsertFromOAuth(data);

    // Create session
    const sessionId = await this.createSession(user);

    return {
      user: this.toSafeUser(user),
      sessionId,
    };
  }

  /**
   * Get OAuth2 authorization URL
   */
  getOAuth2AuthorizationUrl(state: string): string {
    if (!this.oauth2Client) {
      throw new Error('OAuth2 is not configured');
    }
    return this.oauth2Client.getAuthorizationUrl(state);
  }

  /**
   * Handle OAuth2 callback
   */
  async handleOAuth2Callback(code: string): Promise<{ user: SafeUser; sessionId: string }> {
    if (!this.oauth2Client) {
      throw new Error('OAuth2 is not configured');
    }

    // Exchange code for token
    const tokenResponse = await this.oauth2Client.exchangeCodeForToken(code);

    // Get user info
    const userInfo = await this.oauth2Client.getUserInfo(tokenResponse.access_token);

    // Login or register user
    const data: OAuth2LoginData = {
      provider: 'oauth2', // This should be configurable based on provider
      subject: userInfo.sub,
      email: userInfo.email,
      full_name: userInfo.name || userInfo.email,
    };

    return this.loginWithOAuth2(data);
  }

  /**
   * Get user by session ID
   */
  async getUserBySession(sessionId: string): Promise<SafeUser | null> {
    const session = await this.sessionStore.get(sessionId);
    if (!session) {
      return null;
    }

    const user = await this.userRepo.findById(session.userId);
    if (!user) {
      // Session exists but user doesn't - destroy session
      await this.sessionStore.destroy(sessionId);
      return null;
    }

    return this.toSafeUser(user);
  }

  /**
   * Logout user (destroy session)
   */
  async logout(sessionId: string): Promise<boolean> {
    return this.sessionStore.destroy(sessionId);
  }

  /**
   * Logout all sessions for a user
   */
  async logoutAllSessions(userId: string): Promise<number> {
    return this.sessionStore.destroyUserSessions(userId);
  }

  /**
   * Update user password
   */
  async updatePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.password_hash) {
      throw new Error('This account uses OAuth2 authentication and does not have a password');
    }

    // Verify current password
    const isValid = await verifyPassword(user.password_hash, currentPassword);
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    // Validate new password
    const passwordError = validatePasswordStrength(newPassword);
    if (passwordError) {
      throw new Error(passwordError);
    }

    // Update password
    await this.userRepo.update(userId, { password: newPassword });

    // Logout all other sessions for security
    const sessions = await this.sessionStore.getUserSessions(userId);
    for (const sessionId of sessions) {
      await this.sessionStore.destroy(sessionId);
    }
  }

  /**
   * Create a session for a user
   */
  private async createSession(user: User): Promise<string> {
    return this.sessionStore.create(user.id, {
      email: user.email,
      fullName: user.full_name,
    });
  }

  /**
   * Convert User to SafeUser (remove password_hash)
   */
  private toSafeUser(user: User): SafeUser {
    const { password_hash, ...safeUser } = user;
    return safeUser;
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
