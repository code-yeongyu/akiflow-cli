/// <reference types="bun" />
import { describe, it, expect, spyOn } from "bun:test";
import { AkiflowClient } from "../../lib/api/client";
import { lsCommand } from "../../commands/ls";
import type { Task } from "../../lib/api/types";
import * as fs from "node:fs/promises";

const today = new Date();
const todayDateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const tomorrowDateString = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;

const mockTasks: Task[] = [
  {
    id: "task-1",
    user_id: 1,
    recurring_id: null,
    title: "Complete project documentation",
    description: null,
    date: todayDateString,
    datetime: null,
    datetime_tz: null,
    original_date: null,
    original_datetime: null,
    duration: null,
    recurrence: null,
    recurrence_version: null,
    status: 0,
    priority: 2,
    dailyGoal: null,
    done: false,
    done_at: null,
    read_at: null,
    listId: "list-1",
    section_id: null,
    tags_ids: [],
    sorting: 0,
    sorting_label: null,
    origin: null,
    due_date: null,
    connector_id: null,
    origin_id: null,
    origin_account_id: null,
    akiflow_account_id: null,
    doc: {},
    calendar_id: null,
    time_slot_id: null,
    links: [],
    content: {},
    trashed_at: null,
    plan_unit: null,
    plan_period: null,
    global_list_id_updated_at: null,
    global_tags_ids_updated_at: null,
    global_created_at: "2024-01-01T00:00:00Z",
    global_updated_at: "2024-01-01T00:00:00Z",
    data: {},
    deleted_at: null,
  },
  {
    id: "task-2",
    user_id: 1,
    recurring_id: null,
    title: "Inbox task without date",
    description: null,
    date: null,
    datetime: null,
    datetime_tz: null,
    original_date: null,
    original_datetime: null,
    duration: null,
    recurrence: null,
    recurrence_version: null,
    status: 0,
    priority: 1,
    dailyGoal: null,
    done: false,
    done_at: null,
    read_at: null,
    listId: "list-2",
    section_id: null,
    tags_ids: [],
    sorting: 1,
    sorting_label: null,
    origin: null,
    due_date: null,
    connector_id: null,
    origin_id: null,
    origin_account_id: null,
    akiflow_account_id: null,
    doc: {},
    calendar_id: null,
    time_slot_id: null,
    links: [],
    content: {},
    trashed_at: null,
    plan_unit: null,
    plan_period: null,
    global_list_id_updated_at: null,
    global_tags_ids_updated_at: null,
    global_created_at: "2024-01-01T00:00:00Z",
    global_updated_at: "2024-01-01T00:00:00Z",
    data: {},
    deleted_at: null,
  },
  {
    id: "task-3",
    user_id: 1,
    recurring_id: null,
    title: "Completed task",
    description: null,
    date: todayDateString,
    datetime: null,
    datetime_tz: null,
    original_date: null,
    original_datetime: null,
    duration: null,
    recurrence: null,
    recurrence_version: null,
    status: 2,
    priority: 1,
    dailyGoal: null,
    done: true,
    done_at: "2024-01-01T10:00:00Z",
    read_at: null,
    listId: "list-1",
    section_id: null,
    tags_ids: [],
    sorting: 2,
    sorting_label: null,
    origin: null,
    due_date: null,
    connector_id: null,
    origin_id: null,
    origin_account_id: null,
    akiflow_account_id: null,
    doc: {},
    calendar_id: null,
    time_slot_id: null,
    links: [],
    content: {},
    trashed_at: null,
    plan_unit: null,
    plan_period: null,
    global_list_id_updated_at: null,
    global_tags_ids_updated_at: null,
    global_created_at: "2024-01-01T00:00:00Z",
    global_updated_at: "2024-01-01T10:00:00Z",
    data: {},
    deleted_at: null,
  },
  {
    id: "task-4",
    user_id: 1,
    recurring_id: null,
    title: "Tomorrow task",
    description: null,
    date: tomorrowDateString,
    datetime: null,
    datetime_tz: null,
    original_date: null,
    original_datetime: null,
    duration: null,
    recurrence: null,
    recurrence_version: null,
    status: 0,
    priority: 1,
    dailyGoal: null,
    done: false,
    done_at: null,
    read_at: null,
    listId: "list-2",
    section_id: null,
    tags_ids: [],
    sorting: 3,
    sorting_label: null,
    origin: null,
    due_date: null,
    connector_id: null,
    origin_id: null,
    origin_account_id: null,
    akiflow_account_id: null,
    doc: {},
    calendar_id: null,
    time_slot_id: null,
    links: [],
    content: {},
    trashed_at: null,
    plan_unit: null,
    plan_period: null,
    global_list_id_updated_at: null,
    global_tags_ids_updated_at: null,
    global_created_at: "2024-01-01T00:00:00Z",
    global_updated_at: "2024-01-01T00:00:00Z",
    data: {},
    deleted_at: null,
  },
  {
    id: "task-5",
    user_id: 1,
    recurring_id: null,
    title: "Work project task",
    description: null,
    date: todayDateString,
    datetime: null,
    datetime_tz: null,
    original_date: null,
    original_datetime: null,
    duration: null,
    recurrence: null,
    recurrence_version: null,
    status: 0,
    priority: 1,
    dailyGoal: null,
    done: false,
    done_at: null,
    read_at: null,
    listId: "work-project-1",
    section_id: null,
    tags_ids: [],
    sorting: 4,
    sorting_label: null,
    origin: null,
    due_date: null,
    connector_id: null,
    origin_id: null,
    origin_account_id: null,
    akiflow_account_id: null,
    doc: {},
    calendar_id: null,
    time_slot_id: null,
    links: [],
    content: {},
    trashed_at: null,
    plan_unit: null,
    plan_period: null,
    global_list_id_updated_at: null,
    global_tags_ids_updated_at: null,
    global_created_at: "2024-01-01T00:00:00Z",
    global_updated_at: "2024-01-01T00:00:00Z",
    data: {},
    deleted_at: null,
  },
];

