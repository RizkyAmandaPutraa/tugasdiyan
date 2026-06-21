import { ScanHistory } from './types';
import { SCAN_MODULES, getSuccessExplanation } from './constants';

export const exportScanToPDF = async (scan: ScanHistory) => {
  if (scan.score === 0) return;
  
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  const now = new Date(scan.scannedAt).toLocaleString('id-ID');
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(6, 182, 212);
  doc.rect(0, 0, pageWidth, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('LAPORAN SECURITY AUDIT', pageWidth / 2, 12, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Testing System - Realtime Security Audit Dashboard', pageWidth / 2, 20, { align: 'center' });

  // Meta
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(10);
  let y = 36;
  doc.setFont('helvetica', 'bold');
  doc.text('Target URL:', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(scan.url || "Tidak dispesifikasikan", 45, y);
  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Tanggal Scan:', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(now, 48, y);
  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Halaman Dipindai:', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(String(scan.pagesScanned), 57, y);
  y += 12;

  // Score box
  const scoreColor: [number, number, number] = scan.score >= 80 ? [34, 197, 94] : scan.score >= 50 ? [234, 179, 8] : [239, 68, 68];
  doc.setFillColor(...scoreColor);
  doc.roundedRect(14, y, pageWidth - 28, 20, 4, 4, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(`Skor Keamanan: ${scan.score} / 100   |   Total Kerentanan: ${scan.vulnerabilities}`, pageWidth / 2, y + 13, { align: 'center' });
  y += 28;

  // Module results
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Hasil Pemindaian Per Modul', 14, y);
  y += 2;
  doc.setDrawColor(200, 200, 200);
  doc.line(14, y + 2, pageWidth - 14, y + 2);
  y += 8;

  SCAN_MODULES.forEach((mod) => {
    const status = scan.moduleStatuses[mod.id] || 'pending';
    const modFindings = scan.findings.filter(f => f.moduleId === mod.id);
    if (status === 'pending') return;

    if (y > 265) {
      doc.addPage();
      y = 20;
    }

    const dotColor: [number, number, number] = status === 'passed' ? [34, 197, 94] : status === 'failed' ? [239, 68, 68] : [156, 163, 175];
    doc.setFillColor(...dotColor);
    doc.circle(18, y - 1, 2.5, 'F');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text(mod.name, 24, y);

    const label = status === 'passed' ? 'AMAN' : status === 'failed' ? 'RENTAN' : 'N/A';
    doc.setTextColor(...dotColor);
    doc.setFont('helvetica', 'bold');
    doc.text(label, pageWidth - 14, y, { align: 'right' });
    y += 6;

    if (modFindings.length > 0) {
      modFindings.forEach(f => {
        if (y > 265) { doc.addPage(); y = 20; }
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(180, 50, 50);
        doc.text(`  \u2022 ${f.type} [${f.severity.toUpperCase()}]`, 24, y);
        y += 5;
      });
    } else if (status === 'passed') {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      const explanation = getSuccessExplanation(mod.id);
      const lines = doc.splitTextToSize(explanation, pageWidth - 42);
      if (y + lines.length * 4.5 > 265) { doc.addPage(); y = 20; }
      doc.text(lines, 24, y);
      y += lines.length * 4.5;
    }
    y += 5;
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.setFont('helvetica', 'italic');
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.text(`Halaman ${i} dari ${totalPages}  |  Laporan dibuat otomatis oleh Testing System Security Audit`, pageWidth / 2, 290, { align: 'center' });
  }

  doc.save(`laporan-security-audit-${new Date(scan.scannedAt).getTime()}.pdf`);
};
