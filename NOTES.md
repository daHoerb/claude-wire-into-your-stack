# NOTES — Wiring Claude into the Course API

## 1. Server (MCP)
**What:** `@modelcontextprotocol/server-filesystem` (pinned to 2.2.0), registered at project scope in `.mcp.json` as `docs` and limited to the `./docs` folder.
**Why:** This repo's main reference is `docs/api.md`, and it has to stay in sync with `routes/`. The server needs no credentials or network access, so it works the same for every teammate. It also can't reach anything outside `docs/`.
**Permission rule:** `.claude/settings.json` → `permissions.allow` covers only the read-only tools I use: `mcp__docs__read_text_file`, `mcp__docs__list_directory` and `mcp__docs__search_files`. The write tools (`write_file`, `edit_file`, `move_file`, `create_directory`) are not allowed, so they still need a prompt every time. `enabledMcpjsonServers: ["docs"]` saves teammates from approving the server by hand.
**Used it:** I had Claude read `api.md` through the server and compare it with `routes/*.js`. It found that all 5 endpoints are documented and implemented. The rule held: Claude also tried `list_allowed_directories`, which I hadn't allowed, and that call was denied.

## 2. Skill — `express-route`
**Captures:** How an endpoint is written here: one router per resource, mounted in `server.js`; all data goes through `db/store.js`; `400` for bad input and `404` for a missing record; `{ "error": "message" }` as the only error shape; a supertest test that calls `store.reset()`; an update to `docs/api.md`; and finally `npm test` plus `npm run lint`.
**Description wording:** It names the action and the object ("add, create, change, or extend an endpoint, route, or resource"), gives real example requests ("add a DELETE /users/:id"), and lists what it is *not* for (unrelated edits, tests-only changes, config work).
**Confirmed:** The prompt "I need a DELETE /users/:id endpoint…" doesn't name the skill, and Claude loaded `express-route` by itself. A question about which ESLint rules are configured did not load it.

## 3. Command — `/review [base-ref]`
**What:** Reviews the branch diff (`git diff <base>...HEAD`, default `main`) against the CLAUDE.md checklist, runs `npm test` and `npm run lint`, and reports a table of item | ✅/❌ | file:line. It never edits files. `$ARGUMENTS` takes the base ref.
**Why a shortcut:** I'd run this before every PR, and the checklist should be applied the same way every time instead of retyped. Its `allowed-tools` frontmatter is limited to read-only git commands, tests, lint and reading files, so it runs without prompts and can't change anything.

## 4. Hook — lint after every edit
**Event / matcher / command:** `PostToolUse`, matcher `Edit|Write|MultiEdit`, running `.claude/hooks/lint-edited-file.js`.
**React or prevent:** It *reacts*. After Claude writes a `.js` file, ESLint runs on that file. If there are errors, the hook exits with code `2`, so the ESLint output goes straight back to Claude and it fixes the problem right away. Non-JS files are skipped. If `node_modules` isn't installed yet, the hook skips too, so a fresh checkout never breaks.
**Watched it fire:** I had Claude write `module.exports = notDefined;` to a test file. The hook returned `'notDefined' is not defined  no-undef` as a blocking error to Claude. I deleted the file afterwards.

## 5. Headless run
```bash
claude -p "Run the test suite with npm test. Summarise in max 4 lines: how many tests passed/failed, and which endpoints in routes/ have no test coverage (read tests/ and routes/ to decide)." \
  --allowedTools "Bash(npm test)" "Read(./tests/**)" "Read(./routes/**)"
```
**Locked down:** Bash is limited to exactly `npm test`: no other commands, no `npm install`, no git. Read is limited to `tests/` and `routes/`. There are no write or edit tools and no MCP tools. The run asked for no permissions beyond these.
**Result:** 5 tests passed and 0 failed. It found gaps: `GET /health` has no test, `GET /users/:id` is only tested for the 404, and there's no test that `POST /users` returns 400 on bad input.

## Fresh-checkout notes
- On first start, Claude Code shows the workspace trust dialog. Until you accept it, the project's `permissions.allow` rules are ignored.
- Run `npm install` once, otherwise the lint hook has no ESLint to call and skips itself.
- The `docs` server path `./docs` is relative to the folder you start Claude in. Start Claude from the repo root.
