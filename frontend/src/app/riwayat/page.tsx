"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Clock,
  Globe,
  AlertTriangle,
  CheckCircle,
  Trash2,
  X,
  Search,
  ChevronDown,
  ChevronUp,
  Activity,
  Download,
  History as HistoryIcon,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { ScanHistory, ScanFinding } from "@/lib/types";
import { getHistory, deleteScan, clearHistory } from "@/lib/history";
import { SCAN_MODULES, getSuccessExplanation } from "@/lib/constants";
import { exportScanToPDF } from "@/lib/pdf";

const SCORE_COLORS: Record<string, string> = {
  high: "text-green-400 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.15)]",
  medium: "text-yellow-400 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.15)]",
  low: "text-red-400 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]",
};

function scoreColor(score: number) {
  if (score >= 80) return SCORE_COLORS.high;
  if (score >= 50) return SCORE_COLORS.medium;
  return SCORE_COLORS.low;
}

function scoreBadge(score: number) {
  if (score >= 80) return "bg-green-500/15 text-green-400";
  if (score >= 50) return "bg-yellow-500/15 text-yellow-400";
  return "bg-red-500/15 text-red-400";
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function FindingBadge({ finding }: { finding: ScanFinding }) {
  const severityColor =
    finding.severity === "High"
      ? "bg-red-500/15 text-red-400"
      : finding.severity === "Medium"
        ? "bg-yellow-500/15 text-yellow-400"
        : "bg-blue-500/15 text-blue-400";

  return (
    <div className="flex items-center justify-between gap-2 bg-neutral-900 border border-neutral-800 rounded-lg p-3">
      <span className="text-sm text-neutral-200">{finding.type}</span>
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${severityColor}`}>
        {finding.severity.toUpperCase()}
      </span>
    </div>
  );
}

function ScanCard({
  entry,
  onDelete,
  onError,
}: {
  entry: ScanHistory;
  onDelete: (id: string) => void;
  onError: (message: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const handleExportPDF = async () => {
    try {
      await exportScanToPDF(entry);
    } catch (err: unknown) {
      const detail = err instanceof Error ? err.message : "Unknown error";
      onError(`Gagal mengekspor PDF: ${detail}`);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Score */}
        <div className={`shrink-0 w-16 h-16 rounded-xl border flex flex-col items-center justify-center ${scoreColor(entry.score)}`}>
          <span className="text-2xl font-bold">{entry.score}</span>
          <span className="text-[10px] font-medium opacity-70">/ 100</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-lg font-bold text-neutral-200 mb-1">
            <Globe className="w-4 h-4 shrink-0 text-cyan-400" />
            <span className="truncate">{entry.url || "Target URL tidak dispesifikasikan"}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>{formatDate(entry.scannedAt)}</span>
          </div>
        </div>

        {/* Stats pills */}
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-md ${scoreBadge(entry.score)}`}>
            {entry.score >= 80 ? "Aman" : entry.score >= 50 ? "Sedang" : "Rentan"}
          </span>
          <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-red-500/15 text-red-400">
            {entry.vulnerabilities} rentan
          </span>
          <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-neutral-800 text-neutral-400">
            {entry.pagesScanned} halaman
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pb-3 flex items-center gap-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {expanded ? "Sembunyikan detail" : "Lihat detail"}
        </button>
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1 text-xs text-neutral-400 hover:text-cyan-400 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export PDF
          </button>
          <button
            onClick={() => onDelete(entry.id)}
            className="flex items-center gap-1 text-xs text-neutral-500 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Hapus
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-neutral-800 px-4 py-4 space-y-4">
              {/* Module statuses */}
              <div>
                <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" /> Detail Evaluasi Modul
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(entry.moduleStatuses).map(([id, status]) => {
                    const modDef = SCAN_MODULES.find(m => m.id === id);
                    const ModIcon = modDef ? modDef.icon : Activity;
                    return (
                      <div
                        key={id}
                        className={`flex flex-col p-3 rounded-lg border ${
                          status === "passed"
                            ? "bg-green-500/5 border-green-500/20"
                            : "bg-red-500/5 border-red-500/20"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-md ${status === "passed" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                              <ModIcon className="w-4 h-4 shrink-0" />
                            </div>
                            <span className="font-semibold text-sm text-neutral-200">
                              {modDef ? modDef.name : id}
                            </span>
                          </div>
                          {status === "passed" ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-green-400 bg-green-500/10 px-2 py-0.5 rounded-sm">
                              <CheckCircle className="w-3 h-3" /> Aman
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-500/10 px-2 py-0.5 rounded-sm">
                              <AlertTriangle className="w-3 h-3" /> Rentan
                            </span>
                          )}
                        </div>
                        {modDef && (
                          <p className="text-xs text-neutral-500 leading-relaxed mt-1 mb-2 border-b border-neutral-800/50 pb-2">
                            {modDef.description}
                          </p>
                        )}
                        {status === "passed" ? (
                          <div className="mt-auto bg-green-500/10 p-2 rounded-md">
                            <p className="text-xs text-green-300 leading-relaxed">
                              {getSuccessExplanation(id)}
                            </p>
                          </div>
                        ) : (
                          <div className="mt-auto bg-red-500/10 p-2 rounded-md space-y-1.5">
                            <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">Daftar Temuan:</p>
                            {entry.findings.filter(f => f.moduleId === id).map((f, idx) => (
                              <div key={idx} className="flex items-start gap-2">
                                <span className="text-[9px] font-bold bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded uppercase mt-0.5 shrink-0">
                                  {f.severity}
                                </span>
                                <span className="text-xs text-red-300">
                                  {f.type}
                                </span>
                              </div>
                            ))}
                            {entry.findings.filter(f => f.moduleId === id).length === 0 && (
                              <p className="text-xs text-red-300">Gagal menyelesaikan pemindaian atau temuan tidak terdefinisi.</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function RiwayatPage() {
  const [history, setHistory] = useState<ScanHistory[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoaded(false);
    setError(null);
    try {
      const data = await getHistory();
      setHistory(data);
    } catch (err: unknown) {
      const detail = err instanceof Error ? err.message : "Unknown error";
      setError(`Gagal memuat riwayat: ${detail}`);
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteScan(id);
      await fetchHistory();
    } catch (err: unknown) {
      const detail = err instanceof Error ? err.message : "Unknown error";
      setError(`Gagal menghapus data: ${detail}`);
    }
  };

  const handleClearAll = async () => {
    try {
      await clearHistory();
      setHistory([]);
      setError(null);
    } catch (err: unknown) {
      const detail = err instanceof Error ? err.message : "Unknown error";
      setError(`Gagal menghapus semua riwayat: ${detail}`);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 font-sans selection:bg-cyan-500/30">
      {/* Background Grid */}
      <div className="fixed inset-0 z-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      <Navbar />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold flex items-center gap-3">
              <HistoryIcon className="w-8 h-8 text-cyan-400" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                Riwayat Pemindaian
              </span>
            </h1>
            <p className="text-neutral-400 mt-2">
              Daftar hasil pemindaian keamanan yang telah dilakukan.
            </p>
          </div>

          {history.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors self-start"
            >
              <Trash2 className="w-4 h-4" />
              Hapus Semua
            </button>
          )}
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span className="flex-1">{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Content */}
        {!loaded && (
          <div className="flex items-center gap-2 text-neutral-500 text-sm">
            <Activity className="w-4 h-4 animate-pulse" />
            Memuat riwayat...
          </div>
        )}

        {loaded && history.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Search className="w-16 h-16 text-neutral-800 mb-4" />
            <h2 className="text-xl font-semibold text-neutral-400 mb-2">
              Belum ada riwayat pemindaian
            </h2>
            <p className="text-sm text-neutral-500 max-w-md">
              Mulai pemindaian dari dashboard untuk melihat hasilnya di sini.
            </p>
          </div>
        )}

        {loaded && history.length > 0 && (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {history.map((entry) => (
                <ScanCard key={entry.id} entry={entry} onDelete={handleDelete} onError={setError} />
              ))}
            </AnimatePresence>
            <p className="text-center text-xs text-neutral-600 pt-4">
              Menampilkan {history.length} riwayat
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
