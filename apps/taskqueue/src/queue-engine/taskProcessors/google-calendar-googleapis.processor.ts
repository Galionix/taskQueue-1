import { TaskModel } from '@tasks/lib';
import { google, calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import * as sqlite3 from 'sqlite3';
import * as path from 'path';

import { taskProcessorType } from './';

// Database path
const DB_PATH = path.join(process.cwd(), 'taskDB.db');

interface GoogleCalendarPayload {
  operation: string;
  userId: string;
  calendarId?: string;
  timeMin?: string;
  timeMax?: string;
  timeRange?: string;
  query?: string;
  maxResults?: number;
  eventId?: string;
  event?: {
    summary: string;
    description?: string;
    start: { dateTime: string; timeZone?: string };
    end: { dateTime: string; timeZone?: string };
    location?: string;
    attendees?: Array<{ email: string }>;
  };
}

// Function to get user tokens from database
async function getUserTokens(userId: string): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiryDate?: number;
} | null> {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH);

    db.get('SELECT * FROM oauth_tokens WHERE user_id = ?', [userId], (err, row: any) => {
      db.close();
      if (err) {
        console.error('Error getting OAuth tokens:', err);
        reject(err);
      } else if (!row) {
        resolve(null);
      } else {
        resolve({
          accessToken: row.access_token,
          refreshToken: row.refresh_token,
          expiryDate: row.expiry_date ? new Date(row.expiry_date).getTime() : undefined,
        });
      }
    });
  });
}

