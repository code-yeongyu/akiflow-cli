/// <reference types="bun" />
import { describe, it, expect } from "bun:test";
import { projectCommand } from "../../commands/project";

// Resolve citty's Resolvable<T> wrapper for synchronous test assertions
type ResolvedSubCommand = {
  meta: { name: string; description?: string };
  args?: Record<string, { type: string }>;
};

const getSubCommands = () =>
  projectCommand.subCommands as unknown as Record<string, ResolvedSubCommand> | undefined;

describe("project command", () => {
  it("has ls subcommand", () => {
    // given
    const subCommands = getSubCommands();

    // when
    const lsCommand = subCommands?.ls;

    // then
    expect(lsCommand).toBeDefined();
    expect(lsCommand?.meta.name).toBe("ls");
  });

  it("has create subcommand", () => {
    // given
    const subCommands = getSubCommands();

    // when
    const createCommand = subCommands?.create;

    // then
    expect(createCommand).toBeDefined();
    expect(createCommand?.meta.name).toBe("create");
  });

  it("has delete subcommand", () => {
    // given
    const subCommands = getSubCommands();

    // when
    const deleteCommand = subCommands?.delete;

    // then
    expect(deleteCommand).toBeDefined();
    expect(deleteCommand?.meta.name).toBe("delete");
  });

  it("project command has correct metadata", () => {
    // given
    const meta = projectCommand.meta as { name: string; description: string };

    // when
    const name = meta.name;
    const description = meta.description;

    // then
    expect(name).toBe("project");
    expect(description).toContain("project");
  });

  it("create subcommand has color argument", () => {
    // given
    const createCommand = getSubCommands()?.create;

    // when
    const args = createCommand?.args;

    // then
    expect(args).toBeDefined();
    expect(args?.color).toBeDefined();
    expect(args?.color?.type).toBe("string");
  });

  it("delete subcommand has name argument", () => {
    // given
    const deleteCommand = getSubCommands()?.delete;

    // when
    const args = deleteCommand?.args;

    // then
    expect(args).toBeDefined();
    expect(args?.name).toBeDefined();
    expect(args?.name?.type).toBe("string");
  });

  it("ls subcommand has no required arguments", () => {
    // given
    const lsCommand = getSubCommands()?.ls;

    // when
    const args = lsCommand?.args;

    // then
    expect(args).toBeUndefined();
  });
});
