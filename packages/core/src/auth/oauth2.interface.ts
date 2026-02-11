/**
 * OAuth2 Provider Interface
 * Supports Authorization Code Flow and Direct Access Grant (Resource Owner Password Credentials)
 */

/**
 * OAuth2 provider configuration
 */
export interface OAuth2Config {
  /**
   * Provider name (e.g., 'google', 'github', 'keycloak')
   */
  provider: string;
  
  /**
   * Client ID
   */
  clientId: string;
  
  /**
   * Client Secret
   */
  clientSecret: string;
  
  /**
   * Authorization endpoint URL
   */
  authorizationUrl: string;
  
  /**
   * Token endpoint URL
   */
  tokenUrl: string;
  
  /**
   * User info endpoint URL
   */
  userInfoUrl: string;
  
  /**
   * Redirect URI for callback
   */
  redirectUri: string;
  
  /**
   * Scopes to request
   */
  scopes: string[];
  
  /**
   * Grant types supported
   */
  grantTypes?: ('authorization_code' | 'password' | 'client_credentials')[];
}

/**
 * OAuth2 token response
 */
export interface OAuth2TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

/**
 * OAuth2 user info (standardized fields)
 */
export interface OAuth2UserInfo {
  /**
   * Unique user ID from provider
   */
  sub: string;
  
  /**
   * Email address
   */
  email: string;
  
  /**
   * Email verified status
   */
  email_verified?: boolean;
  
  /**
   * Full name
   */
  name?: string;
  
  /**
   * Given name (first name)
   */
  given_name?: string;
  
  /**
   * Family name (last name)
   */
  family_name?: string;
  
  /**
   * Profile picture URL
   */
  picture?: string;
  
  /**
   * Additional provider-specific fields
   */
  [key: string]: unknown;
}

/**
 * OAuth2 client interface
 */
export interface IOAuth2Client {
  /**
   * Get authorization URL for Authorization Code Flow
   * @param state - CSRF protection state parameter
   * @returns Authorization URL to redirect user to
   */
  getAuthorizationUrl(state: string): string;
  
  /**
   * Exchange authorization code for access token
   * @param code - Authorization code from callback
   * @returns Token response
   */
  exchangeCodeForToken(code: string): Promise<OAuth2TokenResponse>;
  
  /**
   * Get access token using Direct Access Grant (Resource Owner Password Credentials)
   * @param username - User's username or email
   * @param password - User's password
   * @returns Token response
   */
  getTokenByPassword(username: string, password: string): Promise<OAuth2TokenResponse>;
  
  /**
   * Get access token using Client Credentials
   * @returns Token response
   */
  getTokenByClientCredentials(): Promise<OAuth2TokenResponse>;
  
  /**
   * Get user info from provider
   * @param accessToken - Access token
   * @returns User info
   */
  getUserInfo(accessToken: string): Promise<OAuth2UserInfo>;
  
  /**
   * Refresh access token
   * @param refreshToken - Refresh token
   * @returns New token response
   */
  refreshToken(refreshToken: string): Promise<OAuth2TokenResponse>;
}
