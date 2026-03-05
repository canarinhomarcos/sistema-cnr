import React, { useState } from 'react';
import { useInventoryStore } from '../../store/useInventoryStore';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, X, Search, CheckSquare, Square, MapPin } from 'lucide-react';

const LabelPrinter: React.FC = () => {
  const { products } = useInventoryStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredProducts = products.filter(p => 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.location && p.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const selectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map(p => p.id));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 no-print shrink-0">
        <h2 className="text-xl md:text-2xl font-black text-white">Etiquetas</h2>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Buscar..."
              className="w-full pl-11 pr-4 py-2.5 bg-black/40 border border-white/5 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-sm transition-all text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={handlePrint}
            disabled={selectedIds.length === 0}
            className="bg-blue-600 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 font-black uppercase tracking-widest text-[10px] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
          >
            <Printer size={14} />
            Imprimir ({selectedIds.length})
          </button>
        </div>
      </div>

      <div className="bg-slate-900/60 rounded-2xl border border-white/5 shadow-sm overflow-hidden no-print flex-1 flex flex-col min-h-0">
        <div className="p-3 bg-black/20 border-b border-white/5 flex items-center justify-between shrink-0">
          <button 
            onClick={selectAll}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-500 transition-colors"
          >
            {selectedIds.length === filteredProducts.length && filteredProducts.length > 0 ? <CheckSquare size={16} className="text-blue-500" /> : <Square size={16} />}
            Todos
          </button>
          <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{filteredProducts.length} itens</span>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-white/5">
          {filteredProducts.map((product) => (
            <div 
              key={product.id} 
              onClick={() => toggleSelect(product.id)}
              className={`p-4 flex items-center justify-between cursor-pointer transition-all ${selectedIds.includes(product.id) ? 'bg-blue-600/5' : 'hover:bg-white/5'}`}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="text-slate-700 shrink-0">
                  {selectedIds.includes(product.id) ? <CheckSquare size={20} className="text-blue-500" /> : <Square size={20} />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">{product.name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px] font-mono font-black text-blue-500 uppercase">{product.sku}</span>
                    {product.location && (
                      <span className="text-[9px] text-slate-500 flex items-center gap-1 font-bold uppercase">
                        <MapPin size={10} /> {product.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-white p-1.5 rounded-lg shrink-0">
                <QRCodeSVG value={product.sku} size={32} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Área de Impressão */}
      <div className="hidden print:block print:p-0 print-area">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {products.filter(p => selectedIds.includes(p.id)).map(product => (
            <div key={product.id} className="border border-slate-300 p-4 flex flex-col items-center text-center break-inside-avoid bg-white text-black">
              <p className="text-[10px] font-black uppercase mb-1 truncate w-full">{product.name}</p>
              <div className="bg-white p-1">
                <QRCodeSVG value={product.sku} size={100} />
              </div>
              <p className="text-xs font-mono font-black mt-1">{product.sku}</p>
              {product.location && <p className="text-[8px] uppercase text-slate-600 mt-0.5">{product.location}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LabelPrinter;
