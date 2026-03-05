import React, { useState, useMemo } from 'react';
import { useInventoryStore } from '../../store/useInventoryStore';
import { Car, Calendar, Clock, Package, User, Search, Filter, ArrowDownLeft, FileSpreadsheet, X, ChevronRight, TrendingUp, Info, Wrench, FileText as FilePdf } from 'lucide-react';
import { exportConsumptionPDF } from '../../lib/pdfExport';

const VehicleConsumption: React.FC = () => {
  const { movements, trucks, products } = useInventoryStore();
  const [filters, setFilters] = useState({
    period: 30 as 7 | 30 | 90 | 0,
    placa: '',
    product: '',
  });
  const [selectedPlaca, setSelectedPlaca] = useState<string | null>(null);

  // Filter movements by type SAIDA and period
  const filteredMovements = useMemo(() => {
    if (!Array.isArray(movements)) return [];
    
    let result = movements.filter(m => m.tipo === 'SAIDA');

    if (filters.period > 0) {
      const cutoff = Date.now() - (filters.period * 24 * 60 * 60 * 1000);
      result = result.filter(m => m.dataHora * 1000 >= cutoff);
    }

    if (filters.product) {
      const term = filters.product.toLowerCase();
      result = result.filter(m => 
        (m.code || '').toLowerCase().includes(term)
      );
    }

    return result;
  }, [movements, filters.period, filters.product]);

  // Aggregate data by plate
  const consumptionRanking = useMemo(() => {
    const truckPlacas = new Set(trucks.map(t => t.placa.toUpperCase()));
    const ranking: Record<string, {
      placa: string;
      totalItems: number;
      totalExits: number;
      lastExit: number;
      products: Record<string, { code: string; qty: number }>;
    }> = {};

    filteredMovements.forEach(m => {
      let placa = (m.placa || '').trim().toUpperCase();
      if (!placa || !truckPlacas.has(placa)) {
        placa = 'NÃO CADASTRADA';
      }

      if (!ranking[placa]) {
        ranking[placa] = {
          placa,
          totalItems: 0,
          totalExits: 0,
          lastExit: 0,
          products: {},
        };
      }

      ranking[placa].totalItems += m.quantidade;
      ranking[placa].totalExits += 1;
      if (m.dataHora > ranking[placa].lastExit) {
        ranking[placa].lastExit = m.dataHora;
      }

      const productKey = m.productId || m.code;
      if (!ranking[placa].products[productKey]) {
        ranking[placa].products[productKey] = {
          code: m.code,
          qty: 0,
        };
      }
      ranking[placa].products[productKey].qty += m.quantidade;
    });

    return Object.values(ranking)
      .map(item => ({
        ...item,
        topProducts: Object.values(item.products)
          .sort((a, b) => b.qty - a.qty)
          .slice(0, 3)
      }))
      .sort((a, b) => b.totalItems - a.totalItems);
  }, [filteredMovements, trucks]);

  const finalRanking = useMemo(() => {
    if (!filters.placa) return consumptionRanking;
    const term = filters.placa.toUpperCase();
    return consumptionRanking.filter(r => r.placa.includes(term));
  }, [consumptionRanking, filters.placa]);

  // Aggregate data by product (Most used parts)
  const partsRanking = useMemo(() => {
    const ranking: Record<string, {
      productId: string;
      code: string;
      totalQty: number;
      movementsCount: number;
      lastExit: number;
    }> = {};

    filteredMovements.forEach(m => {
      // Apply plate filter if present
      if (filters.placa) {
        const mPlaca = (m.placa || '').trim().toUpperCase();
        if (!mPlaca.includes(filters.placa.toUpperCase())) return;
      }

      const key = m.productId || m.code;
      if (!ranking[key]) {
        ranking[key] = {
          productId: m.productId,
          code: m.code,
          totalQty: 0,
          movementsCount: 0,
          lastExit: 0,
        };
      }

      ranking[key].totalQty += m.quantidade;
      ranking[key].movementsCount += 1;
      if (m.dataHora > ranking[key].lastExit) {
        ranking[key].lastExit = m.dataHora;
      }
    });

    return Object.values(ranking).sort((a, b) => b.totalQty - a.totalQty);
  }, [filteredMovements, filters.placa]);

  const exportPlateCSV = (placa: string) => {
    const plateMovements = filteredMovements.filter(m => {
      const mPlaca = (m.placa || '').trim().toUpperCase();
      const truckPlacas = new Set(trucks.map(t => t.placa.toUpperCase()));
      if (placa === 'NÃO CADASTRADA') {
        return !mPlaca || !truckPlacas.has(mPlaca);
      }
      return mPlaca === placa;
    });

    const headers = ['Data/Hora', 'CODE', 'Quantidade', 'Responsável', 'Observação'];
    const rows = plateMovements.map(m => [
      new Date(m.dataHora * 1000).toLocaleString('pt-BR'),
      m.code,
      m.quantidade,
      m.responsavel || '',
      m.observacao || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `consumo_${placa}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPartsCSV = () => {
    const headers = ['CODE', 'Total Saídas', 'Nº Movimentações', 'Última Saída'];
    const rows = partsRanking.map(p => [
      p.code,
      p.totalQty,
      p.movementsCount,
      p.lastExit ? new Date(p.lastExit * 1000).toLocaleString('pt-BR') : '-'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `pecas_mais_usadas_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedPlateData = useMemo(() => {
    if (!selectedPlaca) return null;
    const plateMovements = filteredMovements.filter(m => {
      const mPlaca = (m.placa || '').trim().toUpperCase();
      const truckPlacas = new Set(trucks.map(t => t.placa.toUpperCase()));
      if (selectedPlaca === 'NÃO CADASTRADA') {
        return !mPlaca || !truckPlacas.has(mPlaca);
      }
      return mPlaca === selectedPlaca;
    }).sort((a, b) => b.dataHora - a.dataHora);

    const total = plateMovements.reduce((acc, m) => acc + m.quantidade, 0);

    return { movements: plateMovements, total };
  }, [selectedPlaca, filteredMovements, trucks]);

  const getReportStats = () => {
    const lowStock = products.filter(p => p.stock > 0 && p.stock <= p.min).length;
    const zeroStock = products.filter(p => p.stock === 0).length;
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

  const handleExportConsumptionPDF = () => {
    const periodLabel = filters.period === 0 ? 'Tudo' : `Últimos ${filters.period} dias`;
    exportConsumptionPDF(finalRanking, getReportStats(), periodLabel);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-full overflow-y-auto custom-scrollbar pr-2">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 shrink-0">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-3">
            <TrendingUp className="text-blue-500" size={24} />
            Análise de Consumo
          </h2>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Ranking de veículos e peças mais utilizadas</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-48">
            <Car className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <input 
              type="text" 
              placeholder="Filtrar placa..."
              className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-xl text-[10px] font-bold text-white outline-none focus:border-blue-500 transition-all"
              value={filters.placa}
              onChange={(e) => setFilters({ ...filters, placa: e.target.value.toUpperCase() })}
            />
          </div>
          <div className="relative flex-1 lg:w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <input 
              type="text" 
              placeholder="Filtrar CODE..."
              className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-xl text-[10px] font-bold text-white outline-none focus:border-blue-500 transition-all"
              value={filters.product}
              onChange={(e) => setFilters({ ...filters, product: e.target.value })}
            />
          </div>
          <div className="flex bg-black/40 border border-white/10 rounded-xl p-1">
            {[
              { label: '7d', value: 7 },
              { label: '30d', value: 30 },
              { label: '90d', value: 90 },
              { label: 'Tudo', value: 0 },
            ].map((p) => (
              <button
                key={p.value}
                onClick={() => setFilters({ ...filters, period: p.value as any })}
                className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${
                  filters.period === p.value ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button 
            onClick={handleExportConsumptionPDF}
            className="p-2 bg-white/5 hover:bg-blue-600 text-slate-400 hover:text-white rounded-xl transition-all border border-white/5"
            title="Exportar PDF"
          >
            <FilePdf size={18} />
          </button>
        </div>
      </div>

      {/* Section 1: Vehicles Ranking */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-tight">
            <Car className="text-blue-500" size={20} />
            Ranking por Veículo
          </h3>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-white/5 bg-black/20">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-slate-400 uppercase tracking-widest text-[10px] font-black">
                <th className="px-8 py-4">Placa</th>
                <th className="px-8 py-4 text-right">Total Itens</th>
                <th className="px-8 py-4 text-right">Nº Saídas</th>
                <th className="px-8 py-4">Última Saída</th>
                <th className="px-8 py-4">Top 3 CODEs</th>
                <th className="px-8 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {finalRanking.map(item => (
                <tr key={item.placa} className="hover:bg-white/5 transition-colors group">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500">
                        <Car size={20} />
                      </div>
                      <span className="font-black text-white text-lg tracking-tight">{item.placa}</span>
                    </div>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <span className="text-xl font-black text-white">{item.totalItems}</span>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <span className="font-bold text-slate-400">{item.totalExits}</span>
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-300">
                        {item.lastExit ? new Date(item.lastExit * 1000).toLocaleDateString('pt-BR') : '-'}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {item.lastExit ? new Date(item.lastExit * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex flex-wrap gap-1">
                      {item.topProducts.map((p, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-white/5 rounded-md text-[9px] font-bold text-slate-400 border border-white/5" title={p.code}>
                          {p.code} ({p.qty})
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-8 py-4 text-center">
                    <button 
                      onClick={() => setSelectedPlaca(item.placa)}
                      className="p-2 bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white rounded-xl transition-all group"
                    >
                      <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </td>
                </tr>
              ))}
              {finalRanking.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-20 text-center opacity-10">
                    <TrendingUp size={48} className="mx-auto mb-4" />
                    <p className="text-xl font-black uppercase tracking-widest">Sem dados de consumo</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Most Used Parts Ranking */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-tight">
            <Wrench className="text-blue-500" size={20} />
            Peças Mais Usadas
          </h3>
          <button 
            onClick={exportPartsCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-green-600 text-slate-400 hover:text-white rounded-xl transition-all border border-white/5 font-bold text-[10px] uppercase"
          >
            <FileSpreadsheet size={14} />
            Exportar Ranking
          </button>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-white/5 bg-black/20">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-slate-400 uppercase tracking-widest text-[10px] font-black">
                <th className="px-8 py-4">CODE</th>
                <th className="px-8 py-4 text-right">Total Saídas</th>
                <th className="px-8 py-4 text-right">Nº Movimentações</th>
                <th className="px-8 py-4">Última Saída</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {partsRanking.map(item => (
                <tr key={item.productId || item.code} className="hover:bg-white/5 transition-colors group">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500">
                        <Package size={20} />
                      </div>
                      <span className="font-black text-white text-base uppercase tracking-tight">{item.code}</span>
                    </div>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <span className="text-xl font-black text-white">{item.totalQty}</span>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <span className="font-bold text-slate-400">{item.movementsCount}</span>
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-300">
                        {item.lastExit ? new Date(item.lastExit * 1000).toLocaleDateString('pt-BR') : '-'}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {item.lastExit ? new Date(item.lastExit * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
              {partsRanking.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-20 text-center opacity-10">
                    <Wrench size={48} className="mx-auto mb-4" />
                    <p className="text-xl font-black uppercase tracking-widest">Sem dados de peças</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedPlaca && selectedPlateData && (
        <div className="modal-overlay p-2 md:p-4">
          <div className="bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden border border-white/10 animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 md:p-8 border-b border-white/5 bg-black/20 shrink-0">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-blue-600 text-white shadow-lg">
                  <Car size={24} />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">{selectedPlaca}</h3>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Detalhamento de Consumo</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => exportPlateCSV(selectedPlaca)}
                  className="p-3 bg-white/5 hover:bg-green-600 text-slate-400 hover:text-white rounded-2xl transition-all shadow-lg group"
                  title="Exportar CSV"
                >
                  <FileSpreadsheet size={24} />
                </button>
                <button 
                  onClick={() => setSelectedPlaca(null)} 
                  className="p-3 bg-white/5 hover:bg-red-600 text-slate-400 hover:text-white rounded-2xl transition-all shadow-lg group"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 md:p-8 flex flex-col flex-1 overflow-hidden">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Total de Itens</span>
                  <span className="text-2xl font-black text-white">{selectedPlateData.total}</span>
                </div>
                <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Nº de Saídas</span>
                  <span className="text-2xl font-black text-white">{selectedPlateData.movements.length}</span>
                </div>
                <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Período</span>
                  <span className="text-2xl font-black text-white">{filters.period === 0 ? 'Tudo' : `${filters.period}d`}</span>
                </div>
                <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Média/Saída</span>
                  <span className="text-2xl font-black text-white">
                    {selectedPlateData.movements.length > 0 ? (selectedPlateData.total / selectedPlateData.movements.length).toFixed(1) : '0'}
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar rounded-xl border border-white/5 bg-black/20">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 z-10 bg-slate-800">
                    <tr className="bg-white/5 text-slate-400 uppercase tracking-widest text-[8px] font-black">
                      <th className="px-4 py-3">Data/Hora</th>
                      <th className="px-4 py-3">CODE</th>
                      <th className="px-4 py-3 text-right">Qtd</th>
                      <th className="px-4 py-3">Responsável</th>
                      <th className="px-4 py-3">Observação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {selectedPlateData.movements.map(m => (
                      <tr key={m.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 text-[10px] text-slate-400">
                          <div className="flex flex-col">
                            <span>{new Date(m.dataHora * 1000).toLocaleDateString('pt-BR')}</span>
                            <span className="opacity-50">{new Date(m.dataHora * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-black text-white text-sm uppercase tracking-tight">{m.code}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-black text-white text-sm">{m.quantidade}</td>
                        <td className="px-4 py-3 text-[10px] text-slate-400">{m.responsavel || '-'}</td>
                        <td className="px-4 py-3 text-[10px] text-slate-500 italic truncate max-w-[150px]" title={m.observacao}>
                          {m.observacao || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleConsumption;
