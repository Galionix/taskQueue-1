import { Injectable, Logger } from '@nestjs/common';
import { CreateTaskDto } from '../dto/create-task.dto';
import { ProcessorInterface } from './processor.interface';
import { TaskModel } from '../entities/task.entity';
import { ExeTypes } from '@tasks/lib';
import { google, calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export interface GoogleCalendarPayload {
  operation: string;
  userId: string; // Changed from direct tokens to userId lookup
  calendarId?: string;
  timeMin?: string;
  timeMax?: string;
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

interface CalendarListResponse {
  calendars: Array<{
    id: string;
    summary: string;
    description?: string | null;
    primary?: boolean | null;
    accessRole?: string | null;
  }>;
  total: number;
}

interface EventsListResponse {
  events: Array<{
    id: string;
    summary?: string | null;
    description?: string | null;
    start?: { dateTime?: string | null; date?: string | null };
    end?: { dateTime?: string | null; date?: string | null };
    location?: string | null;
    status?: string | null;
    attendees?: Array<{ email: string }>;
  }>;
  total: number;
  nextPageToken?: string | null;
}

interface SingleEventResponse {
  id: string;
  summary?: string | null;
  description?: string | null;
  start?: { dateTime?: string | null; date?: string | null };
  end?: { dateTime?: string | null; date?: string | null };
  location?: string | null;
  status?: string | null;
  attendees?: Array<{ email: string }>;
  created?: string | null;
  updated?: string | null;
}

interface DeleteEventResponse {
  deleted: boolean;
  eventId: string;
  message: string;
}

interface FreeBusyResponse {
  timeMin: string;
  timeMax: string;
  calendars: Record<string, {
    busy: Array<{
      start: string;
      end: string;
    }>;
    errors?: Array<{
      domain: string;
      reason: string;
    }>;
  }>;
}

interface CurrentTimeResponse {
  currentTime: string;
  timestamp: number;
  timezone: string;
  utcOffset: number;
}

@Injectable()
export class GoogleCalendarProcessor implements ProcessorInterface {
  private readonly logger = new Logger(GoogleCalendarProcessor.name);

  async process(createTaskDto: CreateTaskDto): Promise<TaskModel> {
    const task = new TaskModel();
    task.exeType = ExeTypes.google_calendar;
    task.status = 'pending';
    task.request = JSON.stringify(createTaskDto);

    try {
      const payload = createTaskDto.payload as GoogleCalendarPayload;
      
      if (!payload.userId) {
        throw new Error('User ID is required for Google Calendar operations');
      }

      // Get OAuth tokens for user
      const userTokens = await this.getUserTokens(payload.userId);
      if (!userTokens?.accessToken) {
        throw new Error(`No OAuth tokens found for user ${payload.userId}. Please run google_oauth_setup first.`);
      }

      // Initialize Google Calendar API client
      const oauth2Client = new OAuth2Client();
      oauth2Client.setCredentials({
        access_token: userTokens.accessToken,
        refresh_token: userTokens.refreshToken,
      });

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      let result: unknown;

      switch (payload.operation) {
        case 'list-calendars':
          result = await this.listCalendars(calendar);
          break;
        
        case 'list-events':
          result = await this.listEvents(calendar, payload);
          break;
        
        case 'search-events':
          result = await this.searchEvents(calendar, payload);
          break;
        
        case 'get-event':
          result = await this.getEvent(calendar, payload);
          break;
        
        case 'create-event':
          result = await this.createEvent(calendar, payload);
          break;
        
        case 'update-event':
          result = await this.updateEvent(calendar, payload);
          break;
        
        case 'delete-event':
          result = await this.deleteEvent(calendar, payload);
          break;
        
        case 'get-freebusy':
          result = await this.getFreeBusy(calendar, payload);
          break;
        
        case 'get-current-time':
          result = await this.getCurrentTime();
          break;
        
        default:
          throw new Error(`Unknown operation: ${payload.operation}`);
      }

      task.result = JSON.stringify(result);
      task.status = 'completed';
      
      this.logger.log(`Google Calendar operation ${payload.operation} completed successfully`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Google Calendar operation failed: ${errorMessage}`, errorStack);
      task.result = JSON.stringify({ error: errorMessage });
      task.status = 'failed';
    }

    return task;
  }

  private async listCalendars(calendar: calendar_v3.Calendar): Promise<CalendarListResponse> {
    try {
      const response = await calendar.calendarList.list();
      const calendars = response.data.items || [];
      
      return {
        calendars: calendars.map(cal => ({
          id: cal.id || '',
          summary: cal.summary || '',
          description: cal.description,
          primary: cal.primary,
          accessRole: cal.accessRole,
        })),
        total: calendars.length,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to list calendars: ${errorMessage}`);
    }
  }

  private async listEvents(calendar: calendar_v3.Calendar, payload: GoogleCalendarPayload): Promise<EventsListResponse> {
    try {
      const options: calendar_v3.Params$Resource$Events$List = {
        calendarId: payload.calendarId || 'primary',
        maxResults: payload.maxResults || 10,
        singleEvents: true,
        orderBy: 'startTime',
      };

      if (payload.timeMin) {
        options.timeMin = payload.timeMin;
      }
      if (payload.timeMax) {
        options.timeMax = payload.timeMax;
      }

      const response = await calendar.events.list(options);
      const events = response.data.items || [];
      
      return {
        events: events.map(event => ({
          id: event.id || '',
          summary: event.summary || null,
          description: event.description || null,
          start: event.start ? {
            dateTime: event.start.dateTime || null,
            date: event.start.date || null,
          } : undefined,
          end: event.end ? {
            dateTime: event.end.dateTime || null,
            date: event.end.date || null,
          } : undefined,
          location: event.location || null,
          status: event.status || null,
          attendees: event.attendees?.map(att => ({ email: att.email || '' })),
        })),
        total: events.length,
        nextPageToken: response.data.nextPageToken || null,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to list events: ${errorMessage}`);
    }
  }

  private async searchEvents(calendar: calendar_v3.Calendar, payload: GoogleCalendarPayload): Promise<EventsListResponse> {
    try {
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

      if (payload.timeMin) {
        options.timeMin = payload.timeMin;
      }
      if (payload.timeMax) {
        options.timeMax = payload.timeMax;
      }

      const response = await calendar.events.list(options);
      const events = response.data.items || [];
      
      return {
        events: events.map(event => ({
          id: event.id || '',
          summary: event.summary,
          description: event.description,
          start: event.start,
          end: event.end,
          location: event.location,
          status: event.status,
          attendees: event.attendees?.map(att => ({ email: att.email || '' })),
        })),
        total: events.length,
        nextPageToken: response.data.nextPageToken,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to search events: ${errorMessage}`);
    }
  }

  private async getEvent(calendar: calendar_v3.Calendar, payload: GoogleCalendarPayload): Promise<SingleEventResponse> {
    try {
      if (!payload.eventId) {
        throw new Error('Event ID is required for get event operation');
      }

      const response = await calendar.events.get({
        calendarId: payload.calendarId || 'primary',
        eventId: payload.eventId,
      });

      const event = response.data;

      return {
        id: event.id || '',
        summary: event.summary,
        description: event.description,
        start: event.start,
        end: event.end,
        location: event.location,
        status: event.status,
        attendees: event.attendees?.map(att => ({ email: att.email || '' })),
        created: event.created,
        updated: event.updated,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get event: ${errorMessage}`);
    }
  }

  private async createEvent(calendar: calendar_v3.Calendar, payload: GoogleCalendarPayload): Promise<SingleEventResponse> {
    try {
      if (!payload.event) {
        throw new Error('Event data is required for create operation');
      }

      const eventResource: calendar_v3.Schema$Event = {
        summary: payload.event.summary,
        description: payload.event.description,
        start: payload.event.start,
        end: payload.event.end,
        location: payload.event.location,
        attendees: payload.event.attendees?.map(att => ({ email: att.email })),
      };

      const response = await calendar.events.insert({
        calendarId: payload.calendarId || 'primary',
        requestBody: eventResource,
      });

      const createdEvent = response.data;

      return {
        id: createdEvent.id || '',
        summary: createdEvent.summary,
        description: createdEvent.description,
        start: createdEvent.start,
        end: createdEvent.end,
        location: createdEvent.location,
        status: createdEvent.status,
        attendees: createdEvent.attendees?.map(att => ({ email: att.email || '' })),
        created: createdEvent.created,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create event: ${errorMessage}`);
    }
  }

  private async updateEvent(calendar: calendar_v3.Calendar, payload: GoogleCalendarPayload): Promise<SingleEventResponse> {
    try {
      if (!payload.eventId || !payload.event) {
        throw new Error('Event ID and event data are required for update operation');
      }

      const eventResource: calendar_v3.Schema$Event = {
        summary: payload.event.summary,
        description: payload.event.description,
        start: payload.event.start,
        end: payload.event.end,
        location: payload.event.location,
        attendees: payload.event.attendees?.map(att => ({ email: att.email })),
      };

      const response = await calendar.events.update({
        calendarId: payload.calendarId || 'primary',
        eventId: payload.eventId,
        requestBody: eventResource,
      });

      const updatedEvent = response.data;

      return {
        id: updatedEvent.id || '',
        summary: updatedEvent.summary,
        description: updatedEvent.description,
        start: updatedEvent.start,
        end: updatedEvent.end,
        location: updatedEvent.location,
        status: updatedEvent.status,
        attendees: updatedEvent.attendees?.map(att => ({ email: att.email || '' })),
        updated: updatedEvent.updated,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to update event: ${errorMessage}`);
    }
  }

  private async deleteEvent(calendar: calendar_v3.Calendar, payload: GoogleCalendarPayload): Promise<DeleteEventResponse> {
    try {
      if (!payload.eventId) {
        throw new Error('Event ID is required for delete operation');
      }

      await calendar.events.delete({
        calendarId: payload.calendarId || 'primary',
        eventId: payload.eventId,
      });

      return {
        deleted: true,
        eventId: payload.eventId,
        message: 'Event deleted successfully',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to delete event: ${errorMessage}`);
    }
  }

  private async getFreeBusy(calendar: calendar_v3.Calendar, payload: GoogleCalendarPayload): Promise<FreeBusyResponse> {
    try {
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

      return {
        timeMin: payload.timeMin,
        timeMax: payload.timeMax,
        calendars: response.data.calendars || {},
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get freebusy information: ${errorMessage}`);
    }
  }

  private async getCurrentTime(): Promise<CurrentTimeResponse> {
    const now = new Date();
    return {
      currentTime: now.toISOString(),
      timestamp: now.getTime(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      utcOffset: now.getTimezoneOffset(),
    };
  }

  // TODO: Implement token retrieval from your storage solution
  private async getUserTokens(userId: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiryDate?: number;
  } | null> {
    // TODO: Implement token retrieval from your storage
    // This should match the storage method used in GoogleOAuthSetupProcessor
    this.logger.debug(`Retrieving OAuth tokens for user ${userId}`);
    return null; // Placeholder - implement based on your storage solution
  }
}
