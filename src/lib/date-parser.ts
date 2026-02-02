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
