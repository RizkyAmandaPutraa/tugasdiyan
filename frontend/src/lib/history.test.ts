import assert from "node:assert/strict";
import test from "node:test";

import { getHistory, saveScan, deleteScan, clearHistory } from "./history.ts";

// ---------------------------------------------------------------------------
// When Supabase env vars are not configured (as in CI / test), every exported
// function must degrade gracefully — returning empty results / null and never
// throwing.  These tests verify that error-handling contract.
// ---------------------------------------------------------------------------

// -- getHistory --------------------------------------------------------------

test("getHistory returns an empty array when Supabase is unavailable", async () => {
  const result = await getHistory();
  assert.ok(Array.isArray(result), "result should be an array");
  assert.equal(result.length, 0);
});

// -- saveScan ----------------------------------------------------------------

test("saveScan returns null when Supabase is unavailable", async () => {
  const result = await saveScan({
    url: "https://example.com",
    score: 85,
    vulnerabilities: 1,
    pagesScanned: 3,
    findings: [
      { id: 1, moduleId: "header", type: "Missing CSP", severity: "High" },
    ],
    moduleStatuses: { header: "failed", https: "passed" },
  });

  assert.equal(result, null);
});

// -- deleteScan --------------------------------------------------------------

test("deleteScan does not throw when Supabase is unavailable", async () => {
  await assert.doesNotReject(() => deleteScan("nonexistent-id"));
});

// -- clearHistory ------------------------------------------------------------

test("clearHistory does not throw when Supabase is unavailable", async () => {
  await assert.doesNotReject(() => clearHistory());
});
