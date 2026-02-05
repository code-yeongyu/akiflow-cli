import { describe, it, expect, beforeEach, afterEach, spyOn } from "bun:test";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import * as os from "node:os";
import {
  taskEditCommand,
  taskMoveCommand,
  taskPlanCommand,
  taskSnoozeCommand,
  taskDeleteCommand,
} from "../../commands/task/index";
import * as storage from "../../lib/auth/storage";
import type { Task } from "../../lib/api/types";

class ExitError extends Error {
  constructor(public code: number) {
    super(`process.exit(${code})`);
  }
}

// Use temp directory for tests
const testTmpDir = join(tmpdir(), `af-test-${process.pid}`);
const testCacheDir = join(testTmpDir, ".cache", "af");
const testContextFile = join(testCacheDir, "last-list.json");

const mockCredentials = {
  token: "test-jwt-token",
  clientId: "test-client-id-12345",
  expiryTimestamp: Date.now() + 86400000,
};

const mockContextFile = {
  tasks: [
    { shortId: 1, id: "abc123-def456-789abc-def012", title: "Buy groceries" },
    { shortId: 2, id: "xyz789-uvw012-345xyz-uvw678", title: "Write report" },
    { shortId: 3, id: "pqr345-stu678-901pqr-stu234", title: "Call client" },
  ],
  timestamp: Date.now(),
};

const createMockTask = (overrides: Partial<Task> = {}): Task => ({
  id: "abc123-def456-789abc-def012",
  user_id: 1,
  recurring_id: null,
  title: "Buy groceries",
  description: "Weekly groceries",
  date: "2026-02-04",
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
  ...overrides,
});

