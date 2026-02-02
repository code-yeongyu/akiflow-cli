import { defineCommand } from "citty";
import { createClient } from "../lib/api/client";
import type { CreateTaskPayload } from "../lib/api/types";
import { getTodayDate, getTomorrowDate, parseDate } from "../lib/date-parser";

export const add = defineCommand({
  meta: {
    name: "add",
    description: "Create a new task",
  },
  args: {
    title: {
      type: "positional",
      description: "Task title",
      required: true,
    },
    today: {
      type: "boolean",
      description: "Schedule task for today",
      alias: "t",
    },
    tomorrow: {
      type: "boolean",
      description: "Schedule task for tomorrow",
    },
    date: {
      type: "string",
      description: "Natural language date (e.g., 'next friday', 'in 3 days')",
      alias: "d",
    },
    project: {
      type: "string",
      description: "Assign to project/label by name",
      alias: "p",
    },
  },
  run: async (context) => {
    const client = createClient();

    const title = context.args.title as string;
    const today = context.args.today as boolean;
    const tomorrow = context.args.tomorrow as boolean;
    const dateInput = context.args.date as string | undefined;
    const projectName = context.args.project as string | undefined;

    let taskDate: string | undefined;

    if (today) {
      taskDate = getTodayDate();
    } else if (tomorrow) {
      taskDate = getTomorrowDate();
    } else if (dateInput) {
      const parsedDate = parseDate(dateInput);
      if (!parsedDate) {
        console.error(`Error: Could not parse date "${dateInput}"`);
        process.exit(1);
      }
      taskDate = parsedDate;
    }

    let listId: string | undefined;
    if (projectName) {
      try {
        const labelsResponse = await client.getLabels();
        const label = labelsResponse.data.find(
          (l) => l.title.toLowerCase() === projectName.toLowerCase()
        );

        if (label) {
          listId = label.id;
        } else {
          console.error(`Error: Project "${projectName}" not found`);
          process.exit(1);
        }
      } catch (error) {
        console.error(`Error: Failed to fetch projects`);
        console.error(error instanceof Error ? error.message : "Unknown error");
        process.exit(1);
      }
    }

    const now = new Date().toISOString();
    const taskId = crypto.randomUUID();

    const task: CreateTaskPayload = {
      id: taskId,
      title,
      global_created_at: now,
      global_updated_at: now,
    };

    if (taskDate) {
      task.date = taskDate;
    }

    if (listId) {
      task.listId = listId;
    }

    try {
      const response = await client.upsertTasks([task]);
      const createdTask = response.data[0];

      if (!createdTask) {
        console.error("Error: Failed to create task - no data returned");
        process.exit(1);
      }

      console.log("✓ Task created successfully");
      console.log(`  ID: ${createdTask.id}`);
      console.log(`  Title: ${createdTask.title}`);

      if (createdTask.date) {
        console.log(`  Date: ${createdTask.date}`);
      }

      if (createdTask.listId && listId) {
        console.log(`  Project: ${projectName}`);
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AuthError") {
        console.error(
          "Error: Authentication failed. Please run 'af auth' to login."
        );
      } else {
        console.error(
          "Error: Failed to create task",
          error instanceof Error ? error.message : "Unknown error"
        );
      }
      process.exit(1);
    }
  },
});