describe("ls command", () => {
  it("shows today's tasks by default", async () => {
    const getTasksMock = spyOn(
      AkiflowClient.prototype,
      "getTasks"
    ).mockResolvedValue({
      success: true,
      message: null,
      data: mockTasks,
    });

    const mkdirMock = spyOn(fs, "mkdir").mockResolvedValue(undefined);
    const writeFileMock = spyOn(fs, "writeFile").mockResolvedValue(undefined);

    const consoleLogSpy = spyOn(console, "log").mockImplementation(() => {});

    await lsCommand.run({
      args: { inbox: false, all: false, done: false, json: false, plain: false, _task: [] },
    } as never);

    expect(getTasksMock).toHaveBeenCalled();
    const consoleOutput = consoleLogSpy.mock.calls[0]?.[0] as string | undefined;
    expect(consoleOutput).toContain("Complete project documentation");
    expect(consoleOutput).not.toContain("Inbox task without date");
    expect(consoleOutput).not.toContain("Tomorrow task");
    expect(consoleOutput).not.toContain("Completed task");

    consoleLogSpy.mockRestore();
    getTasksMock.mockRestore();
    mkdirMock.mockRestore();
    writeFileMock.mockRestore();
  });

  it("shows inbox tasks with --inbox flag", async () => {
    const getTasksMock = spyOn(
      AkiflowClient.prototype,
      "getTasks"
    ).mockResolvedValue({
      success: true,
      message: null,
      data: mockTasks,
    });

    const mkdirMock = spyOn(fs, "mkdir").mockResolvedValue(undefined);
    const writeFileMock = spyOn(fs, "writeFile").mockResolvedValue(undefined);

    const consoleLogSpy = spyOn(console, "log").mockImplementation(() => {});

    await lsCommand.run({
      args: { inbox: true, all: false, done: false, json: false, plain: false, _task: [] },
    } as never);

    const consoleOutput = consoleLogSpy.mock.calls[0]?.[0] as string | undefined;
    expect(consoleOutput).toContain("Inbox task without date");
    expect(consoleOutput).not.toContain("Complete project documentation");
    expect(consoleOutput).not.toContain("Tomorrow task");

    consoleLogSpy.mockRestore();
    getTasksMock.mockRestore();
    mkdirMock.mockRestore();
    writeFileMock.mockRestore();
  });

  it("shows all tasks with --all flag", async () => {
    const getTasksMock = spyOn(
      AkiflowClient.prototype,
      "getTasks"
    ).mockResolvedValue({
      success: true,
      message: null,
      data: mockTasks,
    });

    const mkdirMock = spyOn(fs, "mkdir").mockResolvedValue(undefined);
    const writeFileMock = spyOn(fs, "writeFile").mockResolvedValue(undefined);

    const consoleLogSpy = spyOn(console, "log").mockImplementation(() => {});

    await lsCommand.run({
      args: { inbox: false, all: true, done: false, json: false, plain: false, _task: [] },
    } as never);

    const consoleOutput = consoleLogSpy.mock.calls[0]?.[0] as string | undefined;
    expect(consoleOutput).toContain("Complete project documentation");
    expect(consoleOutput).toContain("Inbox task without date");
    expect(consoleOutput).toContain("Tomorrow task");

    consoleLogSpy.mockRestore();
    getTasksMock.mockRestore();
    mkdirMock.mockRestore();
    writeFileMock.mockRestore();
  });

  it("shows only completed tasks with --done flag", async () => {
    const getTasksMock = spyOn(
      AkiflowClient.prototype,
      "getTasks"
    ).mockResolvedValue({
      success: true,
      message: null,
      data: mockTasks,
    });

    const mkdirMock = spyOn(fs, "mkdir").mockResolvedValue(undefined);
    const writeFileMock = spyOn(fs, "writeFile").mockResolvedValue(undefined);

    const consoleLogSpy = spyOn(console, "log").mockImplementation(() => {});

    await lsCommand.run({
      args: { inbox: false, all: false, done: true, json: false, plain: false, _task: [] },
    } as never);

    const consoleOutput = consoleLogSpy.mock.calls[0]?.[0] as string | undefined;
    expect(consoleOutput).toContain("Completed task");
    expect(consoleOutput).not.toContain("Complete project documentation");
    expect(consoleOutput).not.toContain("Inbox task without date");

    consoleLogSpy.mockRestore();
    getTasksMock.mockRestore();
    mkdirMock.mockRestore();
    writeFileMock.mockRestore();
  });

  it("filters tasks by project with --project flag", async () => {
    const getTasksMock = spyOn(
      AkiflowClient.prototype,
      "getTasks"
    ).mockResolvedValue({
      success: true,
      message: null,
      data: mockTasks,
    });

    const mkdirMock = spyOn(fs, "mkdir").mockResolvedValue(undefined);
    const writeFileMock = spyOn(fs, "writeFile").mockResolvedValue(undefined);

    const consoleLogSpy = spyOn(console, "log").mockImplementation(() => {});

    await lsCommand.run({
      args: {
        inbox: false,
        all: false,
        done: false,
        project: "work",
        json: false,
        plain: false,
        _task: [],
      },
    } as never);

    const consoleOutput = consoleLogSpy.mock.calls[0]?.[0] as string | undefined;
    expect(consoleOutput).toContain("Work project task");
    expect(consoleOutput).not.toContain("Complete project documentation");

    consoleLogSpy.mockRestore();
    getTasksMock.mockRestore();
    mkdirMock.mockRestore();
    writeFileMock.mockRestore();
  });

  it("outputs JSON format with --json flag", async () => {
    const getTasksMock = spyOn(
      AkiflowClient.prototype,
      "getTasks"
    ).mockResolvedValue({
      success: true,
      message: null,
      data: mockTasks,
    });

    const mkdirMock = spyOn(fs, "mkdir").mockResolvedValue(undefined);
    const writeFileMock = spyOn(fs, "writeFile").mockResolvedValue(undefined);

    const consoleLogSpy = spyOn(console, "log").mockImplementation(() => {});

    await lsCommand.run({
      args: { inbox: false, all: true, done: false, json: true, plain: false, _task: [] },
    } as never);

    const consoleOutput = consoleLogSpy.mock.calls[0]?.[0] as string | undefined;
    if (consoleOutput) {
      const parsed = JSON.parse(consoleOutput);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(5);
      expect(parsed[0].id).toBe("task-1");
    }

    consoleLogSpy.mockRestore();
    getTasksMock.mockRestore();
    mkdirMock.mockRestore();
    writeFileMock.mockRestore();
  });

  it("outputs plain text without colors with --plain flag", async () => {
    const getTasksMock = spyOn(
      AkiflowClient.prototype,
      "getTasks"
    ).mockResolvedValue({
      success: true,
      message: null,
      data: mockTasks,
    });

    const mkdirMock = spyOn(fs, "mkdir").mockResolvedValue(undefined);
    const writeFileMock = spyOn(fs, "writeFile").mockResolvedValue(undefined);

    const consoleLogSpy = spyOn(console, "log").mockImplementation(() => {});

    await lsCommand.run({
      args: { inbox: false, all: false, done: false, json: false, plain: true, _task: [] },
    } as never);

    const consoleOutput = consoleLogSpy.mock.calls[0]?.[0] as string | undefined;
    expect(consoleOutput).toContain("Complete project documentation");
    expect(consoleOutput).not.toContain("\x1b[");

    consoleLogSpy.mockRestore();
    getTasksMock.mockRestore();
    mkdirMock.mockRestore();
    writeFileMock.mockRestore();
  });

  it("shows 'No tasks found' when no tasks match filter", async () => {
    const getTasksMock = spyOn(
      AkiflowClient.prototype,
      "getTasks"
    ).mockResolvedValue({
      success: true,
      message: null,
      data: [],
    });

    const mkdirMock = spyOn(fs, "mkdir").mockResolvedValue(undefined);
    const writeFileMock = spyOn(fs, "writeFile").mockResolvedValue(undefined);

    const consoleLogSpy = spyOn(console, "log").mockImplementation(() => {});

    await lsCommand.run({
      args: { inbox: false, all: false, done: false, json: false, plain: false, _task: [] },
    } as never);

    const consoleOutput = consoleLogSpy.mock.calls[0]?.[0] as string | undefined;
    expect(consoleOutput).toContain("No tasks found");

    consoleLogSpy.mockRestore();
    getTasksMock.mockRestore();
    mkdirMock.mockRestore();
    writeFileMock.mockRestore();
  });

  it("saves task context to file for short ID resolution", async () => {
    const getTasksMock = spyOn(
      AkiflowClient.prototype,
      "getTasks"
    ).mockResolvedValue({
      success: true,
      message: null,
      data: mockTasks,
    });

    const mkdirMock = spyOn(fs, "mkdir").mockResolvedValue(undefined);

    let writtenData = "";
    const writeFileMock = spyOn(fs, "writeFile").mockImplementation(
      async (file: unknown, data: string | Buffer) => {
        writtenData = String(data);
        return Promise.resolve(undefined);
      }
    );

    const consoleLogSpy = spyOn(console, "log").mockImplementation(() => {});

    await lsCommand.run({
      args: { inbox: false, all: false, done: false, json: false, plain: false, _task: [] },
    } as never);

    const parsedContext = JSON.parse(writtenData);
    expect(parsedContext).toHaveProperty("tasks");
    expect(parsedContext).toHaveProperty("timestamp");
    expect(Array.isArray(parsedContext.tasks)).toBe(true);
    expect(parsedContext.tasks[0]).toHaveProperty("shortId", 1);
    expect(parsedContext.tasks[0]).toHaveProperty("id", "task-1");
    expect(parsedContext.tasks[0]).toHaveProperty("title");

    consoleLogSpy.mockRestore();
    getTasksMock.mockRestore();
    mkdirMock.mockRestore();
    writeFileMock.mockRestore();
  });

  it("displays error message when API request fails", async () => {
    const getTasksMock = spyOn(
      AkiflowClient.prototype,
      "getTasks"
    ).mockRejectedValue(new Error("Network error"));

    const consoleErrorSpy = spyOn(console, "error").mockImplementation(() => {});
    const processExitSpy = spyOn(process, "exit").mockImplementation(() => {
      throw new Error("Exit called");
    });

    try {
      await lsCommand.run({
        args: { inbox: false, all: false, done: false, json: false, plain: false, _task: [] },
      } as never);
    } catch (error) {
      expect(error instanceof Error && error.message === "Exit called").toBe(true);
    }

    expect(consoleErrorSpy).toHaveBeenCalledWith("Error: Network error");

    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
    getTasksMock.mockRestore();
  });
});
