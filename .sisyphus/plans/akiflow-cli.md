# Akiflow CLI (`af`)

## TL;DR

> **Quick Summary**: Build a traditional CLI for Akiflow task management using Bun + Citty, with multi-browser token extraction and power-user-focused command structure.
> 
> **Deliverables**:
> - `af` CLI binary with task CRUD, project management, time blocking
> - Multi-browser auth (Arc, Chrome, Brave, Edge, Safari)
> - Shell completions (bash/zsh/fish)
> - TDD test suite with Bun test
> 
> **Estimated Effort**: Large (40-60 hours)
> **Parallel Execution**: YES - 4 waves
> **Critical Path**: Project Setup → Auth → API Client → Core Commands → Advanced Features

---

## Context

### Original Request
Build a traditional CLI (not TUI) for Akiflow task management, similar to Python's Typer experience but in Bun/TypeScript.

### Interview Summary
**Key Discussions**:
- CLI name: `af` (confirmed no conflicts)
- Framework: Citty (UnJS) - lightweight, functional, Bun-native
- All features requested: Task CRUD, Project/Label, Time blocking, Today view, Inbox
- Auth: Scan ALL browsers → user selects if multiple → Keychain (macOS) / XDG storage
- Command structure: Artistry-designed "Flow at the Speed of Thought"
- Test strategy: TDD with Bun test

**Research Findings**:
- Citty supports lazy-loaded subcommands for fast startup
- `Bun.secrets` API available for native Keychain access
- Safari uses binary cookie format (needs special parser)
- Chrome-family cookies encrypted with PBKDF2

### Metis Review
**Identified Gaps** (addressed):
- Token refresh UX → Added explicit refresh command + auto-refresh on 401
- Client ID strategy → Generate UUID on first run, store with token
- V1 scope → Deferred `af zen`, `af brain-dump`, `af morning` to Phase 2

---

## Work Objectives

### Core Objective
Deliver a production-ready CLI that lets power users manage Akiflow tasks faster than the web/desktop app.

### Concrete Deliverables
- `af` executable (Bun compiled binary)
- Commands: `af add`, `af ls`, `af do`, `af task`, `af cal`, `af block`, `af auth`, `af project`
- Config stored in `~/.config/af/` (XDG) or Keychain (macOS)
- Shell completion scripts for bash/zsh/fish

### Definition of Done
- [ ] `af ls` shows today's tasks correctly
- [ ] `af add "test task"` creates task in Akiflow
- [ ] `af do 1` completes task
- [ ] `af auth` extracts token from browser successfully
- [ ] All tests pass: `bun test`
- [ ] Binary works: `./af --help` shows help

### Must Have
- Task CRUD (create, list, complete, delete)
- Multi-browser token extraction
- Keychain storage on macOS
- Beautiful colorized output
- JSON output mode (`--json`)

