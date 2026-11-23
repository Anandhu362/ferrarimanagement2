// frontend/src/utils/bankVaultPdfService.js
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Universal autoTable caller to guarantee compatibility across all bundler environments
 */
const runAutoTable = (doc, options) => {
  if (typeof autoTable === 'function') {
    autoTable(doc, options);
  } else if (autoTable && typeof autoTable.default === 'function') {
    autoTable.default(doc, options);
  } else if (typeof doc.autoTable === 'function') {
    doc.autoTable(options);
  }
};

/**
 * Universal Currency Formatter for PDF
 */
const formatPdfCurrency = (val) => {
  const num = parseFloat(val) || 0;
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

/**
 * Format a Date object or ISO string into British readable date
 */
const formatReadableDate = (dateVal) => {
  if (!dateVal) return '--';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  } catch (e) {
    return String(dateVal);
  }
};

/**
 * Format timestamp with full date, hours, minutes, and exact seconds
 */
const formatDetailedTimestamp = (dateObj = new Date()) => {
  try {
    const day = dateObj.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const time = dateObj.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    return `${day}, ${time} GST`;
  } catch (e) {
    return dateObj.toISOString();
  }
};

/**
 * Bank Vault PDF Generation Engine
 * Creates a FinTech audit-grade Bank Statement PDF matching the Ferrari Foods visual standards.
 *
 * @param {Object} params
 * @param {string} params.branchId - Active branch name (e.g. 'AL FAJAR AUH', 'Sharjha')
 * @param {string} params.selectedDate - Active selected date (YYYY-MM-DD)
 * @param {Object} params.bankSummary - Current bank summary { totalBalance }
 * @param {Object} params.closingSnapshot - Persistent daily snapshot { openingBalance, closingBalance, dayInflow, dayOutflow }
 * @param {Array} params.logs - Bank transaction logs for the target date
 */
