import React, { useState, useEffect, useMemo } from 'react';
import { useInventoryStore } from '../../store/useInventoryStore';
import { client } from '../../api/client';
import { Package, ArrowUpRight, ArrowDownLeft, FileText, Plus, AlertTriangle, Upload, Download, Search, Filter, FileCode, Scan, BarChart3, RefreshCw, LogOut, ShoppingCart, Image as ImageIcon, Database, Trash2, Printer, AlertCircle, HelpCircle, User, Car, Bell, Wrench, Calendar, Clock, Fuel, FileSpreadsheet, FileText as FilePdf, MapPin, History } from 'lucide-react';
import { exportMovementsPDF } from '../../lib/pdfExport';
import ProductList from '../../components/Inventory/ProductList';
import TransactionForm from '../../components/Inventory/TransactionForm';
import InvoiceManager from '../../components/Inventory/InvoiceManager';
import ImportModal from '../../components/Inventory/ImportModal';
import InvoiceForm from '../../components/Inventory/InvoiceForm';
import XMLImport from '../../components/Inventory/XMLImport';
import BarcodeScanner from '../../components/Inventory/BarcodeScanner';
import Reports from '../../components/Inventory/Reports';
import ProductForm from '../../components/Inventory/ProductForm';
import LabelPrinter from '../../components/Inventory/LabelPrinter';
import PurchaseRequestManager from '../../components/Inventory/PurchaseRequestManager';
import BulkImageAssistant from '../../components/Inventory/BulkImageAssistant';
import Alerts from '../../components/Inventory/Alerts';
import MechanicMode from '../../components/Inventory/MechanicMode';
import VehicleConsumption from '../../components/Inventory/VehicleConsumption';
import TruckManager from '../../components/Inventory/TruckManager';
import BarcodeBeeper from '../../components/Inventory/BarcodeBeeper';
import LocationsPage from '../../components/Locations/LocationsPage';
import StockAudit from '../../components/Inventory/StockAudit';
import { getStockStatus } from '../../lib/inventoryRules';