### Must NOT Have (Guardrails)
- NO TUI/interactive mode (user explicitly rejected)
- NO OAuth flow (Akiflow doesn't expose public OAuth)
- NO real-time sync (Pusher websockets) - out of scope
- NO `af zen`, `af brain-dump`, `af morning` in V1 (deferred to Phase 2)
- NO over-abstraction - keep it simple, direct implementations
- NO excessive error handling for unlikely edge cases

---

## Verification Strategy (MANDATORY)

### Test Decision
- **Infrastructure exists**: NO (new project)
- **User wants tests**: TDD
- **Framework**: Bun test (`bun:test`)

### TDD Pattern

Each TODO follows RED-GREEN-REFACTOR:

**Task Structure:**
1. **RED**: Write failing test first
   - Test file: `src/__tests__/*.test.ts`
   - Test command: `bun test`
   - Expected: FAIL (test exists, implementation doesn't)
2. **GREEN**: Implement minimum code to pass
   - Command: `bun test`
   - Expected: PASS
3. **REFACTOR**: Clean up while keeping green

**Test Setup Task (Task 1)**:
- Install: `bun init` (built-in test support)
- Verify: `bun test` works
- Pattern: Given/When/Then with `describe`/`it`

### CLI Testing Pattern
```typescript
const run = async (args: string[]) => {
  const proc = Bun.spawn(["./af", ...args], { stdio: ["ignore", "pipe", "pipe"] });
  const [stdout, stderr, code] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  return { stdout: stdout.trim(), stderr: stderr.trim(), code };
};
```

### API Mocking Pattern
```typescript
import { spyOn } from "bun:test";
const fetchSpy = spyOn(globalThis, "fetch").mockImplementation(() => 
  Promise.resolve(new Response(JSON.stringify({ success: true, data: [...] })))
);
```

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 1: Project setup + test infrastructure
└── Task 2: Research browser cookie paths

Wave 2 (After Wave 1):
├── Task 3: Auth - Browser token extraction
├── Task 4: Auth - Keychain/XDG storage
└── Task 5: API Client base

Wave 3 (After Wave 2):
├── Task 6: Core command - af ls
├── Task 7: Core command - af add
├── Task 8: Core command - af do
└── Task 9: Core command - af task

Wave 4 (After Wave 3):
├── Task 10: Project/Label commands
├── Task 11: Calendar/Time blocking
├── Task 12: Shell completions
└── Task 13: Binary build + distribution

Critical Path: 1 → 3 → 5 → 6 → 13
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | All | 2 |
| 2 | None | 3 | 1 |
| 3 | 1, 2 | 5, 6-9 | 4 |
| 4 | 1 | 6-9 | 3, 5 |
| 5 | 1, 3 | 6-13 | 4 |
| 6 | 5 | 13 | 7, 8, 9 |
| 7 | 5 | 13 | 6, 8, 9 |
| 8 | 5, 6 | 13 | 7, 9 |
| 9 | 5 | 13 | 6, 7, 8 |
| 10 | 5 | 13 | 11, 12 |
| 11 | 5 | 13 | 10, 12 |
| 12 | 1 | 13 | 10, 11 |
| 13 | 6-12 | None | None (final) |

---

## TODOs

### Phase 0: Foundation

- [ ] 1. Project Setup + Test Infrastructure

  **What to do**:
  - Initialize Bun project: `bun init`
  - Install Citty: `bun add citty`
  - Install dev dependencies: `bun add -d @types/bun`
  - Create directory structure:
    ```
    src/
      commands/
      lib/
      __tests__/
    ```
  - Create main entry point with Citty
  - Write first test to verify setup

  **Must NOT do**:
  - Don't add unnecessary dependencies
  - Don't create complex abstractions yet

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple project scaffolding, no complex logic
  - **Skills**: [`typescript-programmer`]
    - `typescript-programmer`: TypeScript project setup patterns

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 2)
  - **Blocks**: Tasks 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13
  - **Blocked By**: None

  **References**:
  - `api-spec-akiflow.md` - API spec for understanding data types
  - Citty docs: https://unjs.io/citty

  **Acceptance Criteria**:
  
  ```bash
  # Verify project initialized
  bun run --version
  # Assert: Returns Bun version
  
  # Verify Citty installed
  bun run -e "import { defineCommand } from 'citty'; console.log('OK')"
  # Assert: Prints "OK"
  
  # Verify test runs
  bun test
  # Assert: Exit code 0, shows "1 pass" or similar
  
  # Verify CLI entry point
  bun run src/index.ts --help
  # Assert: Shows help message with "af" name
  ```

  **Commit**: YES
  - Message: `feat(init): setup bun project with citty and test infrastructure`
  - Files: `package.json`, `tsconfig.json`, `src/index.ts`, `src/__tests__/setup.test.ts`
  - Pre-commit: `bun test`

---

- [ ] 2. Research & Document Browser Cookie Paths

  **What to do**:
  - Document exact cookie database paths for each browser on macOS:
    - Chrome: `~/Library/Application Support/Google/Chrome/Default/Cookies`
    - Arc: `~/Library/Application Support/Arc/User Data/Default/Cookies`
    - Brave: `~/Library/Application Support/BraveSoftware/Brave-Browser/Default/Cookies`
    - Edge: `~/Library/Application Support/Microsoft Edge/Default/Cookies`
    - Safari: `~/Library/Cookies/Cookies.binarycookies`
  - Document cookie decryption approach (PBKDF2 for Chrome-family)
  - Document Safari binary cookie format
  - Create `src/lib/browser-paths.ts` with type-safe path definitions

  **Must NOT do**:
  - Don't implement extraction yet (that's Task 3)
  - Don't handle Windows/Linux paths (macOS only for now)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Research and documentation, minimal code
  - **Skills**: [`typescript-programmer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: Task 3
  - **Blocked By**: None

  **References**:
  - Chrome cookie format: Chromium source code
  - Safari binary cookies: `binarycookies` npm package docs

  **Acceptance Criteria**:
  
  ```bash
  # Verify browser paths file exists and exports correctly
  bun run -e "import { BROWSER_PATHS } from './src/lib/browser-paths'; console.log(Object.keys(BROWSER_PATHS))"
  # Assert: Output contains ["chrome", "arc", "brave", "edge", "safari"]
  
  # Verify paths are correct format
  bun run -e "import { BROWSER_PATHS } from './src/lib/browser-paths'; console.log(BROWSER_PATHS.arc.includes('Arc'))"
  # Assert: true
  ```

  **Commit**: YES
  - Message: `feat(auth): add browser cookie path definitions for macos`
  - Files: `src/lib/browser-paths.ts`
  - Pre-commit: `bun test`

---

### Phase 1: Authentication

- [ ] 3. Browser Token Extraction

  **What to do**:
  - Create `src/lib/auth/extract-token.ts`
  - Implement SQLite cookie reading for Chrome-family browsers
  - Implement PBKDF2 decryption for encrypted cookies
  - Implement Safari binary cookie parsing
  - Scan all browsers, return list of found tokens
  - Extract JWT from `remember_web_*` cookie for `akiflow.com`
  
  **TDD Tests**:
  - Given: Mock cookie database, When: extract called, Then: returns token
  - Given: Encrypted cookie, When: decrypt called, Then: returns plaintext
  - Given: No browsers with cookies, When: extract called, Then: returns empty array

  **Must NOT do**:
  - Don't store tokens yet (that's Task 4)
  - Don't implement Windows/Linux support

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Complex crypto + SQLite + binary parsing
  - **Skills**: [`typescript-programmer`]
    - `typescript-programmer`: Crypto and file handling in TS

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 5)
  - **Blocks**: Tasks 5, 6, 7, 8, 9
  - **Blocked By**: Tasks 1, 2

  **References**:
  - `api-spec-akiflow.md:Token Extraction` - Token format and cookie names
  - `src/lib/browser-paths.ts` - Browser paths from Task 2
  - Chrome cookie encryption: salt `saltysalt`, iterations `1003`

  **Acceptance Criteria**:
  
  ```bash
  # Run unit tests for token extraction
  bun test src/__tests__/auth/extract-token.test.ts
  # Assert: All tests pass
  
  # Integration test (requires actual browser with Akiflow session)
  bun run -e "import { scanBrowsers } from './src/lib/auth/extract-token'; scanBrowsers().then(r => console.log(r.length > 0 ? 'FOUND' : 'NONE'))"
  # Assert: Output is "FOUND" or "NONE" (no crash)
  ```

  **Commit**: YES
  - Message: `feat(auth): implement multi-browser token extraction`
  - Files: `src/lib/auth/extract-token.ts`, `src/__tests__/auth/extract-token.test.ts`
  - Pre-commit: `bun test`

---

- [ ] 4. Token Storage (Keychain/XDG)

  **What to do**:
  - Create `src/lib/auth/storage.ts`
  - Use `Bun.secrets` API for macOS Keychain storage
  - Fallback to XDG (`~/.config/af/credentials.json`) for non-macOS
  - Store: JWT token, Client ID (generated UUID), expiry timestamp
  - Implement: `saveCredentials()`, `loadCredentials()`, `clearCredentials()`
  
  **TDD Tests**:
  - Given: Valid token, When: save called, Then: can be loaded back
  - Given: No stored token, When: load called, Then: returns null
  - Given: Stored token, When: clear called, Then: load returns null

  **Must NOT do**:
  - Don't implement token refresh logic yet
  - Don't handle multiple accounts

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple CRUD for credentials
  - **Skills**: [`typescript-programmer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 3, 5)
  - **Blocks**: Tasks 6, 7, 8, 9
  - **Blocked By**: Task 1

  **References**:
  - Bun.secrets API: https://bun.sh/docs/api/utils#bun-secrets
  - XDG Base Directory spec

  **Acceptance Criteria**:
  
  ```bash
  # Run unit tests
  bun test src/__tests__/auth/storage.test.ts
  # Assert: All tests pass
  
  # Integration test (actual Keychain)
  bun run -e "
    import { saveCredentials, loadCredentials, clearCredentials } from './src/lib/auth/storage';
    await saveCredentials({ token: 'test', clientId: 'uuid', expiresAt: Date.now() + 3600000 });
    const loaded = await loadCredentials();
    console.log(loaded?.token === 'test' ? 'OK' : 'FAIL');
    await clearCredentials();
  "
  # Assert: Output is "OK"
  ```

  **Commit**: YES
  - Message: `feat(auth): implement keychain and xdg credential storage`
  - Files: `src/lib/auth/storage.ts`, `src/__tests__/auth/storage.test.ts`
  - Pre-commit: `bun test`

