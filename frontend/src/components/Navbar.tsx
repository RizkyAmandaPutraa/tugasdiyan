"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, History, FileDown } from "lucide-react";

interface NavbarProps {
  /** Whether the Export PDF button should be shown (main scan page only). */
  showExport?: boolean;
  /** Whether the export button is disabled (no scan completed yet). */
  exportDisabled?: boolean;
  onExport?: () => void;
}

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: Shield },
  { href: "/riwayat", label: "Riwayat", icon: History },
];

export default function Navbar({ showExport, exportDisabled, onExport }: NavbarProps) {
  const pathname = usePathname();

  return (
    <nav className="relative z-10 border-b border-neutral-800 bg-neutral-950/50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <Shield className="w-8 h-8 text-cyan-400 transition-transform group-hover:scale-110" />
          <span className="text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            TESTING SYSTEM
          </span>
        </Link>

        {/* Nav links + actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Page navigation */}
          <div className="flex items-center rounded-lg border border-neutral-800 p-0.5">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    active
                      ? "bg-cyan-500/15 text-cyan-400"
                      : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}
          </div>

          {/* Export PDF (only on scan page) */}
          {showExport && (
            <button
              onClick={onExport}
              disabled={exportDisabled}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-neutral-950 bg-cyan-400 rounded-md hover:bg-cyan-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FileDown className="w-4 h-4" />
              <span className="hidden sm:inline">Export PDF</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