describe("task commands", () => {
  let fetchSpy: ReturnType<typeof spyOn>;
  let loadCredentialsSpy: ReturnType<typeof spyOn>;
  let processExitSpy: ReturnType<typeof spyOn>;
  let homedirSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    // Mock homedir to return temp directory
    homedirSpy = spyOn(os, "homedir").mockReturnValue(testTmpDir);
    mkdirSync(testCacheDir, { recursive: true });
    writeFileSync(testContextFile, JSON.stringify(mockContextFile));
    fetchSpy = spyOn(globalThis, "fetch");
    loadCredentialsSpy = spyOn(storage, "loadCredentials").mockResolvedValue(mockCredentials);
    processExitSpy = spyOn(process, "exit").mockImplementation((code?: number) => {
      throw new ExitError(code ?? 0);
    });
  });

  afterEach(() => {
    try {
      rmSync(testTmpDir, { recursive: true, force: true });
    } catch {}
    fetchSpy.mockRestore();
    loadCredentialsSpy.mockRestore();
    processExitSpy.mockRestore();
    homedirSpy.mockRestore();
  });

  describe("taskEditCommand", () => {
    it("displays task fields by short ID", async () => {
      // given
      const mockTask = createMockTask();
      
      // First call: getTasks({ limit: 1 }) - validation
      fetchSpy.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            message: null,
            data: [mockTask],
          }),
          { status: 200 }
        )
      );
      
      // Second call: getTasks() - get all tasks
      fetchSpy.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            message: null,
            data: [mockTask],
          }),
          { status: 200 }
        )
      );
      
      const consoleSpy = spyOn(console, "log");

      // when
      await taskEditCommand.run?.({
        args: { id: "1" },
      } as never);

      // then
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Task: Buy groceries"));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("ID:"));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Description:"));

      consoleSpy.mockRestore();
    });

    it("handles invalid short ID", async () => {
      // given
      const consoleErrorSpy = spyOn(console, "error");

      // when/then
      try {
        await taskEditCommand.run?.({
          args: { id: "999" },
        } as never);
        throw new Error("Expected ExitError");
      } catch (error) {
        if (!(error instanceof ExitError)) {
          throw error;
        }
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Could not resolve task ID")
      );

      consoleErrorSpy.mockRestore();
    });

    it("handles task not found in API", async () => {
      // given
      // First call: getTasks({ limit: 1 }) - validation passes
      fetchSpy.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            message: null,
            data: [createMockTask()],
          }),
          { status: 200 }
        )
      );
      
      // Second call: getTasks() - task not in list
      fetchSpy.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            message: null,
            data: [],
          }),
          { status: 200 }
        )
      );
      
      const consoleErrorSpy = spyOn(console, "error");

      // when/then
      try {
        await taskEditCommand.run?.({
          args: { id: "1" },
        } as never);
        throw new Error("Expected ExitError");
      } catch (error) {
        if (!(error instanceof ExitError)) {
          throw error;
        }
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("not found")
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("taskMoveCommand", () => {
    it("moves task to project by short ID", async () => {
      // given
      fetchSpy.mockResolvedValue(
        new Response(
          JSON.stringify({
            success: true,
            message: null,
            data: [createMockTask({ listId: "new-project-id" })],
          }),
          { status: 200 }
        )
      );
      const consoleSpy = spyOn(console, "log");

      // when
      await taskMoveCommand.run?.({
        args: { id: "1", project: "new-project-id" },
      } as never);

      // then
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Moved task")
      );
      expect(fetchSpy).toHaveBeenCalled();

      const callArgs = fetchSpy.mock.calls[0];
      const requestBody = JSON.parse(callArgs?.[1]?.body as string);
      expect(requestBody[0].listId).toBe("new-project-id");

      consoleSpy.mockRestore();
    });

    it("handles invalid short ID", async () => {
      // given
      const consoleErrorSpy = spyOn(console, "error");

      // when/then
      try {
        await taskMoveCommand.run?.({
          args: { id: "999", project: "some-project" },
        } as never);
        throw new Error("Expected ExitError");
      } catch (error) {
        if (!(error instanceof ExitError)) {
          throw error;
        }
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Could not resolve task ID")
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("taskPlanCommand", () => {
    it("schedules task with valid date", async () => {
      // given
      fetchSpy.mockResolvedValue(
        new Response(
          JSON.stringify({
            success: true,
            message: null,
            data: [createMockTask({ date: "2026-02-10" })],
          }),
          { status: 200 }
        )
      );
      const consoleSpy = spyOn(console, "log");

      // when
      await taskPlanCommand.run?.({
        args: { id: "1", date: "2026-02-10" },
      } as never);

      // then
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Scheduled task")
      );
      expect(fetchSpy).toHaveBeenCalled();

      const callArgs = fetchSpy.mock.calls[0];
      const requestBody = JSON.parse(callArgs?.[1]?.body as string);
      expect(requestBody[0].date).toBe("2026-02-10");

      consoleSpy.mockRestore();
    });

    it("handles invalid date format", async () => {
      // given
      const consoleErrorSpy = spyOn(console, "error");

      // when/then
      try {
        await taskPlanCommand.run?.({
          args: { id: "1", date: "invalid-date" },
        } as never);
        throw new Error("Expected ExitError");
      } catch (error) {
        if (!(error instanceof ExitError)) {
          throw error;
        }
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Invalid date format")
      );

      consoleErrorSpy.mockRestore();
    });

    it("handles invalid short ID", async () => {
      // given
      const consoleErrorSpy = spyOn(console, "error");

      // when/then
      try {
        await taskPlanCommand.run?.({
          args: { id: "999", date: "2026-02-10" },
        } as never);
        throw new Error("Expected ExitError");
      } catch (error) {
        if (!(error instanceof ExitError)) {
          throw error;
        }
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Could not resolve task ID")
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("taskSnoozeCommand", () => {
    it("snoozes task by duration", async () => {
      // given
      const mockTask = createMockTask({ date: "2026-02-04" });
      
      // First call: getTasks to get current task
      fetchSpy.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            message: null,
            data: [mockTask],
          }),
          { status: 200 }
        )
      );
      
      // Second call: upsertTasks to update task
      fetchSpy.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            message: null,
            data: [{ ...mockTask, date: "2026-02-05" }],
          }),
          { status: 200 }
        )
      );
      
      const consoleSpy = spyOn(console, "log");

      // when
      await taskSnoozeCommand.run?.({
        args: { id: "1", duration: "1d" },
      } as never);

      // then
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Snoozed task")
      );
      expect(fetchSpy).toHaveBeenCalledTimes(2);

      consoleSpy.mockRestore();
    });

    it("handles invalid duration format", async () => {
      // given
      const consoleErrorSpy = spyOn(console, "error");

      // when/then
      try {
        await taskSnoozeCommand.run?.({
          args: { id: "1", duration: "invalid" },
        } as never);
        throw new Error("Expected ExitError");
      } catch (error) {
        if (!(error instanceof ExitError)) {
          throw error;
        }
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Invalid duration format")
      );

      consoleErrorSpy.mockRestore();
    });

    it("handles invalid short ID", async () => {
      // given
      const consoleErrorSpy = spyOn(console, "error");

      // when/then
      try {
        await taskSnoozeCommand.run?.({
          args: { id: "999", duration: "1d" },
        } as never);
        throw new Error("Expected ExitError");
      } catch (error) {
        if (!(error instanceof ExitError)) {
          throw error;
        }
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Could not resolve task ID")
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("taskDeleteCommand", () => {
    it("soft deletes task by short ID", async () => {
      // given
      fetchSpy.mockResolvedValue(
        new Response(
          JSON.stringify({
            success: true,
            message: null,
            data: [createMockTask({ deleted_at: new Date().toISOString() })],
          }),
          { status: 200 }
        )
      );
      const consoleSpy = spyOn(console, "log");

      // when
      await taskDeleteCommand.run?.({
        args: { id: "1" },
      } as never);

      // then
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Deleted task")
      );
      expect(fetchSpy).toHaveBeenCalled();

      const callArgs = fetchSpy.mock.calls[0];
      const requestBody = JSON.parse(callArgs?.[1]?.body as string);
      expect(requestBody[0].deleted_at).toBeTruthy();

      consoleSpy.mockRestore();
    });

    it("handles invalid short ID", async () => {
      // given
      const consoleErrorSpy = spyOn(console, "error");

      // when/then
      try {
        await taskDeleteCommand.run?.({
          args: { id: "999" },
        } as never);
        throw new Error("Expected ExitError");
      } catch (error) {
        if (!(error instanceof ExitError)) {
          throw error;
        }
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Could not resolve task ID")
      );

      consoleErrorSpy.mockRestore();
    });

    it("handles API error", async () => {
      // given
      fetchSpy.mockResolvedValue(
        new Response(
          JSON.stringify({
            success: false,
            message: "Server error",
            data: [],
          }),
          { status: 200 }
        )
      );
      const consoleErrorSpy = spyOn(console, "error");

      // when/then
      try {
        await taskDeleteCommand.run?.({
          args: { id: "1" },
        } as never);
        throw new Error("Expected ExitError");
      } catch (error) {
        if (!(error instanceof ExitError)) {
          throw error;
        }
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to delete task")
      );

      consoleErrorSpy.mockRestore();
    });
  });
});
