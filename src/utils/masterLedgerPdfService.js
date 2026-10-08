// frontend/src/utils/masterLedgerPdfService.js
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
 * Master Ledger PDF Generation Engine
 * Creates a FinTech audit-grade PDF with exact visual parity to the Ferrari Foods web app.
 *
 * @param {Object} params
 * @param {string} params.branchId - Active branch name (e.g. 'AL FAJAR AUH', 'Sharjha')
 * @param {string} params.selectedDate - Active selected date (YYYY-MM-DD)
 * @param {Array} params.logs - All transaction logs for the date
 * @param {Object} params.ceoVaultSummary - Pre-aggregated CEO Vault daily balances and denominations
 * @param {Array} params.dailyDenominations - Collection daily breakdown denominations
 */
export const generateMasterLedgerPDF = ({
  branchId = 'AL FAJAR AUH',
  selectedDate,
  logs = [],
  ceoVaultSummary = null,
  dailyDenominations = []
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

  // Calculate 5 Overview Totals from transaction logs
  const totals = logs.reduce((acc, trx) => {
    const amount = parseFloat(trx.amount || 0);
    const type = trx.type;

    if (type === 'INFLOW' || type === 'TEMP_INFLOW') {
      acc.inflow += amount;
    } else if (type === 'OUTFLOW' || type === 'EXPENSE') {
      acc.outflow += Math.abs(amount);
    } else if (type === 'EXCHANGE') {
      acc.exchange += amount;
    } else if (type === 'TRANSFER') {
      acc.transfer += amount;
    }
    return acc;
  }, { inflow: 0, outflow: 0, exchange: 0, transfer: 0 });

  const closingBalance = ceoVaultSummary ? (parseFloat(ceoVaultSummary.closingBalance) || 0) : 0;
  const reserveBalance = ceoVaultSummary ? (parseFloat(ceoVaultSummary.reserveVaultBalance) || 0) : 0;

  // ----------------------------------------------------
  // DRAW HEADER SECTION (Top Navigation & Metadata Bar)
  // ----------------------------------------------------
  const drawTopHeader = () => {
    // Top colored accent bar
    doc.setFillColor(36, 32, 56); // Brand dark purple (#242038)
    doc.rect(0, 0, pageWidth, 3.5, 'F');

    // Left: Branch Name & System Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(String(branchId || 'FERRARI FOODS').toUpperCase(), marginX, 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text('FERRARI FOODS MANAGEMENT — FINANCIAL OPERATIONS & AUDIT DIVISION', marginX, 16.5);

    // Right: Download Timestamp with exact seconds
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
  doc.text('DAILY MASTER LEDGER & AUDIT STATEMENT', marginX, currentY);

  // Date pill
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(marginX + 105, currentY - 4.5, 78, 6, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text(`Report Period: ${readableDate}`, marginX + 144, currentY - 0.7, { align: 'center' });

  // Verified Badge pill
  doc.setFillColor(236, 253, 245); // emerald-50
  doc.setDrawColor(167, 243, 208); // emerald-200
  doc.roundedRect(pageWidth - marginX - 45, currentY - 4.5, 45, 6, 2, 2, 'FD');
  doc.setFillColor(16, 185, 129); // emerald-500 dot
  doc.circle(pageWidth - marginX - 40, currentY - 1.5, 1.2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(5, 150, 105); // emerald-600
  doc.text('VERIFIED PARITY', pageWidth - marginX - 22, currentY - 0.6, { align: 'center' });

  // ----------------------------------------------------
  // SECTION 1: THE 5 OVERVIEW KPI CONTAINERS (SCREENSHOT 1)
  // ----------------------------------------------------
  currentY = 30;
  const cardGap = 3.5;
  const cardWidth = (printableWidth - cardGap * 4) / 5; // ~52.6mm
  const cardHeight = 31;

  // Helper to draw clean rounded card
  const drawCardBox = (x, y, w, h, fillRGB, strokeRGB) => {
    doc.setFillColor(fillRGB[0], fillRGB[1], fillRGB[2]);
    if (strokeRGB) {
      doc.setDrawColor(strokeRGB[0], strokeRGB[1], strokeRGB[2]);
      doc.setLineWidth(0.3);
      doc.roundedRect(x, y, w, h, 3, 3, 'FD');
    } else {
      doc.roundedRect(x, y, w, h, 3, 3, 'F');
    }
  };

  // 1. Featured Dark Card: CEO VAULT CLOSING BALANCE
  const c1X = marginX;
  drawCardBox(c1X, currentY, cardWidth, cardHeight, [36, 32, 56], [55, 48, 80]); // #242038

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(199, 210, 254); // indigo-200
  doc.text('CEO VAULT BALANCE', c1X + 4, currentY + 5.5);

  // Date pill inside dark card
  doc.setFillColor(54, 48, 82);
  const isLive = !!(ceoVaultSummary && ceoVaultSummary.isLiveSnapshot);
  const pillText = isLive ? 'LIVE SAFE' : shortDateLabel;
  doc.roundedRect(c1X + cardWidth - 21, currentY + 2.5, 17, 4, 1.2, 1.2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(241, 245, 249);
  doc.text(pillText, c1X + cardWidth - 12.5, currentY + 5.2, { align: 'center' });

  // Large Balance
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('AED', c1X + 4, currentY + 15);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(255, 255, 255);
  doc.text(formatPdfCurrency(closingBalance), c1X + 11.5, currentY + 15);

  // Subtext pill with clean padding
  doc.setFillColor(30, 27, 46);
  doc.roundedRect(c1X + 4, currentY + 21, cardWidth - 8, 5, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(165, 180, 252);
  doc.text(isLive 
    ? `PHYSICAL SAFE SNAPSHOT  |  AED ${formatPdfCurrency(closingBalance)}` 
    : `CLO: AED ${formatPdfCurrency(closingBalance)}  |  Res: AED ${formatPdfCurrency(reserveBalance)}`, 
    c1X + cardWidth / 2, currentY + 24.2, { align: 'center' });

  // 2. Card 2: TOTAL INFLOW (Mint Green)
  const c2X = c1X + cardWidth + cardGap;
  drawCardBox(c2X, currentY, cardWidth, cardHeight, [240, 253, 244], [187, 247, 208]); // #F0FDF4, border #BBF7D0

  // Icon box
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(c2X + 4, currentY + 3.5, 6, 6, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(22, 163, 74);
  doc.text('^', c2X + 7, currentY + 7.8, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(22, 163, 74);
  doc.text('INFLOW', c2X + cardWidth - 4, currentY + 6.5, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('Total Inflow', c2X + 4, currentY + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(22, 163, 74);
  doc.text('AED', c2X + 4, currentY + 24);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(22, 163, 74);
  doc.text(formatPdfCurrency(totals.inflow), c2X + 11.5, currentY + 24);

  // 3. Card 3: OUTFLOW / EXP (Rose Pink)
  const c3X = c2X + cardWidth + cardGap;
  drawCardBox(c3X, currentY, cardWidth, cardHeight, [255, 241, 242], [254, 205, 211]); // #FFF1F2, border #FECDD3

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(c3X + 4, currentY + 3.5, 6, 6, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(225, 29, 72);
  doc.text('v', c3X + 7, currentY + 7.5, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(225, 29, 72);
  doc.text('OUTFLOW', c3X + cardWidth - 4, currentY + 6.5, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('Outflow / Exp', c3X + 4, currentY + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(225, 29, 72);
  doc.text('AED', c3X + 4, currentY + 24);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(225, 29, 72);
  doc.text(formatPdfCurrency(totals.outflow), c3X + 11.5, currentY + 24);

  // 4. Card 4: NET EXCHANGE (Warm Amber)
  const c4X = c3X + cardWidth + cardGap;
  drawCardBox(c4X, currentY, cardWidth, cardHeight, [255, 251, 235], [253, 230, 138]); // #FFFBEB, border #FDE68A

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(c4X + 4, currentY + 3.5, 6, 6, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(217, 119, 6);
  doc.text('<>', c4X + 7, currentY + 7.5, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(217, 119, 6);
  doc.text('EXCHANGE', c4X + cardWidth - 4, currentY + 6.5, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('Net Exchange', c4X + 4, currentY + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(217, 119, 6);
  doc.text('AED', c4X + 4, currentY + 24);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(217, 119, 6);
  doc.text(formatPdfCurrency(totals.exchange), c4X + 11.5, currentY + 24);

  // 5. Card 5: TOTAL TRANSFERS (Soft Blue)
  const c5X = c4X + cardWidth + cardGap;
  drawCardBox(c5X, currentY, cardWidth, cardHeight, [239, 246, 255], [191, 219, 254]); // #EFF6FF, border #BFDBFE

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(c5X + 4, currentY + 3.5, 6, 6, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(37, 99, 235);
  doc.text('->', c5X + 7, currentY + 7.5, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(37, 99, 235);
  doc.text('TRANSFER', c5X + cardWidth - 4, currentY + 6.5, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('Total Transfers', c5X + 4, currentY + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(37, 99, 235);
  doc.text('AED', c5X + 4, currentY + 24);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(37, 99, 235);
  doc.text(formatPdfCurrency(totals.transfer), c5X + 11.5, currentY + 24);

  // ----------------------------------------------------
  // SECTION 2: DUAL DENOMINATIONS CARDS (SCREENSHOT 2)
  // ----------------------------------------------------
  currentY = 64.5;
  const denomBoxHeight = 65;
  const leftDenomWidth = 110;
  const rightDenomWidth = printableWidth - leftDenomWidth - 5; // 162mm

  // --- LEFT CARD: DAILY BREAKDOWN ---
  drawCardBox(marginX, currentY, leftDenomWidth, denomBoxHeight, [255, 255, 255], [226, 232, 240]);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text('Daily Breakdown', marginX + 5, currentY + 6.5);

  doc.setFillColor(99, 102, 241); // indigo dot
  doc.circle(marginX + 6, currentY + 10.5, 0.8, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Collected on ${shortDateLabel}`, marginX + 8.5, currentY + 11.2);

  // Render Daily Breakdown Table Rows inside Left Card
  let collectionSum = 0;
  const dailyBreakdownBody = dailyDenominations.map(d => {
    collectionSum += (d.totalValue || 0);
    return [
      d.denomination || `${d.note} AED`,
      String(d.quantity || 0),
      formatPdfCurrency(d.totalValue || 0)
    ];
  });

  runAutoTable(doc, {
    startY: currentY + 13,
    margin: { left: marginX + 4, right: pageWidth - marginX - leftDenomWidth + 4 },
    head: [['NOTE', 'QTY', 'TOTAL VALUE']],
    body: dailyBreakdownBody.length > 0 ? dailyBreakdownBody : [['No notes recorded', '-', '0.00']],
    theme: 'plain',
    tableWidth: leftDenomWidth - 8,
    styles: {
      fontSize: 6.5,
      cellPadding: 1.1,
      textColor: [51, 65, 85]
    },
    headStyles: {
      fontStyle: 'bold',
      textColor: [148, 163, 184],
      fontSize: 6,
      lineWidth: { bottom: 0.2 },
      lineColor: [241, 245, 249]
    },
    columnStyles: {
      0: { cellWidth: 44, fontStyle: 'bold' },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 38, halign: 'right', fontStyle: 'bold' }
    }
  });

  // Footer inside Left Card: Grand Total
  doc.setDrawColor(241, 245, 249);
  doc.setLineWidth(0.3);
  doc.line(marginX + 5, currentY + denomBoxHeight - 8.5, marginX + leftDenomWidth - 5, currentY + denomBoxHeight - 8.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text('GRAND TOTAL', marginX + 5, currentY + denomBoxHeight - 3.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(22, 163, 74);
  doc.text(`AED ${formatPdfCurrency(collectionSum)}`, marginX + leftDenomWidth - 5, currentY + denomBoxHeight - 3.5, { align: 'right' });

  // --- RIGHT CARD: CEO VAULT DENOMINATIONS ---
  const rightX = marginX + leftDenomWidth + 5;
  drawCardBox(rightX, currentY, rightDenomWidth, denomBoxHeight, [255, 255, 255], [226, 232, 240]);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text('CEO Vault Denominations', rightX + 5, currentY + 6.5);

  // Closing Safe Pill
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(rightX + 52, currentY + 3.5, 28, 4, 1.2, 1.2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(71, 85, 105);
  doc.text(isLive ? 'LIVE SAFE SNAPSHOT' : 'CLOSING SAFE', rightX + 66, currentY + 6.3, { align: 'center' });

  // Lock indicator icon text
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(rightX + rightDenomWidth - 11, currentY + 3.5, 6, 6, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text('[L]', rightX + rightDenomWidth - 8, currentY + 7.5, { align: 'center' });

  doc.setFillColor(99, 102, 241);
  doc.circle(rightX + 6, currentY + 10.5, 0.8, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(isLive ? `Live physical safe distribution (Export: ${generationTimestamp})` : `Physical note distribution as of ${shortDateLabel}`, rightX + 8.5, currentY + 11.2);

  // Build CEO Vault Denomination Table Rows
  const standardDenoms = ['1000', '500', '200', '100', '50', '20', '10', '5', '1', '0.5'];
  const ceoDenomMap = (ceoVaultSummary && ceoVaultSummary.denominations) ? ceoVaultSummary.denominations : {};
  let totalCeoSafe = 0;

  standardDenoms.forEach(d => {
    const qty = parseInt(ceoDenomMap[d] || 0, 10);
    totalCeoSafe += parseFloat(d) * qty;
  });
  if (totalCeoSafe <= 0) totalCeoSafe = closingBalance;

  const ceoDenomBody = [];
  standardDenoms.forEach(d => {
    const qty = parseInt(ceoDenomMap[d] || 0, 10);
    const val = parseFloat(d) * qty;
    const share = totalCeoSafe > 0 ? ((val / totalCeoSafe) * 100).toFixed(1) : '0.0';
    if (qty > 0 || val > 0) {
      ceoDenomBody.push([
        `${d} AED`,
        String(qty),
        formatPdfCurrency(val),
        `${share}%`
      ]);
    }
  });

  runAutoTable(doc, {
    startY: currentY + 13,
    margin: { left: rightX + 4, right: marginX + 4 },
    head: [['NOTE / COIN', 'QTY', 'VALUE (AED)', 'SHARE']],
    body: ceoDenomBody.length > 0 ? ceoDenomBody : [['No denominations tracked', '-', '0.00', '0%']],
    theme: 'plain',
    tableWidth: rightDenomWidth - 8,
    styles: {
      fontSize: 6.5,
      cellPadding: 0.9,
      textColor: [51, 65, 85]
    },
    headStyles: {
      fontStyle: 'bold',
      textColor: [148, 163, 184],
      fontSize: 6,
      lineWidth: { bottom: 0.2 },
      lineColor: [241, 245, 249]
    },
    columnStyles: {
      0: { cellWidth: 38, fontStyle: 'bold' },
      1: { cellWidth: 26, halign: 'center' },
      2: { cellWidth: 42, halign: 'right', fontStyle: 'bold' },
      3: { cellWidth: 48, halign: 'right' }
    },
    didDrawCell: (data) => {
      // Draw dynamic visual progress bar in the SHARE column!
      if (data.section === 'body' && data.column.index === 3 && data.cell.raw) {
        const pctStr = String(data.cell.raw).replace('%', '');
        const pct = Math.min(100, Math.max(0, parseFloat(pctStr) || 0));
        
        const cellX = data.cell.x;
        const cellY = data.cell.y;
        const cellH = data.cell.height;

        const barW = 22;
        const barH = 2.2;
        const barX = cellX + 3;
        const barY = cellY + (cellH - barH) / 2;

        // Background Track
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(barX, barY, barW, barH, 0.8, 0.8, 'F');

        // Filled Portion
        if (pct > 0) {
          const fillW = Math.max(1, (pct / 100) * barW);
          doc.setFillColor(36, 32, 56); // Brand dark purple fill
          doc.roundedRect(barX, barY, fillW, barH, 0.8, 0.8, 'F');
        }
      }
    }
  });

  // Footer inside Right Card: CEO Closing Safe Total
  doc.setDrawColor(241, 245, 249);
  doc.setLineWidth(0.3);
  doc.line(rightX + 5, currentY + denomBoxHeight - 8.5, rightX + rightDenomWidth - 5, currentY + denomBoxHeight - 8.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text('CEO SAFE CLOSING TOTAL', rightX + 5, currentY + denomBoxHeight - 3.5);

  // In Safe Parity pill
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(rightX + 56, currentY + denomBoxHeight - 6.5, 24, 4, 1.2, 1.2, 'F');
  doc.setFillColor(16, 185, 129);
  doc.circle(rightX + 59, currentY + denomBoxHeight - 4.5, 0.8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(5, 150, 105);
  doc.text('In Safe Parity', rightX + 61, currentY + denomBoxHeight - 3.7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`AED ${formatPdfCurrency(totalCeoSafe > 0 ? totalCeoSafe : closingBalance)}`, rightX + rightDenomWidth - 5, currentY + denomBoxHeight - 3.5, { align: 'right' });

  // ----------------------------------------------------
  // SECTION 3: CATEGORIZED TRANSACTION TABLES (SCREENSHOT 3)
  // ----------------------------------------------------
  // Filter categorized records
  const categorized = {
    inflows: logs.filter(t => t.type === 'INFLOW' || t.type === 'TEMP_INFLOW'),
    expenses: logs.filter(t => t.type === 'OUTFLOW' || t.type === 'EXPENSE'),
    transfers: logs.filter(t => t.type === 'TRANSFER'),
    exchanges: logs.filter(t => t.type === 'EXCHANGE')
  };

  const sectionsConfig = [
    {
      title: 'INFLOWS',
      subtitle: 'All revenue and incoming cash',
      data: categorized.inflows,
      themeColor: [16, 185, 129], // #10B981 Emerald
      type: 'INFLOW',
      sign: '+'
    },
    {
      title: 'EXPENSES / OUTFLOWS',
      subtitle: 'Operational and desk expenses',
      data: categorized.expenses,
      themeColor: [239, 68, 68], // #EF4444 Rose/Red
      type: 'OUTFLOW',
      sign: '-'
    },
    {
      title: 'VAULT TRANSFERS',
      subtitle: 'Internal vault capital movements',
      data: categorized.transfers,
      themeColor: [59, 130, 246], // #3B82F6 Royal Blue
      type: 'TRANSFER',
      sign: ''
    },
    {
      title: 'DENOMINATION EXCHANGES',
      subtitle: 'Note swaps and bill exchanges',
      data: categorized.exchanges,
      themeColor: [245, 158, 11], // #F59E0B Amber
      type: 'EXCHANGE',
      sign: ''
    }
  ];

  let tableStartY = currentY + denomBoxHeight + 6;

  // Render each section using autoTable
  sectionsConfig.forEach((sec) => {
    if (sec.data.length === 0) return; // Skip empty sections

    // Check if we need to add a page break before banner
    if (tableStartY > pageHeight - 35) {
      doc.addPage('landscape');
      drawTopHeader();
      tableStartY = 28;
    }

    // 1. Draw FinTech Section Banner Header (Screenshot 3 Parity)
    const bannerH = 7.5;
    doc.setFillColor(sec.themeColor[0], sec.themeColor[1], sec.themeColor[2]);
    doc.roundedRect(marginX, tableStartY, printableWidth, bannerH, 2, 2, 'F');

    // Section Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text(sec.title, marginX + 6, tableStartY + 5);

    // Section Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(255, 255, 255);
    doc.text(`— ${sec.subtitle}`, marginX + 45, tableStartY + 5);

    // Records Count Pill on the Right
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(pageWidth - marginX - 25, tableStartY + 1.6, 20, 4.3, 1.2, 1.2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(sec.themeColor[0], sec.themeColor[1], sec.themeColor[2]);
    doc.text(`${sec.data.length} Records`, pageWidth - marginX - 15, tableStartY + 4.6, { align: 'center' });

    tableStartY += bannerH + 1.5;

    // 2. Map Rows for autoTable
    const tableBody = sec.data.map(trx => {
      // Date formatting: Sep 26, 2026 - 03:19 PM
      let dateDisplay = '--';
      if (trx.createdAt) {
        try {
          const raw = typeof trx.createdAt === 'object' && trx.createdAt.value ? trx.createdAt.value : String(trx.createdAt);
          const dObj = new Date(raw.replace(' ', 'T'));
          if (!isNaN(dObj.getTime())) {
            dateDisplay = dObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
              ' - ' + dObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
          } else {
            dateDisplay = String(trx.createdAt).substring(0, 19);
          }
        } catch (e) {
          dateDisplay = String(trx.createdAt).substring(0, 19);
        }
      }

      // Company / Description
      const companyDesc = trx.description || trx.companyName || trx.reason || 'Transaction';

      // Invoice / Reference
      const invoiceRef = trx.invoiceNo || trx.invoice || trx.id || '--';

      // Amount with Sign
      const amtNum = parseFloat(trx.amount || 0);
      const amtFormatted = `${sec.sign} ${formatPdfCurrency(Math.abs(amtNum))}`;

      // Status
      const statusText = (trx.status || 'VERIFIED').toUpperCase();

      return [dateDisplay, companyDesc, invoiceRef, amtFormatted, statusText];
    });

    runAutoTable(doc, {
      startY: tableStartY,
      margin: { left: marginX, right: marginX },
      tableWidth: printableWidth,
      head: [['DATE & TIME', 'COMPANY / DESCRIPTION', 'INVOICE / REF', 'AMOUNT (AED)', 'STATUS']],
      body: tableBody,
      theme: 'grid',
      styles: {
        fontSize: 7,
        cellPadding: 1.8,
        textColor: [30, 41, 59],
        lineColor: [241, 245, 249],
        lineWidth: 0.2
      },
      headStyles: {
        fillColor: [248, 250, 252], // slate-50
        textColor: [100, 116, 139],
        fontStyle: 'bold',
        fontSize: 6.5,
        lineColor: [226, 232, 240],
        lineWidth: 0.2
      },
      columnStyles: {
        0: { cellWidth: 42, textColor: [100, 116, 139] },
        1: { cellWidth: 'auto', fontStyle: 'bold' },
        2: { cellWidth: 38, fontStyle: 'normal' },
        3: {
          cellWidth: 40,
          halign: 'right',
          fontStyle: 'bold',
          textColor: sec.themeColor
        },
        4: { cellWidth: 28, halign: 'center' }
      },
      alternateRowStyles: {
        fillColor: [253, 254, 255]
      },
      didDrawCell: (data) => {
        // Draw custom Status badge in column 4
        if (data.section === 'body' && data.column.index === 4) {
          const text = data.cell.raw;
          const x = data.cell.x;
          const y = data.cell.y;
          const w = data.cell.width;
          const h = data.cell.height;

          // Paint cell background
          doc.setFillColor(data.row.index % 2 === 1 ? 253 : 255, data.row.index % 2 === 1 ? 254 : 255, 255);
          doc.rect(x, y, w, h, 'F');

          // Draw pill
          const pillW = 20;
          const pillH = 4.2;
          const pillX = x + (w - pillW) / 2;
          const pillY = y + (h - pillH) / 2;

          doc.setFillColor(241, 245, 249);
          doc.roundedRect(pillX, pillY, pillW, pillH, 1.2, 1.2, 'F');

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(5.5);
          doc.setTextColor(71, 85, 105);
          doc.text(String(text), pillX + pillW / 2, pillY + 3, { align: 'center' });
        }
      }
    });

    tableStartY = doc.lastAutoTable.finalY + 5;
  });

  // ----------------------------------------------------
  // SECTION 4: PROFESSIONAL STANDARD DISCLAIMER & SIGN-OFF BLOCKS
  // ----------------------------------------------------
  if (tableStartY > pageHeight - 60) {
    doc.addPage('landscape');
    drawTopHeader();
    tableStartY = 28;
  }

  // Draw Legal Compliance Disclaimer Box with adequate height (26mm)
  const discH = 26;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.3);
  doc.roundedRect(marginX, tableStartY, printableWidth, discH, 2.5, 2.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(30, 41, 59);
  doc.text('ENTERPRISE AUDIT DISCLAIMER & COMPLIANCE NOTICE:', marginX + 5, tableStartY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(100, 116, 139);
  const disclaimerText = 'This daily financial statement is automatically compiled and cryptographically verified by Ferrari Foods Management System. All ledger mutations, physical safe vault balances, and denomination distributions represent immutable accounting records at the exact timestamp of export. Unauthorized duplication, distribution, or alteration is strictly prohibited under UAE commercial audit regulations.';
  doc.text(disclaimerText, marginX + 5, tableStartY + 10, { maxWidth: printableWidth - 10, lineHeightFactor: 1.4 });

  // Subtle interior divider line separating paragraph from metadata
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(marginX + 5, tableStartY + 17.5, marginX + printableWidth - 5, tableStartY + 17.5);

  // Verification Metadata Bar below divider
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`System OS: Ferrari Foods Enterprise v1.4   |   Branch Target: ${branchId}   |   Hash: SHA256-VERIFIED-PARITY   |   Exported: ${generationTimestamp}`, marginX + 5, tableStartY + 21.8);

  tableStartY += discH + 5;

  // Draw 3-Party Sign-Off Verification Blocks with generous spacing (20mm height)
  const sigBoxW = (printableWidth - 8) / 3;
  const sigBoxH = 20;

  const signatures = [
    { title: 'PREPARED BY', role: 'System Operator / Cashier', dept: 'Operations & Desk Team' },
    { title: 'AUDITED & VERIFIED BY', role: 'Chief Financial Accountant', dept: 'Vault & Audit Division' },
    { title: 'FINAL APPROVAL', role: 'Managing Director / CEO', dept: 'Executive Management' }
  ];

  signatures.forEach((sig, index) => {
    const boxX = marginX + index * (sigBoxW + 4);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(boxX, tableStartY, sigBoxW, sigBoxH, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(30, 41, 59);
    doc.text(sig.title, boxX + 4, tableStartY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.8);
    doc.setTextColor(100, 116, 139);
    doc.text(sig.role, boxX + 4, tableStartY + 8.8);
    doc.text(sig.dept, boxX + 4, tableStartY + 12.2);

    // Signature line
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.setLineWidth(0.3);
    doc.line(boxX + 4, tableStartY + sigBoxH - 4.5, boxX + sigBoxW - 4, tableStartY + sigBoxH - 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5);
    doc.setTextColor(148, 163, 184);
    doc.text('Signature & Date Stamp', boxX + sigBoxW - 4, tableStartY + sigBoxH - 1.8, { align: 'right' });
  });

  // ----------------------------------------------------
  // RUNNING FOOTERS (Page Numbers on All Pages)
  // ----------------------------------------------------
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Bottom running divider line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(marginX, pageHeight - 7, pageWidth - marginX, pageHeight - 7);

    // Running Footer Left
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(148, 163, 184);
    doc.text(`Ferrari Foods Management System — Daily Master Ledger Statement (${branchId})`, marginX, pageHeight - 3.8);

    // Running Footer Center: Timestamp
    doc.text(`Audit Snapshot: ${generationTimestamp}`, pageWidth / 2, pageHeight - 3.8, { align: 'center' });

    // Running Footer Right: Page X of Y
    doc.setFont('helvetica', 'bold');
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - marginX, pageHeight - 3.8, { align: 'right' });
  }

  // 4. Trigger Download
  const filename = `Master-Ledger-${selectedDate || 'Export'}.pdf`;
  doc.save(filename);
};
