import React, { useMemo, useState } from 'react';
import { useInventoryStore } from '../../store/useInventoryStore';
import { AlertTriangle, AlertCircle, HelpCircle, Download, Printer, Package, Hash, MapPin, ShoppingCart, X, FileSpreadsheet, FileText as FilePdf } from 'lucide-react';
import { exportAlertsPDF } from '../../lib/pdfExport';
import { getStockStatus, getSuggestedBuyQty } from '../../lib/inventoryRules';
import { Product } from '../../types/inventory';

const Alerts: React.FC = () => {
  const { products } = useInventoryStore();
  const [isShoppingListOpen, setIsShoppingListOpen] = useState(false);

  const alerts = useMemo(() => {
    const categories = {
      ZERADO: [] as Product[],
      BAIXO: [] as Product[],
      INCONSISTENTE: [] as Product[],
    };

    products.forEach(p => {
      const status = getStockStatus(p.stock, p.min);
      if (status === 'ZERADO') categories.ZERADO.push(p);
      else if (status === 'BAIXO') categories.BAIXO.push(p);
      else if (status === 'INCONSISTENTE') categories.INCONSISTENTE.push(p);
    });

    return categories;
  }, [products]);

  const hasAlerts = alerts.ZERADO.length > 0 || alerts.BAIXO.length > 0 || alerts.INCONSISTENTE.length > 0;

  const shoppingListItems = useMemo(() => {
    return [...alerts.ZERADO, ...alerts.BAIXO].map(p => ({
      ...p,
      suggested: getSuggestedBuyQty(p.stock, p.min)
    })).filter(item => item.suggested > 0);
  }, [alerts]);

  const getReportStats = () => {
    const lowStock = products.filter(p => {
      const min = p.min ?? 1;
      return p.stock > 0 && p.stock <= min;
    }).length;
    const zeroStock = products.filter(p => p.stock === 0).length;
    const { movements } = useInventoryStore.getState();
    const totalExits = movements.filter(m => m.tipo === 'SAIDA').reduce((acc, m) => acc + m.quantidade, 0);
    const totalEntries = movements.filter(m => m.tipo === 'ENTRADA').reduce((acc, m) => acc + m.quantidade, 0);

    return {
      totalProducts: products.length,
      totalExits,
      totalEntries,
      lowStockCount: lowStock,
      zeroStockCount: zeroStock,
    };
  };

  const handleExportAlertsPDF = () => {
    const allAlerts = [...alerts.INCONSISTENTE, ...alerts.ZERADO, ...alerts.BAIXO];
    exportAlertsPDF(allAlerts, getReportStats());
  };

  const exportAlertsCSV = () => {
    const headers = ['Status', 'CODE', 'Quantidade', 'Mínimo', 'Localização', 'Sugestão de Compra'];
    const rows = [
      ...alerts.INCONSISTENTE.map(p => ['INCONSISTENTE', p.code, p.stock, p.min, p.location || '', getSuggestedBuyQty(p.stock, p.min)]),
      ...alerts.ZERADO.map(p => ['ZERADO', p.code, p.stock, p.min, p.location || '', getSuggestedBuyQty(p.stock, p.min)]),
      ...alerts.BAIXO.map(p => ['BAIXO', p.code, p.stock, p.min, p.location || '', getSuggestedBuyQty(p.stock, p.min)]),
    ];

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `alertas_estoque_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportShoppingListCSV = () => {
    const headers = ['CODE', 'Quantidade Atual', 'Estoque Mínimo', 'Quantidade Sugerida'];
    const rows = shoppingListItems.map(item => [
      item.code,
      item.stock,
      item.min,
      item.suggested
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `lista_compras_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderSection = (title: string, items: Product[], icon: React.ReactNode, colorClass: string, badgeClass: string) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl bg-white/5 ${colorClass}`}>
              {React.cloneElement(icon as React.ReactElement, { size: 20 })}
            </div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight">{title}</h3>
          </div>
          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${badgeClass}`}>
            {items.length} {items.length === 1 ? 'Item' : 'Itens'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map(p => (
            <div key={p.id} className="bg-slate-900/50 border border-white/5 p-6 rounded-[2rem] hover:border-white/10 transition-all group">
              <div className="flex justify-between items-start mb-3">
                <div className="min-w-0">
                  <h4 className="text-lg font-black text-white truncate uppercase tracking-tight group-hover:text-blue-400 transition-colors">{p.code}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    {p.location && (
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <MapPin size={10} /> {p.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5">
                <div>
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Estoque Atual</p>
                  <p className={`text-sm font-black ${p.stock <= 0 ? 'text-red-500' : 'text-white'}`}>{p.stock}</p>
                </div>
                <div>
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Mínimo</p>
                  <p className="text-sm font-black text-white">{p.min}</p>
                </div>
              </div>

              {(getStockStatus(p.stock, p.min) === 'BAIXO' || getStockStatus(p.stock, p.min) === 'ZERADO') && (
                <div className="mt-3 p-2 bg-blue-600/10 border border-blue-500/20 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingCart size={12} className="text-blue-500" />
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Sugestão</span>
                  </div>
                  <span className="text-xs font-black text-white">Comprar {getSuggestedBuyQty(p.stock, p.min)}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-3">
            <AlertTriangle className="text-yellow-500" size={24} />
            Alertas de Estoque
          </h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Produtos que necessitam de atenção imediata</p>
        </div>

        {hasAlerts && (
          <div className="flex gap-2 w-full md:w-auto">
            <button 
              onClick={exportAlertsCSV}
              className="flex-1 md:flex-none bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all font-bold shadow-sm active:scale-95"
              title="Exportar CSV"
            >
              <Download size={18} />
              <span className="text-[10px] uppercase">CSV</span>
            </button>
            <button 
              onClick={handleExportAlertsPDF}
              className="flex-1 md:flex-none bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all font-bold shadow-sm active:scale-95"
              title="Exportar PDF"
            >
              <FilePdf size={18} />
              <span className="text-[10px] uppercase">PDF</span>
            </button>
            <button 
              onClick={() => setIsShoppingListOpen(true)}
              className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all font-bold shadow-lg shadow-blue-900/20 active:scale-95"
            >
              <ShoppingCart size={18} />
              <span className="text-[10px] uppercase">Lista de Compras</span>
            </button>
          </div>
        )}
      </div>

      {!hasAlerts ? (
        <div className="py-20 text-center bg-white/5 rounded-[2rem] border border-dashed border-white/10">
          <Package size={48} className="mx-auto mb-4 text-slate-700" />
          <p className="text-xl font-black uppercase tracking-widest text-slate-500">Tudo em ordem!</p>
          <p className="text-slate-600 font-bold mt-2">Nenhum alerta de estoque no momento.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {renderSection('Inconsistentes', alerts.INCONSISTENTE, <HelpCircle className="text-purple-500" />, 'text-purple-500', 'bg-purple-500/20 text-purple-400')}
          {renderSection('Zerados', alerts.ZERADO, <AlertCircle className="text-red-500" />, 'text-red-500', 'bg-red-500/20 text-red-400')}
          {renderSection('Estoque Baixo', alerts.BAIXO, <AlertTriangle className="text-yellow-500" />, 'text-yellow-500', 'bg-yellow-500/20 text-yellow-400')}
        </div>
      )}

      {/* Shopping List Modal */}
      {isShoppingListOpen && (
        <div className="modal-overlay p-2 md:p-4 z-[100]">
          <div className="bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-4xl overflow-hidden border border-white/10 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 md:p-8 border-b border-white/5 bg-black/20 shrink-0">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-blue-600 text-white">
                  <ShoppingCart size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight">Lista de Compras</h3>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Reposição de Estoque</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={exportShoppingListCSV}
                  className="p-3 bg-white/5 hover:bg-green-600 text-slate-400 hover:text-white rounded-2xl transition-all shadow-lg group"
                  title="Exportar CSV"
                >
                  <FileSpreadsheet size={24} />
                </button>
                <button 
                  onClick={() => setIsShoppingListOpen(false)} 
                  className="p-3 bg-white/5 hover:bg-red-600 text-slate-400 hover:text-white rounded-2xl transition-all shadow-lg group"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 md:p-8 overflow-y-auto flex-1 custom-scrollbar print:p-0">
              <div className="bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5 text-slate-400 uppercase tracking-widest text-[10px] font-black">
                      <th className="px-6 py-4">CODE</th>
                      <th className="px-6 py-4 text-center">Qtd Atual</th>
                      <th className="px-6 py-4 text-center">Mínimo</th>
                      <th className="px-6 py-4 text-right">Sugestão</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {shoppingListItems.map(item => (
                      <tr key={item.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-black text-white text-base uppercase tracking-tight">{item.code}</td>
                        <td className="px-6 py-4 text-center font-bold text-slate-400 text-sm">{item.stock}</td>
                        <td className="px-6 py-4 text-center font-bold text-slate-400 text-sm">{item.min}</td>
                        <td className="px-6 py-4 text-right font-black text-blue-400 text-base">{item.suggested}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-blue-600/10">
                      <td colSpan={3} className="px-6 py-4 text-sm font-black text-white uppercase tracking-widest">Total de Itens a Comprar</td>
                      <td className="px-6 py-4 text-right font-black text-white text-xl">
                        {shoppingListItems.reduce((acc, item) => acc + item.suggested, 0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              
              <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3 no-print">
                <AlertTriangle className="text-amber-500 shrink-0" size={20} />
                <p className="text-xs font-bold text-amber-200/70 leading-relaxed">
                  Esta lista é gerada automaticamente para atingir o estoque mínimo configurado para cada produto. 
                  Verifique a necessidade real antes de efetuar o pedido.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Alerts;
