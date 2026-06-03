/*
 * Generate a JSON report of PF data-users.
 *
 * Pulls form-submission data (pf_user_access_requests) and PF Pro / API / raw-data
 * activity, emitting a single sectioned JSON file. Qualitative analysis (notable
 * orgs, themes, quote selection, for-profit/NGO classification, geocoding) is
 * deferred to a downstream LLM/HTML step — this script only produces deterministic
 * aggregations and raw rows.
 *
 * RUN: yarn workspace @probable-futures/api generate-data-users-report -- --output=/tmp/report.json
 * Optional flags:
 *   --since=YYYY-MM-DD   filter created_at >= this date
 *   --until=YYYY-MM-DD   filter created_at <= this date (inclusive — interpreted as end-of-day)
 *   --output=<path>      output JSON path (default: ./pf-data-users-report-<timestamp>.json)
 */

import * as fs from "fs";
import * as path from "path";

import { Pool } from "pg";
import fetch from "node-fetch";

import * as env from "../utils/env";
import * as constants from "../utils/constants";
import { FormFields, formFieldsNameIdMapProd } from "../utils/form";

// Build our own owner-role pool here rather than importing rootPgPool from
// ../database, because that module also auto-connects a Redis client at import
// time and the retry loop keeps the process alive (and spams logs) when Redis
// isn't reachable locally. This script only needs Postgres.
const rootPgPool = new Pool({
  host: env.DATABASE_HOST,
  port: env.DATABASE_PORT,
  database: env.DATABASE_NAME,
  user: env.DB_OWNER_ROLE,
  password: env.DB_OWNER_ROLE_PASSWORD,
  application_name: "generate-data-users-report",
  ssl: env.isLocal ? false : { ca: fs.readFileSync(constants.rdsRootCA).toString() },
});

rootPgPool.on("error", (e) => console.error("pg pool error:", e));

type Args = {
  since?: string;
  until?: string;
  outputPath: string;
};

function parseArgs(): Args {
  const args: Args = { outputPath: "" };
  for (const raw of process.argv.slice(2)) {
    const eq = raw.indexOf("=");
    const k = eq === -1 ? raw : raw.slice(0, eq);
    const v = eq === -1 ? "" : raw.slice(eq + 1);
    if (k === "--since") args.since = v;
    else if (k === "--until") args.until = v;
    else if (k === "--output") args.outputPath = v;
  }
  if (!args.outputPath) {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    args.outputPath = path.resolve(process.cwd(), `pf-data-users-report-${stamp}.json`);
  }
  for (const d of [args.since, args.until]) {
    if (d && !/^\d{4}-\d{2}-\d{2}$/.test(d)) {
      throw new Error(`Invalid date: ${d} (expected YYYY-MM-DD)`);
    }
  }
  return args;
}

function buildDateFilter(
  column: string,
  since: string | undefined,
  until: string | undefined,
  paramOffset = 0,
): { clause: string; params: string[]; nextOffset: number } {
  const params: string[] = [];
  const conds: string[] = [];
  if (since) {
    params.push(since);
    conds.push(`${column} >= $${paramOffset + params.length}::timestamptz`);
  }
  if (until) {
    params.push(until);
    conds.push(`${column} < ($${paramOffset + params.length}::timestamptz + interval '1 day')`);
  }
  return {
    clause: conds.length ? `WHERE ${conds.join(" AND ")}` : "",
    params,
    nextOffset: paramOffset + params.length,
  };
}

const F = {
  firstName: formFieldsNameIdMapProd[FormFields.FirstName],
  lastName: formFieldsNameIdMapProd[FormFields.LastName],
  email: formFieldsNameIdMapProd[FormFields.Email],
  title: formFieldsNameIdMapProd[FormFields.Title],
  company: formFieldsNameIdMapProd[FormFields.Company],
  location: formFieldsNameIdMapProd[FormFields.Location],
  usingPFToolsFor: formFieldsNameIdMapProd[FormFields.UsingPFToolsFor],
  howDidYouFindUs: formFieldsNameIdMapProd[FormFields.HowDidYouFindUs],
  anythingElse: formFieldsNameIdMapProd[FormFields.AnythingElse],
  whatWouldYouLikeToUse: formFieldsNameIdMapProd[FormFields.WhatWouldYouLikeToUse],
  emailList: formFieldsNameIdMapProd[FormFields.EmailList],
  pfPro: formFieldsNameIdMapProd[FormFields.PfPro],
  pfApi: formFieldsNameIdMapProd[FormFields.PfApi],
  pfRawData: formFieldsNameIdMapProd[FormFields.PfRawData],
  customizableMaps: formFieldsNameIdMapProd[FormFields.CustomizableMaps],
};

