#!/bin/bash
# PostToolUse hook: formats edited files with Prettier, matching the lefthook pre-commit step.
# Silent; never blocks on failure.

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('tool_input', {}).get('file_path', ''))" 2>/dev/null)

# Only format file types Prettier handles here (matches lefthook glob: js,ts,tsx,json,md)
case "$FILE_PATH" in
  *.js|*.jsx|*.ts|*.tsx|*.json|*.md|*.css|*.scss|*.yml|*.yaml) ;;
  *) exit 0 ;;
esac

# Only format files inside the repo
if [[ "$FILE_PATH" != *"/apps/"* ]]; then
  exit 0
fi

# Use the repo's Prettier via yarn; --ignore-unknown mirrors lefthook. Stay silent.
( cd "${CLAUDE_PROJECT_DIR:-.}" && yarn --silent prettier --ignore-unknown --write "$FILE_PATH" ) >/dev/null 2>&1

exit 0