---

- [ ] 5. API Client

  **What to do**:
  - Create `src/lib/api/client.ts`
  - Implement base HTTP client with:
    - Required headers (Authorization, Akiflow-Client-Id, Akiflow-Version, Akiflow-Platform)
    - Auto-load credentials from storage
    - JSON parsing
    - Error handling (401 triggers re-auth prompt)
  - Implement typed methods:
    - `getTasks(syncToken?: string)`
    - `upsertTasks(tasks: Task[])`
    - `getLabels()`, `getTags()`, `getTimeSlots()`
  - Create type definitions from API spec

  **TDD Tests**:
  - Given: Valid credentials, When: getTasks called, Then: returns tasks array
  - Given: 401 response, When: any method called, Then: throws AuthError
  - Given: Network error, When: any method called, Then: throws NetworkError

  **Must NOT do**:
  - Don't implement caching
  - Don't implement offline support

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Core infrastructure, many moving parts
  - **Skills**: [`typescript-programmer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 3, 4)
  - **Blocks**: Tasks 6, 7, 8, 9, 10, 11
  - **Blocked By**: Tasks 1, 3

  **References**:
  - `api-spec-akiflow.md` - Complete API specification
  - `api-spec-akiflow.md:Task Object Schema` - TypeScript interface source
  - `api-spec-akiflow.md:Required Headers` - Header requirements

  **Acceptance Criteria**:
  
  ```bash
  # Run unit tests (mocked fetch)
  bun test src/__tests__/api/client.test.ts
  # Assert: All tests pass
  
  # Type check
  bun run -e "import type { Task, Label } from './src/lib/api/types'; const t: Task = {} as Task; console.log('OK')"
  # Assert: No type errors, prints "OK"
  ```

  **Commit**: YES
  - Message: `feat(api): implement typed akiflow api client`
  - Files: `src/lib/api/client.ts`, `src/lib/api/types.ts`, `src/__tests__/api/client.test.ts`
  - Pre-commit: `bun test`

---

### Phase 2: Core Commands

- [ ] 6. Command: `af ls` (List Tasks)

  **What to do**:
  - Create `src/commands/ls.ts`
  - Implement task listing with filters:
    - Default: today's tasks
    - `--inbox`: inbox tasks (no date)
    - `--all`: all tasks
    - `--done`: completed tasks
    - `--project <name>`: filter by project
  - Implement output formats:
    - Default: colorized table with short IDs
    - `--json`: JSON output
    - `--plain`: no colors
  - Store task list context for short ID resolution (for `af do 1`)

  **TDD Tests**:
  - Given: Tasks exist, When: `af ls` called, Then: shows today's tasks
  - Given: `--json` flag, When: called, Then: outputs valid JSON
  - Given: No tasks, When: called, Then: shows "No tasks" message

  **Must NOT do**:
  - Don't implement pagination (sync all at once)
  - Don't implement search (client-side filter only)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: Standard command implementation
  - **Skills**: [`typescript-programmer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 7, 8, 9)
  - **Blocks**: Task 8 (do needs ls context), Task 13
  - **Blocked By**: Task 5

  **References**:
  - `api-spec-akiflow.md:Tasks API` - GET endpoint
  - `src/lib/api/client.ts` - API client from Task 5
  - Artistry design: "af ls defaults to Today"

  **Acceptance Criteria**:
  
  ```bash
  # Run unit tests
  bun test src/__tests__/commands/ls.test.ts
  # Assert: All tests pass
  
  # CLI integration test
  bun run src/index.ts ls --json 2>/dev/null | head -1
  # Assert: Starts with "[" or "{" (valid JSON)
  
  # Help text
  bun run src/index.ts ls --help
  # Assert: Contains "--inbox", "--all", "--done", "--project"
  ```

  **Commit**: YES
  - Message: `feat(commands): implement af ls with filters and output formats`
  - Files: `src/commands/ls.ts`, `src/__tests__/commands/ls.test.ts`
  - Pre-commit: `bun test`

