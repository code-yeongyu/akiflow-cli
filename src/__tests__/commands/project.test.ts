/// <reference types="bun" />
import { describe, it, expect } from "bun:test";
import { projectCommand } from "../../commands/project";

describe("project command", () => {
  it("has ls subcommand", () => {
    // given
    const subCommands = projectCommand.subCommands as never;

    // when
    const lsCommand = subCommands?.ls;

    // then
    expect(lsCommand).toBeDefined();
    expect(lsCommand?.meta.name).toBe("ls");
  });

  it("has create subcommand", () => {
    // given
    const subCommands = projectCommand.subCommands;

    // when
    const createCommand = subCommands?.create;

    // then
    expect(createCommand).toBeDefined();
    expect(createCommand?.meta.name).toBe("create");
  });

  it("has delete subcommand", () => {
    // given
    const subCommands = projectCommand.subCommands;

    // when
    const deleteCommand = subCommands?.delete;

    // then
    expect(deleteCommand).toBeDefined();
    expect(deleteCommand?.meta.name).toBe("delete");
  });

  it("project command has correct metadata", () => {
    // given
    const meta = projectCommand.meta;

    // when
    const name = meta.name;
    const description = meta.description;

    // then
    expect(name).toBe("project");
    expect(description).toContain("project");
  });

  it("create subcommand has color argument", () => {
    // given
    const createCommand = projectCommand.subCommands?.create;

    // when
    const args = createCommand?.args;

    // then
    expect(args).toBeDefined();
    expect(args?.color).toBeDefined();
    expect(args?.color.type).toBe("string");
  });

  it("delete subcommand has name argument", () => {
    // given
    const deleteCommand = projectCommand.subCommands?.delete;

    // when
    const args = deleteCommand?.args;

    // then
    expect(args).toBeDefined();
    expect(args?.name).toBeDefined();
    expect(args?.name.type).toBe("string");
  });

  it("ls subcommand has no required arguments", () => {
    // given
    const lsCommand = projectCommand.subCommands?.ls;

    // when
    const args = lsCommand?.args;

    // then
    expect(args).toBeUndefined();
  });
});
