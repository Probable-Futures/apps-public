# Probable Futures — Data Users Report: Field Descriptions

This document explains every field in the JSON file produced by
`generateDataUsersReport.ts`. It's written for an LLM that needs to turn the
JSON into a polished HTML page. Read it once end-to-end before generating any
output, then refer back as you fill the template.

The JSON has five conceptual buckets:

1. **Metadata** — when this report was generated and the time window covered.
2. **`formSubmissions`** — the access-request form (the front door for almost
   every new user). All qualitative narrative material lives here.
3. **`proUsage` / `apiUsage` / `rawDataDownloads`** — how authenticated users
   actually use the product after they sign up. `proUsage` also carries a
   per-user `userActivitySummary` roll-up.
4. **`adaptationTool`** — usage of a separate adaptation-planning tool whose
   app lives outside this repo but whose `session_data` shape is documented
   below.
5. **The `apiUsage._dataNote` string** — a caveat about the API retention
   window; render it visibly so the reader doesn't over-read the data.

---

## Top level

### `generatedAt` (ISO timestamp string)

When the script ran. Render in the page header.

### `window` — `{ since: string|null, until: string|null }`

The `--since` / `--until` CLI flags applied to most queries. Both `null` ⇒
all-time data. When present, the dates are `YYYY-MM-DD` (UTC interpretation).
Render in the page header as e.g. "Jan 1, 2025 – present" or "All time".

---

## `formSubmissions`

Sourced from `pf_private.pf_user_access_requests` — every row is one access
request submitted via the public form. **This is where most of the
qualitative material in the report comes from.**

### `formSubmissions.total` (number)

Total number of submissions in the window.

### `formSubmissions.submissionsPerMonth` (array)

`[{ month: "YYYY-MM-01", count: number }, ...]` sorted oldest → newest.
Useful for a small line chart if monthly cadence is interesting; otherwise
skip rendering it explicitly (the per-month rhythm is implicit elsewhere).

### `formSubmissions.orgs`

- `totalUnique` (number) — count of distinct companies (case-insensitive match
  on the company field).
- `rows` (array) — one entry per unique company, sorted by `submissionCount`
  desc. Each row has:
  - `company` (string) — the company name as the user wrote it (canonical
    casing preserved from the first occurrence).
  - `submissionCount` (number) — how many people from this org submitted.
  - `emails` (string[]) — all email addresses associated with this org.
  - `titles` (string[]) — all titles associated with this org.
  - `locations` (string[]) — all locations associated with this org.

**How to use this in the HTML:**

- Compute a **sector breakdown** (for-profit / nonprofit / NGO / academic /
  government). The JSON does not classify; you do. Use:
  - Company name signals: "University", "Institute", "School", "College" →
    academic. "Foundation", "Trust", "Society" → likely nonprofit. "Ministry",
    "Department of", "Government of", city/state names alone → government.
    Anything else, lean on email-domain.
  - Email-domain signals: `.edu` → academic. `.gov` → government. `.org` →
    likely nonprofit/NGO but verify by name. Everything else → for-profit
    unless clearly otherwise.
  - When uncertain, default to for-profit; do not invent a category.
- Pick **5 to 15+ notable organizations** to feature as `.org-card`s. "Notable"
  means: globally recognized name (e.g., World Bank, MIT, Citigroup, Climate
  Policy Initiative, Munich Re, BBC) OR high `submissionCount` OR clearly
  influential in climate/finance/policy circles. Include more than 15 if there
  are clearly more notable ones — don't trim a strong list to hit a quota.
- Render the full sorted list as a collapsible `<details>` table for thoroughness.

### `formSubmissions.titles`

