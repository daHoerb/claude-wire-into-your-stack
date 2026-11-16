---
description: Review the current changes against this project's conventions checklist
argument-hint: "[base-ref, default: main]"
allowed-tools: Bash(git diff:*), Bash(git status:*), Bash(git log:*), Bash(npm test), Bash(npm run lint), Read, Grep, Glob
---

Review the changes on this branch against the project checklist. Do not edit any files.

Base ref to compare against: "$ARGUMENTS" (if empty, use `main`).

1. Run `git diff <base>...HEAD` and `git status` to see committed and uncommitted changes.
2. Check every changed route against these rules from CLAUDE.md:
   - [ ] One route file per resource, mounted in `server.js` under its base path
   - [ ] All data access goes through `db/store.js`; no state held in `routes/`
   - [ ] Input validated in the route; `400` on bad input, `404` when a record is missing
   - [ ] Every error response is JSON `{ "error": "message" }`
   - [ ] New/changed behaviour has tests in `tests/` covering success, 400 and 404
   - [ ] `docs/api.md` matches the endpoints
3. Run `npm test` and `npm run lint`.

Report as a short table: checklist item | ✅/❌ | file:line evidence. Then list concrete fixes for each ❌. If nothing changed, say so.
