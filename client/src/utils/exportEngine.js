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
  reportSubtitle = '',
  dateScope = 'All Records',
  summaryMetrics = [],
  headers = [],
  rows = [],
  summaryRow = null,
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

  // ─── 1. CLEAN REFINED HEADER ───
  // Brand Logo Mark: Minimalist Slate Rounded Badge
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(margin, 10, 8.5, 8.5, 1.6, 1.6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('GH', margin + 2.1, 15.6);

  // Brand Name & Tagline
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('GHARMB', margin + 11.5, 14.2);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('|   Real Estate Platform', margin + 35, 14.2);

  // Subtitle / Report Title
  const displaySubtitle =
    reportSubtitle ||
    (categoryTitle.toLowerCase().includes('report') ? categoryTitle : `${categoryTitle} Portfolio Report`);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85); // slate-700
  doc.text(displaySubtitle, margin + 11.5, 18.5);

  // Right-hand Metadata (Clean, Professional, Right-Aligned)
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  const rightX = pageWidth - margin;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text('EXECUTIVE OPERATIONS REPORT', rightX, 12, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`Generated: ${dateStr}, ${timeStr}`, rightX, 15.6, { align: 'right' });
  doc.text(`Scope: ${dateScope}`, rightX, 19, { align: 'right' });

  // Subtle Header Divider Hairline
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.3);
  doc.line(margin, 21.5, pageWidth - margin, 21.5);

  // ─── 2. EXECUTIVE SUMMARY STATS STRIP ───
  let startTableY = 25.5;
  if (summaryMetrics && summaryMetrics.length > 0) {
    const totalMetrics = Math.min(summaryMetrics.length, 4);
    const availableWidth = pageWidth - margin * 2;
    const stripY = 24.5;
    const stripHeight = 12.5;
    const colWidth = availableWidth / totalMetrics;

    // Single cohesive summary container
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.25);
    doc.roundedRect(margin, stripY, availableWidth, stripHeight, 1.8, 1.8, 'FD');

    summaryMetrics.slice(0, 4).forEach((metric, idx) => {
      const colX = margin + idx * colWidth;

      // Subtle vertical divider between metric columns
      if (idx > 0) {
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.2);
        doc.line(colX, stripY + 2, colX, stripY + stripHeight - 2);
      }

      // Upper label
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(String(metric.label || '').toUpperCase(), colX + 5, stripY + 4.5);

      // Value
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text(String(metric.value || '0'), colX + 5, stripY + 9.8);
    });

    startTableY = stripY + stripHeight + 4.5;
  }

  // ─── 3. MINIMAL CLEAN DATA TABLE ───
  // Format summaryRow with colSpan so totals don't wrap awkwardly in the first cell
  let formattedFoot = undefined;
  if (summaryRow && Array.isArray(summaryRow) && summaryRow.length > 0) {
    if (typeof summaryRow[0] === 'object' && summaryRow[0] !== null) {
      formattedFoot = [summaryRow];
    } else {
      let valIdx = -1;
      for (let i = 1; i < summaryRow.length; i++) {
        if (summaryRow[i] && String(summaryRow[i]).trim() !== '' && String(summaryRow[i]).trim() !== '—') {
          valIdx = i;
          break;
        }
      }
      if (valIdx > 0) {
        formattedFoot = [
          [
            { content: String(summaryRow[0]), colSpan: valIdx, styles: { halign: 'left', fontStyle: 'bold', textColor: [15, 23, 42] } },
            { content: String(summaryRow[valIdx]), styles: { halign: 'right', fontStyle: 'bold', textColor: [15, 23, 42] } },
            ...(summaryRow.length - valIdx - 1 > 0 ? [{ content: '', colSpan: summaryRow.length - valIdx - 1 }] : [])
          ]
        ];
      } else {
        formattedFoot = [summaryRow];
      }
    }
  }

  runAutoTable(doc, {
    startY: startTableY,
    head: [headers],
    body: rows,
    foot: formattedFoot,
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: { top: 2.8, bottom: 2.8, left: 2, right: 2 },
      textColor: [30, 41, 59], // slate-800
      valign: 'middle',
      overflow: 'linebreak',
      lineWidth: { bottom: 0.15 },
      lineColor: [241, 245, 249] // hairline row separator
    },
    headStyles: {
      fillColor: [248, 250, 252], // clean slate-50
      textColor: [71, 85, 105],   // slate-600
      fontStyle: 'bold',
      fontSize: 7,
      valign: 'middle',
      cellPadding: { top: 3.2, bottom: 3.2, left: 2, right: 2 },
      lineWidth: { bottom: 0.5, top: 0.2 },
      lineColor: [203, 213, 225]  // slate-300
    },
    alternateRowStyles: {
      fillColor: [253, 254, 255]
    },
    footStyles: {
      fillColor: [248, 250, 252],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 7.5,
      cellPadding: { top: 3, bottom: 3, left: 2, right: 2 },
      lineWidth: { top: 0.5, bottom: 0.5 },
      lineColor: [203, 213, 225]
    },
    columnStyles: columnAlignments,
    didParseCell: (data) => {
      if (data.section === 'body') {
        const text = String(data.cell.raw || '').trim().toLowerCase();
        // Semantic, subtle status styling
        if (['approved', 'active', 'settled', 'verified', 'resolved'].includes(text)) {
          data.cell.styles.textColor = [4, 120, 87]; // emerald-700
          data.cell.styles.fontStyle = 'bold';
        } else if (['pending', 'in progress', 'under review', 'escrow held', 'scheduled', 'contacted'].includes(text)) {
          data.cell.styles.textColor = [180, 83, 9]; // amber-700
          data.cell.styles.fontStyle = 'bold';
        } else if (['rejected', 'suspended', 'cancelled', 'refunded', 'disputed'].includes(text)) {
          data.cell.styles.textColor = [185, 28, 28]; // rose-700
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    margin: { left: margin, right: margin, bottom: 15 }
  });

  // ─── 4. MULTI-PAGE SLENDER FOOTER ───
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Hairline divider
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.25);
    doc.line(margin, pageHeight - 11, pageWidth - margin, pageHeight - 11);

    // Left platform identifier
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('GharMB Real Estate Platform  •  Administrative Audit & Operations Record', margin, pageHeight - 6.5);

    // Center confidentiality note
    doc.setFontSize(6.5);
    doc.setTextColor(160, 174, 192);
    doc.text('Confidential  •  For Authorized Internal Operations Only', pageWidth / 2, pageHeight - 6.5, { align: 'center' });

    // Right page number
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 6.5, { align: 'right' });
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
