import { ScanHistory } from "./types";
import { supabase } from "./supabase";

export async function getHistory(): Promise<ScanHistory[]> {
  const { data, error } = await supabase
    .from("scan_history")
    .select("*")
    .order("scannedAt", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch scan history: ${error.message}`);
  }
  return (data || []) as ScanHistory[];
}

export async function saveScan(entry: Omit<ScanHistory, "id" | "scannedAt">): Promise<ScanHistory> {
  const newScan = {
    url: entry.url,
    score: entry.score,
    vulnerabilities: entry.vulnerabilities,
    pagesScanned: entry.pagesScanned,
    findings: entry.findings,
    moduleStatuses: entry.moduleStatuses,
  };

  const { data, error } = await supabase
    .from("scan_history")
    .insert([newScan])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save scan result: ${error.message}`);
  }

  return data as ScanHistory;
}

export async function deleteScan(id: string): Promise<void> {
  const { error } = await supabase
    .from("scan_history")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to delete scan record: ${error.message}`);
  }
}

export async function clearHistory(): Promise<void> {
  const { error } = await supabase
    .from("scan_history")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (error) {
    throw new Error(`Failed to clear scan history: ${error.message}`);
  }
}