type SubmissionRow = {
  id: string;
  email: string | null;
  created_at: Date;
  first_name: string | null;
  last_name: string | null;
  title: string | null;
  company: string | null;
  location: string | null;
  using_pf_tools_for: string | null;
  how_did_you_find_us: string | null;
  anything_else: string | null;
  what_would_you_like_to_use: Array<{ id?: string; name?: string }> | null;
  email_list_raw: { name?: string; value?: unknown } | null;
};

const norm = (s: string | null | undefined): string => (s ?? "").trim();
const monthKey = (d: Date): string => {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
};

function bump<K>(map: Map<K, number>, key: K, by = 1): void {
  map.set(key, (map.get(key) ?? 0) + by);
}

function sortedCounts<K extends string>(
  map: Map<string, number>,
  labelKey: K,
): Array<Record<K | "count", string | number>> {
  return [...map.entries()]
    .filter(([k]) => k.length > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([k, v]) => ({ [labelKey]: k, count: v } as Record<K | "count", string | number>));
}

async function buildFormSubmissionsSection(args: Args) {
  const { clause, params } = buildDateFilter("created_at", args.since, args.until);
  const sql = `
    SELECT
      id, email, created_at,
      form_fields -> '${F.firstName}' ->> 'value' AS first_name,
      form_fields -> '${F.lastName}'  ->> 'value' AS last_name,
      form_fields -> '${F.title}'     ->> 'value' AS title,
      form_fields -> '${F.company}'   ->> 'value' AS company,
      form_fields -> '${F.location}'  ->> 'value' AS location,
      form_fields -> '${F.usingPFToolsFor}' ->> 'value' AS using_pf_tools_for,
      form_fields -> '${F.howDidYouFindUs}' ->> 'value' AS how_did_you_find_us,
      form_fields -> '${F.anythingElse}'    ->> 'value' AS anything_else,
      form_fields -> '${F.whatWouldYouLikeToUse}' -> 'value' AS what_would_you_like_to_use,
      form_fields -> '${F.emailList}'                  AS email_list_raw
    FROM pf_private.pf_user_access_requests
    ${clause}
    ORDER BY created_at DESC
  `;
  const { rows } = await rootPgPool.query<SubmissionRow>(sql, params);

  const submissionsPerMonth = new Map<string, number>();
  const titles = new Map<string, number>();
  const locations = new Map<string, number>();
  const howFoundUsCounts = new Map<string, number>();
  const howFoundUsRaw: Array<Record<string, unknown>> = [];
  const usingPFToolsForRaw: Array<Record<string, unknown>> = [];
  const anythingElseRaw: Array<Record<string, unknown>> = [];

  type OrgAgg = {
    company: string;
    submissionCount: number;
    emails: Set<string>;
    titles: Set<string>;
    locations: Set<string>;
  };
  const orgs = new Map<string, OrgAgg>();

  let optedIn = 0;
  let optedOut = 0;
  const resourceCounts = { pfPro: 0, pfApi: 0, pfRawData: 0, customizableMaps: 0 };
  let totalSelections = 0;
  let totalSubmissionsWithAtLeastOne = 0;

  for (const r of rows) {
    bump(submissionsPerMonth, monthKey(new Date(r.created_at)));

    const company = norm(r.company);
    const title = norm(r.title);
    const location = norm(r.location);
    const email = norm(r.email);
    const submittedAt = new Date(r.created_at).toISOString();

    if (title) bump(titles, title);
    if (location) bump(locations, location);

    if (company) {
      const key = company.toLowerCase();
      let agg = orgs.get(key);
      if (!agg) {
        agg = {
          company,
          submissionCount: 0,
          emails: new Set(),
          titles: new Set(),
          locations: new Set(),
        };
        orgs.set(key, agg);
      }
      agg.submissionCount += 1;
      if (email) agg.emails.add(email);
      if (title) agg.titles.add(title);
      if (location) agg.locations.add(location);
    }

    const howFound = norm(r.how_did_you_find_us);
    if (howFound) {
      bump(howFoundUsCounts, howFound);
      howFoundUsRaw.push({ answer: howFound, email, company, submittedAt });
    }

    const usingFor = norm(r.using_pf_tools_for);
    if (usingFor) {
      usingPFToolsForRaw.push({ answer: usingFor, email, company, title, submittedAt });
    }

    const anyElse = norm(r.anything_else);
    if (anyElse) {
      anythingElseRaw.push({ answer: anyElse, email, company, title, submittedAt });
    }

    const want = Array.isArray(r.what_would_you_like_to_use) ? r.what_would_you_like_to_use : [];
    let hadAny = false;
    for (const sel of want) {
      const id = sel?.id;
      if (!id) continue;
      hadAny = true;
      totalSelections += 1;
      if (id === F.pfPro) resourceCounts.pfPro += 1;
      else if (id === F.pfApi) resourceCounts.pfApi += 1;
      else if (id === F.pfRawData) resourceCounts.pfRawData += 1;
      else if (id === F.customizableMaps) resourceCounts.customizableMaps += 1;
    }
    if (hadAny) totalSubmissionsWithAtLeastOne += 1;

    const emailListValue = r.email_list_raw?.value;
    const optInLabel = "Yes, please sign me up.";
    const isOptIn =
      typeof emailListValue === "string"
        ? emailListValue === optInLabel
        : (emailListValue as { name?: string } | null)?.name === optInLabel;
    if (isOptIn) optedIn += 1;
    else if (emailListValue !== undefined && emailListValue !== null) optedOut += 1;
  }

  const orgsRows = [...orgs.values()]
    .sort((a, b) => b.submissionCount - a.submissionCount || a.company.localeCompare(b.company))
    .map((o) => ({
      company: o.company,
      submissionCount: o.submissionCount,
      emails: [...o.emails],
      titles: [...o.titles],
      locations: [...o.locations],
    }));

  const total = rows.length;
  const totalWithEmailListAnswer = optedIn + optedOut;

  return {
    total,
    submissionsPerMonth: [...submissionsPerMonth.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, count]) => ({ month, count })),
    orgs: {
      totalUnique: orgsRows.length,
      rows: orgsRows,
    },
    titles: { rows: sortedCounts(titles, "title") },
    locations: { rows: sortedCounts(locations, "location") },
    howFoundUs: {
      counts: sortedCounts(howFoundUsCounts, "answer"),
      rawRows: howFoundUsRaw,
    },
    useCases: {
      usingPFToolsForRaw,
      anythingElseRaw,
    },
    emailOptIn: {
      optedIn,
      optedOut,
      totalWithAnswer: totalWithEmailListAnswer,
      percentageOptedIn:
        totalWithEmailListAnswer > 0
          ? Math.round((optedIn / totalWithEmailListAnswer) * 10000) / 100
          : 0,
    },
    dataResourceBreakdown: {
      ...resourceCounts,
      totalSelections,
      totalSubmissionsWithAtLeastOne,
    },
  };
}

