"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Search, Activity, AlertTriangle, CheckCircle, Zap, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import { saveScan } from "@/lib/history";
import { parseScanEventBuffer, type ScanEvent } from "@/lib/scan-stream";
import { SCAN_MODULES, getSuccessExplanation } from "@/lib/constants";

export default function Home() {
  const [targetUrl, setTargetUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [logs, setLogs] = useState<{msg: string, isError?: boolean, isWarning?: boolean}[]>([]);
  const [scanStats, setScanStats] = useState({ score: 0, vulnerabilities: 0, pagesScanned: 0 });
  const [moduleStatus, setModuleStatus] = useState<Record<string, 'pending' | 'scanning' | 'passed' | 'failed'>>({});
  const [findings, setFindings] = useState<{id: number, moduleId: string, type: string, severity: string}[]>([]);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const startScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUrl) return;
    
    setIsScanning(true);
    setScanProgress(0);
    setLogs([{ msg: `> Initiating scan for ${targetUrl}` }]);
    setScanStats({ score: 0, vulnerabilities: 0, pagesScanned: 0 });
    setFindings([]);
    setSelectedModule(null);
    
    // Reset module statuses to pending
    const initialStatuses: Record<string, 'pending'> = {};
    SCAN_MODULES.forEach(m => initialStatuses[m.id] = 'pending');
    setModuleStatus(initialStatuses);
    
    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUrl })
      });
      if (!response.ok) {
        setLogs((prev) => [...prev, { msg: '> Error initiating scan', isError: true }]);
        setIsScanning(false);
        return;
      }

      if (!response.body) {
        throw new Error("Scan response did not include a stream");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let completed = false;

      while (true) {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const parsed = parseScanEventBuffer(buffer);
        buffer = parsed.remainder;

        for (const event of parsed.events) {
          if (event.type === "complete") completed = true;
          applyScanEvent(event, targetUrl);
        }

        if (done) break;
      }

      if (!completed) {
        throw new Error("Scan stream ended before completion");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setLogs((prev) => [...prev, { msg: `> Scan failed: ${message}`, isError: true }]);
      setIsScanning(false);
    }
  };

  const applyScanEvent = (event: ScanEvent, url: string) => {
    setScanProgress(event.progress);
    setLogs((prev) => [...prev, { msg: `> ${event.message}` }]);

    if (event.type === "update" && event.moduleUpdate) {
      setModuleStatus((prev) => ({
        ...prev,
        [event.moduleUpdate!.id]: event.moduleUpdate!.status as "pending" | "scanning" | "passed" | "failed",
      }));
      return;
    }

    if (event.type === "complete") {
      setIsScanning(false);
      setScanStats({
        score: event.score,
        vulnerabilities: event.findings.length,
        pagesScanned: event.pagesScanned,
      });
      setFindings(event.findings);
      setModuleStatus((prev) => ({ ...prev, ...event.moduleStatuses } as typeof prev));
      void saveScan({
        url,
        score: event.score,
        vulnerabilities: event.findings.length,
        pagesScanned: event.pagesScanned,
        findings: event.findings,
        moduleStatuses: event.moduleStatuses,
      });
    }
  };



  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 font-sans selection:bg-cyan-500/30">
      {/* Background Grid */}
      <div className="fixed inset-0 z-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6">
            Dashboard <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Security Audit</span> Realtime
          </h1>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
            Pindai aplikasi web Anda dari kerentanan, kesalahan konfigurasi, dan risiko keamanan secara instan. Dapatkan laporan detail dan wawasan yang dapat ditindaklanjuti.
          </p>
        </div>

        {/* Scanner Input */}
        <div className="max-w-3xl mx-auto mb-16">
          <form onSubmit={startScan} className="relative flex items-center">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-neutral-500" />
            </div>
            <input
              type="url"
              placeholder="https://example.com"
              required
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              disabled={isScanning}
              className="w-full pl-12 pr-40 py-4 bg-neutral-900 border border-neutral-800 rounded-xl text-lg focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isScanning}
              className="absolute right-2 top-2 bottom-2 px-6 bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isScanning ? (
                <>
                  <Activity className="w-5 h-5 animate-pulse" />
                  Memindai
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Mulai Pemindaian
                </>
              )}
            </button>
          </form>
        </div>

        {/* Realtime Progress & Live Logs */}
        <AnimatePresence>
          {(isScanning || scanProgress === 100) && (
            <motion.div 
              initial={{ opacity: 0, y: 20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="max-w-3xl mx-auto mb-12 p-6 bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden"
            >
              <div className="flex justify-between items-center mb-4">
                <span className="text-cyan-400 font-mono text-sm">
                  {isScanning ? "Pemindaian sedang berlangsung..." : "Pemindaian Selesai"}
                </span>
                <span className="font-mono">{scanProgress}%</span>
              </div>
              
              <div className="w-full bg-neutral-800 rounded-full h-2 mb-6 overflow-hidden">
                <motion.div 
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${scanProgress}%` }}
                  transition={{ ease: "linear" }}
                />
              </div>
              
              {/* Live Terminal Log */}
              <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4 h-48 overflow-y-auto font-mono text-sm shadow-inner relative">
                <div className="flex flex-col gap-1">
                  {logs.map((log, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`
                        ${log.isError ? 'text-red-400' : ''} 
                        ${log.isWarning ? 'text-yellow-400' : ''} 
                        ${!log.isError && !log.isWarning ? 'text-green-400' : ''}
                      `}
                    >
                      {log.msg}
                    </motion.div>
                  ))}
                  {isScanning && (
                    <div className="text-cyan-400 animate-pulse mt-2">_</div>
                  )}
                  <div ref={logEndRef} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Audit Modules Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Shield className="text-cyan-400" /> Modul Audit Sistem
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {SCAN_MODULES.map((mod) => {
              const status = moduleStatus[mod.id] || 'pending';
              
              return (
                <div 
                  key={mod.id} 
                  onClick={() => setSelectedModule(mod.id)}
                  className={`cursor-pointer p-4 bg-neutral-900 border rounded-xl flex flex-col gap-3 transition-all duration-300 ${status === 'passed' ? 'border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.1)] hover:shadow-[0_0_20px_rgba(34,197,94,0.2)]' : status === 'failed' ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]' : status === 'scanning' ? 'border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.1)]' : 'border-neutral-800 hover:border-neutral-700'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg transition-colors ${status === 'passed' ? 'bg-green-500/10 text-green-500' : status === 'failed' ? 'bg-red-500/10 text-red-500' : status === 'scanning' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-neutral-800 text-neutral-400'}`}>
                      <mod.icon className="w-5 h-5" />
                    </div>
                    {status === 'passed' && <CheckCircle className="w-5 h-5 text-green-500" />}
                    {status === 'failed' && <AlertTriangle className="w-5 h-5 text-red-500" />}
                    {status === 'scanning' && <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />}
                  </div>
                  <h3 className="font-semibold text-sm text-neutral-200">{mod.name}</h3>
                  <div className="mt-auto">
                    <span className={`text-xs font-medium px-2 py-1 rounded-md ${status === 'passed' ? 'bg-green-500/10 text-green-500' : status === 'failed' ? 'bg-red-500/10 text-red-500' : status === 'scanning' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-neutral-800 text-neutral-500'}`}>
                      {status === 'pending' ? 'Menunggu' : status === 'scanning' ? 'Memindai...' : status === 'passed' ? 'Aman' : 'Rentan'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className={`p-6 bg-neutral-900 border rounded-xl flex items-center gap-4 transition-colors ${scanStats.score > 0 ? (scanStats.score >= 80 ? 'border-green-500/50' : scanStats.score >= 50 ? 'border-yellow-500/50' : 'border-red-500/50') : 'border-neutral-800 hover:border-cyan-500/50'}`}
          >
            <div className="p-4 bg-neutral-800 rounded-lg">
              <Shield className={`w-8 h-8 ${scanStats.score > 0 ? (scanStats.score >= 80 ? 'text-green-500' : scanStats.score >= 50 ? 'text-yellow-500' : 'text-red-500') : 'text-cyan-400'}`} />
            </div>
            <div>
              <p className="text-neutral-400 text-sm">Skor Keamanan</p>
              <p className="text-3xl font-bold">
                {scanStats.score > 0 ? scanStats.score : '--'}
                <span className="text-lg text-neutral-500">/100</span>
              </p>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className={`p-6 bg-neutral-900 border rounded-xl flex items-center gap-4 transition-colors ${scanStats.vulnerabilities > 0 ? 'border-red-500/50' : 'border-neutral-800 hover:border-red-500/50'}`}
          >
            <div className="p-4 bg-neutral-800 rounded-lg">
              <AlertTriangle className={`w-8 h-8 ${scanStats.vulnerabilities > 0 ? 'text-red-500' : 'text-neutral-500'}`} />
            </div>
            <div>
              <p className="text-neutral-400 text-sm">Kerentanan</p>
              <p className="text-3xl font-bold">{scanStats.score > 0 ? scanStats.vulnerabilities : '--'}</p>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="p-6 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center gap-4 hover:border-green-500/50 transition-colors"
          >
            <div className="p-4 bg-neutral-800 rounded-lg">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <div>
              <p className="text-neutral-400 text-sm">Halaman Dipindai</p>
              <p className="text-3xl font-bold">{scanStats.score > 0 ? scanStats.pagesScanned : '--'}</p>
            </div>
          </motion.div>
        </div>

      </main>

      {/* Module Details Modal */}
      <AnimatePresence>
        {selectedModule && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative"
            >
              <button 
                onClick={() => setSelectedModule(null)}
                className="absolute top-4 right-4 text-neutral-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
              
              {(() => {
                const mod = SCAN_MODULES.find(m => m.id === selectedModule);
                const status = moduleStatus[selectedModule] || 'pending';
                const modFindings = findings.filter(f => f.moduleId === selectedModule);
                
                return (
                  <>
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`p-3 rounded-xl ${status === 'passed' ? 'bg-green-500/20 text-green-500' : status === 'failed' ? 'bg-red-500/20 text-red-500' : status === 'scanning' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-neutral-800 text-neutral-400'}`}>
                        {mod && <mod.icon className="w-8 h-8" />}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">{mod?.name}</h2>
                        <p className="text-sm text-neutral-400">
                          Status: <span className="font-semibold text-white capitalize">{status === 'pending' ? 'Menunggu' : status === 'scanning' ? 'Memindai...' : status === 'passed' ? 'Aman' : 'Rentan'}</span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-neutral-950 rounded-xl p-4 border border-neutral-800 h-64 overflow-y-auto">
                      <h3 className="font-semibold text-neutral-300 mb-3 border-b border-neutral-800 pb-2">Detail Pindaian</h3>
                      
                      {status === 'pending' && <p className="text-neutral-500">Modul belum memulai pemindaian.</p>}
                      {status === 'scanning' && <p className="text-cyan-400 animate-pulse">Pemindaian berlangsung... menganalisis target...</p>}
                      
                      {(status === 'passed' || status === 'failed') && (
                        <div className="space-y-4">
                          <p className="text-sm text-neutral-300">
                            Modul telah selesai dieksekusi.
                          </p>
                          
                          {modFindings.length > 0 ? (
                            <div>
                              <p className="text-sm font-medium text-red-400 mb-2">Kerentanan Ditemukan:</p>
                              <ul className="space-y-2">
                                {modFindings.map((finding, idx) => (
                                  <li key={idx} className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-sm">
                                    <div className="flex justify-between items-start mb-1">
                                      <span className="font-semibold text-red-300">{finding.type}</span>
                                      <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded uppercase">{finding.severity}</span>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : (
                            <div className="flex items-start gap-3 text-green-400 bg-green-500/10 p-4 rounded-lg border border-green-500/20">
                              <CheckCircle className="w-5 h-5 mt-0.5 shrink-0" />
                              <div className="flex flex-col">
                                <span className="font-bold text-base mb-1 text-green-500">Aman Terlindungi</span>
                                <span className="text-sm leading-relaxed text-green-100">{mod ? getSuccessExplanation(mod.id) : ''}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
