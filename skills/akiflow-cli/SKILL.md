---
name: akiflow-cli
description: Manage Akiflow tasks from CLI. Use when creating, listing, completing tasks, managing projects, or viewing calendar/time blocks. Credential extraction from browser—no API keys needed.
metadata: {"openclaw":{"emoji":"📋","requires":{"bins":["af"]}}}
---

# Akiflow CLI

Manage [Akiflow](https://akiflow.com) tasks directly from the command line.

## Why use this?

| Feature | Web App | Akiflow CLI |
|---------|---------|-------------|
| Speed | Browser-based | **Instant from terminal** |
| OAuth setup | N/A | **Not needed** |
| API keys | N/A | **Not needed** |
| Credential source | Manual login | Browser token extraction |

Use this when you want fast task management without leaving your terminal.

## Setup

```bash
# Clone and build
git clone https://github.com/code-yeongyu/akiflow-cli.git
cd akiflow-cli
bun install
bun run build

# Move to PATH
mv af /usr/local/bin/

# Extract credentials from browser (run once)
# Requires Akiflow to be logged in via browser (Chrome, Firefox, Safari, Arc, Brave, Edge)
af auth
```

Credentials are stored in Keychain (macOS) or `~/.config/af/credentials.json` (Linux).

---

## Authentication

```bash
af auth                # Extract credentials from browser
af auth status         # Check auth status
```

---

## Task Commands

### List Tasks

```bash
af ls                      # List today's tasks
af ls --inbox              # List inbox (unscheduled tasks)
af ls --project "Work"     # List by project
af ls --all                # List all tasks
```

### Add Tasks

```bash
af add "Task title"                          # Add to inbox
af add "Task title" -t                       # Add for today
af add "Task title" -d "tomorrow"            # Natural language date
af add "Task title" -d "next friday 10am"    # Specific date/time
af add "Task title" --duration "2h"          # With duration
af add "Task title" --project "Work"         # Assign to project
```

### Complete Tasks

```bash
af do 1                    # Complete by short ID (requires af ls first)
af do "full-uuid-here"     # Complete by full UUID
```

### Edit Tasks

```bash
af task edit 1 --title "New title"       # Edit title
af task move 1 --project "Personal"      # Move to project
af task plan 1 -d "tomorrow"             # Reschedule
af task snooze 1 --duration "2h"         # Snooze
af task delete 1                         # Delete
```

---

## Project Commands

```bash
af project ls                    # List all projects
af project create "Project Name" # Create new project
af project delete "Project Name" # Delete project
```

---

## Calendar & Time Blocking

```bash
af cal                           # View today's schedule
af cal --free                    # Find free time slots
af cal -d "tomorrow"             # View specific date

af block 1h "Focus time"         # Create 1-hour time block
af block 2h "Meeting prep" --start "14:00"  # With start time
```

---

## Short ID System

Running `af ls` saves task context to `~/.cache/af/last-list.json`. This enables short IDs:

```bash
af ls                # Shows: [1] Task A, [2] Task B, ...
af do 1              # Completes Task A
af task edit 2 --title "Updated"  # Edits Task B
```

Full UUIDs always work as fallback.

---

## Common Workflows

### Morning Task Review

```bash
af ls                          # See today's tasks
af ls --inbox                  # Check inbox for unscheduled items
af task plan 3 -d "today"      # Schedule an inbox item for today
```

### Quick Task Capture

```bash
af add "Review PR #123" -t     # Add to today
af add "Follow up with client" -d "monday"  # Schedule for next week
```

### End of Day

```bash
af ls                          # Review remaining tasks
af task snooze 2 --duration "1d"   # Push to tomorrow
af do 1                        # Mark as done
```

### Time Blocking

```bash
af cal --free                  # Find available slots
af block 2h "Deep work" --start "09:00"
af block 1h "Email" --start "14:00"
```

### Project Management

```bash
af project ls                  # List projects
af ls --project "Work"         # View project tasks
af add "New feature" --project "Work" -d "friday"
```

---

## Natural Language Dates

Supported formats:
- `today`, `tomorrow`, `yesterday`
- `monday`, `tuesday`, ... (next occurrence)
- `next week`, `next month`
- `in 2 hours`, `in 3 days`
- `march 15`, `2026-03-15`
- `friday 10am`, `tomorrow 14:00`

---

## Output Format

All commands output human-readable format by default.

---

## Troubleshooting

### Token Expired

```bash
af auth                # Re-extract from browser
af auth status         # Verify authentication
```

### Short IDs Not Working

```bash
af ls                  # Refresh task cache first
af do 1                # Now works
```
