import { Injectable, Logger } from '@nestjs/common';
import { CreateTaskDto } from '../dto/create-task.dto';
import { ProcessorInterface } from './processor.interface';
import { TaskModel } from '../entities/task.entity';
import { ExeTypes } from '@tasks/lib';
import { OAuth2Client } from 'google-auth-library';
import * as crypto from 'crypto';

export interface GoogleOAuthPayload {
  operation: string;
  userId: string;
  scopes?: string;
  authCode?: string;
}

interface AuthUrlResponse {
  authUrl: string;
  state: string;
  userId: string;
  instructions: string;
}

interface TokenExchangeResponse {
  success: boolean;
  userId: string;
  message: string;
  tokenInfo?: {
    hasAccessToken: boolean;
    hasRefreshToken: boolean;
    expiresAt?: string;
  };
}

interface RefreshTokenResponse {
  success: boolean;
  userId: string;
  message: string;
  newExpiresAt?: string;
}

interface RevokeTokenResponse {
  success: boolean;
  userId: string;
  message: string;
}

@Injectable()
export class GoogleOAuthSetupProcessor implements ProcessorInterface {
  private readonly logger = new Logger(GoogleOAuthSetupProcessor.name);
  
  // These should be loaded from environment variables
  private readonly CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  private readonly CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  private readonly REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback';

  async process(createTaskDto: CreateTaskDto): Promise<TaskModel> {
    const task = new TaskModel();
    task.exeType = ExeTypes.google_oauth_setup;
    task.status = 'pending';
    task.request = JSON.stringify(createTaskDto);

    try {
      const payload = createTaskDto.payload as GoogleOAuthPayload;
      
      if (!payload.userId) {
        throw new Error('User ID is required for OAuth operations');
      }

      if (!this.CLIENT_ID || !this.CLIENT_SECRET) {
        throw new Error('Google OAuth credentials not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.');
      }

      let result: unknown;

      switch (payload.operation) {
        case 'get-auth-url':
          result = await this.generateAuthUrl(payload);
          break;
        
        case 'exchange-code':
          result = await this.exchangeCodeForTokens(payload);
          break;
        
        case 'refresh-token':
          result = await this.refreshAccessToken(payload);
          break;
        
        case 'revoke-token':
          result = await this.revokeToken(payload);
          break;
        
        default:
          throw new Error(`Unknown OAuth operation: ${payload.operation}`);
      }

      task.result = JSON.stringify(result);
      task.status = 'completed';
      
      this.logger.log(`Google OAuth operation ${payload.operation} completed successfully for user ${payload.userId}`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Google OAuth operation failed: ${errorMessage}`, errorStack);
      task.result = JSON.stringify({ error: errorMessage });
      task.status = 'failed';
    }

    return task;
  }

  private async generateAuthUrl(payload: GoogleOAuthPayload): Promise<AuthUrlResponse> {
    try {
      const oauth2Client = new OAuth2Client(
        this.CLIENT_ID,
        this.CLIENT_SECRET,
        this.REDIRECT_URI
      );

      // Default scopes for calendar access
      const scopes = payload.scopes?.split(',') || [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar'
      ];

      // Generate a unique state parameter to prevent CSRF attacks
      const state = crypto.randomBytes(32).toString('hex');
      
      // Store state temporarily (in production, use Redis or database)
      await this.storeOAuthState(payload.userId, state);

      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline', // Required for refresh token
        scope: scopes,
        state: `${payload.userId}-${state}`,
        prompt: 'consent', // Force consent screen to ensure refresh token
      });

      return {
        authUrl,
        state,
        userId: payload.userId,
        instructions: `
1. Visit the authorization URL above
2. Sign in to your Google account  
3. Grant permissions to access your calendar
4. Copy the authorization code from the callback URL
5. Use 'exchange-code' operation with the authorization code
        `.trim(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to generate auth URL: ${errorMessage}`);
    }
  }

