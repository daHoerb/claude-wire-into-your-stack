#!/usr/bin/env node
// PostToolUse hook: after Claude edits or writes a .js file, run ESLint on it.
// Lint errors are sent back to Claude (exit 2) so it fixes them right away.
// Skips silently for non-JS files and when dependencies aren't installed yet.
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

let input = '';
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', () => {
  let filePath;
  try {
    filePath = JSON.parse(input).tool_input?.file_path;
  } catch {
    process.exit(0);
  }
  if (!filePath || !/\.(c|m)?js$/.test(filePath)) process.exit(0);

  const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const eslintBin = path.join(projectDir, 'node_modules', '.bin', 'eslint');
  if (!fs.existsSync(eslintBin) || !fs.existsSync(filePath)) process.exit(0);

  try {
    execFileSync(eslintBin, ['--no-warn-ignored', filePath], { cwd: projectDir, stdio: 'pipe' });
  } catch (err) {
    process.stderr.write(`ESLint found problems in ${filePath} — fix them before moving on:\n${err.stdout}${err.stderr}`);
    process.exit(2);
  }
  process.exit(0);
});