async function buildProUsageSection(args: Args) {
  const projectsFilter = buildDateFilter("pp.created_at", args.since, args.until);
  const projectsPerUser = await rootPgPool.query(
    `
    SELECT u.email, u.name,
           COUNT(pp.id)::int        AS project_count,
           MIN(pp.created_at)       AS first_project_created,
           MAX(pp.created_at)       AS last_project_created
    FROM pf_private.pf_partner_projects pp
    JOIN pf_private.pf_users u ON pp.partner_id = u.id
    ${projectsFilter.clause}
    GROUP BY u.email, u.name
    ORDER BY project_count DESC
    `,
    projectsFilter.params,
  );

  const projectsMonthFilter = buildDateFilter("created_at", args.since, args.until);
  const projectsPerMonth = await rootPgPool.query(
    `
    SELECT DATE_TRUNC('month', created_at) AS month, COUNT(*)::int AS projects_created
    FROM pf_private.pf_partner_projects
    ${projectsMonthFilter.clause}
    GROUP BY month
    ORDER BY month
    `,
    projectsMonthFilter.params,
  );

  const uploadsFilter = buildDateFilter("pdu.created_at", args.since, args.until);
  const uploadsPerUser = await rootPgPool.query(
    `
    SELECT u.email, u.name,
           COUNT(pdu.id)::int       AS uploads_count,
           MIN(pdu.created_at)      AS first_upload,
           MAX(pdu.created_at)      AS last_upload
    FROM pf_private.pf_partner_dataset_uploads pdu
    JOIN pf_private.pf_partner_datasets pd ON pdu.partner_dataset_id = pd.id
    JOIN pf_private.pf_users u ON pd.partner_id = u.id
    ${uploadsFilter.clause}
    GROUP BY u.email, u.name
    ORDER BY uploads_count DESC
    `,
    uploadsFilter.params,
  );

  const uploadsMonthFilter = buildDateFilter("created_at", args.since, args.until);
  const uploadsPerMonth = await rootPgPool.query(
    `
    SELECT DATE_TRUNC('month', created_at) AS month, COUNT(*)::int AS datasets_uploaded
    FROM pf_private.pf_partner_dataset_uploads
    ${uploadsMonthFilter.clause}
    GROUP BY month
    ORDER BY month
    `,
    uploadsMonthFilter.params,
  );

  const enrichmentsFilter = buildDateFilter("pde.created_at", args.since, args.until);
  const successCond = enrichmentsFilter.clause
    ? `${enrichmentsFilter.clause} AND pde.status = 'successful'`
    : "WHERE pde.status = 'successful'";
  const enrichmentsPerUser = await rootPgPool.query(
    `
    SELECT u.email, u.name, COUNT(pde.id)::int AS enrichment_count
    FROM pf_private.pf_partner_dataset_enrichments pde
    JOIN pf_private.pf_users u ON pde.partner_id = u.id
    ${successCond}
    GROUP BY u.email, u.name
    ORDER BY enrichment_count DESC
    `,
    enrichmentsFilter.params,
  );

  const datasetsListFilter = buildDateFilter("d.created_at", args.since, args.until);
  const datasetsListWhere = datasetsListFilter.clause
    ? `${datasetsListFilter.clause} AND d.is_example IS DISTINCT FROM TRUE`
    : `WHERE d.is_example IS DISTINCT FROM TRUE`;
  const datasetsList = await rootPgPool.query(
    `
    SELECT d.name        AS dataset_name,
           u.name        AS user_name,
           u.email       AS user_email,
           du.original_file,
           d.created_at  AS uploaded_at
    FROM pf_private.pf_partner_datasets d
    JOIN pf_private.pf_users u ON u.id = d.partner_id
    JOIN pf_private.pf_partner_dataset_uploads du ON du.partner_dataset_id = d.id
    ${datasetsListWhere}
    ORDER BY d.created_at DESC
    `,
    datasetsListFilter.params,
  );

  const projectsTotals = projectsPerUser.rows.reduce(
    (acc, r) => ({
      totalProjects: acc.totalProjects + Number(r.project_count),
      uniqueUsers: acc.uniqueUsers + 1,
    }),
    { totalProjects: 0, uniqueUsers: 0 },
  );

  const uploadsTotals = uploadsPerUser.rows.reduce(
    (acc, r) => ({
      totalUploads: acc.totalUploads + Number(r.uploads_count),
      uniqueUsers: acc.uniqueUsers + 1,
    }),
    { totalUploads: 0, uniqueUsers: 0 },
  );

  const enrichmentsTotal = enrichmentsPerUser.rows.reduce(
    (acc, r) => acc + Number(r.enrichment_count),
    0,
  );

  return {
    projects: {
      totalProjects: projectsTotals.totalProjects,
      uniqueUsers: projectsTotals.uniqueUsers,
      perUser: projectsPerUser.rows,
      perMonth: projectsPerMonth.rows,
    },
    datasetUploads: {
      totalUploads: uploadsTotals.totalUploads,
      uniqueUsers: uploadsTotals.uniqueUsers,
      perUser: uploadsPerUser.rows,
      perMonth: uploadsPerMonth.rows,
    },
    datasetEnrichments: {
      totalSuccessful: enrichmentsTotal,
      perUser: enrichmentsPerUser.rows,
    },
    datasetsList: datasetsList.rows,
  };
}

