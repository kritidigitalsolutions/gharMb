import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * Rock-Solid Cross-Browser File Downloader
 * 1. Creates a real Blob / File object with strict MIME type.
 * 2. Connects anchor element to document.body (required by Chromium/Edge to honor the download attribute).
 * 3. Keeps object URL active for 60s so Edge never drops or truncates the download.
 */
export const triggerDownload = (blob, filename) => {
  if (!blob) return;

  try {
    let downloadSource = blob;

    // Use File constructor when available to preserve filename metadata in memory
    try {
      if (typeof File !== 'undefined' && !(blob instanceof File)) {
        downloadSource = new File([blob], filename, {
          type: blob.type || 'application/octet-stream',
          lastModified: Date.now()
        });
      }
    } catch {
      downloadSource = blob;
    }

    const url = window.URL.createObjectURL(downloadSource);
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = url;
    link.download = filename;
    link.setAttribute('download', filename);

    // CRITICAL: Chromium & Edge REQUIRE the anchor tag to be in the DOM document to honor filename
    document.body.appendChild(link);

    // Trigger click
    try {
      link.click();
    } catch {
      const clickEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
      });
      link.dispatchEvent(clickEvent);
    }

    // Keep the object URL alive for 60 seconds to ensure the download finishes cleanly
    setTimeout(() => {
      try {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
        window.URL.revokeObjectURL(url);
      } catch {
        // safe ignore
      }
    }, 60000);
  } catch (err) {
    console.error('triggerDownload failed:', err);
  }
};

export const triggerFileDownload = triggerDownload;
export const downloadViaDataUri = triggerDownload;

/**
 * Robust runner for jspdf-autotable across different bundler environments
 */
const runAutoTable = (doc, options) => {
  if (typeof autoTable === 'function') {
    autoTable(doc, options);
  } else if (typeof doc.autoTable === 'function') {
    doc.autoTable(options);
  } else if (autoTable && typeof autoTable.default === 'function') {
    autoTable.default(doc, options);
  } else {
    throw new Error('PDF Table Generator is not available');
  }
};

/**
 * Clean Indian Currency Formatter for PDF (uses Rs. to guarantee 100% font support in all PDF viewers)
 */
export const formatRupeeForPDF = (val) => {
  if (val === null || val === undefined || val === '') return '—';
  const num = typeof val === 'number' ? val : Number(String(val).replace(/[^0-9.-]+/g, ''));
  if (isNaN(num)) return String(val);
  return `Rs. ${num.toLocaleString('en-IN')}`;
};

/**
 * Clean Indian Currency Formatter for UI and Excel (uses ₹)
 */
export const formatRupeeForUI = (val) => {
  if (val === null || val === undefined || val === '') return '—';
  const num = typeof val === 'number' ? val : Number(String(val).replace(/[^0-9.-]+/g, ''));
  if (isNaN(num)) return String(val);
  return `₹${num.toLocaleString('en-IN')}`;
};

/**
 * ─────────────────────────────────────────────────────────────
 * 1. HIGH-DESIGN VECTOR PDF EXPORT ENGINE (Data URI - No UUID)
 * ─────────────────────────────────────────────────────────────
 */
