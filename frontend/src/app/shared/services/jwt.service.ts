import { Injectable } from '@angular/core';

export interface JwtPayload {
  sub: string;  // Subject (user email)
  exp: number;  // Expiration time (Unix timestamp)
  iat?: number; // Issued at (Unix timestamp)
}

@Injectable({
  providedIn: 'root'
})
export class JwtService {
  /**
   * Decode JWT token without verification
   * Note: This only decodes the token, it doesn't verify the signature
   */
  decode(token: string): JwtPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      // Decode the payload (second part)
      const payload = parts[1];
      const decodedPayload = this.base64UrlDecode(payload);
      return JSON.parse(decodedPayload) as JwtPayload;
    } catch (error) {
      console.error('Failed to decode JWT:', error);
      return null;
    }
  }

  /**
   * Check if token is expired
   * @param token JWT token string
   * @param offsetSeconds Number of seconds before expiry to consider token expired (default: 60)
   */
  isTokenExpired(token: string | null, offsetSeconds: number = 60): boolean {
    if (!token) {
      return true;
    }

    const payload = this.decode(token);
    if (!payload || !payload.exp) {
      return true;
    }

    // Get current time in seconds
    const now = Math.floor(Date.now() / 1000);

    // Consider token expired if it will expire within offsetSeconds
    return payload.exp < (now + offsetSeconds);
  }

  /**
   * Get token expiration date
   */
  getTokenExpirationDate(token: string): Date | null {
    const payload = this.decode(token);
    if (!payload || !payload.exp) {
      return null;
    }

    return new Date(payload.exp * 1000);
  }

  /**
   * Get remaining time until token expires (in seconds)
   */
  getTokenRemainingTime(token: string): number {
    const payload = this.decode(token);
    if (!payload || !payload.exp) {
      return 0;
    }

    const now = Math.floor(Date.now() / 1000);
    const remaining = payload.exp - now;

    return remaining > 0 ? remaining : 0;
  }

  /**
   * Base64 URL decode
   */
  private base64UrlDecode(str: string): string {
    // Replace URL-safe characters
    let output = str.replace(/-/g, '+').replace(/_/g, '/');

    // Pad with '=' to make length multiple of 4
    switch (output.length % 4) {
      case 0:
        break;
      case 2:
        output += '==';
        break;
      case 3:
        output += '=';
        break;
      default:
        throw new Error('Invalid base64url string');
    }

    // Decode base64
    return atob(output);
  }
}
