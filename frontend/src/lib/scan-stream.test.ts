import assert from "node:assert/strict";
import test from "node:test";

import { encodeScanEvent, parseScanEventBuffer } from "./scan-stream.ts";

test("encodes each scan event as one NDJSON record", () => {
  const encoded = encodeScanEvent({
    type: "update",
    progress: 25,
    message: "Checking headers",
  });

  assert.equal(
    encoded,
    '{"type":"update","progress":25,"message":"Checking headers"}\n',
  );
});

test("parses complete events and preserves an incomplete trailing record", () => {
  const input =
    '{"type":"update","progress":10,"message":"Started"}\n' +
    '{"type":"complete","progress":100';

  const result = parseScanEventBuffer(input);

  assert.deepEqual(result.events, [
    { type: "update", progress: 10, message: "Started" },
  ]);
  assert.equal(result.remainder, '{"type":"complete","progress":100');
});

test("keeps independent response buffers isolated", () => {
  const first = parseScanEventBuffer(
    '{"type":"update","progress":15,"message":"Production"}\n',
  );
  const second = parseScanEventBuffer(
    '{"type":"update","progress":20,"message":"Local"}\n',
  );

  assert.equal(first.events[0]?.message, "Production");
  assert.equal(second.events[0]?.message, "Local");
});

// ---------------------------------------------------------------------------
// encodeScanEvent – additional branches
// ---------------------------------------------------------------------------

test("encodes a complete event with findings and module statuses", () => {
  const encoded = encodeScanEvent({
    type: "complete",
    progress: 100,
    message: "Done",
    score: 85,
    findings: [
      { id: 1, moduleId: "header", type: "Missing CSP", severity: "High" },
    ],
    pagesScanned: 3,
    moduleStatuses: { header: "failed", https: "passed" },
  });

  const parsed = JSON.parse(encoded.trimEnd());
  assert.equal(parsed.type, "complete");
  assert.equal(parsed.progress, 100);
  assert.equal(parsed.score, 85);
  assert.equal(parsed.findings.length, 1);
  assert.equal(parsed.pagesScanned, 3);
});

test("encodes an update event with a moduleUpdate field", () => {
  const encoded = encodeScanEvent({
    type: "update",
    progress: 40,
    message: "Scanning cookies",
    moduleUpdate: { id: "cookie", status: "scanning" },
  });

  const parsed = JSON.parse(encoded.trimEnd());
  assert.equal(parsed.moduleUpdate.id, "cookie");
  assert.equal(parsed.moduleUpdate.status, "scanning");
});

// ---------------------------------------------------------------------------
// parseScanEventBuffer – edge cases
// ---------------------------------------------------------------------------

test("returns empty events array for an empty buffer", () => {
  const result = parseScanEventBuffer("");
  assert.deepEqual(result.events, []);
  assert.equal(result.remainder, "");
});

test("returns empty events when buffer has no newline yet", () => {
  const partial = '{"type":"update","progress":5';
  const result = parseScanEventBuffer(partial);
  assert.deepEqual(result.events, []);
  assert.equal(result.remainder, partial);
});

test("parses multiple complete events in one buffer", () => {
  const input =
    '{"type":"update","progress":10,"message":"A"}\n' +
    '{"type":"update","progress":50,"message":"B"}\n' +
    '{"type":"complete","progress":100,"message":"C","score":90,"findings":[],"pagesScanned":1,"moduleStatuses":{}}\n';

  const result = parseScanEventBuffer(input);

  assert.equal(result.events.length, 3);
  assert.equal(result.events[0].message, "A");
  assert.equal(result.events[1].message, "B");
  assert.equal(result.events[2].type, "complete");
  assert.equal(result.remainder, "");
});

test("skips blank lines between records", () => {
  const input =
    '{"type":"update","progress":10,"message":"X"}\n' +
    "\n" +
    '{"type":"update","progress":20,"message":"Y"}\n';

  const result = parseScanEventBuffer(input);

  assert.equal(result.events.length, 2);
  assert.equal(result.events[0].progress, 10);
  assert.equal(result.events[1].progress, 20);
});

test("round-trips encode then parse for an update event", () => {
  const original = {
    type: "update" as const,
    progress: 60,
    message: "Halfway done",
  };

  const encoded = encodeScanEvent(original);
  const { events } = parseScanEventBuffer(encoded);

  assert.equal(events.length, 1);
  assert.deepEqual(events[0], original);
});

test("round-trips encode then parse for a complete event", () => {
  const original = {
    type: "complete" as const,
    progress: 100 as const,
    message: "Finished",
    score: 70,
    findings: [
      { id: 1, moduleId: "sql", type: "SQL Injection", severity: "High" },
      { id: 2, moduleId: "xss", type: "Reflected XSS", severity: "Medium" },
    ],
    pagesScanned: 5,
    moduleStatuses: { sql: "failed", xss: "failed", jwt: "passed" },
  };

  const encoded = encodeScanEvent(original);
  const { events } = parseScanEventBuffer(encoded);

  assert.equal(events.length, 1);
  assert.deepEqual(events[0], original);
});
