import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller('auth/google')
export class GoogleAuthController {
  
  @Get('callback')
  async handleOAuthCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Res() res: Response
  ) {
    if (error) {
      return res.status(400).send(`OAuth Error: ${error}`);
    }

    if (!code) {
      return res.status(400).send('Authorization code not found');
    }

    // Извлекаем userId из state
    const userId = state?.split('-')[0];

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Google OAuth Success</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        .code-box { background: #f5f5f5; padding: 15px; border-radius: 5px; word-break: break-all; }
        .success { color: #28a745; }
        .task-json { background: #e9ecef; padding: 15px; border-radius: 5px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <h1 class="success">✅ Google OAuth Authorization Successful!</h1>
      
      <h3>📋 Next Step: Create Exchange Task</h3>
      <p>Copy this JSON and create a new task to exchange the code for tokens:</p>
      
      <div class="task-json">
        <pre>{
  "exeType": "google_oauth_setup",
  "payload": {
    "operation": "exchange-code",
    "userId": "${userId}",
    "authCode": "${code}"
  }
}</pre>
      </div>
      
      <h3>🔑 Authorization Details:</h3>
      <p><strong>User ID:</strong> ${userId}</p>
      <p><strong>Authorization Code:</strong></p>
      <div class="code-box">${code}</div>
      
      <p><em>You can close this window and create the exchange task in your TaskQueue interface.</em></p>
    </body>
    </html>`;

    res.send(html);
  }
}
