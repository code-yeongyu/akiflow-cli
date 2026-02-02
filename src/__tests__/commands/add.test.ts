import { describe, it, expect, spyOn, beforeEach, afterEach } from "bun:test";
import { add } from "../../commands/add";

describe("add command", () => {
  let fetchSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    fetchSpy = spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("creates task in inbox when no date flag provided", async () => {
    // given
    fetchSpy.mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          message: null,
          data: [
            {
              id: "test-uuid-1",
              title: "Test task",
              date: null,
              listId: null,
              global_created_at: new Date().toISOString(),
              global_updated_at: new Date().toISOString(),
            },
          ],
        }),
        { status: 200 }
      )
    );

    const consoleLogSpy = spyOn(console, "log");

    // when
    await add.run({
      args: { title: "Test task", today: false, tomorrow: false, date: undefined, project: undefined, t: undefined, d: undefined, p: undefined, _: [] },
      rawArgs: [],
    } as any);

    // then
    expect(fetchSpy).toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith("✓ Task created successfully");

    consoleLogSpy.mockRestore();
  });

  it("creates task with today's date when --today flag provided", async () => {
    // given
    const today = new Date();
    const expectedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    fetchSpy.mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          message: null,
          data: [
            {
              id: "test-uuid-2",
              title: "Test task",
              date: expectedDate,
              listId: null,
              global_created_at: new Date().toISOString(),
              global_updated_at: new Date().toISOString(),
            },
          ],
        }),
        { status: 200 }
      )
    );

    const consoleLogSpy = spyOn(console, "log");

    // when
    await add.run({
      args: { title: "Test task", today: true, tomorrow: false, date: undefined, project: undefined, t: undefined, d: undefined, p: undefined, _: [] },
      rawArgs: [],
    } as any);

    // then
    const fetchCall = fetchSpy.mock.calls[0];
    const requestBody = JSON.parse(fetchCall[1]?.body as string);
    expect(requestBody[0].date).toBe(expectedDate);
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Date:"));

    consoleLogSpy.mockRestore();
  });

  it("creates task with tomorrow's date when --tomorrow flag provided", async () => {
    // given
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const expectedDate = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;

    fetchSpy.mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          message: null,
          data: [
            {
              id: "test-uuid-3",
              title: "Test task",
              date: expectedDate,
              listId: null,
              global_created_at: new Date().toISOString(),
              global_updated_at: new Date().toISOString(),
            },
          ],
        }),
        { status: 200 }
      )
    );

    const consoleLogSpy = spyOn(console, "log");

    // when
    await add.run({
      args: { title: "Test task", today: false, tomorrow: true, date: undefined, project: undefined, t: undefined, d: undefined, p: undefined, _: [] },
      rawArgs: [],
    } as any);

    // then
    const fetchCall = fetchSpy.mock.calls[0];
    const requestBody = JSON.parse(fetchCall[1]?.body as string);
    expect(requestBody[0].date).toBe(expectedDate);

    consoleLogSpy.mockRestore();
  });

  it("creates task with parsed date when -d flag provided", async () => {
    // given
    fetchSpy.mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          message: null,
          data: [
            {
              id: "test-uuid-4",
              title: "Test task",
              date: "2026-02-07",
              listId: null,
              global_created_at: new Date().toISOString(),
              global_updated_at: new Date().toISOString(),
            },
          ],
        }),
        { status: 200 }
      )
    );

    const consoleLogSpy = spyOn(console, "log");

    // when
    await add.run({
      args: { title: "Test task", today: false, tomorrow: false, date: "next friday", project: undefined, t: undefined, d: undefined, p: undefined, _: [] },
      rawArgs: [],
    } as any);

    // then
    const fetchCall = fetchSpy.mock.calls[0];
    const requestBody = JSON.parse(fetchCall[1]?.body as string);
    expect(requestBody[0].date).toBeTruthy();

    consoleLogSpy.mockRestore();
  });

  it("creates task assigned to project when --project flag provided", async () => {
    // given
    const projectId = "project-123";

    // First fetch for getLabels
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          message: null,
          data: [
            {
              id: projectId,
              title: "Work",
              icon: null,
              color: null,
              sorting: 0,
              type: null,
              user_id: 1,
              parent_id: null,
              global_created_at: new Date().toISOString(),
              global_updated_at: new Date().toISOString(),
              data: {},
              deleted_at: null,
            },
          ],
        }),
        { status: 200 }
      )
    );

    // Second fetch for upsertTasks
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          message: null,
          data: [
            {
              id: "test-uuid-5",
              title: "Test task",
              date: null,
              listId: projectId,
              global_created_at: new Date().toISOString(),
              global_updated_at: new Date().toISOString(),
            },
          ],
        }),
        { status: 200 }
      )
    );

    const consoleLogSpy = spyOn(console, "log");

    // when
    await add.run({
      args: { title: "Test task", today: false, tomorrow: false, date: undefined, project: "Work", t: undefined, d: undefined, p: undefined, _: [] },
      rawArgs: [],
    } as any);

    // then
    const upsertCall = fetchSpy.mock.calls[1];
    const requestBody = JSON.parse(upsertCall[1]?.body as string);
    expect(requestBody[0].listId).toBe(projectId);
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Project: Work"));

    consoleLogSpy.mockRestore();
  });

  it("exits with error when project not found", async () => {
    // given
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          message: null,
          data: [
            {
              id: "project-123",
              title: "Work",
              icon: null,
              color: null,
              sorting: 0,
              type: null,
              user_id: 1,
              parent_id: null,
              global_created_at: new Date().toISOString(),
              global_updated_at: new Date().toISOString(),
              data: {},
              deleted_at: null,
            },
          ],
        }),
        { status: 200 }
      )
    );

    const consoleErrorSpy = spyOn(console, "error");
    const processExitSpy = spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit");
    });

    // when/then
    await expect(
      add.run({
        args: { title: "Test task", today: false, tomorrow: false, date: undefined, project: "Nonexistent", t: undefined, d: undefined, p: undefined, _: [] },
        rawArgs: [],
      } as any)
    ).rejects.toThrow();

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Project "Nonexistent" not found'));

    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  it("generates client-side UUID for new task", async () => {
    // given
    fetchSpy.mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          message: null,
          data: [
            {
              id: "generated-uuid",
              title: "Test task",
              date: null,
              listId: null,
              global_created_at: new Date().toISOString(),
              global_updated_at: new Date().toISOString(),
            },
          ],
        }),
        { status: 200 }
      )
    );

    // when
    await add.run({
      args: { title: "Test task", today: false, tomorrow: false, date: undefined, project: undefined, t: undefined, d: undefined, p: undefined, _: [] },
      rawArgs: [],
    } as any);

    // then
    const fetchCall = fetchSpy.mock.calls[0];
    const requestBody = JSON.parse(fetchCall[1]?.body as string);
    expect(requestBody[0].id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it("handles API errors gracefully", async () => {
    // given
    fetchSpy.mockRejectedValue(new Error("Network error"));

    const consoleErrorSpy = spyOn(console, "error");
    const processExitSpy = spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit");
    });

    // when/then
    await expect(
      add.run({
        args: { title: "Test task", today: false, tomorrow: false, date: undefined, project: undefined, t: undefined, d: undefined, p: undefined, _: [] },
        rawArgs: [],
      } as any)
    ).rejects.toThrow();

    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });
});