// API `user_sub` values are Auth0 M2M client IDs, not human identifiers. This
// resolves them to the client's human-readable name (e.g. "API Access for Ali
// Kalout") via the Auth0 Management API so the report can show who's behind the
// traffic. Best-effort: on any failure it returns an empty map and callers fall
// back to the raw sub. Mirrors the auth flow in deleteInactiveAuth0Clients.ts.
async function fetchAuth0ClientNames(): Promise<Map<string, string>> {
  const names = new Map<string, string>();
  const domain = `https://${env.AUTH0_DOMAIN}`;
  try {
    const tokenRes = await fetch(`${domain}/oauth/token`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        client_id: env.AUTH_MANAGEMENT_CLIENT_ID,
        client_secret: env.AUTH_MANAGEMENT_CLIENT_SECRET,
        audience: `${domain}/api/v2/`,
        grant_type: "client_credentials",
      }),
    });
    if (!tokenRes.ok) {
      console.warn(
        `auth0: could not get management token (${tokenRes.status}); API users will show raw subs.`,
      );
      return names;
    }
    const { access_token } = (await tokenRes.json()) as { access_token: string };

    // /api/v2/clients is paginated (50/page by default); page until exhausted.
    const perPage = 100;
    for (let page = 0; ; page += 1) {
      const res = await fetch(
        `${domain}/api/v2/clients?fields=client_id,name&include_fields=true&per_page=${perPage}&page=${page}`,
        { headers: { Authorization: `Bearer ${access_token}` } },
      );
      if (!res.ok) {
        console.warn(`auth0: listing clients failed (${res.status}); some subs may be unresolved.`);
        break;
      }
      const clients = (await res.json()) as Array<{ client_id?: string; name?: string }>;
      if (!Array.isArray(clients) || clients.length === 0) break;
      for (const c of clients) {
        if (c.client_id && c.name) names.set(c.client_id, c.name);
      }
      if (clients.length < perPage) break;
    }
  } catch (e) {
    console.warn("auth0: client-name lookup failed; API users will show raw subs.", e);
  }
  return names;
}