---

- [ ] 7. Command: `af add` (Create Task)

  **What to do**:
  - Create `src/commands/add.ts`
  - Implement quick task creation:
    - `af add "Task title"` - adds to inbox
    - `af add "Task" --today` - adds with today's date
    - `af add "Task" --tomorrow` - adds with tomorrow's date
    - `af add "Task" -d "next friday"` - natural language date
    - `af add "Task" --project "Work"` - assign to project
  - Use natural language date parsing (chrono-node or similar)
  - Generate UUID client-side
  - Show confirmation with task details

  **TDD Tests**:
  - Given: Title provided, When: add called, Then: task created with UUID
  - Given: `--today` flag, When: add called, Then: task has today's date
  - Given: Natural language date, When: parsed, Then: correct ISO date

  **Must NOT do**:
  - Don't implement recurring tasks in V1
  - Don't implement bulk add

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: Standard command with date parsing
  - **Skills**: [`typescript-programmer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 6, 8, 9)
  - **Blocks**: Task 13
  - **Blocked By**: Task 5

  **References**:
  - `api-spec-akiflow.md:Create/Update Tasks` - PATCH request format
  - `api-spec-akiflow.md:Required Fields for CREATE` - Minimum fields
  - chrono-node: https://github.com/wanasit/chrono

  **Acceptance Criteria**:
  
  ```bash
  # Run unit tests
  bun test src/__tests__/commands/add.test.ts
  # Assert: All tests pass
  
  # Date parsing test
  bun run -e "import { parseDate } from './src/lib/date-parser'; console.log(parseDate('tomorrow'))"
  # Assert: Prints tomorrow's date in ISO format
  
  # Help text
  bun run src/index.ts add --help
  # Assert: Contains "--today", "--tomorrow", "-d", "--project"
  ```

  **Commit**: YES
  - Message: `feat(commands): implement af add with natural language dates`
  - Files: `src/commands/add.ts`, `src/lib/date-parser.ts`, `src/__tests__/commands/add.test.ts`
  - Pre-commit: `bun test`

---

- [ ] 8. Command: `af do` (Complete Task)

  **What to do**:
  - Create `src/commands/do.ts`
  - Implement task completion:
    - `af do 1` - complete task #1 from last `af ls`
    - `af do 1 3 5` - complete multiple tasks
    - `af do <uuid>` - complete by full/partial UUID
  - Read short ID context from `af ls` (stored in temp file)
  - Set `done: true`, `done_at`, `status: 2`
  - Show confirmation with task title

  **TDD Tests**:
  - Given: Short ID 1, When: do called, Then: correct task completed
  - Given: Multiple IDs, When: do called, Then: all tasks completed
  - Given: Invalid ID, When: do called, Then: shows error

  **Must NOT do**:
  - Don't implement undo (use API's soft delete pattern)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple state change command
  - **Skills**: [`typescript-programmer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 6, 7, 9)
  - **Blocks**: Task 13
  - **Blocked By**: Tasks 5, 6

  **References**:
  - `api-spec-akiflow.md:Complete Task` - PATCH with done fields
  - `src/commands/ls.ts` - Short ID context storage

  **Acceptance Criteria**:
  
  ```bash
  # Run unit tests
  bun test src/__tests__/commands/do.test.ts
  # Assert: All tests pass
  
  # Help text
  bun run src/index.ts do --help
  # Assert: Shows usage with task ID argument
  ```

  **Commit**: YES
  - Message: `feat(commands): implement af do for task completion`
  - Files: `src/commands/do.ts`, `src/__tests__/commands/do.test.ts`
  - Pre-commit: `bun test`

