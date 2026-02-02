import { defineCommand } from "citty";
import { createClient } from "../lib/api/client";
import type { TimeSlot } from "../lib/api/types";

interface TimeRange {
  start: Date;
  end: Date;
}

function getTodayStart(): Date {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  return start;
}

function getTodayEnd(): Date {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  return end;
}

function isToday(timeSlot: TimeSlot): boolean {
  const startTime = new Date(timeSlot.start_time);
  const todayStart = getTodayStart();
  const todayEnd = getTodayEnd();
  return startTime >= todayStart && startTime <= todayEnd;
}

function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function getDurationMinutes(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / (60 * 1000));
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${mins}m`;
  }
}

function formatTimeline(slots: TimeSlot[]): string {
  if (slots.length === 0) {
    return "No events or time blocks scheduled for today.";
  }

  const lines: string[] = [];
  lines.push("📅 Today's Schedule");
  lines.push("");

  const sortedSlots = [...slots].sort((a, b) => {
    const aTime = new Date(a.start_time).getTime();
    const bTime = new Date(b.start_time).getTime();
    return aTime - bTime;
  });

  sortedSlots.forEach((slot, index) => {
    const start = new Date(slot.start_time);
    const end = new Date(slot.end_time);
    const duration = getDurationMinutes(start, end);
    const prefix = index === 0 ? "┌" : "├";

    lines.push(
      `${prefix} ${formatTime(start)} - ${formatTime(end)}  ${slot.title} (${formatDuration(duration)})`
    );
  });

  return lines.join("\n");
}

function findFreeSlots(slots: TimeSlot[]): TimeRange[] {
  const todayStart = getTodayStart();
  const todayEnd = getTodayEnd();

  const sortedSlots = [...slots]
    .filter(isToday)
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  const freeSlots: TimeRange[] = [];
  let currentTime = todayStart;

  for (const slot of sortedSlots) {
    const slotStart = new Date(slot.start_time);

    if (currentTime < slotStart) {
      freeSlots.push({ start: currentTime, end: slotStart });
    }

    const slotEnd = new Date(slot.end_time);
    if (slotEnd > currentTime) {
      currentTime = slotEnd;
    }
  }

  if (currentTime < todayEnd) {
    freeSlots.push({ start: currentTime, end: todayEnd });
  }

  return freeSlots;
}

function formatFreeSlots(slots: TimeRange[]): string {
  if (slots.length === 0) {
    return "No free time slots available today.";
  }

  const lines: string[] = [];
  lines.push("🕐 Free Time Slots Today");
  lines.push("");

  slots.forEach((slot, index) => {
    const duration = getDurationMinutes(slot.start, slot.end);
    const prefix = index === 0 ? "┌" : "├";

    lines.push(
      `${prefix} ${formatTime(slot.start)} - ${formatTime(slot.end)}  ${formatDuration(duration)} available`
    );
  });

  return lines.join("\n");
}

export const cal = defineCommand({
  meta: {
    name: "cal",
    description: "View calendar and time slots",
  },
  args: {
    free: {
      type: "boolean",
      description: "Find free time slots today",
    },
  },
  run: async (context) => {
    const client = createClient();
    const showFree = context.args.free as boolean;

    try {
      const response = await client.getTimeSlots();
      const allSlots = response.data;
      const todaySlots = allSlots.filter(isToday);

      if (showFree) {
        const freeSlots = findFreeSlots(allSlots);
        const output = formatFreeSlots(freeSlots);
        console.log(output);
      } else {
        const output = formatTimeline(todaySlots);
        console.log(output);
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AuthError") {
        console.error(
          "Error: Authentication failed. Please run 'af auth' to login."
        );
      } else {
        console.error(
          "Error: Failed to fetch calendar",
          error instanceof Error ? error.message : "Unknown error"
        );
      }
      process.exit(1);
    }
  },
});
