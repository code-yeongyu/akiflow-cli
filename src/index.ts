import { defineCommand, runMain } from "citty";
import { lsCommand } from "./commands/ls";
import { add } from "./commands/add";
import { doCommand } from "./commands/do";
import { taskCommand } from "./commands/task";
import { projectCommand } from "./commands/project";
import { completionCommand } from "./commands/completion";
import { cal } from "./commands/cal";
import { block } from "./commands/block";
import { authCommand } from "./commands/auth";

const hello = defineCommand({
  meta: {
    name: "hello",
    description: "Say hello",
  },
  run: async () => {
    console.log("Hello from Akiflow CLI!");
  },
});

const main = defineCommand({
  meta: {
    name: "af",
    description: "Akiflow CLI - Task management and automation",
    version: "0.0.1",
  },
  subCommands: {
    add,
    hello,
    do: doCommand,
    ls: lsCommand,
    task: taskCommand,
    project: projectCommand,
    completion: completionCommand,
    cal,
    block,
    auth: authCommand,
  },
  run: async () => {
    console.log("Akiflow CLI v0.0.1");
  },
});

runMain(main);