async function buildApiUsageSection(args: Args, clientNames: Map<string, string>) {
  const f1 = buildDateFilter("created_at", args.since, args.until);
  const perClientPerMonth = await rootPgPool.query(
    `
    SELECT DATE_TRUNC('month', created_at) AS month,
           user_sub,
           action_type,
           COUNT(*)::int AS call_count
    FROM pf_private.pf_audit
    ${f1.clause}
    GROUP BY month, user_sub, action_type
    ORDER BY month, call_count DESC
    `,
    f1.params,
  );

  const f2 = buildDateFilter("created_at", args.since, args.until);
  const monthlyActiveClients = await rootPgPool.query(
    `
    SELECT DATE_TRUNC('month', created_at) AS month,
           COUNT(DISTINCT user_sub)::int AS unique_users
    FROM pf_private.pf_audit
    ${f2.clause}
    GROUP BY month
    ORDER BY month
    `,
    f2.params,
  );

  const f3 = buildDateFilter("created_at", args.since, args.until);
  const perActionType = await rootPgPool.query(
    `
    SELECT action_type, COUNT(*)::int AS total_calls
    FROM pf_private.pf_audit
    ${f3.clause}
    GROUP BY action_type
    ORDER BY total_calls DESC
    `,
    f3.params,
  );

  const f4 = buildDateFilter("created_at", args.since, args.until);
  const totalsRes = await rootPgPool.query(
    `
    SELECT COUNT(*)::int AS total_calls,
           COUNT(DISTINCT user_sub)::int AS unique_clients
    FROM pf_private.pf_audit
    ${f4.clause}
    `,
    f4.params,
  );

  const f5 = buildDateFilter("created_at", args.since, args.until);
  const perClient = await rootPgPool.query<{ user_sub: string; call_count: number }>(
    `
    SELECT user_sub, COUNT(*)::int AS call_count
    FROM pf_private.pf_audit
    ${f5.clause}
    GROUP BY user_sub
    ORDER BY call_count DESC
    `,
    f5.params,
  );

  // Resolve each client's Auth0 name; fall back to null so the LLM can decide
  // whether to show the raw sub. `clientName` is the "API Access for <Name>" label.
  // pf_audit stores M2M subs as `<client_id>@clients`, but the Management API
  // returns the bare `client_id`, so strip the suffix before looking up.
  const topClients = perClient.rows.map((r) => {
    const clientId = r.user_sub.replace(/@clients$/, "");
    return {
      user_sub: r.user_sub,
      clientName: clientNames.get(clientId) ?? clientNames.get(r.user_sub) ?? null,
      call_count: r.call_count,
    };
  });

  return {
    _dataNote:
      "pf_audit rows are auto-deleted after ~180 days, so API usage counts only reflect the last ~6 months regardless of --since.",
    totalCalls: totalsRes.rows[0]?.total_calls ?? 0,
    uniqueClients: totalsRes.rows[0]?.unique_clients ?? 0,
    topClients,
    perClientPerMonth: perClientPerMonth.rows,
    monthlyActiveClients: monthlyActiveClients.rows,
    perActionType: perActionType.rows,
  };
}

