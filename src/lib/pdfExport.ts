import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportStats {
  totalProducts: number;
  totalExits: number;
  totalEntries: number;
  lowStockCount: number;
  zeroStockCount: number;
}

const formatDateTime = () => {
  return new Date().toLocaleString('pt-BR');
};

const addHeader = (doc: jsPDF, subtitle: string, period?: string, filters?: string) => {
  // Header background
  doc.setFillColor(2, 6, 23); // Dark blue from theme
  doc.rect(0, 0, doc.internal.pageSize.width, 45, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('SISTEMA CNR - Relatório de Gestão de Estoque', 14, 15);
  
  doc.setFontSize(12);
  doc.text(subtitle, 14, 25);

  // Date and Period
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Gerado em: ${formatDateTime()}`, doc.internal.pageSize.width - 14, 15, { align: 'right' });
  
  if (period) {
    doc.text(`Período: ${period}`, doc.internal.pageSize.width - 14, 25, { align: 'right' });
  }

  if (filters) {
    doc.setFontSize(8);
    doc.text(`Filtros: ${filters}`, 14, 35);
  }
};

const addSummary = (doc: jsPDF, stats: ReportStats, startY: number) => {
  doc.setTextColor(2, 6, 23);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumo do Inventário', 14, startY);

  const summaryData = [
    ['Total de Produtos', stats.totalProducts.toString()],
    ['Total de Entradas', stats.totalEntries.toString()],
    ['Total de Saídas', stats.totalExits.toString()],
    ['Estoque Baixo', stats.lowStockCount.toString()],
    ['Estoque Zerado', stats.zeroStockCount.toString()],
  ];

  autoTable(doc, {
    startY: startY + 5,
    head: [],
    body: [
      summaryData.map(d => d[0]),
      summaryData.map(d => d[1])
    ],
    theme: 'plain',
    styles: {
      fontSize: 9,
      cellPadding: 2,
      halign: 'center',
      textColor: [51, 65, 85],
    },
    bodyStyles: {
      fontStyle: 'bold',
      textColor: [2, 6, 23],
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
    }
  });

  return (doc as any).lastAutoTable.finalY + 10;
};

const addFooter = (doc: jsPDF) => {
  const pageCount = (doc as any).internal.getNumberOfPages();
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(
      'Gerado automaticamente pelo Sistema CNR',
      14,
      doc.internal.pageSize.height - 10
    );
    doc.text(
      `Página ${i} de ${pageCount}`,
      doc.internal.pageSize.width - 14,
      doc.internal.pageSize.height - 10,
      { align: 'right' }
    );
  }
};

const getFilename = (type: string) => {
  const date = new Date().toISOString().split('T')[0];
  return `${type}-${date}.pdf`;
};

export const exportMovementsPDF = (movements: any[], stats: ReportStats, period: string, filters?: string) => {
  const doc = new jsPDF({ orientation: 'landscape' });
  addHeader(doc, 'Sistema CNR — Relatório de Movimentações', period, filters);
  const nextY = addSummary(doc, stats, 55);

  const tableData = movements.map(m => [
    new Date(m.dataHora * 1000).toLocaleDateString('pt-BR'),
    m.tipo,
    m.code,
    m.quantidade.toString(),
    m.placa || '-',
    m.responsavel || '-',
    m.observacao || '-'
  ]);

  autoTable(doc, {
    startY: nextY,
    head: [['Data', 'Tipo', 'CODE', 'Qtd', 'Placa', 'Responsável', 'Obs']],
    body: tableData,
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { fontSize: 8, cellPadding: 3 },
    columnStyles: {
      6: { cellWidth: 40 } // Limit observation width
    }
  });

  addFooter(doc);
  doc.save(getFilename('movimentacoes'));
};

export const exportConsumptionPDF = (ranking: any[], stats: ReportStats, period: string) => {
  const doc = new jsPDF();
  addHeader(doc, 'Consumo por Veículo', period);
  const nextY = addSummary(doc, stats, 55);

  const tableData = ranking.map(r => [
    r.placa,
    r.totalItems.toString(),
    r.totalExits.toString(),
    r.lastExit ? new Date(r.lastExit * 1000).toLocaleDateString('pt-BR') : '-'
  ]);

  autoTable(doc, {
    startY: nextY,
    head: [['Placa', 'Total Peças Usadas', 'Nº de Saídas', 'Última Saída']],
    body: tableData,
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { fontSize: 9, cellPadding: 4 },
  });

  addFooter(doc);
  doc.save(getFilename('relatorio-estoque-consumo'));
};

export const exportAlertsPDF = (alerts: any[], stats: ReportStats) => {
  const doc = new jsPDF();
  addHeader(doc, 'Alertas de Estoque');
  const nextY = addSummary(doc, stats, 55);

  const tableData = alerts.map(a => [
    a.code,
    a.stock.toString(),
    a.min.toString(),
    (Math.max(0, a.min - a.stock)).toString()
  ]);

  autoTable(doc, {
    startY: nextY,
    head: [['CODE', 'Estoque Atual', 'Estoque Mínimo', 'Sugestão Compra']],
    body: tableData,
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { fontSize: 9, cellPadding: 4 },
  });

  addFooter(doc);
  doc.save(getFilename('relatorio-estoque-alertas'));
};

export const exportProductsPDF = (products: any[], stats: ReportStats) => {
  const doc = new jsPDF();
  addHeader(doc, 'Relatório Geral de Produtos');
  const nextY = addSummary(doc, stats, 55);

  const tableData = products.map(p => {
    let status = 'OK';
    if (p.stock === 0) status = 'ZERADO';
    else if (p.stock <= p.min) status = 'BAIXO';

    return [
      p.code,
      p.stock.toString(),
      p.min.toString(),
      status
    ];
  });

  autoTable(doc, {
    startY: nextY,
    head: [['CODE', 'Estoque', 'Mínimo', 'Status']],
    body: tableData,
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { fontSize: 9, cellPadding: 4 },
  });

  addFooter(doc);
  doc.save(getFilename('relatorio-estoque-produtos'));
};
