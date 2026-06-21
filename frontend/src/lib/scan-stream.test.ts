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