export const googleCalendarProcessor = (): taskProcessorType => {
  // OAuth credentials from environment
  const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback';

  return {
    name: 'googleCalendarProcessor',
    description: 'Google Calendar integration using googleapis library',
    blocks: [], // No resource blocks needed
    execute: async (data: TaskModel, storage) => {
      try {
        // Debug logging for payload issues
        console.log('🔍 Raw payload:', data.payload);
        console.log('🔍 Payload type:', typeof data.payload);
        console.log('🔍 Payload length:', data.payload?.length);

        let payload: GoogleCalendarPayload;


        try {
          // First try to handle if payload is already an object
          if (typeof data.payload === 'object' && data.payload !== null) {
            payload = data.payload as GoogleCalendarPayload;
          } else {
            // Try to clean up common JSON issues before parsing
            let cleanedPayload = data.payload;

            // Remove potential trailing commas before closing braces/brackets
            cleanedPayload = cleanedPayload.replace(/,(\s*[}\]])/g, '$1');

            // Fix potential single quotes to double quotes
            cleanedPayload = cleanedPayload.replace(/'/g, '"');

            console.log('🧹 Cleaned payload:', cleanedPayload);

            payload = JSON.parse(cleanedPayload) as GoogleCalendarPayload;
          }
        } catch (parseError) {
          console.error('❌ JSON Parse Error Details:');
          console.error('Raw payload type:', typeof data.payload);
          console.error('Raw payload length:', data.payload?.length);
          console.error('Raw payload:', data.payload);
          console.error('Parse error:', parseError);

          // Try to extract position information
          if (parseError instanceof SyntaxError && parseError.message.includes('position')) {
            const match = parseError.message.match(/position (\d+)/);
            if (match) {
              const position = parseInt(match[1]);
              const start = Math.max(0, position - 50);
              const end = Math.min(data.payload.length, position + 50);
              console.error('Extended context around error:', data.payload.substring(start, end));
              console.error('Error position marked:', ' '.repeat(position - start) + '^');

              // Show individual characters around the error
              const errorChar = data.payload[position];
              const prevChar = data.payload[position - 1];
              const nextChar = data.payload[position + 1];
              console.error(`Character at error: "${errorChar}" (code: ${errorChar?.charCodeAt(0)})`);
              console.error(`Previous character: "${prevChar}" (code: ${prevChar?.charCodeAt(0)})`);
              console.error(`Next character: "${nextChar}" (code: ${nextChar?.charCodeAt(0)})`);
            }
          }

          // Try to find and show the problematic line
          const lines = data.payload.split('\n');
          if (lines.length >= 10) {
            console.error('Line 10 content:', lines[9]);
            console.error('Line 9 content:', lines[8]);
            console.error('Line 11 content:', lines[10]);
          }

          throw new Error(`Invalid JSON payload: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`);
        }

        const { operation, userId, calendarId = 'primary' } = payload;

        console.log(`Processing Google Calendar operation: ${operation} for user ${userId}`);

        if (!userId) {
          throw new Error('User ID is required for Google Calendar operations');
        }

        if (!CLIENT_ID || !CLIENT_SECRET) {
          throw new Error('Google OAuth credentials not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.');
        }

        // Get stored tokens for user
        const tokens = await getUserTokens(userId);
        if (!tokens?.accessToken) {
          throw new Error(`No OAuth tokens found for user ${userId}. Please run google_oauth_setup first to authenticate.`);
        }

        // Initialize Google Calendar API client
        const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
        oauth2Client.setCredentials({
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
        });

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        let result: unknown;
        let formattedMessage = '';

        switch (operation) {
          case 'list-calendars':
            result = await listCalendars(calendar);
            formattedMessage = formatCalendarsList(result);
            break;

          case 'list-events':
            result = await listEvents(calendar, payload);
            formattedMessage = formatEventsList(result);
            break;

          case 'search-events':
            result = await searchEvents(calendar, payload);
            formattedMessage = formatSearchResults(result, payload.query || '');
            break;

          case 'get-event':
            result = await getEvent(calendar, payload);
            formattedMessage = formatEventDetails(result);
            break;

          case 'create-event':
            result = await createEvent(calendar, payload);
            formattedMessage = formatCreateResult(result);
            break;

          case 'get-freebusy':
            result = await getFreeBusy(calendar, payload);
            formattedMessage = formatFreeBusyInfo(result);
            break;

          case 'get-current-time':
            result = await getCurrentTime();
            formattedMessage = formatCurrentTime(result);
            break;

          default:
            throw new Error(`Unknown operation: ${operation}`);
        }

        storage.message += `\n${formattedMessage}`;

        console.log(`✅ Google Calendar operation '${operation}' completed successfully`);
        return {
          success: true,
          data: result,
          operation,
          userId,
          summary: formattedMessage.trim()
        };

      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        const fullErrorMessage = `❌ Google Calendar Error: ${errorMessage}`;
        storage.message += `\n${fullErrorMessage}`;
        console.error('Google Calendar processor error:', error);

        return {
          success: false,
          error: errorMessage,
          details: error instanceof Error ? error.stack : String(error)
        };
      }
    },
  };

  // Helper functions for calendar operations
  async function listCalendars(calendar: calendar_v3.Calendar) {
    const response = await calendar.calendarList.list();
    return response.data.items || [];
  }

  async function listEvents(calendar: calendar_v3.Calendar, payload: GoogleCalendarPayload) {
    const options: calendar_v3.Params$Resource$Events$List = {
      calendarId: payload.calendarId || 'primary',
      maxResults: payload.maxResults || 10,
      singleEvents: true,
      orderBy: 'startTime',
    };

    // Handle time range
    if (payload.timeRange) {
      const { timeMin, timeMax } = getTimeRange(payload.timeRange);
      options.timeMin = timeMin;
      options.timeMax = timeMax;
    } else {
      if (payload.timeMin) options.timeMin = payload.timeMin;
      if (payload.timeMax) options.timeMax = payload.timeMax;
    }

    const response = await calendar.events.list(options);
    return response.data.items || [];
  }

  async function searchEvents(calendar: calendar_v3.Calendar, payload: GoogleCalendarPayload) {
    if (!payload.query) {
      throw new Error('Query is required for search operation');
    }

    const options: calendar_v3.Params$Resource$Events$List = {
      calendarId: payload.calendarId || 'primary',
      q: payload.query,
      maxResults: payload.maxResults || 10,
      singleEvents: true,
      orderBy: 'startTime',
    };

    if (payload.timeMin) options.timeMin = payload.timeMin;
    if (payload.timeMax) options.timeMax = payload.timeMax;

    const response = await calendar.events.list(options);
    return response.data.items || [];
  }

  async function getEvent(calendar: calendar_v3.Calendar, payload: GoogleCalendarPayload) {
    if (!payload.eventId) {
      throw new Error('Event ID is required for get event operation');
    }

    const response = await calendar.events.get({
      calendarId: payload.calendarId || 'primary',
      eventId: payload.eventId,
    });

    return response.data;
  }

  async function createEvent(calendar: calendar_v3.Calendar, payload: GoogleCalendarPayload) {
    if (!payload.event) {
      throw new Error('Event data is required for create operation');
    }

    const response = await calendar.events.insert({
      calendarId: payload.calendarId || 'primary',
      requestBody: {
        summary: payload.event.summary,
        description: payload.event.description,
        start: payload.event.start,
        end: payload.event.end,
        location: payload.event.location,
        attendees: payload.event.attendees?.map(att => ({ email: att.email })),
      },
    });

    return response.data;
  }

  async function getFreeBusy(calendar: calendar_v3.Calendar, payload: GoogleCalendarPayload) {
    if (!payload.timeMin || !payload.timeMax) {
      throw new Error('Time range (timeMin and timeMax) is required for freebusy operation');
    }

    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: payload.timeMin,
        timeMax: payload.timeMax,
        items: [{ id: payload.calendarId || 'primary' }],
      },
    });

    return response.data;
  }

  async function getCurrentTime() {
    const now = new Date();
    return {
      currentTime: now.toISOString(),
      timestamp: now.getTime(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      utcOffset: now.getTimezoneOffset(),
    };
  }

  function getTimeRange(range: string): { timeMin: string; timeMax: string } {
    const now = new Date();
    let timeMin: Date;
    let timeMax: Date;

    switch (range) {
      case 'day':
        timeMin = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        timeMax = new Date(timeMin.getTime() + 24 * 60 * 60 * 1000);
        break;
      case 'week':
        const dayOfWeek = now.getDay();
        const startOfWeek = new Date(now.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
        timeMin = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate());
        timeMax = new Date(timeMin.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        timeMin = new Date(now.getFullYear(), now.getMonth(), 1);
        timeMax = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      default:
        timeMin = new Date();
        timeMax = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    return {
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
    };
  }
};

// Formatting functions
function formatCalendarsList(calendars: any[]): string {
  let message = '📅 Available Calendars:\n';

  if (calendars.length > 0) {
    calendars.forEach(calendar => {
      const primary = calendar.primary ? ' (Primary)' : '';
      message += `  • ${calendar.summary}${primary}\n`;
      message += `    ID: ${calendar.id}\n`;
      if (calendar.description) {
        message += `    Description: ${calendar.description}\n`;
      }
    });
  } else {
    message += 'No calendars found\n';
  }

  return message;
}

function formatEventsList(events: any[]): string {
  let message = '📅 Calendar Events:\n';

  if (events.length > 0) {
    events.forEach(event => {
      message += `  • ${event.summary || 'No title'}\n`;

      const startTime = event.start?.dateTime || event.start?.date;
      if (startTime) {
        const start = new Date(startTime);
        message += `    📅 ${start.toLocaleDateString()} ${event.start?.dateTime ? start.toLocaleTimeString() : '(All day)'}\n`;
      }

      if (event.location) {
        message += `    📍 ${event.location}\n`;
      }

      if (event.description) {
        message += `    📝 ${event.description.substring(0, 100)}${event.description.length > 100 ? '...' : ''}\n`;
      }

      if (event.attendees && event.attendees.length > 0) {
        message += `    👥 ${event.attendees.length} attendee(s)\n`;
      }

      message += '\n';
    });
  } else {
    message += 'No events found\n';
  }

  return message;
}

function formatSearchResults(events: any[], query: string): string {
  let message = `🔍 Search Results for "${query}":\n`;

  if (events.length > 0) {
    events.forEach(event => {
      message += `  • ${event.summary || 'No title'}\n`;

      const startTime = event.start?.dateTime || event.start?.date;
      if (startTime) {
        const start = new Date(startTime);
        message += `    📅 ${start.toLocaleDateString()} ${event.start?.dateTime ? start.toLocaleTimeString() : '(All day)'}\n`;
      }

      if (event.location) {
        message += `    📍 ${event.location}\n`;
      }
      message += '\n';
    });
  } else {
    message += `No events found matching "${query}"\n`;
  }

  return message;
}

function formatEventDetails(event: any): string {
  let message = '📅 Event Details:\n';

  if (event) {
    message += `  Title: ${event.summary || 'No title'}\n`;

    const startTime = event.start?.dateTime || event.start?.date;
    const endTime = event.end?.dateTime || event.end?.date;
    if (startTime) {
      const start = new Date(startTime);
      message += `  📅 ${start.toLocaleDateString()} ${event.start?.dateTime ? start.toLocaleTimeString() : '(All day)'}`;
      if (endTime && event.end?.dateTime) {
        const end = new Date(endTime);
        message += ` - ${end.toLocaleTimeString()}\n`;
      } else {
        message += '\n';
      }
    }

    if (event.location) {
      message += `  📍 Location: ${event.location}\n`;
    }

    if (event.description) {
      message += `  📝 Description: ${event.description}\n`;
    }

    if (event.attendees && event.attendees.length > 0) {
      message += `  👥 Attendees:\n`;
      event.attendees.forEach((attendee: any) => {
        message += `    • ${attendee.displayName || attendee.email} (${attendee.responseStatus || 'pending'})\n`;
      });
    }

    if (event.htmlLink) {
      message += `  🔗 Link: ${event.htmlLink}\n`;
    }
  } else {
    message += 'Event not found\n';
  }

  return message;
}

function formatCreateResult(event: any): string {
  let message = '✅ Event Created Successfully:\n';

  if (event) {
    message += `  Title: ${event.summary}\n`;
    message += `  ID: ${event.id}\n`;

    if (event.htmlLink) {
      message += `  🔗 Link: ${event.htmlLink}\n`;
    }
  }

  return message;
}

function formatFreeBusyInfo(data: any): string {
  let message = '📅 Free/Busy Information:\n';

  if (data.calendars) {
    Object.entries(data.calendars).forEach(([calendarId, info]: [string, any]) => {
      message += `  Calendar: ${calendarId}\n`;

      if (info.busy && info.busy.length > 0) {
        message += `  📅 Busy times:\n`;
        info.busy.forEach((period: any) => {
          const start = new Date(period.start);
          const end = new Date(period.end);
          message += `    • ${start.toLocaleDateString()} ${start.toLocaleTimeString()} - ${end.toLocaleTimeString()}\n`;
        });
      } else {
        message += `  ✅ No busy times found\n`;
      }
      message += '\n';
    });
  }

  return message;
}

function formatCurrentTime(timeInfo: any): string {
  let message = '🕐 Current Time Information:\n';

  if (timeInfo.currentTime) {
    const time = new Date(timeInfo.currentTime);
    message += `  Current Time: ${time.toLocaleString()}\n`;
  }

  if (timeInfo.timezone) {
    message += `  Time Zone: ${timeInfo.timezone}\n`;
  }

  return message;
}

// Tokens are now stored in database by OAuth setup processor
