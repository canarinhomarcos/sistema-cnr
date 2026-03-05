import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useInventoryStore } from '../../store/useInventoryStore';
import { Scan, MapPin, Package, Trash2, CheckCircle2, AlertCircle, FileSpreadsheet, FileText as FilePdf, X, Play, Save, ChevronRight, AlertTriangle, History } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CountedItem {
  productId: string;
  code: string;
  location: string;
  counted: number;
  currentStock: number;
}

const StockAudit: React.FC = () => {
  const { products, fetchData } = useInventoryStore();
  const [isAuditActive, setIsAuditActive] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<string | null>(null);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [countedItems, setCountedItems] = useState<Record<string, CountedItem>>({});
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showReport, setShowReport] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep focus on input
  useEffect(() => {
    if (isAuditActive && !showReport) {
      const interval = setInterval(() => {
        if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          inputRef.current?.focus();
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isAuditActive, showReport]);

  const playBeep = (success: boolean) => {
    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(success ? 880 : 220, context.currentTime);
      gain.gain.setValueAtTime(0.1, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.2);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.2);
    } catch (e) {}
  };

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    const code = barcodeInput.trim().toUpperCase();
    if (!code) return;

    // 1. Check if it's a location barcode
    if (code.startsWith('LOC-')) {
      const loc = code.replace('LOC-', '');
      setCurrentLocation(loc);
      setFeedback({ message: `Local definido: ${loc}`, type: 'info' });
      playBeep(true);
      setBarcodeInput('');
      return;
    }

    // 2. If no location defined, warn user
    if (!currentLocation) {
      setFeedback({ message: 'Bipe um LOCAL primeiro (ex: LOC-A1)', type: 'error' });
      playBeep(false);
      setBarcodeInput('');
      return;
    }

    // 3. Identify product
    const product = products.find(p => p.barcode === code || p.code === code);

    if (product) {
      setCountedItems(prev => {
        const existing = prev[product.id];
        return {
          ...prev,
          [product.id]: {
            productId: product.id,
            code: product.code,
            location: currentLocation,
            counted: (existing?.counted || 0) + 1,
            currentStock: product.stock
          }
        };
      });
      setFeedback({ message: `Contado: ${product.code}`, type: 'success' });
      playBeep(true);
    } else {
      setFeedback({ message: 'Produto não cadastrado!', type: 'error' });
      playBeep(false);
    }

    setBarcodeInput('');
    setTimeout(() => setFeedback(null), 2000);
  };

  const startAudit = () => {
    setIsAuditActive(true);
    setCountedItems({});
    setCurrentLocation(null);
    setShowReport(false);
    setFeedback({ message: 'Bipe o código do LOCAL para começar', type: 'info' });
  };

  const finalizeAudit = () => {
    if (Object.keys(countedItems).length === 0) {
      if (!confirm('Nenhum item contado. Deseja realmente finalizar?')) return;
    }
    setShowReport(true);
    setIsAuditActive(false);
  };

  const exportCSV = () => {
    const headers = ['CODE', 'Estoque Atual', 'Contado', 'Diferença'];
    const rows = Object.values(countedItems).map(item => [
      item.code,
      item.currentStock,
      item.counted,
      item.counted - item.currentStock
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.body.appendChild(document.createElement('a'));
    link.href = URL.createObjectURL(blob);
    link.download = `inventario_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(2, 6, 23);
    doc.rect(0, 0, doc.internal.pageSize.width, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text('SISTEMA CNR - Relatório de Inventário', 14, 20);
    doc.setFontSize(10);
    doc.text(`Data: ${new Date().toLocaleString('pt-BR')}`, 14, 30);

    const tableData = Object.values(countedItems).map(item => [
      item.code,
      item.currentStock.toString(),
      item.counted.toString(),
      (item.counted - item.currentStock).toString()
    ]);

    autoTable(doc, {
      startY: 50,
      head: [['CODE', 'Estoque Atual', 'Contado', 'Diferença']],
      body: tableData,
      headStyles: { fillColor: [37, 99, 235] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    doc.save(`inventario_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const countedList = useMemo(() => Object.values(countedItems), [countedItems]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-full">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 shrink-0">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-3">
            <History className="text-blue-500" size={24} />
            Inventário de Estoque
          </h2>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Conferência e auditoria de materiais</p>
        </div>

        {!isAuditActive && !showReport && (
          <button
            onClick={startAudit}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl flex items-center gap-2 transition-all font-black uppercase tracking-widest text-sm shadow-xl shadow-blue-900/20 active:scale-95"
          >
            <Play size={18} />
            Iniciar Inventário
          </button>
        )}

        {(isAuditActive || showReport) && (
          <button
            onClick={() => { if(confirm('Deseja cancelar a sessão atual?')) { setIsAuditActive(false); setShowReport(false); } }}
            className="bg-white/5 hover:bg-red-600 text-slate-400 hover:text-white px-6 py-3 rounded-2xl flex items-center gap-2 transition-all font-black uppercase tracking-widest text-xs border border-white/5"
          >
            <X size={18} />
            Sair
          </button>
        )}
      </div>

      {isAuditActive && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
          <div className="space-y-6">
            <div className="bg-blue-600/10 border-2 border-blue-500/20 p-6 rounded-3xl text-center">
              <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest block mb-2">Local Atual</span>
              <div className="flex items-center justify-center gap-3">
                <MapPin className="text-blue-500" size={24} />
                <span className="text-4xl font-black text-white uppercase tracking-tighter">
                  {currentLocation || '---'}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 flex items-center gap-1">
                <Scan size={10} /> Campo de Leitura
              </label>
              <form onSubmit={handleScan}>
                <input 
                  ref={inputRef}
                  type="text" 
                  placeholder="Bipe Local ou Produto..."
                  className={`w-full px-4 py-6 bg-black/40 border-4 rounded-2xl focus:ring-8 focus:ring-blue-500/10 outline-none font-black text-2xl text-center text-white transition-all ${
                    feedback?.type === 'success' ? 'border-green-500/50' : 
                    feedback?.type === 'error' ? 'border-red-500/50' : 
                    feedback?.type === 'info' ? 'border-blue-500/50' : 'border-blue-500/20'
                  }`}
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  autoComplete="off"
                  autoFocus
                />
              </form>
              {feedback && (
                <div className={`p-4 rounded-xl flex items-center gap-3 animate-in zoom-in-95 duration-200 ${
                  feedback.type === 'success' ? 'bg-green-600/20 text-green-400 border border-green-500/20' : 
                  feedback.type === 'error' ? 'bg-red-600/20 text-red-400 border border-red-500/20' :
                  'bg-blue-600/20 text-blue-400 border border-blue-500/20'
                }`}>
                  {feedback.type === 'success' ? <CheckCircle2 size={20} /> : feedback.type === 'error' ? <AlertCircle size={20} /> : <Info size={20} />}
                  <span className="font-bold text-sm">{feedback.message}</span>
                </div>
              )}
            </div>

            <button
              onClick={finalizeAudit}
              className="w-full py-5 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl shadow-green-900/20 active:scale-95 flex items-center justify-center gap-3"
            >
              <Save size={20} />
              Finalizar e Ver Relatório
            </button>
          </div>

          <div className="lg:col-span-2 flex flex-col min-h-0">
            <div className="bg-black/20 rounded-3xl border border-white/5 flex flex-col flex-1 overflow-hidden">
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <Package size={16} className="text-blue-500" />
                  Itens Contados ({countedList.length})
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 z-10 bg-slate-900">
                    <tr className="bg-white/5 text-slate-500 uppercase tracking-widest text-[8px] font-black">
                      <th className="px-6 py-3">CODE</th>
                      <th className="px-6 py-3">Local</th>
                      <th className="px-6 py-3 text-center">Contado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {countedList.map(item => (
                      <tr key={item.productId} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-black text-white text-sm uppercase">{item.code}</td>
                        <td className="px-6 py-4 text-slate-400 text-xs font-bold uppercase">{item.location}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-block px-3 py-1 bg-blue-600/20 text-blue-400 rounded-lg font-black text-lg">
                            {item.counted}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {countedList.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-20 text-center opacity-10">
                          <Scan size={48} className="mx-auto mb-4" />
                          <p className="text-xl font-black uppercase tracking-widest">Aguardando leitura...</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {showReport && (
        <div className="space-y-6 flex-1 flex flex-col min-h-0">
          <div className="flex justify-between items-center bg-white/5 p-6 rounded-3xl border border-white/5 shrink-0">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-600/20 rounded-2xl text-green-500">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Relatório de Divergências</h3>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Comparativo entre estoque e contagem física</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={exportCSV} className="p-3 bg-white/5 hover:bg-green-600 text-slate-400 hover:text-white rounded-xl transition-all border border-white/5 flex items-center gap-2 font-bold text-[10px] uppercase">
                <FileSpreadsheet size={18} /> CSV
              </button>
              <button onClick={exportPDF} className="p-3 bg-white/5 hover:bg-blue-600 text-slate-400 hover:text-white rounded-xl transition-all border border-white/5 flex items-center gap-2 font-bold text-[10px] uppercase">
                <FilePdf size={18} /> PDF
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <div className="overflow-x-auto rounded-3xl border border-white/5 bg-black/20 flex-1">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-900">
                  <tr className="bg-white/5 text-slate-400 uppercase tracking-widest text-[10px] font-black">
                    <th className="px-8 py-4">CODE</th>
                    <th className="px-8 py-4 text-center">Estoque Atual</th>
                    <th className="px-8 py-4 text-center">Contado</th>
                    <th className="px-8 py-4 text-right">Diferença</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {countedList.map(item => {
                    const diff = item.counted - item.currentStock;
                    return (
                      <tr key={item.productId} className="hover:bg-white/5 transition-colors">
                        <td className="px-8 py-4 font-black text-white text-base uppercase">{item.code}</td>
                        <td className="px-8 py-4 text-center font-bold text-slate-400">{item.currentStock}</td>
                        <td className="px-8 py-4 text-center font-black text-white text-lg">{item.counted}</td>
                        <td className={`px-8 py-4 text-right font-black text-lg ${diff === 0 ? 'text-slate-500' : diff > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {diff > 0 ? `+${diff}` : diff}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3 shrink-0">
            <AlertTriangle className="text-amber-500 shrink-0" size={20} />
            <p className="text-xs font-bold text-amber-200/70 leading-relaxed">
              Este relatório não altera o estoque automaticamente. Utilize os dados acima para realizar os ajustes manuais necessários na aba de Produtos ou Movimentações.
            </p>
          </div>
        </div>
      )}

      {!isAuditActive && !showReport && (
        <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-20">
          <History size={80} className="mb-6" />
          <h3 className="text-2xl font-black uppercase tracking-widest">Nenhuma sessão ativa</h3>
          <p className="font-bold mt-2">Clique em "Iniciar Inventário" para começar a auditoria.</p>
        </div>
      )}
    </div>
  );
};

const Info: React.FC<{ className?: string; size?: number }> = ({ className, size }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </svg>
);

export default StockAudit;
