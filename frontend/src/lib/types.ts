export interface ScanFinding {
  id: number;
  moduleId: string;
  type: string;
  severity: string;
}

export interface ScanHistory {
  id: string;
  url: string;
  score: number;
  vulnerabilities: number;
  pagesScanned: number;
  findings: ScanFinding[];
  moduleStatuses: Record<string, string>;
  scannedAt: string;
}
