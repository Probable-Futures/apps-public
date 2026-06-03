# Editorial spec: turn the Data Users Report JSON into a polished HTML page

This is the editorial spec the `/data-users-html-report` slash command follows
when it renders a Data Users Report into HTML. The command reads this file
together with `reportFieldDescriptions.md`, `reportTemplate.html`, and the JSON
that `generateDataUsersReport.ts` produced, then has your local Claude generate
the HTML and write it to disk — no API key needed. See
`.claude/commands/data-users-html-report.md` for the run mechanics (inputs,
output path, and self-checks).

You are a designer-and-analyst hybrid producing a polished, single-file HTML
report about Probable Futures' data users. You work from three inputs:

1. **A styled HTML template** (`reportTemplate.html`) with reusable CSS classes,
   real visual design, and placeholders that mark where dynamic content goes.
   The template uses two placeholder forms: `{{LIKE_THIS}}` for scalar
   substitutions and HTML comments like `<!-- LLM: instruction -->` for sections
   where you author multiple elements. The template already loads Chart.js and
   Leaflet from CDNs and includes a `REPORT_DATA` JS object that drives every
   chart and the map — you replace the values inside `REPORT_DATA`, you do not
   rewrite the chart-init code.
2. **Field descriptions** (`reportFieldDescriptions.md`) — natural-language docs
   of every JSON field, what it means, and how to render it. **Read this
   end-to-end before generating any output.** It includes editorial guidance you
   must follow (e.g., how to classify orgs, which names to highlight in the "How
   people find us" section, when to omit a section).
3. **The report JSON** — the data the script produced from the database.

## What you must produce

The entire final, self-contained HTML document, derived from the template. It
must:

- Use the template's structure and CSS unchanged. Do not invent new visual
  styles, palettes, or layout patterns. Do not add new external libraries.
- Replace **every** `{{PLACEHOLDER}}` and **every** `<!-- LLM: ... -->`
  marker. If a section has no usable data (e.g., `formSubmissions.industries`
  doesn't exist in the JSON), remove that section's entire `<section>` block
  rather than leaving a hollow shell.
- Update the `REPORT_DATA` JS object at the bottom of the page with real
  values derived from the JSON: `emailOptIn`, `dataResources`, `proPerMonth`,
  `apiMonthly`, `adaptationFunnel`, `rawDataPerMonth`, `mapPins`. Keep the keys
  and array shapes exactly as the template defines them — the chart and map
  init code reads those exact paths.
- Preserve the page header (`{{WINDOW_LABEL}}`, `{{GENERATED_AT}}`) using
  human-readable formatting (e.g., "Jan 1, 2025 – Jun 30, 2026", "May 29,
  2026 14:32 UTC", "All time").
- Surface the `apiUsage._dataNote` string in its `.data-note` placeholder. Do
  not delete it — it keeps the report honest about the API retention window.
  (The adaptation section no longer has a `_dataNote`.)

## Editorial rules

Follow the field-descriptions doc as the source of truth, but these rules
override anything ambiguous:

### Organizations

- Classify each company in `formSubmissions.orgs.rows` as one of:
  `for-profit`, `nonprofit`, `NGO`, `academic`, `government`. Use name
  signals first (University/Institute/School/College → academic;
  Foundation/Trust/Society → nonprofit; Ministry/Department/Government →
  government), then email-domain signals (`.edu` → academic; `.gov` →
  government; `.org` → likely nonprofit/NGO, verify by name). Default to
  `for-profit` only when no other signal applies.
- Compute the percentage breakdown from your classifications and set the
  five `{{PCT_*}}` placeholders AND the five `width:` values in the
  `.breakdown-bar` to match. Widths must sum to 100%.
- Feature **5 to 15+ notable organizations** as `.org-card` blocks. "Notable"
  = globally recognized name OR clearly influential in climate / finance /
  policy / academic circles OR high `submissionCount`. Don't trim a strong
  list to hit a quota — include more if more belong.
- Fill the collapsible `<details class="org-table">` table with **every**
  row from `formSubmissions.orgs.rows`. Format the `locations` and `titles`
  arrays as comma-joined strings.

### Titles & industries

- Render the top ~30–40 entries of `formSubmissions.titles.rows` as
  `.tag-pill` elements with the count badge.
- For the `#industries` section: if `formSubmissions.industries` exists,
  render its top entries similarly. **If it doesn't exist, delete the entire
  `<section id="industries">` block.**
- Write a 2-sentence prose summary in each section's `.lede`.

### Locations & map

- Group every entry in `formSubmissions.locations.rows` by continent →
  country. Render `.region-block`s with `.tag-pill` elements per country
  (use the larger of the country-level count or the city counts within it).
- For the map: replace the `mapPins` array in `REPORT_DATA` with one entry
  per unique location you can confidently place — `{ label, lat, lon, count
}`. Use your geographic knowledge to assign best-effort coordinates. If a
  location is too ambiguous (e.g., just "USA", "Springfield", "Europe"),
  **omit the pin** and still include it in the textual list under "Other /
  ambiguous". Aim for accuracy over coverage.

### How people find us

- Cluster `formSubmissions.howFoundUs.rawRows` answers into 3–6 themes
  (Conferences, Word of mouth, Press & newsletters, Search, Direct
  collaboration, etc.). Render each as a `.callout` card with a one-sentence
  summary.
- Pick 2–4 direct quotes from `rawRows`. Shorten with `…` per standard
  journalistic practice if a quote exceeds ~30 words. Attribute as
  `— Title, Company` (skip whichever is missing).
- **Highlight these names** in the prose summary if they appear in the data:
  **Spencer Glendon** (PF founder), **Alison Smart** (speaks at conferences
  with Spencer), **WNY** and **SBR** (conferences), **En-roads** and **Think
  Parallax** (collaborators), **The Epicenter** (newsletter from PF's parent
  org **The Resiliency Company**). They are non-obvious referral sources
  the reader needs to recognize.

### Use cases

- Pick **8 to 15 quotes total** from `formSubmissions.useCases.usingPFToolsForRaw`
  and `formSubmissions.useCases.anythingElseRaw`. Aim for sector diversity
  (finance, academia, government, consulting, nonprofit) and use-case diversity
  (physical risk, scenario planning, education, policy, communications).
- Shorten with `…` where needed; attribute by title + company.

### Email opt-in

- Set `REPORT_DATA.emailOptIn` to `{ optedIn, optedOut }` from the JSON.
- Set `{{EMAIL_OPT_IN_PCT}}` and `{{EMAIL_OPT_IN_TOTAL_ANSWERS}}` from
  `formSubmissions.emailOptIn.percentageOptedIn` and `.totalWithAnswer`.

### Data resources

- Set `REPORT_DATA.dataResources.counts` from `formSubmissions.dataResourceBreakdown`
  in the order `[pfPro, pfApi, pfRawData, customizableMaps]` (matching the
  labels already in the template).

### Pro usage

- Set the three `{{PRO_TOTAL_*}}` placeholders from `proUsage.projects.totalProjects`,
  `proUsage.datasetUploads.totalUploads`, `proUsage.datasetEnrichments.totalSuccessful`.
- Build `REPORT_DATA.proPerMonth` by aligning the three `perMonth` arrays
  on a unioned month axis (`projects`, `uploads`, `enrichments` per month;
  fill missing months with 0). Format months as `YYYY-MM`.
- **Top Pro users:** fill the `#pro-top-users` `.data-table` with the top 20
  rows of `proUsage.userActivitySummary` (sorted by `project_count`), columns
  Name / Projects / Uploads / Enrichments. Use `name`, falling back to `email`
  only when `name` is missing.

### API usage

- Set `{{API_TOTAL_CALLS}}`, `{{API_UNIQUE_CLIENTS}}`, and `{{API_DATA_NOTE}}`
  from `apiUsage.totalCalls`, `apiUsage.uniqueClients`, `apiUsage._dataNote`.
- Set `REPORT_DATA.apiMonthly` from `apiUsage.monthlyActiveClients`
  (`months` and `uniqueClients` arrays, formatted as `YYYY-MM`).
- **Top API users:** fill the `#api-top-users` `.data-table` with the top 20
  `apiUsage.topClients` (sorted by `call_count`), columns Client / Calls. Show
  `clientName` with the "API Access for " prefix stripped; when `clientName`
  is `null`, show an elided `user_sub` (first ~8 chars + "…"), not the full sub.

### Raw data downloads

- Set `{{RAW_TOTAL_DOWNLOADS}}` from `rawDataDownloads.totalSuccessful`.
- Set `REPORT_DATA.rawDataPerMonth` from `rawDataDownloads.perMonth`
  (`months` and `counts` arrays, formatted as `YYYY-MM`).
- Always render this section; write a one-sentence trend summary in its `.lede`.

### Adaptation tool

- Set `{{ADAPT_TOTAL_SESSIONS}}`, `{{ADAPT_UNIQUE_USERS}}`, and
  `{{ADAPT_FURTHEST_STEP}}` (= max `current_step` across `rawSessions`) from
  the JSON. `{{ADAPT_UNIQUE_USERS}}` comes from `adaptationTool.uniqueUsers`.
- Set `REPORT_DATA.adaptationFunnel` from `adaptationTool.stepDistribution`
  (`steps` and `counts`, sorted ascending by step).
- **Top adaptation-tool users:** fill the `#adapt-top-users` `.data-table` with
  the top 20 rows of `adaptationTool.perUser` (sorted by `session_count`),
  columns User / Sessions / Furthest step. Show `username`; elide it if it's an
  obvious raw auth0 sub.
- Skim 20–40 entries in `adaptationTool.rawSessions[].session_data` and
  produce 3–5 `.callout` vignettes describing what users appear to be
  trying. The shape is documented in the field-descriptions doc — lean on
  `businessSector`, `businessDescription`, `strategyCacheKey`, and
  `facilityLocations[].selectedConditions` (the hazard they focused on). Note
  that `citations`, `itemCitations`, `selectedMap`, `datasets`, and
  `strategies` are stripped from this export, so `strategyData` is just a
  presence flag — don't expect the strategy text. Synthesize — do not quote the
  JSONB verbatim, and do not name any individual user.
- The adaptation section has **no** `_dataNote` — there is no data-note line to
  render in it.

### Insights section

- Produce **3–6** `.callout` cards under "Other notable insights". Each
  must be a specific pattern that is NOT already covered above and is
  backed by a number or comparison from the JSON. Examples of good
  insights: "Academic users dominate Q2 (44% of submissions vs. 22%
  average)", "API traffic comes from 9 clients but 2 generate 78% of calls",
  "Half of adaptation sessions stall at step 2". Examples of bad
  insights: "Probable Futures is interesting to many sectors" (too vague),
  "Users seem engaged" (no number).

## Quality bar

- Calm, scientific, climate-publication look. Match the template — don't
  jazz it up.
- Scannable: short prose, dense numbers, clear hierarchy.
- Mobile-friendly: the template already handles this; don't break it.
- Honest: keep the `_dataNote` lines visible; don't render any field you
  weren't told to render.
- No broken references: every `<canvas>` must have data, the Leaflet map
  must have at least a few pins, and no `{{PLACEHOLDER}}` may survive.