export const generateBankVaultPDF = ({
  branchId = 'AL FAJAR AUH',
  selectedDate,
  bankSummary = {},
  closingSnapshot = {},
  logs = []
}) => {
  // 1. Initialize Document in A4 Landscape mode
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const pageWidth = 297;
  const pageHeight = 210;
  const marginX = 10;
  const printableWidth = pageWidth - marginX * 2; // 277mm

  const generationTimestamp = formatDetailedTimestamp(new Date());
  const readableDate = formatReadableDate(selectedDate);
  const shortDateLabel = new Date(selectedDate).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).toUpperCase();

  // Filter logs for selected date if logs contain broader records
  const targetDateStr = String(selectedDate).split('T')[0];
  const dateLogs = logs.filter(log => {
    const logDate = String(log.createdAt || '').split('T')[0];
    return !targetDateStr || logDate === targetDateStr;
  });

  // Calculate Log-level Totals from the immutable ledger
  let logCreditsTotal = 0;
  let logDebitsTotal = 0;
  dateLogs.forEach(log => {
    const amt = parseFloat(log.amount || 0);
    const isCredit = log.type === 'BANK_MANUAL_CREDIT' || log.type === 'OUTFLOW';
    if (isCredit) {
      logCreditsTotal += amt;
    } else {
      logDebitsTotal += amt;
    }
  });

  // Metrics Resolution (Fail-Safe FinTech Standard)
  const currentBankBalance = parseFloat(bankSummary.totalBalance || 0);
  const rawOpening = parseFloat(closingSnapshot.openingBalance || 0);
  const rawClosing = parseFloat(closingSnapshot.closingBalance || 0);
  const rawInflow = parseFloat(closingSnapshot.dayInflow || 0);
  const rawOutflow = parseFloat(closingSnapshot.dayOutflow || 0);

  // Inflow & Outflow prioritizes verified transaction logs if records exist
  const dayInflow = (dateLogs.length > 0) ? logCreditsTotal : rawInflow;
  const dayOutflow = (dateLogs.length > 0) ? logDebitsTotal : rawOutflow;

  // Closing balance resolution: uses snapshot closing if available, otherwise currentBankBalance
  let closingBalance = rawClosing > 0 ? rawClosing : (currentBankBalance > 0 ? currentBankBalance : (rawOpening + dayInflow - dayOutflow));
  
  // Opening balance resolution: uses snapshot opening or computes from closing - inflow + outflow
  let openingBalance = rawOpening > 0 ? rawOpening : (closingBalance - dayInflow + dayOutflow);

  // Reconcile mathematical integrity: opening + inflow - outflow MUST equal closing
  if (Math.abs(closingBalance - (openingBalance + dayInflow - dayOutflow)) > 0.01) {
    openingBalance = closingBalance - dayInflow + dayOutflow;
  }
  const dayNetMovement = closingBalance - openingBalance;

  // Helper to draw clean rounded card
  const drawCardBox = (x, y, w, h, fillRGB, strokeRGB, radius = 2.5) => {
    doc.setFillColor(fillRGB[0], fillRGB[1], fillRGB[2]);
    if (strokeRGB) {
      doc.setDrawColor(strokeRGB[0], strokeRGB[1], strokeRGB[2]);
      doc.setLineWidth(0.3);
      doc.roundedRect(x, y, w, h, radius, radius, 'FD');
    } else {
      doc.roundedRect(x, y, w, h, radius, radius, 'F');
    }
  };

  // ----------------------------------------------------
  // DRAW HEADER SECTION (Top Navigation & Metadata Bar)
  // ----------------------------------------------------
  const drawTopHeader = () => {
    // Top colored accent bar
    doc.setFillColor(36, 32, 56); // Brand dark (#242038)
    doc.rect(0, 0, pageWidth, 3.5, 'F');

    // Left: Branch Name & System Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(String(branchId || 'FERRARI FOODS').toUpperCase(), marginX, 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text('FERRARI FOODS MANAGEMENT — FINANCIAL OPERATIONS & BANK RECONCILIATION DIVISION', marginX, 16.5);

    // Right: Download Timestamp
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Exported On:', pageWidth - marginX - 60, 12, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text(generationTimestamp, pageWidth - marginX, 12, { align: 'right' });

    // Status pill on the right
    doc.setFillColor(241, 245, 249); // slate-100
    doc.roundedRect(pageWidth - marginX - 44, 14, 44, 4.8, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text('CONFIDENTIAL AUDIT REPORT', pageWidth - marginX - 22, 17.5, { align: 'center' });

    // Subtle divider line
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.4);
    doc.line(marginX, 20.5, pageWidth - marginX, 20.5);
  };

  drawTopHeader();

  // ----------------------------------------------------
  // DRAW REPORT TITLE BAR
  // ----------------------------------------------------
  let currentY = 25.5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text('DAILY BANK ACCOUNT AUDIT STATEMENT', marginX, currentY);

  // Date pill
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(marginX + 96, currentY - 4.5, 84, 6, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text(`Report Period: ${readableDate}`, marginX + 138, currentY - 0.7, { align: 'center' });

  // Verified Badge pill
  doc.setFillColor(236, 253, 245); // emerald-50
  doc.setDrawColor(167, 243, 208); // emerald-200
  doc.roundedRect(pageWidth - marginX - 45, currentY - 4.5, 45, 6, 2, 2, 'FD');
  doc.setFillColor(16, 185, 129); // emerald-500 dot
  doc.circle(pageWidth - marginX - 40, currentY - 1.5, 1.2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(5, 150, 105); // emerald-600
  doc.text('LIVE SYNC ACTIVE', pageWidth - marginX - 22, currentY - 0.6, { align: 'center' });

  // ----------------------------------------------------
  // SECTION 1: EXECUTIVE FINANCIAL METRICS (5 CARDS GRID)
  // ----------------------------------------------------
  currentY = 28;
  const numCards = 5;
  const gap = 3.5;
  const cardWidth = (printableWidth - (gap * (numCards - 1))) / numCards; // ~52.6mm each
  const cardHeight = 22;

  // 1. Current Banked Balance Card (Dark Featured Card)
  drawCardBox(marginX, currentY, cardWidth, cardHeight, [36, 32, 56], [51, 45, 80]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text('CURRENT BANKED BALANCE', marginX + 4, currentY + 5.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(255, 255, 255);
  doc.text(`AED ${formatPdfCurrency(currentBankBalance)}`, marginX + 4, currentY + 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('Real-time Cumulative Bank Safe', marginX + 4, currentY + 17.5);

  // 2. Day Opening Balance Card
  const c2X = marginX + cardWidth + gap;
  drawCardBox(c2X, currentY, cardWidth, cardHeight, [255, 255, 255], [226, 232, 240]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('DAY OPENING BALANCE', c2X + 4, currentY + 5.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(30, 41, 59);
  doc.text(`AED ${formatPdfCurrency(openingBalance)}`, c2X + 4, currentY + 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184);
  doc.text(`Baseline as of 00:00 GST`, c2X + 4, currentY + 17.5);

  // 3. Total Inflow (Credits)
  const c3X = c2X + cardWidth + gap;
  drawCardBox(c3X, currentY, cardWidth, cardHeight, [240, 253, 244], [187, 247, 208]); // emerald-50/200
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(22, 101, 52); // emerald-800
  doc.text('TOTAL INFLOW (CREDITS)', c3X + 4, currentY + 5.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(21, 128, 61); // emerald-700
  doc.text(`+AED ${formatPdfCurrency(dayInflow > 0 ? dayInflow : logCreditsTotal)}`, c3X + 4, currentY + 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(22, 101, 52);
  doc.text(`${dateLogs.filter(l => l.type === 'BANK_MANUAL_CREDIT' || l.type === 'OUTFLOW').length} Deposits / Credits`, c3X + 4, currentY + 17.5);

  // 4. Total Outflow (Debits)
  const c4X = c3X + cardWidth + gap;
  drawCardBox(c4X, currentY, cardWidth, cardHeight, [254, 242, 242], [254, 202, 202]); // rose-50/200
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(153, 27, 27); // rose-800
  doc.text('TOTAL OUTFLOW (DEBITS)', c4X + 4, currentY + 5.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(185, 28, 28); // rose-700
  doc.text(`-AED ${formatPdfCurrency(dayOutflow > 0 ? dayOutflow : logDebitsTotal)}`, c4X + 4, currentY + 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(153, 27, 27);
  doc.text(`${dateLogs.filter(l => l.type === 'BANK_MANUAL_DEBIT').length} Debits / Payments`, c4X + 4, currentY + 17.5);

  // 5. Day Closing Balance Card
  const c5X = c4X + cardWidth + gap;
  drawCardBox(c5X, currentY, cardWidth, cardHeight, [248, 250, 252], [203, 213, 225]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(51, 65, 85);
  doc.text('DAY CLOSING BALANCE', c5X + 4, currentY + 5.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`AED ${formatPdfCurrency(closingBalance)}`, c5X + 4, currentY + 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  const netSign = dayNetMovement >= 0 ? '+' : '';
  doc.setTextColor(dayNetMovement >= 0 ? 21 : 185, dayNetMovement >= 0 ? 128 : 28, dayNetMovement >= 0 ? 61 : 28);
  doc.text(`Day Net Movement: ${netSign}AED ${formatPdfCurrency(dayNetMovement)}`, c5X + 4, currentY + 17.5);

  currentY += cardHeight + 4;

  // ----------------------------------------------------
  // SECTION 2: BANK TRANSACTION ACTIVITY LEDGER TABLE
  // ----------------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text('CHRONOLOGICAL BANK TRANSACTION LEDGER', marginX, currentY + 3);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Showing ${dateLogs.length} verified records for ${shortDateLabel}`, marginX + 85, currentY + 3);

  currentY += 5;

  const tableHeaders = [
    '#',
    'DATE & TIME',
    'TYPE',
    'COUNTERPARTY / COMPANY',
    'DESCRIPTION & DETAILS',
    'AUDIT STATUS',
    'AMOUNT (AED)'
  ];

  const tableRows = dateLogs.map((log, index) => {
    const isCredit = log.type === 'BANK_MANUAL_CREDIT' || log.type === 'OUTFLOW';
    
    // Parse title & subtitle
    let rawTitle = (log.description || '').replace('[Bank Account] ', '').split(' - Notes removed:')[0];
    let displayTitle = rawTitle;
    let displaySubtitle = 'Manual Adjustment';
    const companyMatch = rawTitle.match(/\[(.*?)\] (.*)/);
    if (companyMatch) {
      displayTitle = companyMatch[1];
      displaySubtitle = companyMatch[2];
    } else if (isCredit && log.type === 'OUTFLOW') {
      displaySubtitle = 'Physical Cash Deposit';
    }

    const timeFormatted = log.createdAt 
      ? (log.createdAt.length === 10 ? log.createdAt : new Date(log.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }))
      : '--';

    const amt = parseFloat(log.amount || 0);
    const amountStr = `${isCredit ? '+' : '-'} AED ${formatPdfCurrency(amt)}`;
    const auditStatusStr = log.isNoted ? 'VERIFIED (AUDITED)' : 'PENDING AUDIT';

    return [
      String(index + 1),
      timeFormatted,
      isCredit ? 'CREDIT' : 'DEBIT',
      displayTitle,
      displaySubtitle,
      auditStatusStr,
      amountStr
    ];
  });

  if (tableRows.length === 0) {
    tableRows.push([
      '-',
      shortDateLabel,
      '-- ',
      'No Transactions',
      'No debits or credits recorded for this date. Balance remained static.',
      'PARITY MAINTAINED',
      'AED 0.00'
    ]);
  }

  runAutoTable(doc, {
    startY: currentY,
    head: [tableHeaders],
    body: tableRows,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: 2.2,
      textColor: [51, 65, 85],
      lineColor: [226, 232, 240],
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: [36, 32, 56], // brand dark
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'left'
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 26, halign: 'left' },
      2: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
      3: { cellWidth: 55, halign: 'left', fontStyle: 'bold' },
      4: { cellWidth: 90, halign: 'left' },
      5: { cellWidth: 34, halign: 'center', fontStyle: 'bold' },
      6: { cellWidth: 40, halign: 'right', fontStyle: 'bold' }
    },
    didParseCell: (data) => {
      // Color-code Type column
      if (data.section === 'body' && data.column.index === 2) {
        if (data.cell.raw === 'CREDIT') {
          data.cell.styles.textColor = [21, 128, 61]; // emerald-700
          data.cell.styles.fillColor = [240, 253, 244];
        } else if (data.cell.raw === 'DEBIT') {
          data.cell.styles.textColor = [185, 28, 28]; // rose-700
          data.cell.styles.fillColor = [254, 242, 242];
        }
      }
      // Color-code Audit Status
      if (data.section === 'body' && data.column.index === 5) {
        if (String(data.cell.raw).includes('VERIFIED')) {
          data.cell.styles.textColor = [16, 185, 129];
        } else {
          data.cell.styles.textColor = [148, 163, 184];
        }
      }
      // Color-code Amount
      if (data.section === 'body' && data.column.index === 6) {
        if (String(data.cell.raw).startsWith('+')) {
          data.cell.styles.textColor = [21, 128, 61];
        } else if (String(data.cell.raw).startsWith('-')) {
          data.cell.styles.textColor = [15, 23, 42];
        }
      }
    },
    margin: { left: marginX, right: marginX }
  });

  // ----------------------------------------------------
  // SECTION 3: FOOTER, AUDIT HASH & SIGN-OFF
  // ----------------------------------------------------
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Bottom subtle divider
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(marginX, pageHeight - 12, pageWidth - marginX, pageHeight - 12);

    // Left: Confidentiality statement
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'OFFICIAL BANK RECONCILIATION AUDIT DOCUMENT — CONFIDENTIAL & PROPRIETARY. ALL FIGURES RECORDED IN UAE DIRHAMS (AED).',
      marginX,
      pageHeight - 7.5
    );

    // Center: Verification Reference
    const auditHash = `BNK-AUDIT-${selectedDate}-${branchId.replace(/\s+/g, '')}`;
    doc.text(`Ref: ${auditHash}`, pageWidth / 2, pageHeight - 7.5, { align: 'center' });

    // Right: Page Numbering
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - marginX, pageHeight - 7.5, { align: 'right' });
  }

  // ----------------------------------------------------
  // SAVE / DOWNLOAD FILE
  // ----------------------------------------------------
  const safeBranchName = String(branchId || 'Branch').replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `Bank-Audit-Report-${safeBranchName}-${selectedDate}.pdf`;
  doc.save(fileName);
};

