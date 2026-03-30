// PostToolUse hook: reminds to use requireApiKey() when editing src/app/api/ files
let d = '';
process.stdin.on('data', c => d += c);
process.stdin.on('end', () => {
  const j = JSON.parse(d);
  const f = (j.tool_input && (j.tool_input.file_path || j.tool_input.path)) || '';
  const normalized = f.replace(/\\/g, '/');
  if (normalized.includes('src/app/api/')) {
    console.log(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext:
          'REMINDER: This file is in src/app/api/. ' +
          'Always use requireApiKey() from @/lib/getUserApiKeys instead of process.env ' +
          'for third-party API keys (openrouter_api_key, spotify_client_id, ' +
          'spotify_client_secret, genius_access_token). ' +
          'Keys must never be read from process.env in API routes.'
      }
    }));
  }
});
