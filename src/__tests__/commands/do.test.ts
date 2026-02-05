import { describe, it, expect, beforeEach, afterEach, spyOn } from "bun:test";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import * as os from "node:os";
import { doCommand } from "../../commands/do";
import * as storage from "../../lib/auth/storage";

class ExitError extends Error {
  constructor(public code: number) {
    super(`process.exit(${code})`);
  }
}

// Use temp directory for tests
const testTmpDir = join(tmpdir(), `af-test-do-${process.pid}`);
const testCacheDir = join(testTmpDir, ".cache", "af");
const testContextFile = join(testCacheDir, "last-list.json");

const mockContextFile = {
  tasks: [
    { shortId: 1, id: "abc123def456", title: "Buy groceries" },
    { shortId: 2, id: "xyz789uvw012", title: "Write report" },
    { shortId: 3, id: "pqr345stu678", title: "Call client" },
  ],
  timestamp: Date.now(),
};

const mockCredentials = {
  token: "test-jwt-token",
  clientId: "test-client-id-12345",
  expiryTimestamp: Date.now() + 86400000,
};

describe("do command", () => {
  let loadCredentialsSpy: ReturnType<typeof spyOn>;
  let processExitSpy: ReturnType<typeof spyOn>;
  let homedirSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    // Mock homedir to return temp directory
    homedirSpy = spyOn(os, "homedir").mockReturnValue(testTmpDir);
    mkdirSync(testCacheDir, { recursive: true });
    writeFileSync(testContextFile, JSON.stringify(mockContextFile));
    loadCredentialsSpy = spyOn(storage, "loadCredentials").mockResolvedValue(mockCredentials);
    processExitSpy = spyOn(process, "exit").mockImplementation((code?: number) => {
      throw new ExitError(code ?? 0);
    });
  });

  afterEach(() => {
    loadCredentialsSpy.mockRestore();
    processExitSpy.mockRestore();
    homedirSpy.mockRestore();
    try {
      rmSync(testTmpDir, { recursive: true, force: true });
    } catch {
      // file may not exist
    }
  });

  it("completes single task by short ID", async () => {
    // given
    const consoleSpy = spyOn(console, "log");
    const fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          message: null,
          data: [
            {
              id: "abc123def456",
              done: true,
              done_at: new Date().toISOString(),
              status: 2,
            },
          ],
        }),
        { status: 200 }
      )
    );

    const mockContext = {
      args: { ids: "1" },
    };

    // when
    await doCommand.run?.(mockContext as never);

    // then
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Completed 1 task(s):")
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Buy groceries")
    );
    expect(fetchSpy).toHaveBeenCalled();
  });

  it("completes multiple tasks by short IDs", async () => {
    // given
    const consoleSpy = spyOn(console, "log");
    const fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          message: null,
          data: [
            {
              id: "abc123def456",
              done: true,
              done_at: new Date().toISOString(),
              status: 2,
            },
            {
              id: "xyz789uvw012",
              done: true,
              done_at: new Date().toISOString(),
              status: 2,
            },
          ],
        }),
        { status: 200 }
      )
    );

    const mockContext = {
      args: { ids: ["1", "2"] },
    };

    // when
    await doCommand.run?.(mockContext as never);

    // then
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Completed 2 task(s):")
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Buy groceries")
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Write report")
    );
    expect(fetchSpy).toHaveBeenCalled();
  });

  it("completes task by partial UUID", async () => {
    // given
    const consoleSpy = spyOn(console, "log");
    const fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          message: null,
          data: [
            {
              id: "abc123def456",
              done: true,
              done_at: new Date().toISOString(),
              status: 2,
            },
          ],
        }),
        { status: 200 }
      )
    );

    const mockContext = {
      args: { ids: "abc123" },
    };

    // when
    await doCommand.run?.(mockContext as never);

    // then
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Completed 1 task(s):")
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Buy groceries")
    );
    expect(fetchSpy).toHaveBeenCalled();
  });

  it("handles invalid short ID", async () => {
    // given
    const consoleErrorSpy = spyOn(console, "error");
    const mockContext = {
      args: { ids: "999" },
    };

    // when/then
    try {
      await doCommand.run?.(mockContext as never);
      throw new Error("Expected ExitError");
    } catch (error) {
      if (!(error instanceof ExitError)) {
        throw error;
      }
    }

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Could not resolve task IDs")
    );
  });

  it("handles ambiguous UUID", async () => {
    // given
    const consoleErrorSpy = spyOn(console, "error");
    const contextWithDuplicates = {
      tasks: [
        { shortId: 1, id: "abc123def456", title: "Task 1" },
        { shortId: 2, id: "abc123xyz789", title: "Task 2" },
      ],
      timestamp: Date.now(),
    };
    writeFileSync(testContextFile, JSON.stringify(contextWithDuplicates));

    const mockContext = {
      args: { ids: "abc123" },
    };

    // when/then
    try {
      await doCommand.run?.(mockContext as never);
      throw new Error("Expected ExitError");
    } catch (error) {
      if (!(error instanceof ExitError)) {
        throw error;
      }
    }

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Ambiguous UUID")
    );
  });

  it("handles missing context file", async () => {
    // given
    rmSync(testContextFile);
    const consoleErrorSpy = spyOn(console, "error");

    const mockContext = {
      args: { ids: "1" },
    };

    // when/then
    try {
      await doCommand.run?.(mockContext as never);
      throw new Error("Expected ExitError");
    } catch (error) {
      if (!(error instanceof ExitError)) {
        throw error;
      }
    }

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("No task context found")
    );
  });

  it("handles API error", async () => {
    // given
    const consoleErrorSpy = spyOn(console, "error");
    const fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          message: "API error",
          data: [],
        }),
        { status: 200 }
      )
    );

    const mockContext = {
      args: { ids: "1" },
    };

    // when/then
    try {
      await doCommand.run?.(mockContext as never);
      throw new Error("Expected ExitError");
    } catch (error) {
      if (!(error instanceof ExitError)) {
        throw error;
      }
    }

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Failed to complete tasks")
    );
    expect(fetchSpy).toHaveBeenCalled();
  });

  it("handles network error", async () => {
    // given
    const consoleErrorSpy = spyOn(console, "error");
    const fetchSpy = spyOn(globalThis, "fetch").mockRejectedValue(
      new Error("Network error")
    );

    const mockContext = {
      args: { ids: "1" },
    };

    // when/then
    try {
      await doCommand.run?.(mockContext as never);
      throw new Error("Expected ExitError");
    } catch (error) {
      if (!(error instanceof ExitError)) {
        throw error;
      }
    }

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Failed to complete tasks")
    );
    expect(fetchSpy).toHaveBeenCalled();
  });

  it("sends correct payload to API", async () => {
    // given
    const fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          message: null,
          data: [],
        }),
        { status: 200 }
      )
    );

    const mockContext = {
      args: { ids: "1" },
    };

    // when
    await doCommand.run?.(mockContext as never);

    // then
    const callArgs = fetchSpy.mock.calls[0];
    if (!callArgs || !callArgs[1]) {
      throw new Error("fetch was not called");
    }

    const requestBody = JSON.parse(callArgs[1].body as string);

    expect(requestBody[0]).toHaveProperty("id", "abc123def456");
    expect(requestBody[0]).toHaveProperty("done", true);
    expect(requestBody[0]).toHaveProperty("status", 2);
    expect(requestBody[0]).toHaveProperty("done_at");
    expect(requestBody[0]).toHaveProperty("global_updated_at");
  });

  it("completes multiple tasks with mixed short IDs and UUIDs", async () => {
    // given
    const consoleSpy = spyOn(console, "log");
    const fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          message: null,
          data: [
            {
              id: "abc123def456",
              done: true,
              done_at: new Date().toISOString(),
              status: 2,
            },
            {
              id: "pqr345stu678",
              done: true,
              done_at: new Date().toISOString(),
              status: 2,
            },
          ],
        }),
        { status: 200 }
      )
    );

    const mockContext = {
      args: { ids: ["1", "pqr345"] },
    };

    // when
    await doCommand.run?.(mockContext as never);

    // then
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Completed 2 task(s):")
    );
    expect(fetchSpy).toHaveBeenCalled();
  });
});