async function buildRawDataDownloadsSection(args: Args) {
  const filter = buildDateFilter("created_at", args.since, args.until);
  const successCond = filter.clause
    ? `${filter.clause} AND status = 'successful'`
    : `WHERE status = 'successful'`;
  const perMonth = await rootPgPool.query(
    `
    SELECT DATE_TRUNC('month', created_at) AS month, COUNT(*)::int AS raw_data_downloads
    FROM pf_private.pf_geo_place_statistics
    ${successCond}
    GROUP BY month
    ORDER BY month
    `,
    filter.params,
  );

  const totals = await rootPgPool.query(
    `
    SELECT COUNT(*)::int AS total_successful
    FROM pf_private.pf_geo_place_statistics
    ${successCond}
    `,
    filter.params,
  );

  return {
    totalSuccessful: totals.rows[0]?.total_successful ?? 0,
    perMonth: perMonth.rows,
  };
}

// Keys stripped from each adaptation session_data blob before it lands in the
// report. They carry heavy, low-signal payloads that bloat the file ~10x and
// aren't useful to the downstream LLM: `citations` / `itemCitations` are the
// raw source-document excerpts behind AI strategies, `selectedMap` is the full
// map-style blob for the chosen map, `datasets` is the candidate-dataset
// catalog under climateConditions, and `strategies` is the verbose
// AI-generated strategy object nested under each facilityLocations[].strategyData.
const SESSION_DATA_OMIT_KEYS = new Set([
  "citations",
  "itemCitations",
  "selectedMap",
  "datasets",
  "strategies",
]);

// Recursively drop SESSION_DATA_OMIT_KEYS wherever they appear in the JSONB,
// regardless of nesting depth.
function stripSessionData(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripSessionData);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (SESSION_DATA_OMIT_KEYS.has(k)) continue;
      out[k] = stripSessionData(v);
    }
    return out;
  }
  return value;
}

async function buildAdaptationToolSection(args: Args) {
  const f1 = buildDateFilter("created_at", args.since, args.until);
  const perUser = await rootPgPool.query(
    `
    SELECT username,
           COUNT(*)::int          AS session_count,
           MIN(created_at)        AS first_session,
           MAX(updated_at)        AS last_session,
           MAX(current_step)::int AS max_step_reached
    FROM knowledge.adaptation_sessions
    ${f1.clause}
    GROUP BY username
    ORDER BY session_count DESC
    `,
    f1.params,
  );

  const f2 = buildDateFilter("created_at", args.since, args.until);
  const perMonth = await rootPgPool.query(
    `
    SELECT DATE_TRUNC('month', created_at) AS month, COUNT(*)::int AS session_count
    FROM knowledge.adaptation_sessions
    ${f2.clause}
    GROUP BY month
    ORDER BY month
    `,
    f2.params,
  );

  const f3 = buildDateFilter("created_at", args.since, args.until);
  const stepDistribution = await rootPgPool.query(
    `
    SELECT current_step, COUNT(*)::int AS session_count
    FROM knowledge.adaptation_sessions
    ${f3.clause}
    GROUP BY current_step
    ORDER BY current_step
    `,
    f3.params,
  );

  const f4 = buildDateFilter("created_at", args.since, args.until);
  const rawSessions = await rootPgPool.query(
    `
    SELECT id, username, current_step, session_data, created_at, updated_at
    FROM knowledge.adaptation_sessions
    ${f4.clause}
    ORDER BY updated_at DESC
    `,
    f4.params,
  );

  const totals = perUser.rows.reduce(
    (acc, r) => ({
      totalSessions: acc.totalSessions + Number(r.session_count),
      uniqueUsers: acc.uniqueUsers + 1,
    }),
    { totalSessions: 0, uniqueUsers: 0 },
  );

  const rawSessionsRows = rawSessions.rows.map((r) => ({
    ...r,
    session_data: stripSessionData(r.session_data),
  }));

  return {
    totalSessions: totals.totalSessions,
    uniqueUsers: totals.uniqueUsers,
    perUser: perUser.rows,
    perMonth: perMonth.rows,
    stepDistribution: stepDistribution.rows,
    rawSessions: rawSessionsRows,
  };
}