---

- [ ] 9. Command: `af task` (Task Management)

  **What to do**:
  - Create `src/commands/task/index.ts` with subcommands:
    - `af task edit <id>` - open in $EDITOR or interactive
    - `af task move <id> <project>` - move to project
    - `af task plan <id> <date>` - schedule task
    - `af task snooze <id> <duration>` - push back (1h, 1d, etc.)
    - `af task delete <id>` - soft delete
  - Implement duration parsing (1h, 2d, 1w)

  **TDD Tests**:
  - Given: Task ID and project, When: move called, Then: listId updated
  - Given: Task ID and date, When: plan called, Then: date updated
  - Given: Duration "1h", When: parsed, Then: returns 3600000ms

  **Must NOT do**:
  - Don't implement batch operations
  - Don't implement task duplication

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: Multiple subcommands but straightforward
  - **Skills**: [`typescript-programmer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 6, 7, 8)
  - **Blocks**: Task 13
  - **Blocked By**: Task 5

  **References**:
  - `api-spec-akiflow.md:Create/Update Tasks` - PATCH fields
  - `api-spec-akiflow.md:Delete Task` - Soft delete pattern

  **Acceptance Criteria**:
  
  ```bash
  # Run unit tests
  bun test src/__tests__/commands/task.test.ts
  # Assert: All tests pass
  
  # Subcommand help
  bun run src/index.ts task --help
  # Assert: Shows subcommands: edit, move, plan, snooze, delete
  ```

  **Commit**: YES
  - Message: `feat(commands): implement af task subcommands`
  - Files: `src/commands/task/*.ts`, `src/__tests__/commands/task.test.ts`
  - Pre-commit: `bun test`

---

### Phase 3: Extended Features

- [ ] 10. Command: `af project` (Project/Label Management)

  **What to do**:
  - Create `src/commands/project.ts` with subcommands:
    - `af project ls` - list projects
    - `af project create <name>` - create project
    - `af project delete <name>` - soft delete
  - Support project colors from palette
  - Show task count per project in listing

  **TDD Tests**:
  - Given: Projects exist, When: ls called, Then: shows project list
  - Given: Name and color, When: create called, Then: project created

  **Must NOT do**:
  - Don't implement project nesting (folders)
  - Don't implement project archiving

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple CRUD, similar pattern to tasks
  - **Skills**: [`typescript-programmer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 11, 12)
  - **Blocks**: Task 13
  - **Blocked By**: Task 5

  **References**:
  - `api-spec-akiflow.md:Labels API` - PATCH/GET endpoints
  - `api-spec-akiflow.md:Available Colors` - Color palette

  **Acceptance Criteria**:
  
  ```bash
  # Run unit tests
  bun test src/__tests__/commands/project.test.ts
  # Assert: All tests pass
  
  # Help text
  bun run src/index.ts project --help
  # Assert: Shows subcommands: ls, create, delete
  ```

  **Commit**: YES
  - Message: `feat(commands): implement af project for label management`
  - Files: `src/commands/project.ts`, `src/__tests__/commands/project.test.ts`
  - Pre-commit: `bun test`

---

- [ ] 11. Commands: `af cal` and `af block` (Time Blocking)

  **What to do**:
  - Create `src/commands/cal.ts`:
    - `af cal` - list today's events and time slots
    - `af cal free` - find free time slots
  - Create `src/commands/block.ts`:
    - `af block <duration> <title>` - create time block
    - `af block 2h "Deep Work"` - finds next free slot
  - Parse duration (30m, 1h, 2h)

  **TDD Tests**:
  - Given: Events exist, When: cal called, Then: shows timeline
  - Given: Duration and title, When: block called, Then: time slot created

  **Must NOT do**:
  - Don't create calendar events (read-only for events)
  - Don't implement recurring time blocks

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: Moderate complexity with time calculations
  - **Skills**: [`typescript-programmer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 10, 12)
  - **Blocks**: Task 13
  - **Blocked By**: Task 5

  **References**:
  - `api-spec-akiflow.md:Time Slots API` - Time slot CRUD
  - `api-spec-akiflow.md:Events API` - Read events
  - `api-spec-akiflow.md:Calendars API` - Get calendar IDs

  **Acceptance Criteria**:
  
  ```bash
  # Run unit tests
  bun test src/__tests__/commands/cal.test.ts
  bun test src/__tests__/commands/block.test.ts
  # Assert: All tests pass
  
  # Duration parsing
  bun run -e "import { parseDuration } from './src/lib/duration-parser'; console.log(parseDuration('2h'))"
  # Assert: Prints 7200 (seconds)
  ```

  **Commit**: YES
  - Message: `feat(commands): implement af cal and af block for time management`
  - Files: `src/commands/cal.ts`, `src/commands/block.ts`, `src/lib/duration-parser.ts`, `src/__tests__/commands/cal.test.ts`, `src/__tests__/commands/block.test.ts`
  - Pre-commit: `bun test`

---

- [ ] 12. Shell Completions

  **What to do**:
  - Create `src/commands/completion.ts`:
    - `af completion bash` - output bash completion script
    - `af completion zsh` - output zsh completion script
    - `af completion fish` - output fish completion script
  - Generate completions for:
    - All subcommands
    - All flags
    - Dynamic: project names, task short IDs
  - Add installation instructions in output

  **TDD Tests**:
  - Given: bash requested, When: completion called, Then: valid bash script
  - Given: zsh requested, When: completion called, Then: valid zsh script

  **Must NOT do**:
  - Don't auto-install completions (user does it)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Templated output generation
  - **Skills**: [`typescript-programmer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 10, 11)
  - **Blocks**: Task 13
  - **Blocked By**: Task 1

  **References**:
  - Citty completion docs
  - Bash completion spec
  - Zsh completion spec

  **Acceptance Criteria**:
  
  ```bash
  # Run unit tests
  bun test src/__tests__/commands/completion.test.ts
  # Assert: All tests pass
  
  # Bash completion output
  bun run src/index.ts completion bash | head -5
  # Assert: Contains "complete -F" or similar bash completion syntax
  
  # Zsh completion output
  bun run src/index.ts completion zsh | head -5
  # Assert: Contains "#compdef" or similar zsh completion syntax
  ```

  **Commit**: YES
  - Message: `feat(commands): implement shell completion scripts`
  - Files: `src/commands/completion.ts`, `src/__tests__/commands/completion.test.ts`
  - Pre-commit: `bun test`

---

- [ ] 13. Command: `af auth` + Binary Build

  **What to do**:
  - Create `src/commands/auth.ts`:
    - `af auth` - interactive auth flow:
      1. Scan all browsers for Akiflow tokens
      2. If multiple found, let user choose
      3. If one found, confirm and save
      4. If none found, show instructions
    - `af auth status` - show current auth status
    - `af auth logout` - clear stored credentials
    - `af auth refresh` - force token refresh
  - Build binary:
    - `bun build src/index.ts --compile --outfile af`
  - Add build script to package.json

  **TDD Tests**:
  - Given: Multiple browsers with tokens, When: auth called, Then: prompts selection
  - Given: One browser with token, When: auth called, Then: auto-selects
  - Given: No tokens, When: auth called, Then: shows help message

  **Must NOT do**:
  - Don't implement OAuth (not available)
  - Don't implement auto-refresh in background

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: Integration of previous auth work + build
  - **Skills**: [`typescript-programmer`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (final task)
  - **Blocks**: None (final)
  - **Blocked By**: Tasks 3, 4, 6, 7, 8, 9, 10, 11, 12

  **References**:
  - `src/lib/auth/extract-token.ts` - Token extraction from Task 3
  - `src/lib/auth/storage.ts` - Credential storage from Task 4
  - Bun compile docs: https://bun.sh/docs/bundler/executables

  **Acceptance Criteria**:
  
  ```bash
  # Run unit tests
  bun test src/__tests__/commands/auth.test.ts
  # Assert: All tests pass
  
  # Build binary
  bun build src/index.ts --compile --outfile af
  # Assert: Exit code 0, ./af file exists
  
  # Binary works
  ./af --help
  # Assert: Shows help with all commands
  
  # Binary version
  ./af --version
  # Assert: Shows version number
  ```

  **Commit**: YES
  - Message: `feat(auth): implement af auth command and binary build`
  - Files: `src/commands/auth.ts`, `src/__tests__/commands/auth.test.ts`, `package.json`
  - Pre-commit: `bun test && bun build src/index.ts --compile --outfile af`

---

## Commit Strategy

| After Task | Message | Key Files |
|------------|---------|-----------|
| 1 | `feat(init): setup bun project with citty and test infrastructure` | package.json, src/index.ts |
| 2 | `feat(auth): add browser cookie path definitions` | src/lib/browser-paths.ts |
| 3 | `feat(auth): implement multi-browser token extraction` | src/lib/auth/extract-token.ts |
| 4 | `feat(auth): implement keychain and xdg credential storage` | src/lib/auth/storage.ts |
| 5 | `feat(api): implement typed akiflow api client` | src/lib/api/client.ts, types.ts |
| 6 | `feat(commands): implement af ls` | src/commands/ls.ts |
| 7 | `feat(commands): implement af add` | src/commands/add.ts |
| 8 | `feat(commands): implement af do` | src/commands/do.ts |
| 9 | `feat(commands): implement af task subcommands` | src/commands/task/*.ts |
| 10 | `feat(commands): implement af project` | src/commands/project.ts |
| 11 | `feat(commands): implement af cal and af block` | src/commands/cal.ts, block.ts |
| 12 | `feat(commands): implement shell completions` | src/commands/completion.ts |
| 13 | `feat(auth): implement af auth and binary build` | src/commands/auth.ts |

---

## Success Criteria

### Verification Commands
```bash
# All tests pass
bun test
# Expected: All tests pass, 0 failures

# Binary builds
bun build src/index.ts --compile --outfile af
# Expected: ./af binary created

# Core workflow works
./af auth                    # Extracts and stores token
./af ls                      # Shows today's tasks
./af add "Test from CLI"     # Creates task
./af do 1                    # Completes first task
./af project ls              # Shows projects
```

### Final Checklist
- [ ] All "Must Have" features implemented and working
- [ ] All "Must NOT Have" guardrails respected
- [ ] All 13 tasks completed with tests
- [ ] Binary compiles and runs standalone
- [ ] Shell completions generate valid scripts
