import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';

interface VerificationToken {
  userId: string;
  expiresAt: Date;
}

@Injectable()
export class FaceVerificationTokenService {
  private readonly logger = new Logger(FaceVerificationTokenService.name);
  private readonly tokens: Map<string, VerificationToken> = new Map();
  private readonly TOKEN_EXPIRY_MINUTES = 5; // Token expires in 5 minutes

  /**
   * Generate a verification token for a user after successful face verification
   */
  generateToken(userId: string): string {
    // Generate a random token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Calculate expiration time
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.TOKEN_EXPIRY_MINUTES);

    // Store token
    this.tokens.set(token, {
      userId,
      expiresAt,
    });

    this.logger.log(`Generated verification token for user ${userId}, expires at ${expiresAt}`);

    // Clean up expired tokens periodically
    this.cleanupExpiredTokens();

    return token;
  }

  /**
   * Validate a verification token
   */
  validateToken(token: string, userId: string): boolean {
    const storedToken = this.tokens.get(token);

    if (!storedToken) {
      this.logger.warn(`Invalid verification token: ${token}`);
      return false;
    }

    // Check if token belongs to user
    if (storedToken.userId !== userId) {
      this.logger.warn(`Token ${token} does not belong to user ${userId}`);
      return false;
    }

    // Check if token is expired
    if (new Date() > storedToken.expiresAt) {
      this.logger.warn(`Token ${token} has expired`);
      this.tokens.delete(token);
      return false;
    }

    this.logger.log(`Token validated successfully for user ${userId}`);
    return true;
  }

  /**
   * Revoke a token (optional, for security)
   */
  revokeToken(token: string): void {
    this.tokens.delete(token);
    this.logger.log(`Token revoked: ${token}`);
  }

  /**
   * Clean up expired tokens
   */
  private cleanupExpiredTokens(): void {
    const now = new Date();
    let cleaned = 0;

    for (const [token, data] of this.tokens.entries()) {
      if (now > data.expiresAt) {
        this.tokens.delete(token);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.log(`Cleaned up ${cleaned} expired tokens`);
    }
  }
}

