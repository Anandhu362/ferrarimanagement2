// frontend/src/utils/pdfGeneratorService.js
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; 

export const generateDailyOrderPDF = (validRows, products, metadata) => {
  // 1. Initialize PDF in Landscape mode (A4)
  const doc = new jsPDF('landscape', 'mm', 'a4');
  
  // 2. Exact Header Replication
  doc.setTextColor(0, 0, 0); 
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('AL FAJAR AL SADIQ GENERAL TRADING', 148.5, 15, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text('DAILY ORDER FORM   MOB: 055-8867751, MOB: 050-7442245', 148.5, 22, { align: 'center' });

  doc.setFontSize(9);
  doc.text('DRIVER NAME :', 14, 15);
  doc.text('LOAD:', 14, 25);
  
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.rect(26, 22, 5, 5); 

  const formattedDate = new Date(metadata.date).toLocaleDateString('en-GB');
  doc.text(`PLACE & DATE :  ${metadata.location.toUpperCase()}   ${formattedDate}`, 200, 15);
  doc.text('VEHICLE NO :', 200, 25);

  // 3. Dynamic Density Checking (Trigger vertical layout if > 8 columns)
  const isHighDensity = products.length > 8; 

  // Format Product Names
  const formatProductName = (name) => {
    let formatted = name.toUpperCase().replace('WHEAT FLOUR', 'W.FLOUR').trim();
    
    if (!isHighDensity) {
      // Normal Horizontal: Add line breaks
      formatted = formatted.replace(/ 50\s*KG/g, '\n(50KG)')
                           .replace(/ 25\s*KG/g, '\n(25KG)')
                           .replace(/ 10\s*KG/g, '\n(10KG)');
    } else {
      // High Density Vertical: Keep as a single line, format cleanly
      formatted = formatted.replace(/ 50\s*KG/g, ' (50KG)')
                           .replace(/ 25\s*KG/g, ' (25KG)')
                           .replace(/ 10\s*KG/g, ' (10KG)');
    }
    return formatted;
  };

  const tableColumns = ['CUSTOMER', ...products.map(p => formatProductName(p.label))];
  
  // THE FIX: If high density, give autoTable empty strings so it doesn't wrap text!
  const displayHeadRow = isHighDensity 
    ? ['CUSTOMER', ...products.map(() => '')] 
    : tableColumns;

  // 4. Prepare Table Rows & Calculate Totals
  const tableRows = [];
  const columnTotals = {};
  
  products.forEach(p => columnTotals[p.label] = 0);

  validRows.forEach(row => {
    const rowData = [row.companyName.toUpperCase()];
    products.forEach(p => {
      const orderedProduct = row.structuredProducts.find(sp => sp.inventory_id === p.id);
      const qty = orderedProduct ? orderedProduct.qty : '';
      rowData.push(qty); 
      if (qty) columnTotals[p.label] += parseInt(qty, 10);
    });
    tableRows.push(rowData);
  });

  const MIN_ROWS = 11; 
  while (tableRows.length < MIN_ROWS) {
    tableRows.push(Array(tableColumns.length).fill(''));
  }

  const totalRow = ['TOTALS:'];
  products.forEach(p => {
    totalRow.push(columnTotals[p.label] > 0 ? columnTotals[p.label].toString() : '-');
  });
  tableRows.push(totalRow);

  // 5. Draw the Table
  autoTable(doc, {
    startY: 32,
    head: [displayHeadRow], // Use the empty strings here
    body: tableRows,
    theme: 'grid',
    showHead: 'firstPage', 
    margin: { bottom: 10, left: 10, right: 10 }, // Maximizing page space
    styles: {
      fontSize: 8,
      cellPadding: isHighDensity ? 1.5 : 3, // Tighter padding for many columns
      lineColor: [0, 0, 0], 
      lineWidth: 0.2,
      textColor: [0, 0, 0],
    },
    headStyles: {
      fillColor: [255, 255, 255], 
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
      valign: isHighDensity ? 'bottom' : 'middle', 
      minCellHeight: isHighDensity ? 65 : 15, // Provide 65mm of height for the rotated text
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold', cellWidth: isHighDensity ? 45 : 50 }, 
    },
    alternateRowStyles: {
      fillColor: [155, 194, 230] 
    },
    
    // --- MANUALLY DRAW THE TEXT ROTATED ---
    didDrawCell: function(data) {
      if (data.section === 'head' && data.column.index > 0 && isHighDensity) {
        // Fetch the actual text from our original array
        const rawText = tableColumns[data.column.index];
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(7.5); // Crisp, small font for vertical reading
        doc.setFont('helvetica', 'bold');
        
        // Find center of the column
        const xPos = data.cell.x + (data.cell.width / 2) + 1.2; 
        // Start near the bottom border of the cell
        const yPos = data.cell.y + data.cell.height - 3;
        
        // Paint the text pointing 90 degrees upwards
        doc.text(rawText, xPos, yPos, { 
          angle: 90 
        });
      }
    },
    willDrawCell: function(data) {
      if (data.column.index > 0) {
        data.cell.styles.halign = 'center';
      }
      if (data.row.raw[0] === 'TOTALS:') {
        doc.setFillColor(50, 50, 50); 
        doc.setTextColor(255, 255, 255); 
        doc.setFont('helvetica', 'bold');
      }
    }
  });

  // 6. Save the PDF
  const filename = `Daily_Order_Form_${metadata.location}_Trip${metadata.trip}_${metadata.date}.pdf`;
  doc.save(filename.replace(/\s+/g, '_'));
};

// ============================================================================
// ✅ LPO PDF Generator (Local Purchase Order)
// ============================================================================
export const generateLPOPdf = async (lpoData) => {
  // Helper to ensure text is strings and uppercase for PDF rendering
  const safeUpper = (str) => {
    if (str === null || str === undefined) return '';
    return String(str).toUpperCase();
  };

  // 1. Initialize PDF in Portrait mode (A4)
  const doc = new jsPDF('portrait', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 10;
  const contentWidth = pageWidth - (margin * 2);

  // --- HEADER SECTION ---
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('AL FAJAR AL SADIQ GENERAL TRADING LLC', pageWidth / 2, 14, { align: 'center' });
  
  doc.setFontSize(9);
  doc.text('P.O BOX 113115, DUBAI , UAE', pageWidth / 2, 18, { align: 'center' });
  doc.text('TEL : 04-2694660, EMAIL : KURIYIGIL@GMAIL.COM', pageWidth / 2, 22, { align: 'center' });
  
  doc.setFontSize(11);
  doc.text('LOCAL PURCHASE ORDER', pageWidth / 2, 28, { align: 'center' });

  // Format Dates to DD-MM-YY to match template
  const formatDateTemplate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return safeUpper(dateStr);
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const year = d.getFullYear().toString().slice(-2);
    return `${day}-${month}-${year}`;
  };

  const orderDateFormatted = formatDateTemplate(lpoData.orderDate || new Date());
  const deliveryDateFormatted = formatDateTemplate(lpoData.deliveryDate || lpoData.orderDate);

  // --- TABLE 1: ORDER METADATA (GRID) ---
  autoTable(doc, {
    startY: 32,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: {
      fontSize: 8.5,
      fontStyle: 'bold', // Forces ALL text in this table to be Bold
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
      halign: 'center',
      valign: 'middle',
      cellPadding: 2
    },
    head: [[
      'ORDER NO', 
      'ORDER DATE', 
      'DELIVERY DATE', 
      'DELIVERY TIME', 
      'CURRENCY'
    ]],
    body: [[
      safeUpper(lpoData.orderNo || ''),
      safeUpper(orderDateFormatted),
      safeUpper(deliveryDateFormatted),
      safeUpper(lpoData.deliveryTime || 'EVENING'),
      safeUpper(lpoData.currency || 'AED')
    ]],
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0]
    },
    didDrawCell: (data) => {
      // Draw green highlight box for DELIVERY TIME value in row 0, col 3
      if (data.section === 'body' && data.row.index === 0 && data.column.index === 3) {
        doc.setFillColor(112, 173, 71); // Template green accent
        doc.rect(data.cell.x + 1, data.cell.y + 1, data.cell.width - 2, data.cell.height - 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text(
          safeUpper(lpoData.deliveryTime || 'EVENING'), 
          data.cell.x + (data.cell.width / 2), 
          data.cell.y + (data.cell.height / 2) + 1.2, 
          { align: 'center' }
        );
      }
    }
  });

  // --- TABLE 2: LOGISTICS & VENDOR (GRID) ---
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 3,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: {
      fontSize: 8,
      fontStyle: 'bold', // Forces ALL text in this table to be Bold
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
      valign: 'top',
      cellPadding: 2.5
    },
    head: [[
      { content: 'DELIVERY ADDRESS', styles: { halign: 'left' } },
      { content: 'PUCHASE ORGANIZATION', styles: { halign: 'left' } },
      { content: 'VENDOR', styles: { halign: 'left' } },
      { content: 'PAYEE DETAILS', styles: { halign: 'left' } },
      { content: 'PAYMENT TERMS', styles: { halign: 'center' } }
    ]],
    body: [[
      safeUpper(lpoData.deliveryAddress || 'Al Fajar Al Sadiq Gen Trdg BR 1\nABUDHABI- MUSSAHFA\nUnited Arab Emirates'),
      safeUpper(lpoData.purchaseOrganization || 'Al Fajar Al Sadiq Gen Trdg LLc BR 1'),
      safeUpper(lpoData.vendorName || 'Al Ghurair Foods LLC\nDubai, U.A.E'),
      safeUpper(lpoData.payeeDetails || 'Al Ghurair Foods LLC\nDubai, U.A.E'),
      { content: safeUpper(lpoData.paymentTerms || '60 DAYS\n(SOA DATE)'), styles: { halign: 'center', valign: 'middle' } }
    ]],
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0]
    },
    columnStyles: {
      0: { cellWidth: 42 },
      1: { cellWidth: 40 },
      2: { cellWidth: 42 },
      3: { cellWidth: 38 },
      4: { cellWidth: 28 }
    }
  });

  // --- TABLE 3: ITEMIZED DETAILS & TOTALS ---
  const itemRows = [];
  let calculatedSubtotal = 0;

  if (lpoData.items && Array.isArray(lpoData.items)) {
    lpoData.items.forEach(item => {
      const qty = parseFloat(item.qty) || 0;
      const price = parseFloat(item.purchasePrice) || 0;
      const total = qty * price;
      calculatedSubtotal += total;

      const kgStr = item.kg ? `${item.kg} KG` : '';
      const convStr = item.uomConversion || (item.kg ? `1 BAG=${item.kg} KG` : '');

      itemRows.push([
        safeUpper(item.description || item.itemDescription),
        safeUpper(kgStr),
        safeUpper(qty > 0 ? qty.toString() : ''),
        safeUpper(item.uom || 'BAGS'),
        safeUpper(convStr),
        safeUpper(price > 0 ? price.toFixed(2) : ''),
        safeUpper(item.tradeOffer),
        safeUpper(total > 0 ? total.toFixed(2) : '0.00')
      ]);
    });
  }

  // Ensure minimum 5 visual rows matching template layout
  while (itemRows.length < 5) {
    itemRows.push(['', '', '', '', '', '', '', itemRows.length === 0 ? '0.00' : '']);
  }

  const subTotal = lpoData.subTotal !== undefined ? lpoData.subTotal : calculatedSubtotal;
  const vatAmount = lpoData.vatAmount !== undefined ? lpoData.vatAmount : (subTotal * 0.05);
  const netAmount = lpoData.netAmount !== undefined ? lpoData.netAmount : (subTotal + vatAmount);

  // Append Summary Rows to Bottom of Table
  itemRows.push([
    { content: '', colSpan: 6 },
    { content: '', styles: { halign: 'right' } },
    { content: subTotal.toFixed(2), styles: { halign: 'right' } }
  ]);

  itemRows.push([
    { content: '', colSpan: 6 },
    { content: 'VAT 5%', styles: { halign: 'right' } },
    { content: vatAmount.toFixed(2), styles: { halign: 'right' } }
  ]);

  itemRows.push([
    { content: '', colSpan: 6 },
    { content: 'NET AMOUNT', styles: { halign: 'right' } },
    { content: netAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: 'right' } }
  ]);

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 3,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: {
      fontSize: 8.5,
      fontStyle: 'bold', // Forces ALL text in this table to be Bold
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
      valign: 'middle',
      cellPadding: 2.5
    },
    head: [[
      { content: 'ITEM DESCRIPTION', styles: { halign: 'center' } },
      { content: 'KG', styles: { halign: 'center' } },
      { content: 'QTY', styles: { halign: 'center' } },
      { content: 'UOM', styles: { halign: 'center' } },
      { content: 'UOM CONVERSION', styles: { halign: 'center' } },
      { content: 'PURCHASE PRICE', styles: { halign: 'center' } },
      { content: 'TRADE OFFER', styles: { halign: 'center' } },
      { content: 'TOTAL AED', styles: { halign: 'center' } }
    ]],
    body: itemRows,
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0]
    },
    columnStyles: {
      0: { cellWidth: 55, halign: 'left' },
      1: { cellWidth: 16, halign: 'center' },
      2: { cellWidth: 16, halign: 'center' },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 26, halign: 'center' },
      5: { cellWidth: 20, halign: 'center' },
      6: { cellWidth: 18, halign: 'center' },
      7: { cellWidth: 21, halign: 'right' }
    }
  });

  // --- FOOTER SECTION: AMOUNT IN WORDS, REMARKS, PREPARED BY ---
  const footerStartY = doc.lastAutoTable.finalY + 3;

  autoTable(doc, {
    startY: footerStartY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: {
      fontSize: 8.5,
      fontStyle: 'bold', // Forces ALL text in this table to be Bold
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
      cellPadding: 2.5,
      valign: 'middle'
    },
    body: [
      [
        { content: 'AMOUNT IN WORDS :', styles: { width: 38 } },
        { content: safeUpper(lpoData.amountInWords) }
      ],
      [
        { content: 'REMARKS :', styles: { width: 38 } },
        { content: safeUpper(lpoData.remarks) }
      ]
    ],
    columnStyles: {
      0: { cellWidth: 38 },
      1: { cellWidth: contentWidth - 38 }
    }
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: {
      fontSize: 8.5,
      fontStyle: 'bold', // Forces ALL text in this table to be Bold
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
      cellPadding: 2.5,
      valign: 'middle'
    },
    body: [
      [
        { content: 'PREPARED BY :', styles: { cellWidth: 38 } },
        { content: safeUpper(lpoData.preparedBy || 'NASEEM'), styles: { cellWidth: 50 } },
        { content: '', styles: { cellWidth: contentWidth - 88 } }
      ]
    ]
  });

  // Save the generated LPO PDF document
  const fileName = `LPO_${safeUpper(lpoData.orderNo || 'DOCUMENT').replace(/[^A-Z0-9]/g, '_')}.pdf`;
  doc.save(fileName);
};