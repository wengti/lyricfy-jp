// PreToolUse hook: runs tsc --noEmit before any git commit
// Skips silently if TypeScript is not yet installed (pre-scaffold)
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

let d = '';
process.stdin.on('data', c => d += c);
process.stdin.on('end', () => {
  const j = JSON.parse(d);
  const cmd = (j.tool_input && j.tool_input.command) || '';

  if (!/git\s+commit/.test(cmd)) {
    process.exit(0);
  }

  const cwd = 'c:/Users/User/Journey/dev/lyricfy-jp';
  const tscBin = path.join(cwd, 'node_modules/.bin/tsc');

  if (!fs.existsSync(tscBin)) {
    // Project not scaffolded yet — skip check
    process.exit(0);
  }

  try {
    execSync(`"${tscBin}" --noEmit`, { stdio: 'inherit', cwd });
    process.exit(0);
  } catch {
    // tsc reported errors — block the commit
    console.error('TypeScript check failed. Fix errors before committing.');
    process.exit(1);
  }
});