const InventoryDashboard: React.FC = () => {
  const { products, transactions, movements, trucks, exportToCSV, exportFullBackup, fetchData, isLoading, deleteTransaction } = useInventoryStore();
  const [activeTab, setActiveTab] = useState<'products' | 'transactions' | 'invoices' | 'reports' | 'labels' | 'purchase-requests' | 'alerts' | 'mechanic' | 'consumption' | 'trucks' | 'beeper' | 'locations' | 'audit'>('products');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isXMLModalOpen, setIsXMLModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  // Filters for Movements
  const [movementFilters, setMovementFilters] = useState({
    placa: '',
    product: '',
    type: 'ALL' as 'ALL' | 'ENTRADA' | 'SAIDA' | 'AJUSTE',
    period: 30 as 7 | 30 | 90 | 0, // 0 means all
  });

  useEffect(() => {
    fetchData();
  }, []);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentIn = useMemo(() => {
    if (!Array.isArray(movements)) return 0;
    return movements.filter(m => m.tipo === 'ENTRADA' && m.dataHora * 1000 >= thirtyDaysAgo.getTime()).length;
  }, [movements, thirtyDaysAgo]);

  const recentOut = useMemo(() => {
    if (!Array.isArray(movements)) return 0;
    return movements.filter(m => m.tipo === 'SAIDA' && m.dataHora * 1000 >= thirtyDaysAgo.getTime()).length;
  }, [movements, thirtyDaysAgo]);

  const stockStats = useMemo(() => {
    if (!Array.isArray(products)) return { baixo: 0, zerado: 0, inconsistente: 0 };
    return products.reduce((acc, p) => {
      const status = getStockStatus(p.stock, p.min);
      if (status === 'BAIXO') acc.baixo++;
      else if (status === 'ZERADO') acc.zerado++;
      else if (status === 'INCONSISTENTE') acc.inconsistente++;
      return acc;
    }, { baixo: 0, zerado: 0, inconsistente: 0 });
  }, [products]);

  const totalAlerts = stockStats.baixo + stockStats.zerado + stockStats.inconsistente;

  const filteredMovements = useMemo(() => {
    let result = [...movements];

    // Filter by type
    if (movementFilters.type !== 'ALL') {
      result = result.filter(m => m.tipo === movementFilters.type);
    }

    // Filter by period
    if (movementFilters.period > 0) {
      const cutoff = Date.now() - (movementFilters.period * 24 * 60 * 60 * 1000);
      result = result.filter(m => m.dataHora * 1000 >= cutoff);
    }

    // Filter by plate
    if (movementFilters.placa) {
      const term = movementFilters.placa.toLowerCase();
      result = result.filter(m => (m.placa || '').toLowerCase().includes(term));
    }

    // Filter by product
    if (movementFilters.product) {
      const term = movementFilters.product.toLowerCase();
      result = result.filter(m => 
        (m.code || '').toLowerCase().includes(term)
      );
    }

    // Sort by most recent first
    return result.sort((a, b) => b.dataHora - a.dataHora);
  }, [movements, movementFilters, products]);

  const getReportStats = () => {
    const lowStock = products.filter(p => {
      const min = p.minimo ?? p.minQuantity ?? 1;
      return p.quantity > 0 && p.quantity <= min;
    }).length;
    const zeroStock = products.filter(p => p.quantity === 0).length;
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

  const handleExportMovementsPDF = () => {
    const periodLabel = movementFilters.period === 0 ? 'Tudo' : `Últimos ${movementFilters.period} dias`;
    const filters = [
      movementFilters.type !== 'ALL' ? `Tipo: ${movementFilters.type}` : null,
      movementFilters.placa ? `Placa: ${movementFilters.placa}` : null,
      movementFilters.product ? `Busca: ${movementFilters.product}` : null,
    ].filter(Boolean).join(' | ') || 'Nenhum';

    exportMovementsPDF(filteredMovements, getReportStats(), periodLabel, filters);
  };

  const exportMovementsCSV = () => {
    const headers = ['Data/Hora', 'Tipo', 'CODE', 'Quantidade', 'Placa', 'Responsável', 'Observação'];
    const rows = filteredMovements.map(m => {
      return [
        new Date(m.dataHora * 1000).toLocaleString('pt-BR'),
        m.tipo,
        m.code,
        m.quantidade,
        m.placa || '',
        m.responsavel || '',
        m.observacao || ''
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `movimentacoes_estoque_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tabs = [
    { id: 'products', label: 'Produtos', icon: Package },
    { id: 'audit', label: 'Inventário', icon: History },
    { id: 'beeper', label: 'Bipador', icon: Scan },
    { id: 'mechanic', label: 'Mecânico', icon: Wrench },
    { id: 'consumption', label: 'Consumo', icon: Fuel },
    { id: 'trucks', label: 'Caminhões', icon: Car },
    { id: 'locations', label: 'Locais', icon: MapPin },
    { id: 'transactions', label: 'Movim.', icon: ArrowUpRight },
    { id: 'alerts', label: 'Alertas', icon: Bell, badge: totalAlerts > 0 ? totalAlerts : undefined },
    { id: 'invoices', label: 'NFs', icon: FileText },
    { id: 'purchase-requests', label: 'Compras', icon: ShoppingCart },
    { id: 'labels', label: 'Etiquet.', icon: Printer },
    { id: 'reports', label: 'Relat.', icon: BarChart3 },
  ];

  return (
    <div className="h-screen overflow-hidden font-sans text-slate-100 flex flex-col bg-[#020617] safe-area-top">
      <div className="p-2 md:p-4 lg:p-6 max-w-[1600px] mx-auto w-full flex flex-col flex-1 overflow-hidden">
        <header className="mb-3 md:mb-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 no-print shrink-0">
          <div className="flex justify-between items-center w-full lg:w-auto">
            <div className="space-y-0.5">
              <h1 className="text-xl md:text-4xl font-black tracking-tight text-white drop-shadow-lg">
                SISTEMA<span className="text-blue-600">CNR</span>
              </h1>
              <p className="text-[10px] md:text-sm text-white font-medium opacity-60 uppercase tracking-widest">Gestão de Estoque</p>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => fetchData()}
                className={`p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all ${isLoading ? 'animate-spin text-blue-500' : 'text-slate-400'}`}
                title="Atualizar Dados"
              >
                <RefreshCw size={18} />
              </button>
              <button 
                onClick={() => client.auth.signOut()}
                className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all"
                title="Sair do Sistema"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
          
          {/* Action Buttons - Scrollable on Mobile */}
          <div className="w-full lg:w-auto overflow-x-auto no-scrollbar -mx-2 px-2 shrink-0">
            <div className="flex gap-2 pb-1">
              <button 
                onClick={() => setIsAssistantOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all font-bold shadow-lg shadow-blue-900/20 active:scale-95 shrink-0"
              >
                <ImageIcon size={18} />
                <span className="text-[10px] uppercase">Fotos</span>
              </button>
              <button 
                onClick={() => setIsProductModalOpen(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all font-bold shadow-lg shadow-green-900/20 active:scale-95 shrink-0"
              >
                <Plus size={18} />
                <span className="text-[10px] uppercase">Novo</span>
              </button>
              <button 
                onClick={() => setIsScannerOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all font-bold shadow-lg shadow-blue-900/20 active:scale-95 shrink-0"
              >
                <Scan size={18} />
                <span className="text-[10px] uppercase">Scanner</span>
              </button>
              <button 
                onClick={() => setIsXMLModalOpen(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all font-bold shadow-lg shadow-purple-900/20 active:scale-95 shrink-0"
              >
                <FileCode size={18} />
                <span className="text-[10px] uppercase">XML</span>
              </button>
              <button 
                onClick={() => setIsInvoiceModalOpen(true)}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all font-bold shadow-sm active:scale-95 shrink-0"
              >
                <FileText size={18} />
                <span className="text-[10px] uppercase">NF</span>
              </button>
              <button 
                onClick={() => setIsImportModalOpen(true)}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all font-bold shadow-sm active:scale-95 shrink-0"
              >
                <Upload size={18} />
                <span className="text-[10px] uppercase">CSV</span>
              </button>
              <button 
                onClick={() => exportFullBackup()}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all font-bold shadow-sm active:scale-95 shrink-0"
              >
                <Database size={18} />
                <span className="text-[10px] uppercase">Backup</span>
              </button>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-white text-black px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all font-bold shadow-xl active:scale-95 shrink-0"
              >
                <ArrowUpRight size={18} />
                <span className="text-[10px] uppercase">Movim.</span>
              </button>
            </div>
          </div>
        </header>

        {/* Stats Cards - More compact on mobile */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-2 md:gap-4 mb-3 md:mb-6 no-print shrink-0">
          {[
            { label: 'Total', value: products.length, icon: Package, color: 'blue' },
            { label: 'Baixo', value: stockStats.baixo, icon: AlertTriangle, color: 'yellow' },
            { label: 'Zerado', value: stockStats.zerado, icon: AlertCircle, color: 'red' },
            { label: 'Erro', value: stockStats.inconsistente, icon: HelpCircle, color: 'purple' },
            { label: 'Entradas', value: recentIn, icon: ArrowUpRight, color: 'green' },
            { label: 'Saídas', value: recentOut, icon: ArrowDownLeft, color: 'orange' },
          ].map((stat, i) => (
            <div key={i} className="bg-slate-900/60 backdrop-blur-md p-3 md:p-4 rounded-xl md:rounded-2xl shadow-xl border border-white/5 hover:border-white/10 transition-all group">
              <div className="flex items-center gap-2 md:gap-3">
                <div className={`p-1.5 md:p-2.5 bg-${stat.color}-500/10 text-${stat.color}-500 rounded-lg md:rounded-xl group-hover:scale-110 transition-transform`}>
                  <stat.icon size={14} className="md:w-5 md:h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[8px] md:text-[10px] font-bold text-white uppercase tracking-widest mb-0.5 opacity-60 truncate">{stat.label}</p>
                  <p className="text-sm md:text-xl font-black text-white truncate">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl md:rounded-[2rem] shadow-2xl border border-white/5 overflow-hidden flex-1 flex flex-col mb-16 md:mb-0">
          {/* Desktop Tabs */}
          <div className="hidden md:flex flex-wrap border-b border-white/5 bg-black/20 p-1 md:p-1.5 gap-1 no-print shrink-0">
            {tabs.map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-1.5 md:gap-2 px-2 md:px-4 py-2 md:py-3 rounded-lg md:rounded-xl font-bold text-[10px] md:text-sm transition-all relative ${
                  activeTab === tab.id 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                }`}
              >
                <tab.icon size={14} className="md:w-4 md:h-4" />
                {tab.label}
                {tab.badge !== undefined && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 md:p-6">
            {activeTab === 'products' && <ProductList />}
            {activeTab === 'audit' && <StockAudit />}
            {activeTab === 'beeper' && <BarcodeBeeper />}
            {activeTab === 'alerts' && <Alerts />}
            {activeTab === 'mechanic' && <MechanicMode />}
            {activeTab === 'consumption' && <VehicleConsumption />}
            {activeTab === 'trucks' && <TruckManager />}
            {activeTab === 'locations' && <LocationsPage />}
            {activeTab === 'transactions' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-full">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
                  <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-3">
                    <ArrowUpRight className="text-blue-500" size={24} />
                    Histórico de Movimentações
                  </h2>

                  {/* Filters */}
                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none min-w-[100px]">
                      <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                      <select 
                        className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-xl text-[10px] font-bold text-white outline-none focus:border-blue-500 transition-all appearance-none"
                        value={movementFilters.type}
                        onChange={(e) => setMovementFilters({ ...movementFilters, type: e.target.value as any })}
                      >
                        <option value="ALL">Todos Tipos</option>
                        <option value="ENTRADA">Entrada</option>
                        <option value="SAIDA">Saída</option>
                        <option value="AJUSTE">Ajuste</option>
                      </select>
                    </div>
                    <div className="relative flex-1 md:flex-none min-w-[100px]">
                      <Car className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                      <input 
                        type="text" 
                        placeholder="Placa..."
                        className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-xl text-[10px] font-bold text-white outline-none focus:border-blue-500 transition-all"
                        value={movementFilters.placa}
                        onChange={(e) => setMovementFilters({ ...movementFilters, placa: e.target.value.toUpperCase() })}
                      />
                    </div>
                    <div className="relative flex-1 md:flex-none min-w-[120px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                      <input 
                        type="text" 
                        placeholder="Filtrar CODE..."
                        className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-xl text-[10px] font-bold text-white outline-none focus:border-blue-500 transition-all"
                        value={movementFilters.product}
                        onChange={(e) => setMovementFilters({ ...movementFilters, product: e.target.value })}
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
                          onClick={() => setMovementFilters({ ...movementFilters, period: p.value as any })}
                          className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${
                            movementFilters.period === p.value ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                    <button 
                      onClick={exportMovementsCSV}
                      className="p-2 bg-white/5 hover:bg-green-600 text-slate-400 hover:text-white rounded-xl transition-all border border-white/5"
                      title="Exportar CSV"
                    >
                      <FileSpreadsheet size={18} />
                    </button>
                    <button 
                      onClick={handleExportMovementsPDF}
                      className="p-2 bg-white/5 hover:bg-blue-600 text-slate-400 hover:text-white rounded-xl transition-all border border-white/5"
                      title="Exportar PDF"
                    >
                      <FilePdf size={18} />
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto rounded-xl md:rounded-2xl border border-white/5 bg-black/20 flex-1">
                    <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 z-10 bg-slate-900">
                        <tr className="bg-white/5 text-slate-400 uppercase tracking-widest text-[10px] font-black">
                          <th className="px-4 md:px-8 py-3 md:py-4">Data/Hora</th>
                          <th className="px-4 md:px-8 py-3 md:py-4">Tipo</th>
                          <th className="px-4 md:px-8 py-3 md:py-4">CODE</th>
                          <th className="px-4 md:px-8 py-3 md:py-4 text-right">Qtd</th>
                          <th className="px-4 md:px-8 py-3 md:py-4">Placa / Resp.</th>
                          <th className="px-4 md:px-8 py-3 md:py-4">Observação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredMovements.map(m => {
                          const product = products.find(p => p.id === m.productId);
                          return (
                            <tr key={m.id} className="hover:bg-white/5 transition-colors group">
                              <td className="px-4 md:px-8 py-3 md:py-4 text-slate-400 font-medium text-[10px] md:text-sm">
                                <div className="flex flex-col">
                                  <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(m.dataHora * 1000).toLocaleDateString('pt-BR')}</span>
                                  <span className="flex items-center gap-1 text-[10px] opacity-60"><Clock size={10} /> {new Date(m.dataHora * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                              </td>
                              <td className="px-4 md:px-8 py-3 md:py-4">
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[8px] md:text-[10px] font-black uppercase tracking-wider ${
                                  m.tipo === 'ENTRADA' ? 'bg-green-500/10 text-green-500' : m.tipo === 'SAIDA' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'
                                }`}>
                                  {m.tipo === 'ENTRADA' ? <ArrowUpRight size={10} /> : m.tipo === 'SAIDA' ? <ArrowDownLeft size={10} /> : <Info size={10} />}
                                  {m.tipo}
                                </span>
                              </td>
                              <td className="px-4 md:px-8 py-3 md:py-4">
                                <span className="font-black text-white text-[10px] md:text-sm uppercase tracking-tight">{m.code}</span>
                              </td>
                              <td className="px-4 md:px-8 py-3 md:py-4 text-right font-black text-[10px] md:text-base text-white">{m.quantidade}</td>
                              <td className="px-4 md:px-8 py-3 md:py-4 text-slate-400 font-medium text-[10px] md:text-sm">
                                <div className="flex flex-col">
                                  {m.placa && <span className="flex items-center gap-1 text-white font-black"><Car size={10} /> {m.placa}</span>}
                                  {m.responsavel && <span className="flex items-center gap-1"><User size={10} /> {m.responsavel}</span>}
                                </div>
                              </td>
                              <td className="px-4 md:px-8 py-3 md:py-4 text-slate-500 italic text-[10px] md:text-xs max-w-[200px] truncate" title={m.observacao}>
                                {m.observacao || '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card Layout */}
                  <div className="md:hidden flex-1 overflow-y-auto custom-scrollbar space-y-3">
                    {filteredMovements.map(m => {
                      const product = products.find(p => p.id === m.productId);
                      return (
                        <div key={m.id} className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-xl ${m.tipo === 'ENTRADA' ? 'bg-green-500/10 text-green-500' : m.tipo === 'SAIDA' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                {m.tipo === 'ENTRADA' ? <ArrowUpRight size={16} /> : m.tipo === 'SAIDA' ? <ArrowDownLeft size={16} /> : <Info size={16} />}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-sm font-black text-white truncate uppercase tracking-tight">{m.code}</h4>
                              </div>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-base font-black text-white">{m.quantidade}</span>
                              <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">{m.tipo}</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 pt-3 border-t border-white/5">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                {new Date(m.dataHora * 1000).toLocaleString('pt-BR')}
                              </span>
                              <div className="flex gap-3">
                                {m.placa && <span className="text-[10px] text-white font-black flex items-center gap-1"><Car size={10} /> {m.placa}</span>}
                                {m.responsavel && <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1"><User size={10} /> {m.responsavel}</span>}
                              </div>
                            </div>
                            {m.observacao && (
                              <p className="text-[10px] text-slate-500 italic bg-black/20 p-2 rounded-lg border border-white/5">
                                {m.observacao}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {filteredMovements.length === 0 && (
                    <div className="py-20 text-center opacity-10">
                      <ArrowUpRight size={48} className="mx-auto mb-4" />
                      <p className="text-xl font-black uppercase tracking-widest">Sem movimentações</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            {activeTab === 'invoices' && <InvoiceManager />}
            {activeTab === 'reports' && <Reports />}
            {activeTab === 'labels' && <LabelPrinter />}
            {activeTab === 'purchase-requests' && <PurchaseRequestManager />}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-xl border-t border-white/10 flex justify-around items-center p-2 safe-area-bottom z-50">
        {tabs.map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all relative ${
              activeTab === tab.id ? 'text-blue-500' : 'text-slate-500'
            }`}
          >
            <tab.icon size={20} />
            <span className="text-[8px] font-black uppercase tracking-tighter">{tab.label}</span>
            {tab.badge !== undefined && (
              <span className="absolute top-1 right-1 bg-red-600 text-white text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-lg">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Modals */}
      {isModalOpen && <TransactionForm onClose={() => setIsModalOpen(false)} />}
      {isProductModalOpen && <ProductForm onClose={() => setIsProductModalOpen(false)} />}
      {isImportModalOpen && <ImportModal onClose={() => setIsImportModalOpen(false)} />}
      {isInvoiceModalOpen && <InvoiceForm onClose={() => setIsInvoiceModalOpen(false)} />}
      {isXMLModalOpen && <XMLImport onClose={() => setIsXMLModalOpen(false)} />}
      {isScannerOpen && <BarcodeScanner onClose={() => setIsScannerOpen(false)} />}
      {isAssistantOpen && <BulkImageAssistant onClose={() => setIsAssistantOpen(false)} />}
    </div>
  );
};

export default InventoryDashboard;
