import { defineCommand } from "citty";
import { createClient } from "../lib/api/client";
import type { Task } from "../lib/api/types";
import * as path from "node:path";
import * as os from "node:os";
import * as fs from "node:fs/promises";
import { loadPendingTasks, mergeTasks, removePendingTask } from "../lib/task-cache";
import { syncTasksCache } from "../lib/tasks-local-cache";
import { rrulestr } from "rrule";

interface TaskContext {
  tasks: Array<{
    shortId: number;
    id: string;
    title: string;
  }>;
  timestamp: number;
}

interface LsOptions {
  inbox?: boolean;
  all?: boolean;
  done?: boolean;
  project?: string;
  search?: string;
  json?: boolean;
  plain?: boolean;
}

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getLocalDayRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function getRecurrenceDtstart(task: Task): Date {
  // Akiflow recurrence strings often come without DTSTART.
  // Pick a stable DTSTART to avoid rrule defaulting to "now".
  const dateTimeString = task.original_datetime ?? task.datetime ?? null;
  if (dateTimeString) {
    const dt = new Date(dateTimeString);
    if (!Number.isNaN(dt.getTime())) return dt;
  }

  const dateString = task.original_date ?? task.date ?? null;
  if (dateString) {
    const dt = new Date(`${dateString}T00:00:00`);
    if (!Number.isNaN(dt.getTime())) return dt;
  }

  const created = new Date(task.global_created_at);
  if (!Number.isNaN(created.getTime())) return created;

  return new Date();
}

function taskRecursOnDate(task: Task, date: Date): boolean {
  if (!task.recurrence) return false;
  const { start, end } = getLocalDayRange(date);

  try {
    // recurrence can be string or string[] - normalize to string
    const rruleString = Array.isArray(task.recurrence) 
      ? task.recurrence[0] 
      : task.recurrence;
    if (!rruleString) return false;
    
    const rule = rrulestr(rruleString, {
      dtstart: getRecurrenceDtstart(task),
    });
    return rule.between(start, end, true).length > 0;
  } catch {
    return false;
  }
}

function addVirtualRecurringTasksForToday(tasks: Task[]): Task[] {
  const todayString = getTodayDateString();
  const today = new Date();

  const virtuals: Task[] = [];

  for (const master of tasks) {
    if (!master.recurrence) continue;
    if (master.deleted_at) continue;

    if (!taskRecursOnDate(master, today)) continue;

    // If there's already a real instance for today (done or not), don't create a virtual one.
    const hasAnyInstanceToday = tasks.some(
      (t) =>
        (t.recurring_id === master.id || t.id === master.id) &&
        t.date === todayString &&
        !t.deleted_at
    );
    if (hasAnyInstanceToday) continue;

    // If an instance is already completed today, don't show a pending virtual one.
    const hasDoneInstanceToday = tasks.some(
      (t) =>
        t.recurring_id === master.id &&
        t.date === todayString &&
        t.done &&
        !t.deleted_at
    );
    if (hasDoneInstanceToday) continue;

    const nowIso = new Date().toISOString();

    virtuals.push({
      ...master,
      id: `virtual:${master.id}:${todayString}`,
      recurring_id: master.id,
      date: todayString,
      datetime: null,
      datetime_tz: null,
      original_date: todayString,
      original_datetime: null,
      done: false,
      done_at: null,
      status: 0,
      // Prevent virtual instances from being treated as recurrence masters.
      recurrence: null,
      recurrence_version: null,
      global_updated_at: nowIso,
    });
  }

  return virtuals.length ? [...tasks, ...virtuals] : tasks;
}

function filterTasks(tasks: Task[], options: LsOptions): Task[] {
  const today = getTodayDateString();

  // Search mode: search across ALL tasks (ignore date/done defaults),
  // optionally filter by project.
  if (options.search) {
    const q = options.search.toLowerCase();
    let filtered = tasks.filter((task) => {
      const title = task.title?.toLowerCase() ?? "";
      const description = task.description?.toLowerCase() ?? "";
      const originalMessage =
        (task.doc?.original_message as string | undefined)?.toLowerCase() ?? "";

      return title.includes(q) || description.includes(q) || originalMessage.includes(q);
    });

    if (options.project) {
      const projectName = options.project.toLowerCase();
      filtered = filtered.filter((task) =>
        (task.listId ?? "").toLowerCase().includes(projectName)
      );
    }

    return filtered;
  }

  let filtered = tasks;

  if (!options.all) {
    if (options.done) {
      filtered = filtered.filter((task) => task.done);
    } else {
      filtered = filtered.filter((task) => !task.done);
    }

    if (options.inbox) {
      filtered = filtered.filter((task) => !task.date);
    } else if (!options.done) {
      // Default view: show tasks scheduled up to today
      filtered = filtered.filter((task) => task.date && task.date <= today);
    }
  }

  if (options.project) {
    const projectName = options.project.toLowerCase();
    filtered = filtered.filter((task) =>
      (task.listId ?? "").toLowerCase().includes(projectName)
    );
  }

  return filtered;
}

function colorizeStatus(done: boolean): string {
  if (done) {
    return `\x1b[32m✓\x1b[0m`;
  }
  return `\x1b[31m✗\x1b[0m`;
}

function colorizeId(id: number): string {
  return `\x1b[36m${String(id).padStart(2, " ")}\x1b[0m`;
}

