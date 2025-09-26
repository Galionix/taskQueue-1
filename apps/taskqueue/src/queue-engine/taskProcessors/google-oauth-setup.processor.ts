import { TaskModel } from '@tasks/lib';
import axios from 'axios';
import { OAuth2Client } from 'google-auth-library';
import * as crypto from 'crypto';

import { taskProcessorType } from './';
import * as sqlite3 from 'sqlite3';
import * as path from 'path';

// Database path
const DB_PATH = path.join(process.cwd(), 'taskDB.db');

// Helper function to store OAuth tokens in database
async function storeUserTokens(userId: string, tokens: OAuthTokens): Promise<void> {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH);
    
    // Create table if it doesn't exist
    db.run(`
      CREATE TABLE IF NOT EXISTS oauth_tokens (
        user_id TEXT PRIMARY KEY,
        access_token TEXT,
        refresh_token TEXT,
        expiry_date TEXT,
        token_type TEXT DEFAULT 'Bearer',
        scope TEXT DEFAULT 'https://www.googleapis.com/auth/calendar',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Error creating oauth_tokens table:', err);
        db.close();
        reject(err);
        return;
      }
      
      // Insert or replace tokens
      const query = `
        INSERT OR REPLACE INTO oauth_tokens 
        (user_id, access_token, refresh_token, expiry_date, token_type, scope, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;
      
      const values = [
        userId,
        tokens.access_token || null,
        tokens.refresh_token || null,
        tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
        tokens.token_type || 'Bearer',
        tokens.scope || 'https://www.googleapis.com/auth/calendar',
      ];
      
      db.run(query, values, function(err) {
        db.close();
        if (err) {
          console.error('Error storing OAuth tokens:', err);
          reject(err);
        } else {
          console.log(`OAuth tokens stored for user ${userId}`);
          resolve();
        }
      });
    });
  });
}

// Google OAuth Setup types
interface GoogleOAuthPayload {
  operation: string;
  userId: string;
  scopes?: string;
  authCode?: string;
}

interface OAuthTokens {
  access_token?: string | null;
  refresh_token?: string | null;
  expiry_date?: number | null;
  token_type?: string;
  scope?: string;
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

export const googleOAuthSetupProcessor = (): taskProcessorType => {
  // OAuth credentials from environment
  const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback';

  return {
    name: 'googleOAuthSetupProcessor',
    description: 'Handles Google OAuth 2.0 setup and token management',
    blocks: [], // No resource blocks needed
    execute: async (data: TaskModel, storage) => {
      try {
        const payload = JSON.parse(data.payload) as GoogleOAuthPayload;
        const { operation, userId, scopes, authCode } = payload;

        console.log(`Processing Google OAuth setup: ${operation} for user ${userId}`);

        if (!userId) {
          throw new Error('User ID is required for OAuth operations');
        }

        if (!CLIENT_ID || !CLIENT_SECRET) {
          throw new Error('Google OAuth credentials not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.');
        }

        let result: any;
        let formattedMessage = '';

        switch (operation) {
          case 'get-auth-url':
            result = await generateAuthUrl(userId, scopes);
            formattedMessage = formatAuthUrlResponse(result);
            break;
          
          case 'exchange-code':
            if (!authCode) {
              throw new Error('Authorization code is required for token exchange');
            }
            result = await exchangeCodeForTokens(userId, authCode);
            formattedMessage = formatTokenExchangeResponse(result);
            break;
          
          case 'refresh-token':
            result = await refreshAccessToken(userId);
            formattedMessage = formatRefreshResponse(result);
            break;
          
          case 'revoke-token':
            result = await revokeToken(userId);
            formattedMessage = formatRevokeResponse(result);
            break;
          
          default:
            throw new Error(`Unknown OAuth operation: ${operation}`);
        }

        storage.message += `\n${formattedMessage}`;

        console.log(`✅ Google OAuth operation '${operation}' completed successfully for user ${userId}`);
        return {
          success: true,
          data: result,
          operation,
          userId,
          summary: formattedMessage.trim()
        };

      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        const fullErrorMessage = `❌ Google OAuth Setup Error: ${errorMessage}`;
        storage.message += `\n${fullErrorMessage}`;
        console.error('Google OAuth setup processor error:', error);

        return {
          success: false,
          error: errorMessage,
          details: error instanceof Error ? error.stack : String(error)
        };
      }
    },
  };

  // Helper functions
  async function generateAuthUrl(userId: string, scopes?: string): Promise<AuthUrlResponse> {
    const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

    // Default scopes for calendar access
    const scopeList = scopes?.split(',') || [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar'
    ];

    // Generate a unique state parameter to prevent CSRF attacks
    const state = crypto.randomBytes(32).toString('hex');
    
    // TODO: Store state temporarily (implement proper storage)
    console.log(`OAuth state for user ${userId}: ${state}`);

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline', // Required for refresh token
      scope: scopeList,
      state: `${userId}-${state}`,
      prompt: 'consent', // Force consent screen to ensure refresh token
    });

