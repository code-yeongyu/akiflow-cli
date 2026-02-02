<div align="center">

# Akiflow CLI

**Command-line interface for [Akiflow](https://akiflow.com) task management**

[![GitHub Release](https://img.shields.io/github/v/release/code-yeongyu/akiflow-cli?color=369eff&labelColor=black&logo=github&style=flat-square)](https://github.com/code-yeongyu/akiflow-cli/releases)
[![GitHub Stars](https://img.shields.io/github/stars/code-yeongyu/akiflow-cli?color=ffcb47&labelColor=black&style=flat-square)](https://github.com/code-yeongyu/akiflow-cli/stargazers)
[![GitHub Issues](https://img.shields.io/github/issues/code-yeongyu/akiflow-cli?color=ff80eb&labelColor=black&style=flat-square)](https://github.com/code-yeongyu/akiflow-cli/issues)
[![CI](https://img.shields.io/github/actions/workflow/status/code-yeongyu/akiflow-cli/test.yml?branch=master&labelColor=black&style=flat-square&logo=github&label=tests)](https://github.com/code-yeongyu/akiflow-cli/actions/workflows/test.yml)
[![License](https://img.shields.io/badge/license-MIT-white?labelColor=black&style=flat-square)](https://github.com/code-yeongyu/akiflow-cli/blob/master/LICENSE)

</div>

---

Bun-native CLI for managing Akiflow tasks directly from your terminal. Built with TypeScript, [citty](https://github.com/unjs/citty) framework, and compiles to a standalone `af` binary.

## Features

- **Task Management**: List, add, complete, edit, move, plan, snooze, delete tasks
- **Project Management**: List, create, delete labels/projects
- **Calendar View**: View scheduled tasks and time blocks
- **Time Blocking**: Create focus time blocks
- **Natural Language Dates**: "tomorrow", "next friday", "in 2 hours"
- **Short ID System**: Use `af do 1` instead of full UUIDs
- **Shell Completions**: Bash, Zsh, Fish support
- **Secure Auth**: Browser token extraction, Keychain (macOS) / XDG config (Linux)

## Installation

### Prerequisites

- [Bun](https://bun.sh) v1.0+

### From Source

```bash
# Clone the repository
git clone https://github.com/code-yeongyu/akiflow-cli.git
cd akiflow-cli

# Install dependencies
bun install

# Build standalone binary
bun run build

# Move to PATH (optional)
mv af /usr/local/bin/
```

### Development

```bash
# Run directly
bun run start

# Hot reload development
bun run dev

# Run tests
bun test
```

## Authentication

Before using the CLI, authenticate with your Akiflow account:

```bash
af auth
```

This extracts your session token from your browser (Chrome, Firefox, Safari, Arc, Brave, Edge supported).

Check authentication status:

```bash
af auth status
```

## Usage

### List Tasks

```bash
# List today's tasks
af ls

# List inbox (unscheduled tasks)
af ls --inbox

# List by project
af ls --project "Work"
```

### Add Tasks

```bash
# Add task for today
af add "Review PR" -t

# Add with specific date
af add "Submit report" -d "next friday"

# Add with duration
af add "Focus time" -d "tomorrow 10am" --duration "2h"
```

### Complete Tasks

```bash
# Complete by short ID (requires af ls first)
af do 1

# Complete by full UUID
af do "task-uuid-here"
```

### Manage Tasks

```bash
# Edit task title
af task edit 1 --title "Updated title"

# Move to project
af task move 1 --project "Personal"

# Reschedule
af task plan 1 -d "tomorrow"

# Snooze
af task snooze 1 --duration "2h"

# Delete
af task delete 1
```

### Calendar & Time Blocking

```bash
# View today's schedule
af cal

# Find free time slots
af cal --free

# Create time block
af block 1h "Deep work"
af block 2h "Meeting prep" --start "14:00"
```

### Projects

```bash
# List projects
af project ls

# Create project
af project create "New Project"
```

### Shell Completions

```bash
# Bash
af completion bash >> ~/.bashrc

# Zsh
af completion zsh >> ~/.zshrc

# Fish
af completion fish > ~/.config/fish/completions/af.fish
```

## Architecture

```
akiflow-cli/
├── src/
│   ├── index.ts              # CLI entry point
│   ├── commands/             # Command modules
│   │   ├── add.ts
│   │   ├── ls.ts
│   │   ├── do.ts
│   │   ├── auth.ts
│   │   ├── task/index.ts     # Subcommands
│   │   ├── project.ts
│   │   ├── cal.ts
│   │   ├── block.ts
│   │   └── completion.ts
│   ├── lib/
│   │   ├── api/              # Akiflow API client
│   │   ├── auth/             # Token extraction & storage
│   │   ├── date-parser.ts    # chrono-node wrapper
│   │   └── duration-parser.ts
│   └── __tests__/            # Test files
└── docs/
    ├── COMMANDS.md
    └── API_INTEGRATION.md
```

## How It Works

### Short ID System

Running `af ls` saves task context to `~/.cache/af/last-list.json`. Subsequent commands like `af do 1` resolve the short ID from this cache. Full UUIDs always work as fallback.

### Token Extraction

Authentication works by extracting your existing Akiflow session from your browser:
1. IndexedDB (JWT pattern matching)
2. Cookies (PBKDF2 decryption for Chrome-family, binary parsing for Safari)

No OAuth flow required - just log into Akiflow in your browser once.

### Credentials Storage

- **macOS**: Keychain via `Bun.secrets`
- **Linux/Other**: `~/.config/af/credentials.json`

## Development

```bash
# Run tests
bun test

# Type checking
bunx tsc --noEmit

# Build binary
bun run build
```

## License

MIT
