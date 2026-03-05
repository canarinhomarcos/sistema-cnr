import React, { useState, useMemo } from 'react';
import { useInventoryStore } from '../../store/useInventoryStore';
import { AlertTriangle, Edit2, Trash2, Search, Filter, ChevronRight, Image as ImageIcon, Maximize2, X, MapPin, Hash, TrendingUp, ChevronDown, CheckSquare, Square, Trash, ChevronLeft, AlertCircle, CheckCircle2, HelpCircle, RefreshCw, FileText as FilePdf, Scan, Printer, Loader2 } from 'lucide-react';
import { exportProductsPDF } from '../../lib/pdfExport';
import { exportProductLabels, exportLocationLabels } from '../../lib/labelExport';
import PriceHistoryChart from './PriceHistoryChart';
import ProductForm from './ProductForm';
import AdjustStockModal from './AdjustStockModal';
import { Product } from '../../types/inventory';
import { getStockStatus } from '../../lib/inventoryRules';

const ProductList: React.FC = () => {
  const { products, deleteProduct, deleteProductsBulk, deleteAllProducts, generateMissingBarcodes } = useInventoryStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedProductForHistory, setSelectedProductForHistory] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const itemsPerPage = 12;

  // Print Modal State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printMode, setPrintMode] = useState<'all' | 'selected' | 'no-barcode'>('all');
  const [labelStyle, setLabelStyle] = useState<'professional' | 'simple'>('simple');
  const [batchSize, setBatchSize] = useState(150);
  const [printRange, setPrintRange] = useState({ start: 1, end: 150 });
  const [isGenerating, setIsGenerating] = useState(false);
  const [printProgress, setPrintProgress] = useState({ current: 0, total: 0 });

  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];
    const term = (searchTerm || '').toLowerCase();
    return products.filter(p => {
      if (!p) return false;
      const code = (p.code || '').toLowerCase();
      const location = (p.location || p.local || '').toLowerCase();
      
      const matchesSearch = code.includes(term) || location.includes(term);
      return matchesSearch;
    });
  }, [products, searchTerm]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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

  const handleExportProductsPDF = () => {
    exportProductsPDF(filteredProducts, getReportStats());
  };

  const startPrinting = async () => {
    let itemsToPrint = [];
    
    if (printMode === 'selected') {
      itemsToPrint = products.filter(p => selectedIds.includes(p.id));
    } else if (printMode === 'no-barcode') {
      itemsToPrint = filteredProducts.filter(p => !p.barcode);
    } else {
      itemsToPrint = filteredProducts;
    }

    const start = Math.max(1, printRange.start) - 1;
    const end = Math.min(itemsToPrint.length, printRange.end);
    itemsToPrint = itemsToPrint.slice(start, end);
    
    if (itemsToPrint.length === 0) {
      alert("Nenhum produto para imprimir etiquetas.");
      return;
    }

    setIsGenerating(true);
    try {
      await exportProductLabels(itemsToPrint, (current, total) => {
        setPrintProgress({ current, total });
      }, 50, labelStyle === 'simple');
      setIsPrintModalOpen(false);
    } catch (err) {
      console.error("Erro ao gerar etiquetas:", err);
      alert("Erro ao gerar etiquetas.");
    } finally {
      setIsGenerating(false);
      setPrintProgress({ current: 0, total: 0 });
    }
  };

  const handlePrintLocationLabels = () => {
    if (filteredProducts.length === 0) {
      alert("Nenhum local para imprimir etiquetas.");
      return;
    }
    exportLocationLabels(filteredProducts);
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map(p => p.id));
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Deseja excluir ${selectedIds.length} produtos?`)) {
      await deleteProductsBulk(selectedIds);
      setSelectedIds([]);
    }
  };

  const handleDeleteAll = async () => {
    if (window.confirm('ATENÇÃO: Isso excluirá TODOS os produtos do sistema. Esta ação é irreversível. Deseja continuar?')) {
      await deleteAllProducts();
    }
  };

  const handleEditClick = (product: Product) => {
    if (product && product.id) {
      setEditingProduct(product);
    } else {
      alert("Erro: Produto não encontrado ou inválido.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-slate-900/50 p-4 rounded-[2rem] border border-white/5">
        <div className="flex flex-col md:flex-row gap-4 w-full lg:max-w-3xl">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
            <input
              type="text"
              placeholder="Buscar por CODE ou localização..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-bold"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 w-full lg:w-auto">
          <button 
            onClick={() => {
              setPrintMode(selectedIds.length > 0 ? 'selected' : 'all');
              setIsPrintModalOpen(true);
            }}
            className="flex-1 lg:flex-none p-3 bg-white/5 hover:bg-blue-600 text-slate-400 hover:text-white rounded-2xl transition-all flex items-center justify-center gap-2 border border-white/5"
            title="Imprimir Etiquetas de Produtos"
          >
            <Printer size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest">Etiquetas</span>
          </button>

          <button 
            onClick={handlePrintLocationLabels}
            className="flex-1 lg:flex-none p-3 bg-white/5 hover:bg-blue-600 text-slate-400 hover:text-white rounded-2xl transition-all flex items-center justify-center gap-2 border border-white/5"
            title="Imprimir Etiquetas de Locais"
          >
            <MapPin size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest">Locais</span>
          </button>

          <button 
            onClick={handleExportProductsPDF}
            className="flex-1 lg:flex-none p-3 bg-white/5 hover:bg-blue-600 text-slate-400 hover:text-white rounded-2xl transition-all flex items-center justify-center gap-2 border border-white/5"
            title="Exportar PDF"
          >
            <FilePdf size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest">PDF</span>
          </button>

          <button 
            onClick={toggleSelectAll}
            className="flex-1 lg:flex-none p-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-2xl transition-all flex items-center justify-center gap-2 border border-white/5"
          >
            {selectedIds.length === filteredProducts.length && filteredProducts.length > 0 ? <CheckSquare size={20} className="text-blue-500" /> : <Square size={20} />}
            <span className="text-[10px] font-black uppercase tracking-widest">
              {selectedIds.length === filteredProducts.length ? 'Desmarcar' : 'Selecionar'}
            </span>
          </button>

          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex-1 lg:flex-none bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white px-4 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all font-black uppercase tracking-widest text-[10px] border border-red-600/20"
            >
              <Trash size={16} />
              Excluir ({selectedIds.length})
            </button>
          )}
          
          <button
            onClick={handleDeleteAll}
            className="flex-1 lg:flex-none bg-white/5 hover:bg-red-600 text-slate-400 hover:text-white px-4 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all font-black uppercase tracking-widest text-[10px] border border-white/5"
          >
            <Trash2 size={16} />
            Limpar Tudo
          </button>

          <button
            onClick={generateMissingBarcodes}
            className="flex-1 lg:flex-none bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white px-4 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all font-black uppercase tracking-widest text-[10px] border border-blue-600/20"
          >
            <Scan size={16} />
            Gerar Barcodes
          </button>
        </div>
      </div>

      {/* Print Modal */}
      {isPrintModalOpen && (
        <div className="modal-overlay p-2 md:p-4 z-[100]">
          <div className="bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-white/10 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center p-6 border-b border-white/5 bg-black/20">
              <h3 className="text-xl font-black text-white tracking-tight">Imprimir Etiquetas</h3>
              <button onClick={() => !isGenerating && setIsPrintModalOpen(false)} className="p-2 bg-white/5 hover:bg-red-600 text-slate-400 hover:text-white rounded-xl transition-all">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Estilo da Etiqueta</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setLabelStyle('professional')}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${labelStyle === 'professional' ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-white/5 bg-black/20 text-slate-400'}`}
                  >
                    <span className="font-black text-[10px] uppercase">Profissional</span>
                  </button>
                  <button 
                    onClick={() => setLabelStyle('simple')}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${labelStyle === 'simple' ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-white/5 bg-black/20 text-slate-400'}`}
                  >
                    <span className="font-black text-[10px] uppercase">Simples (Bipador)</span>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Modo de Impressão</label>
                <div className="grid grid-cols-1 gap-2">
                  <button 
                    onClick={() => setPrintMode('all')}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${printMode === 'all' ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-white/5 bg-black/20 text-slate-400'}`}
                  >
                    <p className="font-black text-xs uppercase">Todos Filtrados</p>
                    <p className="text-[10px] opacity-60">Total: {filteredProducts.length} itens</p>
                  </button>
                  {selectedIds.length > 0 && (
                    <button 
                      onClick={() => setPrintMode('selected')}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${printMode === 'selected' ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-white/5 bg-black/20 text-slate-400'}`}
                    >
                      <p className="font-black text-xs uppercase">Selecionados</p>
                      <p className="text-[10px] opacity-60">Total: {selectedIds.length} itens</p>
                    </button>
                  )}
                  <button 
                    onClick={() => setPrintMode('no-barcode')}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${printMode === 'no-barcode' ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-white/5 bg-black/20 text-slate-400'}`}
                  >
                    <p className="font-black text-xs uppercase">Apenas sem Barcode</p>
                    <p className="text-[10px] opacity-60">Total: {filteredProducts.filter(p => !p.barcode).length} itens</p>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Intervalo (Opcional)</label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[8px] font-bold text-slate-500 uppercase ml-1">De</span>
                    <input 
                      type="number" 
                      min="1"
                      className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-xl text-white font-bold outline-none focus:border-blue-500"
                      value={printRange.start}
                      onChange={(e) => setPrintRange({ ...printRange, start: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8px] font-bold text-slate-500 uppercase ml-1">Até</span>
                    <input 
                      type="number" 
                      min="1"
                      className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-xl text-white font-bold outline-none focus:border-blue-500"
                      value={printRange.end}
                      onChange={(e) => setPrintRange({ ...printRange, end: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                </div>
                {filteredProducts.length > 300 && printMode === 'all' && (
                  <p className="text-[10px] text-amber-500 font-bold flex items-center gap-1">
                    <AlertTriangle size={12} /> Muitos itens. Recomendado imprimir em lotes de 150.
                  </p>
                )}
              </div>

              {isGenerating ? (
                <div className="space-y-4 py-4">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-blue-500">
                    <span>Gerando PDF...</span>
                    <span>{Math.round((printProgress.current / printProgress.total) * 100)}%</span>
                  </div>
                  <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className="h-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${(printProgress.current / printProgress.total) * 100}%` }}
                    />
                  </div>
                  <p className="text-center text-[10px] text-slate-500 font-bold">
                    {printProgress.current} de {printProgress.total} etiquetas processadas
                  </p>
                </div>
              ) : (
                <button 
                  onClick={startPrinting}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-blue-900/20 active:scale-95"
                >
                  Gerar PDF para Impressão
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {paginatedProducts && paginatedProducts.map(product => {
          if (!product) return null;
          const status = getStockStatus(product.stock, product.min);
          const isSelected = selectedIds.includes(product.id);
          
          return (
            <div 
              key={product.id}
              className={`group relative bg-slate-900 border ${isSelected ? 'border-blue-500 shadow-lg shadow-blue-900/20' : 'border-white/5'} rounded-[2rem] overflow-hidden hover:border-white/20 transition-all duration-300 flex flex-col`}
            >
              {/* Selection Overlay */}
              <button 
                onClick={() => toggleSelection(product.id)}
                className={`absolute top-4 left-4 z-10 p-2 rounded-xl transition-all ${isSelected ? 'bg-blue-600 text-white' : 'bg-black/40 text-slate-500 hover:text-white opacity-0 group-hover:opacity-100'}`}
              >
                {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
              </button>

              {/* Image Section */}
              <div className="relative h-48 bg-black/40 overflow-hidden">
                {product.imageUrl ? (
                  <img 
                    src={product.imageUrl} 
                    alt={product.code}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-700">
                    <ImageIcon size={48} />
                  </div>
                )}
                
                {/* Image Actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {product.imageUrl && (
                    <button 
                      onClick={() => setSelectedImage(product.imageUrl!)}
                      className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all"
                    >
                      <Maximize2 size={20} />
                    </button>
                  )}
                  <button 
                    onClick={() => handleEditClick(product)}
                    className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl transition-all"
                  >
                    <Edit2 size={20} />
                  </button>
                </div>

                {/* Status Badge */}
                <div className={`absolute bottom-4 right-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg ${
                  status === 'OK' ? 'bg-green-500/20 text-green-400 border border-green-500/20' :
                  status === 'BAIXO' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20' :
                  status === 'ZERADO' ? 'bg-red-500/20 text-red-400 border border-red-500/20' :
                  'bg-purple-500/20 text-purple-400 border border-purple-500/20'
                }`}>
                  {status}
                </div>
              </div>

              {/* Content Section */}
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-mono font-black text-blue-500 uppercase bg-blue-500/10 px-2 py-0.5 rounded-lg">
                    {product.code}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-auto">
                  <div className="bg-black/20 p-3 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Estoque</p>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-xl font-black ${product.stock <= product.min ? 'text-red-500' : 'text-white'}`}>
                        {product.stock}
                      </span>
                      <span className="text-[10px] font-bold text-slate-600 uppercase">{product.unidade || 'un'}</span>
                    </div>
                  </div>
                  <div className="bg-black/20 p-3 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Mínimo</p>
                    <p className="text-xl font-black text-white">
                      {product.min}
                    </p>
                  </div>
                </div>

                {product.location && (
                  <div className="mt-4 flex items-center gap-2 text-slate-500">
                    <MapPin size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{product.location}</span>
                  </div>
                )}

                {product.barcode && (
                  <div className="mt-2 flex items-center gap-2 text-blue-500/60">
                    <Scan size={14} />
                    <span className="text-[10px] font-mono font-bold tracking-widest">{product.barcode}</span>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => product && setAdjustingProduct(product)}
                    className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all flex flex-col items-center gap-1 group/btn"
                    title="Ajustar Estoque"
                  >
                    <RefreshCw size={16} className="group-hover/btn:rotate-180 transition-transform duration-500" />
                    <span className="text-[8px] font-black uppercase">Ajustar</span>
                  </button>
                  <button 
                    onClick={() => product && setSelectedProductForHistory(product)}
                    className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all flex flex-col items-center gap-1 group/btn"
                    title="Histórico de Preços"
                  >
                    <TrendingUp size={16} className="group-hover/btn:scale-110 transition-transform" />
                    <span className="text-[8px] font-black uppercase">Preços</span>
                  </button>
                  <button 
                    onClick={() => {
                      if (product && window.confirm(`Excluir item ${product.code}?`)) deleteProduct(product.id);
                    }}
                    className="p-2 bg-white/5 hover:bg-red-600/20 text-slate-400 hover:text-red-500 rounded-xl transition-all flex flex-col items-center gap-1 group/btn"
                    title="Excluir"
                  >
                    <Trash2 size={16} className="group-hover/btn:scale-110 transition-transform" />
                    <span className="text-[8px] font-black uppercase">Excluir</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="py-20 text-center bg-slate-900/50 rounded-[3rem] border border-dashed border-white/10">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search size={40} className="text-slate-700" />
          </div>
          <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Nenhum produto encontrado</h3>
          <p className="text-slate-500 font-bold">Tente ajustar sua busca ou filtros.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-10">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="p-4 bg-slate-900 border border-white/5 rounded-2xl text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5 transition-all"
          >
            <ChevronLeft size={24} />
          </button>
          <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">Página {currentPage} de {totalPages}</span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="p-4 bg-slate-900 border border-white/5 rounded-2xl text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5 transition-all"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      )}

      {/* Modals */}
      {selectedImage && (
        <div className="modal-overlay p-4 z-[100]" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-4xl w-full h-full flex items-center justify-center">
            <img src={selectedImage} className="max-w-full max-h-full rounded-3xl shadow-2xl animate-in zoom-in-95 duration-300" />
            <button className="absolute top-4 right-4 p-3 bg-black/60 text-white rounded-2xl hover:bg-red-600 transition-all">
              <X size={24} />
            </button>
          </div>
        </div>
      )}

      {selectedProductForHistory && (
        <PriceHistoryChart 
          productId={selectedProductForHistory.id} 
          productName={selectedProductForHistory.code}
          onClose={() => setSelectedProductForHistory(null)} 
        />
      )}

      {editingProduct && (
        <ProductForm 
          initialData={editingProduct} 
          onClose={() => setEditingProduct(null)} 
        />
      )}

      {adjustingProduct && (
        <AdjustStockModal 
          product={adjustingProduct} 
          onClose={() => setAdjustingProduct(null)} 
        />
      )}
    </div>
  );
};

export default ProductList;
