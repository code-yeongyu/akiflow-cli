/// <reference types="bun:test" />
import { describe, it, expect } from "bun:test";
import { completionCommand } from "../../commands/completion";

describe("completion command", () => {
  it("generates bash completion script", async () => {
    // given
    let output = "";
    const originalLog = console.log;
    console.log = (msg: unknown) => {
      output = String(msg);
    };
    const context = {
      args: { shell: "bash" },
    } as never;

    // when
    await completionCommand.run?.(context);

    // then
    console.log = originalLog;
    expect(output).toContain("#!/bin/bash");
    expect(output).toContain("_af_completion");
  });

  it("generates zsh completion script", async () => {
    // given
    let output = "";
    const originalLog = console.log;
    console.log = (msg: unknown) => {
      output = String(msg);
    };
    const context = {
      args: { shell: "zsh" },
    } as never;

    // when
    await completionCommand.run?.(context);

    // then
    console.log = originalLog;
    expect(output).toContain("#compdef af");
    expect(output).toContain("_af()");
  });

  it("generates fish completion script", async () => {
    // given
    let output = "";
    const originalLog = console.log;
    console.log = (msg: unknown) => {
      output = String(msg);
    };
    const context = {
      args: { shell: "fish" },
    } as never;

    // when
    await completionCommand.run?.(context);

    // then
    console.log = originalLog;
    expect(output).toContain("# Fish completion for af");
    expect(output).toContain("complete -c af");
  });

  it("includes all commands in bash completion", async () => {
    // given
    let output = "";
    const originalLog = console.log;
    console.log = (msg: unknown) => {
      output = String(msg);
    };
    const context = {
      args: { shell: "bash" },
    } as never;

    // when
    await completionCommand.run?.(context);

    // then
    console.log = originalLog;
    expect(output).toContain("add");
    expect(output).toContain("ls");
    expect(output).toContain("task");
    expect(output).toContain("project");
  });

  it("includes task subcommands in zsh", async () => {
    // given
    let output = "";
    const originalLog = console.log;
    console.log = (msg: unknown) => {
      output = String(msg);
    };
    const context = {
      args: { shell: "zsh" },
    } as never;

    // when
    await completionCommand.run?.(context);

    // then
    console.log = originalLog;
    expect(output).toContain("edit");
    expect(output).toContain("move");
    expect(output).toContain("plan");
  });

  it("includes project subcommands in fish", async () => {
    // given
    let output = "";
    const originalLog = console.log;
    console.log = (msg: unknown) => {
      output = String(msg);
    };
    const context = {
      args: { shell: "fish" },
    } as never;

    // when
    await completionCommand.run?.(context);

    // then
    console.log = originalLog;
    expect(output).toContain("__fish_seen_subcommand_from project");
  });

  it("includes add flags in bash", async () => {
    // given
    let output = "";
    const originalLog = console.log;
    console.log = (msg: unknown) => {
      output = String(msg);
    };
    const context = {
      args: { shell: "bash" },
    } as never;

    // when
    await completionCommand.run?.(context);

    // then
    console.log = originalLog;
    expect(output).toContain("--today");
    expect(output).toContain("--date");
  });

  it("includes ls flags in zsh", async () => {
    // given
    let output = "";
    const originalLog = console.log;
    console.log = (msg: unknown) => {
      output = String(msg);
    };
    const context = {
      args: { shell: "zsh" },
    } as never;

    // when
    await completionCommand.run?.(context);

    // then
    console.log = originalLog;
    expect(output).toContain("--inbox");
    expect(output).toContain("--all");
  });

  it("rejects invalid shell", async () => {
    // given
    let errorMsg = "";
    const originalError = console.error;
    console.error = (msg: unknown) => {
      errorMsg = String(msg);
    };
    const context = {
      args: { shell: "invalid" },
    } as never;

    // when
    await completionCommand.run?.(context);

    // then
    console.error = originalError;
    expect(errorMsg).toContain("Unknown shell");
  });

  it("handles case-insensitive shell names", async () => {
    // given
    let output = "";
    const originalLog = console.log;
    console.log = (msg: unknown) => {
      output = String(msg);
    };
    const context = {
      args: { shell: "BASH" },
    } as never;

    // when
    await completionCommand.run?.(context);

    // then
    console.log = originalLog;
    expect(output).toContain("#!/bin/bash");
  });

  it("bash includes installation instructions", async () => {
    // given
    let output = "";
    const originalLog = console.log;
    console.log = (msg: unknown) => {
      output = String(msg);
    };
    const context = {
      args: { shell: "bash" },
    } as never;

    // when
    await completionCommand.run?.(context);

    // then
    console.log = originalLog;
    expect(output).toContain("Installation:");
    expect(output).toContain("~/.bashrc");
  });

  it("zsh includes installation instructions", async () => {
    // given
    let output = "";
    const originalLog = console.log;
    console.log = (msg: unknown) => {
      output = String(msg);
    };
    const context = {
      args: { shell: "zsh" },
    } as never;

    // when
    await completionCommand.run?.(context);

    // then
    console.log = originalLog;
    expect(output).toContain("Installation:");
    expect(output).toContain("~/.zsh/completions/_af");
  });

  it("fish includes installation instructions", async () => {
    // given
    let output = "";
    const originalLog = console.log;
    console.log = (msg: unknown) => {
      output = String(msg);
    };
    const context = {
      args: { shell: "fish" },
    } as never;

    // when
    await completionCommand.run?.(context);

    // then
    console.log = originalLog;
    expect(output).toContain("Installation:");
    expect(output).toContain("/usr/local/share/fish/vendor_completions.d/af.fish");
  });
});