    return {
      authUrl,
      state,
      userId,
      instructions: `
1. Visit the authorization URL
2. Sign in to your Google account  
3. Grant permissions to access your calendar
4. Copy the authorization code from the callback URL
5. Use 'exchange-code' operation with the authorization code
      `.trim(),
    };
  }

  async function exchangeCodeForTokens(userId: string, authCode: string): Promise<TokenExchangeResponse> {
    const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(authCode);

    if (!tokens.access_token) {
      throw new Error('Failed to obtain access token');
    }

    // Store tokens in database
    await storeUserTokens(userId, {
      access_token: tokens.access_token || null,
      refresh_token: tokens.refresh_token || null,
      expiry_date: tokens.expiry_date || null,
      token_type: tokens.token_type || 'Bearer',
      scope: tokens.scope || 'https://www.googleapis.com/auth/calendar',
    });

    console.log(`OAuth tokens stored for user ${userId}:`, {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : 'N/A'
    });

    return {
      success: true,
      userId,
      message: 'OAuth tokens successfully obtained and stored',
      tokenInfo: {
        hasAccessToken: true,
        hasRefreshToken: !!tokens.refresh_token,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : undefined,
      },
    };
  }

  async function refreshAccessToken(userId: string): Promise<any> {
    // TODO: Implement token refresh (requires stored refresh token)
    console.log(`Refreshing access token for user ${userId}`);
    return {
      success: false,
      userId,
      message: 'Token refresh not yet implemented - need to implement token storage first',
    };
  }

  async function revokeToken(userId: string): Promise<any> {
    // TODO: Implement token revocation (requires stored access token)
    console.log(`Revoking tokens for user ${userId}`);
    return {
      success: false,
      userId,
      message: 'Token revocation not yet implemented - need to implement token storage first',
    };
  }
};

// Formatting functions
function formatAuthUrlResponse(result: AuthUrlResponse): string {
  return `🔐 Google OAuth Setup - Authorization URL Generated

👤 User ID: ${result.userId}
🔗 Authorization URL: ${result.authUrl}

📋 Next Steps:
${result.instructions}

⚠️  Important: Copy the authorization code from the callback URL and use it with the 'exchange-code' operation.`;
}

function formatTokenExchangeResponse(result: TokenExchangeResponse): string {
  let message = `✅ Google OAuth Setup - Tokens Successfully Obtained

👤 User ID: ${result.userId}
📝 Status: ${result.message}`;

  if (result.tokenInfo) {
    message += `
🔑 Token Information:
  • Access Token: ${result.tokenInfo.hasAccessToken ? '✅ Available' : '❌ Missing'}
  • Refresh Token: ${result.tokenInfo.hasRefreshToken ? '✅ Available' : '❌ Missing'}`;
    
    if (result.tokenInfo.expiresAt) {
      message += `
  • Expires At: ${result.tokenInfo.expiresAt}`;
    }
  }

  message += `

🎉 You can now use Google Calendar operations with this user ID!`;

  return message;
}

function formatRefreshResponse(result: any): string {
  return `🔄 Google OAuth Setup - Token Refresh

👤 User ID: ${result.userId}
📝 Status: ${result.message}`;
}

function formatRevokeResponse(result: any): string {
  return `🚫 Google OAuth Setup - Token Revocation  

👤 User ID: ${result.userId}
📝 Status: ${result.message}`;
}
