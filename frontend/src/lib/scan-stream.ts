import type { ScanFinding } from "./types";

export type { ScanFinding };

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
  const events = records
    .filter((record) => record.trim().length > 0)
    .map((record) => JSON.parse(record) as ScanEvent);

  return { events, remainder };
}
