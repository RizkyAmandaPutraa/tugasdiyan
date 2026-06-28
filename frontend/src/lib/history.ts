import type { ScanHistory } from "./types.ts";
import { supabase } from "./supabase.ts";

export async function getHistory(): Promise<ScanHistory[]> {
  try {
    const { data, error } = await supabase
      .from("scan_history")
      .select("*")
      .order("scannedAt", { ascending: false });

    if (error) {
      console.warn("Error fetching history from Supabase:", JSON.stringify(error));
      return [];
    }
    return (data || []) as ScanHistory[];
  } catch (err) {
    console.error("Failed to get history:", err);
    return [];
  }
}

export async function saveScan(entry: Omit<ScanHistory, "id" | "scannedAt">): Promise<ScanHistory | null> {
  const newScan = {
    url: entry.url,
    score: entry.score,
    vulnerabilities: entry.vulnerabilities,
    pagesScanned: entry.pagesScanned,
    findings: entry.findings,
    moduleStatuses: entry.moduleStatuses,
  };

  try {
    const { data, error } = await supabase
      .from("scan_history")
      .insert([newScan])
      .select()
      .single();

    if (error) {
      console.warn("Error saving scan to Supabase:", JSON.stringify(error));
      return null;
    }
    
    // We also implement limit keeping via a rpc or edge function if needed, 
    // but for now Supabase DB can hold more than 50 easily.
    return data as ScanHistory;
  } catch (err) {
    console.warn("Failed to save scan:", err);
    return null;
  }
}

export async function deleteScan(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from("scan_history")
      .delete()
      .eq("id", id);
      
    if (error) {
      console.warn("Error deleting scan from Supabase:", JSON.stringify(error));
    }
  } catch (err) {
    console.warn("Failed to delete scan:", err);
  }
}

export async function clearHistory(): Promise<void> {
  try {
    // Delete all records. Note: RLS policies might require specific setup to allow bulk delete.
    const { error } = await supabase
      .from("scan_history")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // A dummy condition that is always true
      
    if (error) {
      console.warn("Error clearing history from Supabase:", JSON.stringify(error));
    }
  } catch (err) {
    console.warn("Failed to clear history:", err);
  }
}
