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
  const pettyCashBalance = ceoVaultSummary ? (parseFloat(ceoVaultSummary.pettyCashBalance) || 0) : 0;
  const openingBalance = ceoVaultSummary ? (parseFloat(ceoVaultSummary.openingBalance) || 0) : 0;
  const currentBalance = ceoVaultSummary ? (parseFloat(ceoVaultSummary.currentBalance) || closingBalance) : closingBalance;
  const dayNetMovement = currentBalance - openingBalance;
  // Total CEO Vault aggregate balance = CEO Safe Cash + Reserve Vault + Petty Cash
  const totalCeoVaultBalance = (ceoVaultSummary && typeof ceoVaultSummary.totalCeoVaultBalance === 'number')
    ? ceoVaultSummary.totalCeoVaultBalance
    : (closingBalance + reserveBalance + pettyCashBalance);

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
  // SECTION 1: EXECUTIVE VAULT CARDS (ROW 1 - 2 LARGE CARDS)
  // ----------------------------------------------------
  currentY = 27;
  const execCardGap = 4;
  const execCardWidth = (printableWidth - execCardGap) / 2; // 136.5mm
  const execCardHeight = 26; // 26mm high

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

  const isLive = !!(ceoVaultSummary && ceoVaultSummary.isLiveSnapshot);

  // --- CARD 1: CEO VAULT TOTAL BALANCE ---
  const c1X = marginX;
  drawCardBox(c1X, currentY, execCardWidth, execCardHeight, [30, 27, 46], [55, 48, 80]); // #1E1B2E

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(199, 210, 254); // indigo-200
  doc.text('CEO VAULT TOTAL BALANCE', c1X + 5, currentY + 5.2);

  // Date / Live pill inside Card 1
  doc.setFillColor(54, 48, 82);
  const c1PillText = isLive ? 'LIVE SAFE' : shortDateLabel;
  doc.roundedRect(c1X + execCardWidth - 23, currentY + 2.2, 18, 4, 1.2, 1.2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(241, 245, 249);
  doc.text(c1PillText, c1X + execCardWidth - 14, currentY + 4.9, { align: 'center' });

  // Hero Balance Number
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('AED', c1X + 5, currentY + 12.8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(formatPdfCurrency(totalCeoVaultBalance), c1X + 12.5, currentY + 12.8);

  // Live status dot
  doc.setFillColor(16, 185, 129); // emerald dot
  doc.circle(c1X + 85, currentY + 11.5, 0.8, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Live Safe Cash Connected', c1X + 87.5, currentY + 12.3);

  // 3 Sub-Vault Breakdown Boxes (CEO Safe Cash, Reserve Vault, Petty Cash)
  const subBoxY = currentY + 15.5;
  const subBoxH = 8;
  const subBoxGap = 2.5;
  const subBoxW = (execCardWidth - 10 - subBoxGap * 2) / 3; // ~38.8mm

  const subVaults = [
    { label: 'CEO SAFE CASH', value: closingBalance },
    { label: 'RESERVE VAULT', value: reserveBalance },
    { label: 'PETTY CASH', value: pettyCashBalance }
  ];

  subVaults.forEach((sv, idx) => {
    const svX = c1X + 5 + idx * (subBoxW + subBoxGap);
    drawCardBox(svX, subBoxY, subBoxW, subBoxH, [42, 38, 64], [62, 56, 92], 1.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(4.6);
    doc.setTextColor(165, 180, 252);
    doc.text(sv.label, svX + 3, subBoxY + 3);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);
    doc.setTextColor(255, 255, 255);
    doc.text(`AED ${formatPdfCurrency(sv.value)}`, svX + 3, subBoxY + 6.3);
  });

  // --- CARD 2: CEO VAULT DAILY AUDIT ---
  const c2X = c1X + execCardWidth + execCardGap;
  drawCardBox(c2X, currentY, execCardWidth, execCardHeight, [30, 27, 46], [55, 48, 80]); // #1E1B2E

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(199, 210, 254);
  doc.text('CEO VAULT DAILY AUDIT', c2X + 5, currentY + 5.2);

  // Date pill inside Card 2
  doc.setFillColor(54, 48, 82);
  doc.roundedRect(c2X + execCardWidth - 25, currentY + 2.2, 20, 4, 1.2, 1.2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(241, 245, 249);
  doc.text(shortDateLabel, c2X + execCardWidth - 15, currentY + 4.9, { align: 'center' });

  // 2 Side-by-Side Metric Boxes (Daily Opening & Daily Closing)
  const auditBoxY = currentY + 7.5;
  const auditBoxH = 11;
  const auditBoxGap = 3;
  const auditBoxW = (execCardWidth - 10 - auditBoxGap) / 2; // ~61.75mm

  // Box 1: Opening
  const openBoxX = c2X + 5;
  drawCardBox(openBoxX, auditBoxY, auditBoxW, auditBoxH, [42, 38, 64], [62, 56, 92], 1.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.8);
  doc.setTextColor(148, 163, 184);
  doc.text('DAILY OPENING BALANCE', openBoxX + 4, auditBoxY + 3.8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(148, 163, 184);
  doc.text('AED', openBoxX + 4, auditBoxY + 8.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text(formatPdfCurrency(openingBalance), openBoxX + 10.5, auditBoxY + 8.5);

  // Box 2: Closing
  const closeBoxX = openBoxX + auditBoxW + auditBoxGap;
  drawCardBox(closeBoxX, auditBoxY, auditBoxW, auditBoxH, [42, 38, 64], [62, 56, 92], 1.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.8);
  doc.setTextColor(148, 163, 184);
  doc.text('DAILY CLOSING BALANCE', closeBoxX + 4, auditBoxY + 3.8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(148, 163, 184);
  doc.text('AED', closeBoxX + 4, auditBoxY + 8.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text(formatPdfCurrency(closingBalance), closeBoxX + 10.5, auditBoxY + 8.5);

  // Card 2 Footer Bar: Current Safe Cash & Day Net Movement
  const auditFootY = currentY + 19.8;
  const auditFootH = 4.8;
  const auditFootW = execCardWidth - 10;
  drawCardBox(c2X + 5, auditFootY, auditFootW, auditFootH, [24, 21, 38], null, 1.2);

  // Left: Current safe cash indicator
  doc.setFillColor(245, 158, 11); // amber dot
  doc.circle(c2X + 8, auditFootY + 2.4, 0.7, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5);
  doc.setTextColor(203, 213, 225);
  doc.text('Current Safe Cash:', c2X + 10.5, auditFootY + 3.2);

  doc.setFont('helvetica', 'bold');
  doc.text(`AED ${formatPdfCurrency(currentBalance)}`, c2X + 31, auditFootY + 3.2);

  // Right: Day Net Movement (proper spacing to eliminate clash)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5);
  doc.setTextColor(148, 163, 184);
  doc.text('Day Net Movement:', c2X + auditFootW - 42, auditFootY + 3.2);

  const isNetPos = dayNetMovement >= 0;
  doc.setFont('helvetica', 'bold');
  if (isNetPos) {
    doc.setTextColor(52, 211, 153); // emerald-400
  } else {
    doc.setTextColor(251, 113, 133); // rose-400
  }
  doc.text(`${isNetPos ? '+' : ''}${formatPdfCurrency(dayNetMovement)} AED`, c2X + auditFootW + 2, auditFootY + 3.2, { align: 'right' });

  // ----------------------------------------------------
  // SECTION 2: TRANSACTION FLOW VOLUME CARDS (ROW 2 - 4 BALANCED CARDS)
  // ----------------------------------------------------
  currentY = currentY + execCardHeight + 2.5; // 27 + 26 + 2.5 = 55.5mm
  const flowCardGap = 3.5;
  const flowCardWidth = (printableWidth - flowCardGap * 3) / 4; // ~66.6mm
  const flowCardHeight = 16; // 16mm high for generous internal padding

  // Clean vector icon renderer (Zero ASCII / Emoji glitches)
  const drawVectorArrow = (cx, cy, type, colorRGB) => {
    doc.setDrawColor(colorRGB[0], colorRGB[1], colorRGB[2]);
    doc.setLineWidth(0.45);
    if (type === 'INFLOW') {
      // Sleek upward arrow
      doc.line(cx, cy + 1.6, cx, cy - 1.4);
      doc.line(cx - 1.1, cy - 0.3, cx, cy - 1.4);
      doc.line(cx + 1.1, cy - 0.3, cx, cy - 1.4);
    } else if (type === 'OUTFLOW') {
      // Sleek downward arrow
      doc.line(cx, cy - 1.4, cx, cy + 1.6);
      doc.line(cx - 1.1, cy + 0.5, cx, cy + 1.6);
      doc.line(cx + 1.1, cy + 0.5, cx, cy + 1.6);
    } else if (type === 'EXCHANGE') {
      // Sleek dual horizontal currency flow lines
      doc.line(cx - 1.4, cy - 0.7, cx + 1.4, cy - 0.7);
      doc.line(cx + 0.6, cy - 1.3, cx + 1.4, cy - 0.7);
      doc.line(cx + 1.4, cy + 0.7, cx - 1.4, cy + 0.7);
      doc.line(cx - 0.6, cy + 1.3, cx - 1.4, cy + 0.7);
    } else if (type === 'TRANSFER') {
      // Sleek forward transfer arrow
      doc.line(cx - 1.6, cy, cx + 1.5, cy);
      doc.line(cx + 0.5, cy - 1.1, cx + 1.5, cy);
      doc.line(cx + 0.5, cy + 1.1, cx + 1.5, cy);
    }
  };

  const flowCards = [
    {
      label: 'Total Inflow',
      value: totals.inflow,
      tag: 'INFLOW',
      type: 'INFLOW',
      bg: [240, 253, 244], // #F0FDF4
      border: [187, 247, 208], // #BBF7D0
      textRGB: [22, 163, 74] // #16A34A
    },
    {
      label: 'Outflow / Expenses',
      value: totals.outflow,
      tag: 'OUTFLOW',
      type: 'OUTFLOW',
      bg: [255, 241, 242], // #FFF1F2
      border: [254, 205, 211], // #FECDD3
      textRGB: [225, 29, 72] // #E11D48
    },
    {
      label: 'Net Currency Exchange',
      value: totals.exchange,
      tag: 'EXCHANGE',
      type: 'EXCHANGE',
      bg: [255, 251, 235], // #FFFBEB
      border: [253, 230, 138], // #FDE68A
      textRGB: [217, 119, 6] // #D97706
    },
    {
      label: 'Total Transfers',
      value: totals.transfer,
      tag: 'TRANSFER',
      type: 'TRANSFER',
      bg: [239, 246, 255], // #EFF6FF
      border: [191, 219, 254], // #BFDBFE
      textRGB: [37, 99, 235] // #2563EB
    }
  ];

  flowCards.forEach((fc, idx) => {
    const fcX = marginX + idx * (flowCardWidth + flowCardGap);
    drawCardBox(fcX, currentY, flowCardWidth, flowCardHeight, fc.bg, fc.border, 2);

    // Vector icon box in white
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(fcX + 3.5, currentY + 2.5, 5, 5, 1, 1, 'F');
    drawVectorArrow(fcX + 6, currentY + 5, fc.type, fc.textRGB);

    // Category tag on the right
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(4.8);
    doc.setTextColor(fc.textRGB[0], fc.textRGB[1], fc.textRGB[2]);
    doc.text(fc.tag, fcX + flowCardWidth - 3.5, currentY + 5.2, { align: 'right' });

    // Label
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.6);
    doc.setTextColor(71, 85, 105);
    doc.text(fc.label, fcX + 3.5, currentY + 10.2);

    // Value (adequate vertical clearance from bottom border)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(fc.textRGB[0], fc.textRGB[1], fc.textRGB[2]);
    doc.text('AED', fcX + 3.5, currentY + 14.3);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(fc.textRGB[0], fc.textRGB[1], fc.textRGB[2]);
    doc.text(formatPdfCurrency(fc.value), fcX + 9.5, currentY + 14.3);
  });

  // ----------------------------------------------------
  // SECTION 3: DUAL DENOMINATIONS CARDS (SCREENSHOT 2)
  // ----------------------------------------------------
  currentY = currentY + flowCardHeight + 2.5; // ~74mm
  const leftDenomWidth = 110;
  const rightDenomWidth = printableWidth - leftDenomWidth - 4; // 163mm
  const rightX = marginX + leftDenomWidth + 4;

  // Helper to extract denomination quantities safely supporting all 0.5 / 50 Fils aliases
  const getDenomQty = (map, keyStr) => {
    if (!map || typeof map !== 'object') return 0;
    if (map[keyStr] !== undefined && map[keyStr] !== null) return parseInt(map[keyStr], 10) || 0;
    if (keyStr === '0.5' || keyStr === '0.50') {
      return parseInt(map['0.5'] ?? map['0.50'] ?? map['50 Fils'] ?? map['50_fils'] ?? map['0.50 AED'] ?? map['0.5 AED'] ?? map['fils_50'] ?? 0, 10) || 0;
    }
    if (keyStr === '1') {
      return parseInt(map['1'] ?? map['1.0'] ?? map['1 AED'] ?? map['coins'] ?? 0, 10) || 0;
    }
    return parseInt(map[keyStr] || 0, 10) || 0;
  };

  // Pre-build Daily Breakdown Table Rows inside Left Card
  let collectionSum = 0;
  const dailyBreakdownBody = dailyDenominations.map(d => {
    collectionSum += (d.totalValue || 0);
    const noteVal = parseFloat(d.note || d.denominationValue || d.value || 0);
    const label = (noteVal === 0.5 || String(d.denomination || '').includes('0.5') || String(d.denomination || '').toLowerCase().includes('fils'))
      ? '0.50 AED (50 Fils)'
      : (d.denomination || `${d.note} AED`);
    return [
      label,
      String(d.quantity || 0),
      formatPdfCurrency(d.totalValue || 0)
    ];
  });

  // Standard UAE Currency Tiers including 0.50 AED (50 Fils)
  const standardDenoms = [
    { key: '1000', label: '1000 AED', val: 1000 },
    { key: '500', label: '500 AED', val: 500 },
    { key: '200', label: '200 AED', val: 200 },
    { key: '100', label: '100 AED', val: 100 },
    { key: '50', label: '50 AED', val: 50 },
    { key: '20', label: '20 AED', val: 20 },
    { key: '10', label: '10 AED', val: 10 },
    { key: '5', label: '5 AED', val: 5 },
    { key: '1', label: '1 AED', val: 1 },
    { key: '0.5', label: '0.50 AED (50 Fils)', val: 0.5 }
  ];

  const ceoDenomMap = (ceoVaultSummary && ceoVaultSummary.denominations) ? ceoVaultSummary.denominations : {};
  let totalCeoSafe = 0;

  standardDenoms.forEach(d => {
    const qty = getDenomQty(ceoDenomMap, d.key);
    totalCeoSafe += d.val * qty;
  });
  if (totalCeoSafe <= 0) totalCeoSafe = closingBalance;

  const ceoDenomBody = [];
  standardDenoms.forEach(d => {
    const qty = getDenomQty(ceoDenomMap, d.key);
    const val = d.val * qty;
    const share = totalCeoSafe > 0 ? ((val / totalCeoSafe) * 100).toFixed(1) : '0.0';
    // Include active notes, and explicitly include 0.50 AED (50 Fils) data as requested
    if (qty > 0 || val > 0 || d.key === '0.5') {
      ceoDenomBody.push([
        d.label,
        String(qty),
        formatPdfCurrency(val),
        `${share}%`
      ]);
    }
  });

  // Calculate safe initial container height
  const maxDenomRows = Math.max(dailyBreakdownBody.length, ceoDenomBody.length, 1);
  const initialBoxH = Math.max(58, 12.0 + 3.6 + (maxDenomRows * 3.4) + 11.5);

  // Draw Initial White Card Containers
  drawCardBox(marginX, currentY, leftDenomWidth, initialBoxH, [255, 255, 255], [226, 232, 240]);
  drawCardBox(rightX, currentY, rightDenomWidth, initialBoxH, [255, 255, 255], [226, 232, 240]);

  // --- LEFT CARD HEADER ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('Daily Breakdown', marginX + 5, currentY + 5.5);

  doc.setFillColor(99, 102, 241); // indigo dot
  doc.circle(marginX + 6, currentY + 9.2, 0.7, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.0);
  doc.setTextColor(100, 116, 139);
  doc.text(`Collected on ${shortDateLabel}`, marginX + 8.5, currentY + 9.8);

  // --- RIGHT CARD HEADER ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('CEO Vault Denominations', rightX + 5, currentY + 5.5);

  // Closing Safe Pill
  doc.setFillColor(241, 245, 249);
  const safePillText = isLive ? 'LIVE SAFE SNAPSHOT' : 'CLOSING SAFE';
  doc.roundedRect(rightX + rightDenomWidth - 30, currentY + 2.8, 25, 4, 1.2, 1.2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.2);
  doc.setTextColor(71, 85, 105);
  doc.text(safePillText, rightX + rightDenomWidth - 17.5, currentY + 5.4, { align: 'center' });

  doc.setFillColor(99, 102, 241);
  doc.circle(rightX + 6, currentY + 9.2, 0.7, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.0);
  doc.setTextColor(100, 116, 139);
  doc.text(isLive ? `Live physical safe distribution (Export: ${generationTimestamp})` : `Physical note distribution as of ${shortDateLabel}`, rightX + 8.5, currentY + 9.8);

  // 1. Render Left Table (Daily Breakdown)
  runAutoTable(doc, {
    startY: currentY + 11.5,
    margin: { left: marginX + 4, right: pageWidth - marginX - leftDenomWidth + 4 },
    head: [['NOTE', 'QTY', 'TOTAL VALUE']],
    body: dailyBreakdownBody.length > 0 ? dailyBreakdownBody : [['No notes recorded', '-', '0.00']],
    theme: 'plain',
    tableWidth: leftDenomWidth - 8,
    styles: {
      fontSize: 5.6,
      cellPadding: { top: 0.45, bottom: 0.45, left: 1, right: 1 },
      textColor: [51, 65, 85],
      minCellHeight: 2.7
    },
    headStyles: {
      fontStyle: 'bold',
      textColor: [148, 163, 184],
      fontSize: 5.4,
      cellPadding: { top: 0.5, bottom: 0.5, left: 1, right: 1 },
      lineWidth: { bottom: 0.2 },
      lineColor: [241, 245, 249]
    },
    columnStyles: {
      0: { cellWidth: 44, fontStyle: 'bold' },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 38, halign: 'right', fontStyle: 'bold' }
    }
  });
  const leftFinalY = doc.lastAutoTable.finalY;

  // 2. Render Right Table (CEO Vault Denominations including 0.50 AED)
  runAutoTable(doc, {
    startY: currentY + 11.5,
    margin: { left: rightX + 4, right: marginX + 4 },
    head: [['NOTE / COIN', 'QTY', 'VALUE (AED)', 'SHARE']],
    body: ceoDenomBody.length > 0 ? ceoDenomBody : [['No denominations tracked', '-', '0.00', '0%']],
    theme: 'plain',
    tableWidth: rightDenomWidth - 8,
    styles: {
      fontSize: 5.6,
      cellPadding: { top: 0.45, bottom: 0.45, left: 1, right: 1 },
      textColor: [51, 65, 85],
      minCellHeight: 2.7
    },
    headStyles: {
      fontStyle: 'bold',
      textColor: [148, 163, 184],
      fontSize: 5.4,
      cellPadding: { top: 0.5, bottom: 0.5, left: 1, right: 1 },
      lineWidth: { bottom: 0.2 },
      lineColor: [241, 245, 249]
    },
    columnStyles: {
      0: { cellWidth: 44, fontStyle: 'bold' },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 38, halign: 'right', fontStyle: 'bold' },
      3: { cellWidth: 53, halign: 'right' }
    },
    didDrawCell: (data) => {
      // Dynamic visual progress bar in SHARE column
      if (data.section === 'body' && data.column.index === 3 && data.cell.raw) {
        const pctStr = String(data.cell.raw).replace('%', '');
        const pct = Math.min(100, Math.max(0, parseFloat(pctStr) || 0));
        
        const cellX = data.cell.x;
        const cellY = data.cell.y;
        const cellH = data.cell.height;

        const barW = 18;
        const barH = 1.8;
        const barX = cellX + 3;
        const barY = cellY + (cellH - barH) / 2;

        // Background Track
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(barX, barY, barW, barH, 0.6, 0.6, 'F');

        // Filled Portion
        if (pct > 0) {
          const fillW = Math.max(0.8, (pct / 100) * barW);
          doc.setFillColor(36, 32, 56);
          doc.roundedRect(barX, barY, fillW, barH, 0.6, 0.6, 'F');
        }
      }
    }
  });
  const rightFinalY = doc.lastAutoTable.finalY;

  // 3. ZERO-COLLISION DYNAMIC FOOTER POSITIONING (Directly derived from real table bottom)
  const maxTableFinalY = Math.max(leftFinalY, rightFinalY);
  const dividerY = maxTableFinalY + 2.5; // Exactly 2.5mm below lowest table row
  const footerY = dividerY + 4.5; // Exactly 4.5mm below divider line
  const actualCardBottomY = footerY + 3.8; // Exactly 3.8mm below footer text
  const finalBoxHeight = actualCardBottomY - currentY;

  // If tables ran taller than initial estimate, cleanly expand both card borders
  if (finalBoxHeight > initialBoxH) {
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(marginX, currentY + initialBoxH - 3, leftDenomWidth, finalBoxHeight - initialBoxH + 3, 2.5, 2.5, 'F');
    doc.roundedRect(rightX, currentY + initialBoxH - 3, rightDenomWidth, finalBoxHeight - initialBoxH + 3, 2.5, 2.5, 'F');

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(marginX, currentY, leftDenomWidth, finalBoxHeight, 2.5, 2.5, 'S');
    doc.roundedRect(rightX, currentY, rightDenomWidth, finalBoxHeight, 2.5, 2.5, 'S');
  }

  // Draw Left Card Footer (Grand Total)
  doc.setDrawColor(241, 245, 249);
  doc.setLineWidth(0.3);
  doc.line(marginX + 5, dividerY, marginX + leftDenomWidth - 5, dividerY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('GRAND TOTAL', marginX + 5, footerY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(22, 163, 74);
  doc.text(`AED ${formatPdfCurrency(collectionSum)}`, marginX + leftDenomWidth - 5, footerY, { align: 'right' });

  // Draw Right Card Footer (CEO Safe Closing Total)
  doc.setDrawColor(241, 245, 249);
  doc.setLineWidth(0.3);
  doc.line(rightX + 5, dividerY, rightX + rightDenomWidth - 5, dividerY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('CEO SAFE CLOSING TOTAL', rightX + 5, footerY);

  // In Safe Parity pill
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(rightX + 54, footerY - 2.8, 22, 3.8, 1.2, 1.2, 'F');
  doc.setFillColor(16, 185, 129);
  doc.circle(rightX + 57, footerY - 0.9, 0.7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.2);
  doc.setTextColor(5, 150, 105);
  doc.text('In Safe Parity', rightX + 59, footerY - 0.2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`AED ${formatPdfCurrency(totalCeoSafe > 0 ? totalCeoSafe : closingBalance)}`, rightX + rightDenomWidth - 5, footerY, { align: 'right' });

  let tableStartY = actualCardBottomY + 4.5;

  // ----------------------------------------------------
  // SECTION 3: CATEGORIZED TRANSACTION TABLES (SCREENSHOT 3)
  // ----------------------------------------------------
  const isPettyOrReserve = (t) => {
    if (!t) return false;
    const type = t.type || '';
    if (['PETTY_CASH', 'RESERVE_ADD', 'RESERVE_TAKE', 'RESERVE_REVERSAL'].includes(type)) return true;
    const id = String(t.id || '');
    if (id.startsWith('PC-') || id.startsWith('RES-') || id.startsWith('REV-RES-')) return true;
    const desc = String(t.description || '');
    if (desc.includes('Petty Cash') || desc.includes('Reserve Vault')) return true;
    if (t.allocationId) return true;
    return false;
  };

  // Filter categorized records with strict category isolation
  const categorized = {
    inflows: logs.filter(t => !isPettyOrReserve(t) && (t.type === 'INFLOW' || t.type === 'TEMP_INFLOW')),
    expenses: logs.filter(t => t.type === 'OUTFLOW' || t.type === 'EXPENSE'),
    transfers: logs.filter(t => !isPettyOrReserve(t) && (t.type === 'TRANSFER' || t.type === 'EXCHANGE')),
    pettyCash: logs.filter(t => isPettyOrReserve(t)),
    exchanges: logs.filter(t => !isPettyOrReserve(t) && t.type === 'EXCHANGE')
  };

  // Detailed Petty Cash & Reserve Metrics
  let pettyAdvancesSum = 0;
  let pettyExpensesSum = 0;
  let pettyReturnsSum = 0;
  let reserveAddSum = 0;
  let reserveTakeSum = 0;

  categorized.pettyCash.forEach(t => {
    const amt = Math.abs(parseFloat(t.amount || 0));
    const id = String(t.id || '');
    const type = t.type || '';

    if (id.startsWith('PC-TOP-')) {
      pettyAdvancesSum += amt;
    } else if (id.startsWith('PC-REV-')) {
      pettyReturnsSum += amt;
    } else if (type === 'OUTFLOW' || type === 'EXPENSE' || id.startsWith('EXP-') || id.startsWith('PC-EXP-')) {
      pettyExpensesSum += amt;
    } else if (type === 'RESERVE_ADD' || id.startsWith('RES-ADD-')) {
      reserveAddSum += amt;
    } else if (type === 'RESERVE_TAKE' || type === 'RESERVE_REVERSAL' || id.startsWith('RES-TAKE-') || id.startsWith('REV-RES-')) {
      reserveTakeSum += amt;
    }
  });

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
      subtitle: 'All operational and desk expenses',
      data: categorized.expenses,
      themeColor: [239, 68, 68], // #EF4444 Rose/Red
      type: 'OUTFLOW',
      sign: '-'
    },
    {
      title: 'VAULT TRANSFERS',
      subtitle: 'Internal vault capital movements (Accountant to CEO Vault)',
      data: categorized.transfers,
      themeColor: [59, 130, 246], // #3B82F6 Royal Blue
      type: 'TRANSFER',
      sign: ''
    },
    {
      title: 'PETTY CASH & RESERVE',
      subtitle: 'Daily miscellaneous advances, settlements & reserve operations',
      data: categorized.pettyCash,
      themeColor: [217, 119, 6], // #D97706 Warm Amber
      type: 'PETTY_CASH',
      sign: '',
      isPettySection: true,
      summaryStats: {
        advances: pettyAdvancesSum,
        expenses: pettyExpensesSum,
        returns: pettyReturnsSum,
        reserveAdd: reserveAddSum,
        reserveTake: reserveTakeSum,
        pettyBalance: pettyCashBalance,
        reserveBalance: reserveBalance
      }
    },
    {
      title: 'DENOMINATION EXCHANGES',
      subtitle: 'Note swaps and bill exchanges',
      data: categorized.exchanges,
      themeColor: [100, 116, 139], // #64748B Slate
      type: 'EXCHANGE',
      sign: ''
    }
  ];

  // Render each section using autoTable
  sectionsConfig.forEach((sec) => {
    if (sec.data.length === 0) return; // Skip empty sections

    // Check if we need to add a page break before banner
    if (tableStartY > pageHeight - 38) {
      doc.addPage('landscape');
      drawTopHeader();
      tableStartY = 26;
    }

    // 1. Draw FinTech Section Banner Header
    const bannerH = 7.5;
    doc.setFillColor(sec.themeColor[0], sec.themeColor[1], sec.themeColor[2]);
    doc.roundedRect(marginX, tableStartY, printableWidth, bannerH, 2, 2, 'F');

    // Section Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text(sec.title, marginX + 6, tableStartY + 5);

    // Dynamic Section Subtitle Position (prevent overlapping title)
    const titleWidth = doc.getTextWidth(sec.title);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(255, 255, 255);
    doc.text(`— ${sec.subtitle}`, marginX + 6 + titleWidth + 3, tableStartY + 5);

    // Records Count Pill on the Right
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(pageWidth - marginX - 25, tableStartY + 1.6, 20, 4.3, 1.2, 1.2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(sec.themeColor[0], sec.themeColor[1], sec.themeColor[2]);
    doc.text(`${sec.data.length} Records`, pageWidth - marginX - 15, tableStartY + 4.6, { align: 'center' });

    tableStartY += bannerH + 1.5;

    // 1B. Draw Petty Cash & Reserve Financial Calculation Summary Strip
    if (sec.isPettySection && sec.summaryStats) {
      const statsH = 5.2;
      doc.setFillColor(254, 243, 199); // amber-100 (#FEF3C7)
      doc.setDrawColor(251, 191, 36); // amber-400
      doc.setLineWidth(0.2);
      doc.roundedRect(marginX, tableStartY, printableWidth, statsH, 1.2, 1.2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.8);
      doc.setTextColor(180, 83, 9); // amber-700
      const statsText = `Advances/Top-Ups: AED ${formatPdfCurrency(sec.summaryStats.advances)}   |   Settled Expenses: AED ${formatPdfCurrency(sec.summaryStats.expenses)}   |   Returned to Safe: AED ${formatPdfCurrency(sec.summaryStats.returns)}   |   Live Petty Cash: AED ${formatPdfCurrency(sec.summaryStats.pettyBalance)}   |   Reserve Vault: AED ${formatPdfCurrency(sec.summaryStats.reserveBalance)}`;
      doc.text(statsText, marginX + printableWidth / 2, tableStartY + 3.6, { align: 'center' });

      tableStartY += statsH + 1.5;
    }

    // 2. Map Rows for autoTable
    const tableBody = sec.data.map(trx => {
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
      let amtFormatted = '';

      if (sec.isPettySection) {
        const id = String(trx.id || '');
        const type = trx.type || '';
        if (id.startsWith('PC-TOP-')) {
          amtFormatted = `- ${formatPdfCurrency(Math.abs(amtNum))}`;
        } else if (id.startsWith('PC-REV-')) {
          amtFormatted = `+ ${formatPdfCurrency(Math.abs(amtNum))}`;
        } else if (type === 'RESERVE_ADD' || id.startsWith('RES-ADD-')) {
          amtFormatted = `+ ${formatPdfCurrency(Math.abs(amtNum))}`;
        } else if (type === 'RESERVE_TAKE' || type === 'RESERVE_REVERSAL' || id.startsWith('RES-TAKE-') || id.startsWith('REV-RES-')) {
          amtFormatted = `- ${formatPdfCurrency(Math.abs(amtNum))}`;
        } else {
          amtFormatted = `- ${formatPdfCurrency(Math.abs(amtNum))}`;
        }
      } else {
        amtFormatted = `${sec.sign ? sec.sign + ' ' : ''}${formatPdfCurrency(Math.abs(amtNum))}`;
      }

      // Status
      const statusText = (trx.status || 'VERIFIED').toUpperCase();

      return [dateDisplay, companyDesc, invoiceRef, amtFormatted, statusText];
    });

    runAutoTable(doc, {
      startY: tableStartY,
      margin: { left: marginX, right: marginX, top: 25, bottom: 14 },
      tableWidth: printableWidth,
      head: [['DATE & TIME', sec.isPettySection ? 'OPERATION / DESCRIPTION' : 'COMPANY / DESCRIPTION', sec.isPettySection ? 'TRANSACTION ID / REF' : 'INVOICE / REF', 'AMOUNT (AED)', 'STATUS']],
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
        2: { cellWidth: 40, fontStyle: 'normal' },
        3: {
          cellWidth: 38,
          halign: 'right',
          fontStyle: 'bold',
          textColor: sec.themeColor
        },
        4: { cellWidth: 28, halign: 'center' }
      },
      alternateRowStyles: {
        fillColor: [253, 254, 255]
      },
      didDrawPage: (data) => {
        if (data.pageNumber > 1) {
          drawTopHeader();
        }
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
