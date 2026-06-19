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