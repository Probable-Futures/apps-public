---
description: Render a Probable Futures Data Users JSON report into a polished single-file HTML page (runs locally in Claude Code — no API key)
argument-hint: <path/to/report.json> [output.html]
---

You are generating the Probable Futures **Data Users HTML report** locally. **You are the LLM** in this workflow: use the **Read** tool to load the inputs and the **Write** tool to save the result. Do **not** print the HTML into the chat or wrap it in a code block — write it straight to a file.

## Inputs — Read all four before writing anything

1. **Report data JSON:** `$1` — Read this file. This is the data produced by `packages/api/src/scripts/generateDataUsersReport.ts`. If `$1` is empty, stop and ask the user for the path.
2. **Editorial spec & rules:** `packages/api/src/scripts/reportPrompt.md` — Read it end-to-end and follow its **"What you must produce"**, **"Editorial rules"**, and **"Quality bar"** sections. It defines the _content_ of the HTML; this command defines the _mechanics_ — you Write that content to a file (see "Output" below) rather than printing it to the chat.
3. **Field descriptions:** `packages/api/src/scripts/reportFieldDescriptions.md` — Read it end-to-end. It documents every JSON field and exactly how to render it (org classification, name highlighting, geocoding, quote selection, which sections to drop, the adaptation `session_data` shape and how to mine it for vignettes, the `_dataNote` rules, etc.). Note the script strips `citations`, `itemCitations`, `datasets`, and `selectedMap` from each `session_data` blob, so they won't appear in the JSON.
4. **HTML template (the design contract):** `packages/api/src/scripts/reportTemplate.html` — Read it. Reproduce its structure, CSS, component classes, and the `REPORT_DATA` object shape **unchanged**. Do not add libraries or invent styles.

## What to produce

The entire final, self-contained HTML document, derived from the template:

- Replace **every** `{{PLACEHOLDER}}` and **every** `<!-- LLM: … -->` marker. If a section has no usable data, remove that whole `<section>` rather than leaving a hollow shell (e.g. delete `<section id="industries">` if the JSON has no industries).
- Fill the `REPORT_DATA` JS object (`emailOptIn`, `dataResources`, `proPerMonth`, `apiMonthly`, `adaptationFunnel`, `rawDataPerMonth`, `mapPins`) with real values from the JSON, keeping the keys and array shapes exactly as the template defines them — the chart/map init code reads those exact paths. Geocode `mapPins` from your own geographic knowledge; omit pins you can't confidently place.
- Fill the three "Top users" tables: `#pro-top-users` from `proUsage.userActivitySummary`, `#api-top-users` from `apiUsage.topClients` (resolved `clientName`, prefix stripped), and `#adapt-top-users` from `adaptationTool.perUser`. See the field-descriptions doc for columns and fallbacks.
- Keep the `apiUsage._dataNote` string visible (the adaptation section no longer has one). Use human-readable header formatting for `{{WINDOW_LABEL}}` / `{{GENERATED_AT}}`.

## Output

- If a second argument `$2` was given, Write the HTML there. Otherwise Write it next to the input JSON, using the same path with the extension changed to `.html` (e.g. `/tmp/report.json` → `/tmp/report.html`).
- After writing, confirm the output path and give a one-line summary (e.g. counts of notable orgs, quotes, and map pins rendered, and any sections you dropped). Do not paste the HTML.

## Self-check before finishing

- No `{{` placeholder and no `LLM:` marker remains in the output file.
- Every `<canvas>` has data in `REPORT_DATA`, and `mapPins` has at least a few entries.
- The three "Top users" tables are populated. These intentionally show names/clients (internal report). Outside those tables, don't leak raw emails, auth0 subs, or full per-user arrays into the user-facing HTML (per the field-descriptions doc).
