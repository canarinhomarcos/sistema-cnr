import jsPDF from 'jspdf';
import JsBarcode from 'jsbarcode';

interface LabelData {
  title: string;
  code: string;
  location: string;
  barcode: string;
}

interface PendingItem {
  name: string;
  code: string;
  reason: string;
}

// Cache for barcode images
const barcodeCache: Record<string, string> = {};

const generateBarcodeDataURL = (value: string): string => {
  if (barcodeCache[value]) return barcodeCache[value];

  const canvas = document.createElement('canvas');
  try {
    JsBarcode(canvas, value, {
      format: 'CODE128',
      width: 2,
      height: 50,
      displayValue: false,
      margin: 0,
    });
    const dataUrl = canvas.toDataURL('image/png', 0.8);
    barcodeCache[value] = dataUrl;
    return dataUrl;
  } catch (e) {
    console.error('Error generating barcode:', e);
    return '';
  }
};

export const exportLabelsPDF = async (
  items: LabelData[], 
  filename: string, 
  pending: PendingItem[] = [],
  onProgress?: (current: number, total: number) => void,
  batchSize: number = 50,
  simpleMode: boolean = true // Default to simple mode as requested
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  const margin = 5;
  const cols = 4; // More columns for simple mode
  const rows = 10; // More rows for simple mode
  const labelWidth = (pageWidth - (margin * 2)) / cols;
  const labelHeight = (pageHeight - (margin * 2)) / rows;

  let currentItem = 0;
  const total = items.length;

  const processBatch = async () => {
    const end = Math.min(currentItem + batchSize, total);
    
    for (; currentItem < end; currentItem++) {
      if (currentItem > 0 && currentItem % (cols * rows) === 0) {
        doc.addPage();
      }

      const indexOnPage = currentItem % (cols * rows);
      const col = indexOnPage % cols;
      const row = Math.floor(indexOnPage / cols);

      const x = margin + (col * labelWidth);
      const y = margin + (row * labelHeight);

      const item = items[currentItem];
      
      // Draw label border
      doc.setDrawColor(240, 240, 240);
      doc.rect(x, y, labelWidth, labelHeight);

      // Simple Mode: ONLY Barcode and Text
      const padding = 2;
      const contentX = x + padding;
      const contentY = y + padding;
      const contentWidth = labelWidth - (padding * 2);
      const contentHeight = labelHeight - (padding * 2);

      // Barcode
      const barcodeData = generateBarcodeDataURL(item.barcode);
      if (barcodeData) {
        const barcodeW = contentWidth;
        const barcodeH = contentHeight * 0.7;
        doc.addImage(barcodeData, 'PNG', contentX, contentY, barcodeW, barcodeH, undefined, 'FAST');
      }

      // Barcode Text
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(item.barcode, x + (labelWidth / 2), contentY + (contentHeight * 0.85), { align: 'center' });
    }

    if (onProgress) onProgress(currentItem, total);

    if (currentItem < total) {
      await new Promise(resolve => setTimeout(resolve, 0));
      return processBatch();
    }
  };

  await processBatch();

  if (pending.length > 0) {
    doc.addPage();
    doc.setTextColor(239, 68, 68);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PENDÊNCIAS (Itens não impressos)', 14, 20);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    let y = 30;
    pending.forEach((p, i) => {
      if (y > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }
      doc.text(`${i + 1}. CODE: ${p.code || 'Vazio'} - Motivo: ${p.reason}`, 14, y);
      y += 7;
    });
  }

  doc.save(`${filename}-${new Date().toISOString().split('T')[0]}.pdf`);
};

export const exportProductLabels = async (
  products: any[], 
  onProgress?: (current: number, total: number) => void,
  batchSize: number = 50,
  simpleMode: boolean = true
) => {
  const pending: PendingItem[] = [];
  const labelData: LabelData[] = [];

  products.forEach(p => {
    let barcode = p.barcode;
    const cleanCode = (p.code || p.sku || "").replace(/\s+/g, "");
    const isNumericCode = /^\d+$/.test(cleanCode);

    if (!barcode) {
      if (cleanCode && isNumericCode) {
        barcode = `CNR-${cleanCode.padStart(6, "0")}`;
      } else {
        pending.push({
          name: p.name || 'Item',
          code: p.code || p.sku,
          reason: !cleanCode ? 'CODE Vazio' : 'CODE não numérico'
        });
        return;
      }
    }

    labelData.push({
      title: p.name || 'Item',
      code: cleanCode.padStart(6, "0"),
      location: p.location || p.local || '—',
      barcode: barcode,
    });
  });

  await exportLabelsPDF(labelData, 'etiquetas-codes', pending, onProgress, batchSize, simpleMode);
};

export const exportLocationLabels = async (products: any[]) => {
  const locations = Array.from(new Set(products.map(p => p.location || p.local).filter(l => !!l)));
  
  const labelData: LabelData[] = locations.map(loc => ({
    title: `LOCALIZAÇÃO`,
    code: '-',
    location: loc,
    barcode: `LOC-${loc.replace(/\s+/g, '-')}`,
  }));

  await exportLabelsPDF(labelData, 'etiquetas-locais');
};