`{ rows: [{ title: string, count: number }, ...] }` — every distinct title
people wrote, sorted by frequency desc. Render the top ~30–40 as a tag cloud
and write a 2–3 sentence prose summary of role types ("Researchers and
analysts dominate, with a meaningful tail of policy and finance directors,
plus a small but consistent academic / student presence.").

### `formSubmissions.locations`

`{ rows: [{ location: string, count: number }, ...] }` — every raw location
string. **Locations are free text and were not geocoded by the script.** You
will geocode them inline as you emit the Leaflet `<script>` block:

- Use your own geographic knowledge to assign best-effort `lat`, `lon` to
  each unique location string.
- If a location is too ambiguous to confidently place (e.g., "Springfield" or
  just "USA"), **omit the pin** and still include the row in the textual list
  grouped under "Other / ambiguous".
- Use the `count` to scale the circle marker radius (more people in the same
  city → bigger dot).
- Group the textual list by continent → country in `.region-block` sections.

### `formSubmissions.howFoundUs`

Two sub-fields:

- `counts` (array) — `[{ answer: string, count: number }, ...]`: the same
  answer repeated by multiple people gets one row with a count.
- `rawRows` (array) — `[{ answer, email, company, submittedAt }, ...]`: the
  full attributed list of answers, useful for picking direct quotes.

**How to use this in the HTML:**

- Cluster the answers into 3–6 themes (Conferences, Word of mouth, Press &
  newsletters, Search, Direct collaboration, Existing PF presence, etc.).
  Render each theme as a `.callout`.
- Pull 2–4 direct quotes from `rawRows` for the section. Shorten with `…`
  per standard journalistic practice if needed. Attribute by title + company
  when both are available; otherwise just title or just company.
- **Special signal**: highlight any mention of these names — they're
  non-obvious context the reader will care about:
  - **Spencer Glendon** — founded Probable Futures.
  - **Alison Smart** — speaks at conferences with Spencer.
  - **WNY** and **SBR** — conferences Spencer/Alison speak at.
  - **En-roads** — a tool PF has collaborated with.
  - **Think Parallax** — agency PF has collaborated with.
  - **The Epicenter** — newsletter from PF's parent organization, **The
    Resiliency Company**.
    Surface those mentions explicitly in the prose summary (e.g., "Conference
    appearances by Spencer Glendon and Alison Smart at WNY and SBR are a
    recurring referral source.").

### `formSubmissions.useCases`

Two sub-fields, both arrays of raw qualitative answers:

- `usingPFToolsForRaw` — what each user said they intend to use PF for.
- `anythingElseRaw` — the free-form "anything else?" field.

Each entry: `{ answer, email, company, title, submittedAt }`.

**How to use this in the HTML:**

- Pick **8 to 15 quotes total** across both fields. Pull the most concrete,
  vivid, or representative ones. Diversity matters — don't just pick the
  longest quotes; aim for a mix of sectors (finance, academia, government,
  consulting, nonprofit) and use cases (physical risk, scenario planning,
  education, policy, comms).
- Shorten with `…` if a quote runs longer than ~30 words.
- Attribute each quote: `— Title, Company` (or just one if the other is
  missing).
- Render as `.quote-card`s in a grid.

### `formSubmissions.emailOptIn`

`{ optedIn, optedOut, totalWithAnswer, percentageOptedIn }` — straightforward
counts. The `percentageOptedIn` is already computed (2 decimal places).
Render as a doughnut chart + a percentage stat tile.

### `formSubmissions.dataResourceBreakdown`

`{ pfPro, pfApi, pfRawData, customizableMaps, totalSelections, totalSubmissionsWithAtLeastOne }`.

The form's "what would you like to use?" question is multi-select, so the
sum of the four resource counts equals `totalSelections` (not
`totalSubmissionsWithAtLeastOne`). Render as a horizontal bar chart with the
four resources as bars. The data note can mention that totals reflect
selections, not people.

---

## `proUsage`

Sourced from `pf_private.pf_partner_*` tables. This is what users actually do
_inside_ Probable Futures Pro after they sign up.

### `proUsage.projects`

- `totalProjects` (number) — sum of `project_count` across all users.
- `uniqueUsers` (number) — distinct users who created any project.
- `perUser` (array) — `[{ email, name, project_count, first_project_created,
last_project_created }, ...]` sorted by `project_count` desc.
- `perMonth` (array) — `[{ month, projects_created }, ...]`.

### `proUsage.datasetUploads`

- `totalUploads`, `uniqueUsers`, `perUser`, `perMonth` — same shape as
  projects but for dataset uploads.

### `proUsage.datasetEnrichments`

- `totalSuccessful` (number) — count of `status='successful'` enrichments.
- `perUser` (array) — `[{ email, name, enrichment_count }, ...]`.

### `proUsage.datasetsList` (array)

`[{ dataset_name, user_name, user_email, original_file, uploaded_at }, ...]`
— the catalog of non-example datasets. Useful as a deep-dive table but
**don't render names/emails in the HTML by default** unless the user is an
obvious public-facing org. The point of this list in the report is internal
context, not external publication.

### `proUsage.userActivitySummary` (array)

A flat per-user roll-up of Pro activity (it lives under `proUsage` because it's
purely about Pro users). Each row:
`{ email, name, project_count, first_project_created, last_project_created,
uploads_count, first_upload, last_upload, enrichment_count }`, sorted by
`project_count` desc. Its `length` is the "active Pro users" headline stat.

**This is the source for the "Top Pro users" table** (see below). Beyond that
table, don't dump the full array into the HTML.

**How to use this in the HTML:**

- Show total counts as `.stat-tile`s.
- Combine the three `perMonth` series (projects, uploads, enrichments) into a
  single multi-line chart (Chart.js `line`) so the cadence is visible.
- A 1–2 sentence prose summary: which activity dominates, whether monthly
  cadence is growing/flat/decaying.
- **Top Pro users:** render a small table (the `.data-table` style) of the top
  20 rows of `proUsage.userActivitySummary` by `project_count`, with columns
  Name, Projects, Uploads, Enrichments. Use `name`; fall back to `email` only
  when `name` is missing. This is an internal report, so showing the most
  active users by name is intended here.

---

## `apiUsage`

Sourced from `pf_private.pf_audit`. **The `_dataNote` field on this section
flags that rows >180 days old are auto-deleted**, so API usage is necessarily
a "last ~6 months" view regardless of `--since`. Render the note visibly using
the `.data-note` style.

### Fields

- `_dataNote` (string) — render under the section.
- `totalCalls` (number)
- `uniqueClients` (number)
- `topClients` (array) — `[{ user_sub, clientName, call_count }, ...]` sorted
  by `call_count` desc. `user_sub` is the auth0 M2M client ID; `clientName` is
  the resolved human-readable client label (e.g. "API Access for Ali Kalout"),
  or `null` if the script couldn't resolve it. **This is the source for the
  "Top API users" table.**
- `perClientPerMonth` (array) — `[{ month, user_sub, action_type, call_count
}, ...]`. The `user_sub` is an auth0 client identifier, not a human name.
- `monthlyActiveClients` (array) — `[{ month, unique_users }, ...]`. Best
  single chart for the API section: monthly active clients over time.
- `perActionType` (array) — `[{ action_type, total_calls }, ...]`. Useful for
  a 1-sentence callout ("most calls are X").

**How to use this in the HTML:**

- The stat tiles + the `monthlyActiveClients` line chart as before.
- **Top API users:** render a small `.data-table` of the top 20 `topClients`
  by `call_count`, columns Client and Calls. Show `clientName` (strip the
  "API Access for " prefix for readability). When `clientName` is `null`, show
  a truncated/elided sub (e.g. first 8 chars + "…") rather than the full raw
  sub — an unresolved client is fine to label generically.

---

## `rawDataDownloads`

Sourced from `pf_private.pf_geo_place_statistics` where `status='successful'`.
These are downloads of raw climate-statistics files for specific places.

### Fields

- `totalSuccessful` (number)
- `perMonth` (array) — `[{ month, raw_data_downloads }, ...]`.

**Always render this section** (don't drop it): a `.stat-tile` for
`totalSuccessful` plus a small line/bar chart driven by `perMonth`
(`REPORT_DATA.rawDataPerMonth`), and a one-sentence prose summary of the trend.

---

## `adaptationTool`

Sourced from `knowledge.adaptation_sessions`. The app this comes from lives
outside this monorepo, but the `session_data` JSONB shape **is known** and
documented below.

### Fields

- `totalSessions` (number)
- `uniqueUsers` (number) — distinct `username` values. **Render this** as a
  `.stat-tile` (the template has a "Unique users" tile for it).
- `perUser` (array) — `[{ username, session_count, first_session,
last_session, max_step_reached }, ...]` sorted by `session_count` desc. The
  `username` may be an email, an auth0 sub, or some other identifier. **This is
  the source for the "Top adaptation-tool users" table:** render a small
  `.data-table` of the top 20 rows, columns User, Sessions, Furthest step.
  Show `username` as-is (it's an internal report); if it's an obvious raw
  auth0 sub, elide it.
- `perMonth` (array) — `[{ month, session_count }, ...]`.
- `stepDistribution` (array) — `[{ current_step, session_count }, ...]`. This
  is a **rough funnel** showing how far into the flow users typically get.
  Render as a bar chart and call out the drop-off in 1 sentence (e.g., "Half
  of all sessions stall at step 2 before reaching the strategies stage.").
- `rawSessions` (array) — `[{ id, username, current_step, session_data,
created_at, updated_at }, ...]`. **Read 20–40 of the `session_data` blobs**
  to infer common usage patterns. Output 3–5 plain-language **vignettes** in
  `.callout` cards summarizing what users appear to be trying to do (e.g., "A
  Beirut travel agency with 200+ staff planning for very hot days"). Do **not**
  quote the JSONB directly — synthesize. Avoid identifying anyone by
  username/email.

#### `session_data` shape

Each `session_data` describes one business's adaptation-planning session. The
script strips five heavy, low-signal keys before export — `citations` /
`itemCitations` (raw source-document excerpts), `selectedMap` (the full
map-style blob), `datasets` (the candidate-dataset catalog under
`climateConditions`), and `strategies` (the verbose AI-generated strategy
object under `strategyData`) — so you will not see them anywhere in the blob.
The fields you _will_ see, and how to read them for vignettes:

- `businessSector` (string) — e.g. "Tourism and travel agency". The single
  best one-word handle on who the user is.
- `businessDescription` (string) — the user's free-text description of their
  business (size, hours, what they do). Richest source for a vignette.
- `numberOfEmployees` (number|null), `hoursOfOperations` (string|null),
  `businessPriorities` (string) — supporting business profile.
- `facilityLocations` (array) — one entry per location the user analyzed.
  Usually one. Each entry has:
  - `label` (string) — human-readable place, e.g. "بيروت, Beirut, Lebanon".
  - `coordinates` (`[number, number]`) — **`[longitude, latitude]`** (note the
    order). Use for a vignette's geography, not for the report map.
  - `countryCode` (string) — ISO-2, e.g. "LB".
  - `selectedConditions` (string[]) — the climate hazard(s) the user chose to
    focus on, e.g. `["Very hot days"]`. This is the clearest signal of _intent_.
  - `climateConditions` (object) — now just `{ scores }` (the `datasets`
    catalog is stripped). `scores` is `[{ condition, score }, ...]` ranking how
    relevant each hazard is to the location. Useful for a vignette's framing
    ("heat scored highest"), but summarize — don't enumerate.
  - `warmingScenario1` / `warmingScenario2` (number) — the two warming levels
    (°C) compared in the session, e.g. 0.5 and 2.
  - `strategyData` (object|null) — after stripping, this is just
    `{ aiGenerated, timestamp }` (the verbose `strategies` object is removed).
    Treat it as a **presence flag**: a populated `strategyData` means the user
    reached the strategies step and the tool generated a plan; null/absent
    means they stalled earlier.
  - `strategyError` (null|string) — set when strategy generation failed; a
    non-null value is a signal the session hit a problem.
  - `strategyCacheKey` (string) — a colon-delimited key that incidentally
    embeds the sector, the business description, and the selected condition;
    a handy compact summary of the session's intent.

Cross-check `strategyData` presence against `current_step` and
`stepDistribution` to gauge how far the session got.

---

## Things you should NOT do

- Don't invent counts or percentages that aren't in the JSON.
- Don't quote `session_data` JSONB verbatim — synthesize into plain language.
- Don't override the template's CSS, color palette, or component classes —
  the template is the design contract.
- Don't drop the `apiUsage._dataNote` string. It's how the report stays honest
  about the API retention window.
- The "Top users" tables (Pro, API, adaptation) **are meant to show
  names/clients** — this is an internal report. Outside those tables, still
  avoid dumping raw emails, auth0 subs, or the full per-user arrays.
