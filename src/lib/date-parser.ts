import { parseDate as chronoParseDate } from "chrono-node";

/**
 * Parse natural language date string to ISO date format (YYYY-MM-DD).
 * Supports: "today", "tomorrow", "next monday", "next friday", "in 3 days", "next week"
 *
 * @param dateString - Natural language date string
 * @returns ISO date string (YYYY-MM-DD) or null if parsing fails
 */
export function parseDate(dateString: string): string | null {
  const result = chronoParseDate(dateString, new Date(), { forwardDate: true });

  if (!result) {
    return null;
  }

  const year = result.getFullYear();
  const month = String(result.getMonth() + 1).padStart(2, "0");
  const day = String(result.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Get today's date in ISO format (YYYY-MM-DD).
 *
 * @returns Today's date as ISO string
 */
export function getTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Get tomorrow's date in ISO format (YYYY-MM-DD).
 *
 * @returns Tomorrow's date as ISO string
 */
export function getTomorrowDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
  const day = String(tomorrow.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Parse time string (HH:MM or H:MM format) to hours and minutes.
 *
 * @param timeString - Time string (e.g., "21:00", "9:30", "14:30")
 * @returns Object with hours and minutes, or null if parsing fails
 */
export function parseTime(timeString: string): { hours: number; minutes: number } | null {
  const trimmed = timeString.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);

  if (!match) {
    return null;
  }

  const hours = parseInt(match[1]!, 10);
  const minutes = parseInt(match[2]!, 10);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return { hours, minutes };
}

/**
 * Create UTC datetime string from date and time.
 *
 * @param dateString - ISO date string (YYYY-MM-DD)
 * @param hours - Hours (0-23)
 * @param minutes - Minutes (0-59)
 * @returns UTC ISO datetime string
 */
export function createDateTimeUTC(dateString: string, hours: number, minutes: number): string {
  const [year, month, day] = dateString.split("-").map(Number);
  const localDate = new Date(year!, month! - 1, day!, hours, minutes, 0, 0);
  return localDate.toISOString();
}

/**
 * Get local timezone identifier.
 *
 * @returns IANA timezone string (e.g., "Asia/Seoul")
 */
export function getLocalTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
