import assert from "node:assert/strict";
import test from "node:test";

import { SCAN_MODULES, getSuccessExplanation } from "./constants.ts";

// ---------------------------------------------------------------------------
// SCAN_MODULES
// ---------------------------------------------------------------------------

test("SCAN_MODULES contains exactly 12 modules", () => {
  assert.equal(SCAN_MODULES.length, 12);
});

test("every module has a non-empty id, name, and description", () => {
  for (const mod of SCAN_MODULES) {
    assert.ok(mod.id.length > 0, `module id should be non-empty`);
    assert.ok(mod.name.length > 0, `module name should be non-empty`);
    assert.ok(mod.description.length > 0, `module description should be non-empty`);
  }
});

test("module ids are unique", () => {
  const ids = SCAN_MODULES.map((m) => m.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("every module exposes an icon component", () => {
  for (const mod of SCAN_MODULES) {
    assert.ok(mod.icon != null, `${mod.id} icon should be defined`);
  }
});

// ---------------------------------------------------------------------------
// getSuccessExplanation – per-module branches
// ---------------------------------------------------------------------------

const MODULE_IDS = [
  "sql",
  "xss",
  "jwt",
  "csrf",
  "api",
  "cookie",
  "header",
  "https",
  "server",
  "crawl",
  "config",
  "admin",
];

for (const id of MODULE_IDS) {
  test(`getSuccessExplanation returns a non-empty string for "${id}"`, () => {
    const result = getSuccessExplanation(id);
    assert.equal(typeof result, "string");
    assert.ok(result.length > 0);
  });
}

test("getSuccessExplanation returns default message for unknown id", () => {
  const result = getSuccessExplanation("unknown_module");
  assert.equal(
    result,
    "Sistem memvalidasi modul ini dengan sukses. Tidak ada anomali atau celah keamanan yang terdeteksi.",
  );
});

test("every SCAN_MODULES id has a dedicated getSuccessExplanation branch", () => {
  const defaultText = getSuccessExplanation("__does_not_exist__");
  for (const mod of SCAN_MODULES) {
    const explanation = getSuccessExplanation(mod.id);
    assert.notEqual(
      explanation,
      defaultText,
      `${mod.id} should have a dedicated explanation, not the default`,
    );
  }
});