async function buildUserActivitySummary(args: Args) {
  const projectsF = buildDateFilter("pp.created_at", args.since, args.until);
  const uploadsF = buildDateFilter("pdu.created_at", args.since, args.until, projectsF.nextOffset);
  const enrichF = buildDateFilter("pde.created_at", args.since, args.until, uploadsF.nextOffset);
  const enrichClause = enrichF.clause
    ? `${enrichF.clause} AND pde.status = 'successful'`
    : `WHERE pde.status = 'successful'`;

  const sql = `
    WITH project_stats AS (
      SELECT u.id, u.email, u.name,
             COUNT(pp.id)::int  AS project_count,
             MIN(pp.created_at) AS first_project_created,
             MAX(pp.created_at) AS last_project_created
      FROM pf_private.pf_partner_projects pp
      JOIN pf_private.pf_users u ON pp.partner_id = u.id
      ${projectsF.clause}
      GROUP BY u.id, u.email, u.name
    ),
    upload_stats AS (
      SELECT u.id,
             COUNT(pdu.id)::int  AS uploads_count,
             MIN(pdu.created_at) AS first_upload,
             MAX(pdu.created_at) AS last_upload
      FROM pf_private.pf_partner_dataset_uploads pdu
      JOIN pf_private.pf_partner_datasets pd ON pdu.partner_dataset_id = pd.id
      JOIN pf_private.pf_users u ON pd.partner_id = u.id
      ${uploadsF.clause}
      GROUP BY u.id
    ),
    enrichment_stats AS (
      SELECT u.id, COUNT(pde.id)::int AS enrichment_count
      FROM pf_private.pf_partner_dataset_enrichments pde
      JOIN pf_private.pf_users u ON pde.partner_id = u.id
      ${enrichClause}
      GROUP BY u.id
    )
    SELECT u.email, u.name,
           COALESCE(ps.project_count, 0)   AS project_count,
           ps.first_project_created,
           ps.last_project_created,
           COALESCE(us.uploads_count, 0)   AS uploads_count,
           us.first_upload,
           us.last_upload,
           COALESCE(es.enrichment_count, 0) AS enrichment_count
    FROM pf_private.pf_users u
    LEFT JOIN project_stats    ps ON u.id = ps.id
    LEFT JOIN upload_stats     us ON u.id = us.id
    LEFT JOIN enrichment_stats es ON u.id = es.id
    WHERE ps.project_count IS NOT NULL
       OR us.uploads_count IS NOT NULL
       OR es.enrichment_count IS NOT NULL
    ORDER BY project_count DESC
  `;
  const params = [...projectsF.params, ...uploadsF.params, ...enrichF.params];
  const { rows } = await rootPgPool.query(sql, params);
  return rows;
}

async function main() {
  const args = parseArgs();
  console.log(`Generating data-users report → ${args.outputPath}`);
  if (args.since || args.until) {
    console.log(`Window: since=${args.since ?? "(none)"}  until=${args.until ?? "(none)"}`);
  }

  // Resolve Auth0 client names up front so the API section can attribute traffic.
  const clientNames = await fetchAuth0ClientNames();

  // userActivitySummary is a per-user roll-up of Pro activity, so it belongs
  // under proUsage rather than as a sibling top-level section.
  const proUsage = {
    ...(await buildProUsageSection(args)),
    userActivitySummary: await buildUserActivitySummary(args),
  };

  const report = {
    generatedAt: new Date().toISOString(),
    window: { since: args.since ?? null, until: args.until ?? null },
    formSubmissions: await buildFormSubmissionsSection(args),
    proUsage,
    apiUsage: await buildApiUsageSection(args, clientNames),
    rawDataDownloads: await buildRawDataDownloadsSection(args),
    adaptationTool: await buildAdaptationToolSection(args),
  };

  fs.writeFileSync(args.outputPath, JSON.stringify(report, null, 2));
  console.log(
    `Wrote report (${report.formSubmissions.total} form submissions, ${report.proUsage.userActivitySummary.length} active pro users, ${report.adaptationTool.totalSessions} adaptation-tool sessions).`,
  );
}

main()
  .catch((err) => {
    console.error("Failed to generate report:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await rootPgPool.end();
    } catch {}
  });
