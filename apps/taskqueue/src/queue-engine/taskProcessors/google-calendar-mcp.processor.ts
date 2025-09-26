import { TaskModel } from '@tasks/lib';
import axios from 'axios';

import { taskProcessorType } from './';

// Google Calendar MCP types
interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  location?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  htmlLink?: string;
  status: string;
}

interface Calendar {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  accessRole: string;
}

interface FreeBusyInfo {
  busy: Array<{
    start: string;
    end: string;
  }>;
}

export const googleCalendarMcpProcessor = (): taskProcessorType => {
  return {
    name: 'googleCalendarMcpProcessor',
    description: 'Integrates with Google Calendar via MCP server',
    blocks: [], // No resource blocks needed for MCP calls
    execute: async (data: TaskModel, storage) => {
      try {
        const payload = JSON.parse(data.payload);
        const { 
          operation, 
          userId,
          mcpServerUrl = 'http://localhost:3010',
          calendarId = 'primary',
          timeMin,
          timeMax,
          query,
          maxResults = 10,
          ...params 
        } = payload;

        if (!userId) {
          throw new Error('User ID is required for Google Calendar operations. Please provide userId in payload.');
        }

        console.log(`Making Google Calendar MCP request: ${operation}`);

        // Prepare MCP request
        const mcpRequest = {
          method: 'tools/call',
          params: {
            name: operation,
            arguments: {
              calendarId,
              ...params
            }
          }
        };

        // Add operation-specific parameters
        switch (operation) {
          case 'list-events':
            if (timeMin) mcpRequest.params.arguments.timeMin = timeMin;
            if (timeMax) mcpRequest.params.arguments.timeMax = timeMax;
            break;
          case 'search-events':
            if (query) mcpRequest.params.arguments.query = query;
            if (timeMin) mcpRequest.params.arguments.timeMin = timeMin;
            if (timeMax) mcpRequest.params.arguments.timeMax = timeMax;
            break;
          case 'list-calendars':
          case 'get-current-time':
            // These operations don't need additional parameters
            delete mcpRequest.params.arguments.calendarId;
            break;
        }

        // Make request to MCP server
        const response = await axios.post(mcpServerUrl, mcpRequest, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000
        });

        const result = response.data;

        // Format the message based on operation
        let formattedMessage = '';
        switch (operation) {
          case 'list-calendars':
            formattedMessage = formatCalendarsList(result);
            break;
          case 'list-events':
            formattedMessage = formatEventsList(result);
            break;
          case 'search-events':
            formattedMessage = formatSearchResults(result, query);
            break;
          case 'get-event':
            formattedMessage = formatEventDetails(result);
            break;
          case 'get-freebusy':
            formattedMessage = formatFreeBusyInfo(result);
            break;
          case 'get-current-time':
            formattedMessage = formatCurrentTime(result);
            break;
          case 'create-event':
          case 'update-event':
          case 'delete-event':
            formattedMessage = formatOperationResult(operation, result);
            break;
          default:
            formattedMessage = `📅 Google Calendar Operation: ${operation}\n${JSON.stringify(result, null, 2)}`;
        }

        storage.message += `\n${formattedMessage}`;

        console.log(`✅ Google Calendar MCP operation '${operation}' completed successfully`);
        return {
          success: true,
          data: result,
          operation,
          summary: formattedMessage.trim()
        };

      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        const fullErrorMessage = `❌ Google Calendar MCP Error: ${errorMessage}`;
        storage.message += `\n${fullErrorMessage}`;
        console.error('Google Calendar MCP processor error:', error);

        return {
          success: false,
          error: errorMessage,
          details: error instanceof Error ? error.stack : String(error)
        };
      }
    },
  };
};

