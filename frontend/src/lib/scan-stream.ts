export type ScanFinding = {
  id: number;
  moduleId: string;
  type: string;
  severity: string;
};

export type ScanModuleUpdate = {
  id: string;
  status: string;
};

export type ScanEvent =
  | {
      type: "update";
      progress: number;
      message: string;
      moduleUpdate?: ScanModuleUpdate;
    }
  | {
      type: "complete";
      progress: 100;
      message: string;
      score: number;
      findings: ScanFinding[];
      pagesScanned: number;
      moduleStatuses: Record<string, string>;
    };

export function encodeScanEvent(event: ScanEvent): string {
  return `${JSON.stringify(event)}\n`;
}

export function parseScanEventBuffer(buffer: string): {
  events: ScanEvent[];
  remainder: string;
} {
  const records = buffer.split("\n");
  const remainder = records.pop() ?? "";
  const events: ScanEvent[] = [];

  for (const record of records) {
    if (record.trim().length === 0) continue;
    try {
      events.push(JSON.parse(record) as ScanEvent);
    } catch (error: unknown) {
      const detail = error instanceof Error ? error.message : "Unknown parse error";
      console.error(`[scan-stream] Failed to parse NDJSON record: ${detail}`, record);
    }
  }

  return { events, remainder };
}