function getConnectorPrefix(connectorId: string | null): string {
  if (!connectorId) return "";
  const connectorMap: Record<string, string> = {
    slack: "[Slack]",
    gmail: "[Gmail]",
    github: "[GitHub]",
    jira: "[Jira]",
    asana: "[Asana]",
    trello: "[Trello]",
    notion: "[Notion]",
    linear: "[Linear]",
  };
  return connectorMap[connectorId.toLowerCase()] ?? `[${connectorId}]`;
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength - 3)}...`;
}

export function getTaskDisplayTitle(task: Task, maxLength = 60): string {
  // 1. Use title if available (sanitize newlines for CLI output)
  if (task.title && task.title.trim()) {
    const cleanedTitle = task.title.replace(/\n/g, " ").trim();
    return truncateText(cleanedTitle, maxLength);
  }

  // 2. Use doc.original_message with connector prefix
  const originalMessage = task.doc?.original_message;
  if (typeof originalMessage === "string" && originalMessage.trim()) {
    const prefix = getConnectorPrefix(task.connector_id);
    const cleanedMessage = originalMessage.replace(/\n/g, " ").trim();
    const fullMessage = prefix ? `${prefix} ${cleanedMessage}` : cleanedMessage;
    return truncateText(fullMessage, maxLength);
  }

  // 3. Use description field
  if (task.description && task.description.trim()) {
    return truncateText(task.description.replace(/\n/g, " ").trim(), maxLength);
  }

  // 4. Last resort
  return "(No title)";
}

function formatTaskTable(
  tasks: Task[],
  showShortIds: boolean,
  useColors: boolean
): string {
  if (tasks.length === 0) {
    return "No tasks found.";
  }

  const header = useColors
    ? `${useColors ? "\x1b[1m" : ""}ID  Status  Title${useColors ? "\x1b[0m" : ""}`
    : "ID  Status  Title";

  const rows = tasks.map((task, index) => {
    const shortId = index + 1;
    const idStr = showShortIds
      ? useColors
        ? colorizeId(shortId)
        : String(shortId).padStart(2, " ")
      : "   ";
    const statusStr = useColors ? colorizeStatus(task.done) : (task.done ? "✓" : "✗");
    const displayTitle = getTaskDisplayTitle(task, 50);

    return `${idStr}  ${statusStr}      ${displayTitle}`;
  });

  return [header, ...rows].join("\n");
}

async function saveTaskContext(tasks: Task[]): Promise<void> {
  const homeDir = os.homedir();
  const cacheDir = path.join(homeDir, ".cache", "af");

  try {
    await fs.mkdir(cacheDir, { recursive: true });
  } catch {
    // Directory might already exist
  }

  const contextFile = path.join(cacheDir, "last-list.json");

  const context: TaskContext = {
    tasks: tasks.map((task, index) => ({
      shortId: index + 1,
      id: task.id,
      title: getTaskDisplayTitle(task),
    })),
    timestamp: Date.now(),
  };

  await fs.writeFile(contextFile, JSON.stringify(context, null, 2));
}

export const lsCommand = defineCommand({
  meta: {
    name: "ls",
    description: "List tasks with filters",
  },
  args: {
    inbox: {
      type: "boolean",
      description: "Show inbox tasks (no date)",
    },
    all: {
      type: "boolean",
      description: "Show all tasks",
    },
    done: {
      type: "boolean",
      description: "Show completed tasks",
    },
    project: {
      type: "string",
      description: "Filter by project name",
    },
    search: {
      type: "string",
      alias: "s",
      description: "Search tasks by title, description, or content",
    },
    json: {
      type: "boolean",
      description: "Output as JSON",
    },
    plain: {
      type: "boolean",
      description: "Output without colors",
    },
  },
  run: async ({ args }) => {
    const options: LsOptions = {
      inbox: args.inbox as boolean,
      all: args.all as boolean,
      done: args.done as boolean,
      project: args.project as string,
      search: args.search as string,
      json: args.json as boolean,
      plain: args.plain as boolean,
    };

    const client = createClient();

    try {
      // Always use local full cache + incremental sync.
      // This avoids missing newest tasks when the API returns a fixed order.
      const { tasks: apiTasks } = await syncTasksCache(client, { quiet: true });

      // Load pending tasks and merge with API response
      const pendingTasks = await loadPendingTasks();
      const tasks = mergeTasks(apiTasks, pendingTasks);

      // Clean up pending tasks that are now in API response
      const apiTaskIds = new Set(apiTasks.map((t) => t.id));
      for (const pending of pendingTasks) {
        if (apiTaskIds.has(pending.id)) {
          await removePendingTask(pending.id);
        }
      }

      const tasksWithVirtualRecurring =
        !options.all && !options.done && !options.inbox
          ? addVirtualRecurringTasksForToday(tasks)
          : tasks;

      const filteredTasks = filterTasks(tasksWithVirtualRecurring, options);

      if (options.json) {
        const output = JSON.stringify(filteredTasks, null, 2);
        await new Promise<void>((resolve, reject) => {
          process.stdout.write(output + '\n', (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        return;
      }

      const useColors = !options.plain;
      const output = formatTaskTable(filteredTasks, true, useColors);

      console.log(output);

      await saveTaskContext(filteredTasks);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
      } else {
        console.error("Unknown error occurred");
      }
      process.exit(1);
    }
  },
});