export const exportToPDF = ({
  categoryTitle = 'Administrative Report',
  dateScope = 'All Records',
  summaryMetrics = [],
  headers = [],
  rows = [],
  columnAlignments = {},
  filename = `gharmb_report_${Date.now()}.pdf`
}) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Header Top Accent Stripe (Gharmb Indigo)
  doc.setFillColor(79, 70, 229); // #4f46e5 (Indigo 600)
  doc.rect(0, 0, pageWidth, 4, 'F');

  // Header Content
  // Brand Logo / Monogram Box
  doc.setFillColor(24, 32, 54); // Deep Navy Slate
  doc.roundedRect(margin, 10, 14, 14, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('GH', margin + 3.5, 19);

  // Platform Name and Report Title
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('GHARMB REAL ESTATE PLATFORM', margin + 18, 16);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(
    `OFFICIAL ADMINISTRATIVE AUDIT & COMPLIANCE REPORT • CATEGORY: ${categoryTitle.toUpperCase()}`,
    margin + 18,
    21.5
  );

  // Right-hand Metadata Pill & Timestamp
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  doc.setFillColor(241, 245, 249); // slate-100
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.roundedRect(pageWidth - margin - 72, 10, 72, 14, 2, 2, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('CLASSIFICATION: STRICTLY CONFIDENTIAL', pageWidth - margin - 70, 14.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`Scope: ${dateScope}`, pageWidth - margin - 70, 18.5);
  doc.text(`Generated: ${dateStr}, ${timeStr}`, pageWidth - margin - 70, 22);

  // Summary KPI Cards (If provided)
  let startTableY = 28;
  if (summaryMetrics && summaryMetrics.length > 0) {
    const cardGap = 4;
    const totalCards = Math.min(summaryMetrics.length, 4);
    const availableWidth = pageWidth - margin * 2;
    const cardWidth = (availableWidth - (totalCards - 1) * cardGap) / totalCards;
    const cardHeight = 15;
    const cardY = 28;

    summaryMetrics.slice(0, 4).forEach((metric, idx) => {
      const cardX = margin + idx * (cardWidth + cardGap);

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

      const indicatorColor = metric.accentColor || [79, 70, 229];
      doc.setFillColor(indicatorColor[0], indicatorColor[1], indicatorColor[2]);
      doc.roundedRect(cardX, cardY, 2, cardHeight, 1, 1, 'F');

      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text(String(metric.label || '').toUpperCase(), cardX + 5, cardY + 5);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(String(metric.value || '—'), cardX + 5, cardY + 11.5);
    });

    startTableY = cardY + cardHeight + 5;
  }

  // Data Table via autoTable
  runAutoTable(doc, {
    startY: startTableY,
    head: [headers],
    body: rows,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: { top: 2.2, bottom: 2.2, left: 3, right: 3 },
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.15,
      valign: 'middle',
      overflow: 'linebreak'
    },
    headStyles: {
      fillColor: [24, 32, 54],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
      cellPadding: { top: 3, bottom: 3, left: 3, right: 3 }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: columnAlignments,
    didDrawCell: (data) => {
      if (data.section === 'body') {
        const text = String(data.cell.raw || '').trim().toLowerCase();
        if (['approved', 'active', 'settled', 'verified', 'resolved'].includes(text)) {
          doc.setTextColor(5, 150, 105);
        } else if (['pending', 'in progress', 'under review', 'escrow held', 'scheduled'].includes(text)) {
          doc.setTextColor(217, 119, 6);
        } else if (['rejected', 'suspended', 'cancelled', 'refunded', 'disputed'].includes(text)) {
          doc.setTextColor(220, 38, 38);
        }
      }
    },
    margin: { left: margin, right: margin, bottom: 16 }
  });

  // Multi-Page Footer with Page Numbers
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'GHARMB REAL ESTATE PLATFORM • ADMINISTRATIVE CONSOLE • CONFIDENTIAL INTERNAL RECORD',
      margin,
      pageHeight - 7
    );

    const pageString = `Page ${i} of ${totalPages}`;
    doc.text(pageString, pageWidth - margin - doc.getTextWidth(pageString), pageHeight - 7);
  }

  // Output genuine binary PDF Blob
  const pdfBlob = doc.output('blob');
  triggerDownload(pdfBlob, filename);
};

/**
 * ─────────────────────────────────────────────────────────────
 * 2. GENUINE EXCEL (.XLSX) EXPORT ENGINE
 * ─────────────────────────────────────────────────────────────
 */
export const exportToExcel = ({
  categoryTitle = 'Export',
  sheetName = 'Data Export',
  dateScope = 'All Records',
  headers = [],
  rows = [],
  summaryRow = null,
  filename = `gharmb_export_${Date.now()}.xlsx`
}) => {
  const wb = XLSX.utils.book_new();

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  const wsData = [
    ['GHARMB REAL ESTATE PLATFORM - ADMINISTRATIVE DATA EXPORT'],
    [`Category: ${categoryTitle}`, `Date Scope: ${dateScope}`, `Exported: ${dateStr} ${timeStr}`, `Status: Synchronized Live`],
    [`Total Records in Scope: ${rows.length}`, `Format: Native Excel Workbook (.xlsx)`, `Security: Internal Administrative Use`],
    [],
    headers,
    ...rows
  ];

  if (summaryRow && Array.isArray(summaryRow)) {
    wsData.push([]);
    wsData.push(summaryRow);
  }

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  const colWidths = headers.map((header, colIdx) => {
    let maxLen = String(header || '').length;

    rows.forEach((row) => {
      const cellVal = row[colIdx];
      if (cellVal !== undefined && cellVal !== null) {
        const len = String(cellVal).length;
        if (len > maxLen) maxLen = len;
      }
    });

    return { wch: Math.min(Math.max(maxLen + 4, 12), 45) };
  });

  ws['!cols'] = colWidths;

  const safeSheetName = sheetName.replace(/[\\/?*[\]]/g, '').slice(0, 30) || 'Export';
  XLSX.utils.book_append_sheet(wb, ws, safeSheetName);

  // Generate binary Excel array and package into genuine Blob
  const excelArray = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const excelBlob = new Blob([excelArray], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  triggerDownload(excelBlob, filename);
};

/**
 * ─────────────────────────────────────────────────────────────
 * 3. COMPLIANT UTF-8 CSV EXPORT ENGINE
 * ─────────────────────────────────────────────────────────────
 */
export const exportToCSV = ({
  categoryTitle = 'Export',
  dateScope = 'All Records',
  headers = [],
  rows = [],
  filename = `gharmb_export_${Date.now()}.csv`
}) => {
  const wb = XLSX.utils.book_new();
  const wsData = [
    headers,
    ...rows
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'Data');

  const csvText = XLSX.utils.sheet_to_csv(ws);
  const csvBlob = new Blob(['\uFEFF' + csvText], {
    type: 'text/csv;charset=utf-8;'
  });
  triggerDownload(csvBlob, filename);
};
