#!/bin/bash
# PreToolUse hook: blocks dangerous git operations for the Probable Futures monorepo.
# Exit code 2 = block the tool call. Exit code 0 = allow.

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('tool_name', ''))" 2>/dev/null)
COMMAND=$(echo "$INPUT" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('tool_input', {}).get('command', ''))" 2>/dev/null)

# Only check Bash tool calls
if [[ "$TOOL_NAME" != "Bash" ]]; then
  exit 0
fi

# Block any push (the user pushes manually, never the agent)
if echo "$COMMAND" | grep -qE "git +push"; then
  echo "BLOCKED: 'git push' detected. This repo's policy is to leave commits local - the user pushes manually. Do not push (force or otherwise)."
  exit 2
fi

# Block commits onto protected/auto-deploy branches (main, staging, production)
if echo "$COMMAND" | grep -qE "git +commit"; then
  CURRENT_BRANCH=$(git -C "${CLAUDE_PROJECT_DIR:-.}" branch --show-current 2>/dev/null)
  if echo "$CURRENT_BRANCH" | grep -qE "^(main|staging|production)$"; then
    echo "BLOCKED: You are on protected branch '$CURRENT_BRANCH', which auto-deploys. Create or switch to a feature branch before committing. Ask the user which branch to use."
    exit 2
  fi
fi

# Block destructive git operations that can discard uncommitted work
if echo "$COMMAND" | grep -qE "git +(reset +--hard|clean +-[a-z]*f|checkout +\.)"; then
  echo "BLOCKED: Destructive git operation detected. This can discard uncommitted work. Ask the user for explicit confirmation first."
  exit 2
fi

exit 0