  private async exchangeCodeForTokens(payload: GoogleOAuthPayload): Promise<TokenExchangeResponse> {
    try {
      if (!payload.authCode) {
        throw new Error('Authorization code is required for token exchange');
      }

      const oauth2Client = new OAuth2Client(
        this.CLIENT_ID,
        this.CLIENT_SECRET,
        this.REDIRECT_URI
      );

      // Exchange authorization code for tokens
      const { tokens } = await oauth2Client.getToken(payload.authCode);

      if (!tokens.access_token) {
        throw new Error('Failed to obtain access token');
      }

      // Store tokens securely (implement your preferred storage method)
      await this.storeUserTokens(payload.userId, {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date,
      });

      return {
        success: true,
        userId: payload.userId,
        message: 'OAuth tokens successfully obtained and stored',
        tokenInfo: {
          hasAccessToken: true,
          hasRefreshToken: !!tokens.refresh_token,
          expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : undefined,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to exchange code for tokens: ${errorMessage}`);
    }
  }

  private async refreshAccessToken(payload: GoogleOAuthPayload): Promise<RefreshTokenResponse> {
    try {
      // Retrieve stored tokens
      const storedTokens = await this.getUserTokens(payload.userId);
      if (!storedTokens?.refreshToken) {
        throw new Error('No refresh token found for user. User needs to re-authenticate.');
      }

      const oauth2Client = new OAuth2Client(
        this.CLIENT_ID,
        this.CLIENT_SECRET,
        this.REDIRECT_URI
      );

      oauth2Client.setCredentials({
        refresh_token: storedTokens.refreshToken,
      });

      // Refresh the access token
      const { credentials } = await oauth2Client.refreshAccessToken();

      if (!credentials.access_token) {
        throw new Error('Failed to refresh access token');
      }

      // Update stored tokens
      await this.storeUserTokens(payload.userId, {
        accessToken: credentials.access_token,
        refreshToken: credentials.refresh_token || storedTokens.refreshToken,
        expiryDate: credentials.expiry_date,
      });

      return {
        success: true,
        userId: payload.userId,
        message: 'Access token successfully refreshed',
        newExpiresAt: credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : undefined,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to refresh access token: ${errorMessage}`);
    }
  }

  private async revokeToken(payload: GoogleOAuthPayload): Promise<RevokeTokenResponse> {
    try {
      const storedTokens = await this.getUserTokens(payload.userId);
      if (!storedTokens?.accessToken) {
        throw new Error('No access token found for user');
      }

      const oauth2Client = new OAuth2Client(
        this.CLIENT_ID,
        this.CLIENT_SECRET,
        this.REDIRECT_URI
      );

      oauth2Client.setCredentials({
        access_token: storedTokens.accessToken,
      });

      // Revoke the token
      await oauth2Client.revokeToken(storedTokens.accessToken);

      // Remove stored tokens
      await this.removeUserTokens(payload.userId);

      return {
        success: true,
        userId: payload.userId,
        message: 'OAuth tokens successfully revoked and removed',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to revoke token: ${errorMessage}`);
    }
  }

  // TODO: Implement these methods based on your storage solution
  private async storeOAuthState(userId: string, state: string): Promise<void> {
    // In production: store in Redis with expiration (e.g., 10 minutes)
    // For now, log it (not secure for production)
    this.logger.debug(`OAuth state for user ${userId}: ${state}`);
  }

  private async storeUserTokens(userId: string, tokens: {
    accessToken: string;
    refreshToken?: string | null;
    expiryDate?: number | null;
  }): Promise<void> {
    // TODO: Implement secure token storage
    // Options:
    // 1. Database with encryption
    // 2. Secure key-value store (Redis with encryption)
    // 3. Environment-specific secrets manager
    
    this.logger.log(`Storing OAuth tokens for user ${userId}`);
    // For development, you might store in a simple JSON file or memory
    // In production, use proper encrypted storage
  }

  private async getUserTokens(userId: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiryDate?: number;
  } | null> {
    // TODO: Implement token retrieval from your storage
    this.logger.debug(`Retrieving OAuth tokens for user ${userId}`);
    return null; // Placeholder
  }

  private async removeUserTokens(userId: string): Promise<void> {
    // TODO: Implement token removal from your storage
    this.logger.log(`Removing OAuth tokens for user ${userId}`);
  }
}