// Helper functions for formatting responses
function formatCalendarsList(result: any): string {
  let message = '📅 Available Calendars:\n';
  
  if (result.content && Array.isArray(result.content)) {
    const calendars = result.content[0]?.text ? JSON.parse(result.content[0].text) : [];
    
    if (Array.isArray(calendars) && calendars.length > 0) {
      calendars.forEach((calendar: Calendar) => {
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
  }
  
  return message;
}

function formatEventsList(result: any): string {
  let message = '📅 Calendar Events:\n';
  
  if (result.content && Array.isArray(result.content)) {
    const events = result.content[0]?.text ? JSON.parse(result.content[0].text) : [];
    
    if (Array.isArray(events) && events.length > 0) {
      events.forEach((event: CalendarEvent) => {
        message += `  • ${event.summary}\n`;
        
        // Format date/time
        const startTime = event.start.dateTime || event.start.date;
        const endTime = event.end.dateTime || event.end.date;
        if (startTime) {
          const start = new Date(startTime);
          const end = new Date(endTime);
          message += `    📅 ${start.toLocaleDateString()} ${event.start.dateTime ? start.toLocaleTimeString() : '(All day)'}\n`;
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
  }
  
  return message;
}

function formatSearchResults(result: any, query: string): string {
  let message = `🔍 Search Results for "${query}":\n`;
  
  if (result.content && Array.isArray(result.content)) {
    const events = result.content[0]?.text ? JSON.parse(result.content[0].text) : [];
    
    if (Array.isArray(events) && events.length > 0) {
      events.forEach((event: CalendarEvent) => {
        message += `  • ${event.summary}\n`;
        
        const startTime = event.start.dateTime || event.start.date;
        if (startTime) {
          const start = new Date(startTime);
          message += `    📅 ${start.toLocaleDateString()} ${event.start.dateTime ? start.toLocaleTimeString() : '(All day)'}\n`;
        }
        
        if (event.location) {
          message += `    📍 ${event.location}\n`;
        }
        message += '\n';
      });
    } else {
      message += `No events found matching "${query}"\n`;
    }
  }
  
  return message;
}

function formatEventDetails(result: any): string {
  let message = '📅 Event Details:\n';
  
  if (result.content && Array.isArray(result.content)) {
    const event = result.content[0]?.text ? JSON.parse(result.content[0].text) : null;
    
    if (event) {
      message += `  Title: ${event.summary}\n`;
      
      const startTime = event.start.dateTime || event.start.date;
      const endTime = event.end.dateTime || event.end.date;
      if (startTime) {
        const start = new Date(startTime);
        const end = new Date(endTime);
        message += `  📅 ${start.toLocaleDateString()} ${event.start.dateTime ? start.toLocaleTimeString() : '(All day)'}`;
        if (endTime && event.end.dateTime) {
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
  }
  
  return message;
}

function formatFreeBusyInfo(result: any): string {
  let message = '📅 Free/Busy Information:\n';
  
  if (result.content && Array.isArray(result.content)) {
    const data = result.content[0]?.text ? JSON.parse(result.content[0].text) : {};
    
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
  }
  
  return message;
}

function formatCurrentTime(result: any): string {
  let message = '🕐 Current Time Information:\n';
  
  if (result.content && Array.isArray(result.content)) {
    const timeInfo = result.content[0]?.text ? JSON.parse(result.content[0].text) : {};
    
    if (timeInfo.currentTime) {
      const time = new Date(timeInfo.currentTime);
      message += `  Current Time: ${time.toLocaleString()}\n`;
    }
    
    if (timeInfo.timeZone) {
      message += `  Time Zone: ${timeInfo.timeZone}\n`;
    }
    
    if (timeInfo.utcTime) {
      message += `  UTC Time: ${timeInfo.utcTime}\n`;
    }
  }
  
  return message;
}

function formatOperationResult(operation: string, result: any): string {
  let message = '';
  
  switch (operation) {
    case 'create-event':
      message = '✅ Event Created Successfully\n';
      break;
    case 'update-event':
      message = '✅ Event Updated Successfully\n';
      break;
    case 'delete-event':
      message = '✅ Event Deleted Successfully\n';
      break;
  }
  
  if (result.content && Array.isArray(result.content)) {
    const data = result.content[0]?.text ? JSON.parse(result.content[0].text) : null;
    if (data && data.htmlLink) {
      message += `🔗 Link: ${data.htmlLink}\n`;
    }
  }
  
  return message;
}
