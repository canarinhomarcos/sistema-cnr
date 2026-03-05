import React, { useState, useMemo } from 'react';
import { useInventoryStore } from '../../store/useInventoryStore';
import { X, Search, FileText, Plus, Trash2, CheckCircle2, Percent, DollarSign, Hash, Calendar, Tag } from 'lucide-react';
import { Invoice } from '../../types/inventory';

interface InvoiceFormProps {
  onClose: () => void;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ onClose }) => {
  const { products, addInvoice } = useInventoryStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [invoiceData, setInvoiceData] = useState({
    number: '',
    issueDate: new Date().toISOString().split('T')[0],
    type: 'PURCHASE' as 'PURCHASE' | 'SALE',
    discount: 0,
  });
  const [items, setItems] = useState<{ productId: string; quantity: number; unitPrice: number; discount: number }[]>([]);

  const [discountText, setDiscountText] = useState('');

  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];
    if (!searchTerm) return products.slice(0, 10);
    const term = searchTerm.toLowerCase();
    return products.filter(p => 
      (p.sku || '').toLowerCase().includes(term) ||
      (p.name || '').toLowerCase().includes(term)
    ).slice(0, 20);
  }, [products, searchTerm]);

  const addItem = (product: any) => {
    if (items.find(i => i.productId === product.id)) return;
    setItems([...items, { productId: product.id, quantity: 1, unitPrice: product.price, discount: 0 }]);
    setSearchTerm('');
  };

  const removeItem = (productId: string) => {
    setItems(items.filter(i => i.productId !== productId));
  };

  const updateItem = (productId: string, updates: any) => {
    setItems(items.map(i => i.productId === productId ? { ...i, ...updates } : i));
  };

  const totalAmount = useMemo(() => {
    const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.unitPrice) - item.discount, 0);
    return subtotal - invoiceData.discount;
  }, [items, invoiceData.discount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    await addInvoice({
      number: invoiceData.number,
      issueDate: invoiceData.issueDate,
      type: invoiceData.type,
      totalAmount: totalAmount,
      discount: invoiceData.discount,
      status: 'PAID',
      items: items
    });
    onClose();
  };

  return (
    <div className="modal-overlay p-2 md:p-4">
      <div className="bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden border border-white/10 animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 md:p-8 border-b border-white/5 bg-black/20 shrink-0">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="p-2 md:p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-900/20">
              <FileText size={20} className="md:w-6 md:h-6" />
            </div>
            <div>
              <h3 className="text-lg md:text-2xl font-black text-white tracking-tight">Entrada de NF</h3>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[8px] md:text-[10px]">Gerar base de dados</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-3 bg-white/5 hover:bg-red-600 text-slate-400 hover:text-white rounded-2xl transition-all shadow-lg group"
            title="Fechar"
          >
            <X size={24} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 flex items-center gap-1">
                <Hash size={10} /> Número da NF
              </label>
              <input 
                type="text" 
                required
                className="w-full px-4 py-3 bg-black/40 border-2 border-white/5 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-sm transition-all text-white"
                placeholder="Ex: 000123"
                value={invoiceData.number}
                onChange={(e) => setInvoiceData({ ...invoiceData, number: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 flex items-center gap-1">
                <Calendar size={10} /> Data Emissão
              </label>
              <input 
                type="date" 
                required
                className="w-full px-4 py-3 bg-black/40 border-2 border-white/5 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-sm transition-all text-white"
                value={invoiceData.issueDate}
                onChange={(e) => setInvoiceData({ ...invoiceData, issueDate: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 flex items-center gap-1">
                <Tag size={10} /> Tipo
              </label>
              <select 
                className="w-full px-4 py-3 bg-black/40 border-2 border-white/5 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-sm transition-all appearance-none text-white"
                value={invoiceData.type}
                onChange={(e) => setInvoiceData({ ...invoiceData, type: e.target.value as any })}
              >
                <option value="PURCHASE">Compra (Entrada)</option>
                <option value="SALE">Venda (Saída)</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Adicionar Itens</label>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por SKU ou nome..."
                className="w-full pl-11 pr-4 py-3.5 bg-black/40 border-2 border-white/5 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-sm transition-all text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border-2 border-white/10 rounded-xl shadow-xl z-10 max-h-48 overflow-y-auto divide-y divide-white/5 custom-scrollbar">
                  {filteredProducts.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addItem(p)}
                      className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors flex justify-between items-center"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="px-2 py-0.5 bg-blue-600 text-white rounded-md font-mono font-black text-[8px] uppercase w-fit mb-1">{p.sku}</span>
                        <span className="font-bold text-white text-xs truncate">{p.name}</span>
                      </div>
                      <Plus size={16} className="text-blue-500 shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="overflow-x-auto rounded-xl border border-white/5 bg-black/20">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 text-slate-500 uppercase tracking-widest text-[8px] font-black">
                    <th className="px-4 py-3">Item</th>
                    <th className="px-4 py-3 text-center">Qtd</th>
                    <th className="px-4 py-3 text-right">Subtotal</th>
                    <th className="px-4 py-3 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {items.map((item) => {
                    const product = products.find(p => p.id === item.productId);
                    return (
                      <tr key={item.productId} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-white text-xs truncate max-w-[100px]">{product?.name}</span>
                            <span className="text-[8px] font-mono text-blue-500">{product?.code || product?.sku}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <input 
                            type="number" 
                            min="1"
                            className="w-12 bg-black/40 border border-white/10 rounded-lg px-1 py-1 text-center text-xs font-black text-white"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.productId, { quantity: parseInt(e.target.value) || 1 })}
                          />
                        </td>
                        <td className="px-4 py-3 text-right font-black text-white text-xs">
                          R$ {(item.quantity * item.unitPrice).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => removeItem(item.productId)} className="text-slate-600 hover:text-red-500 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-600 font-bold uppercase tracking-widest text-[10px] italic">
                        Nenhum item adicionado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-black/40 p-6 rounded-2xl border-2 border-white/5 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total da Nota</span>
              <span className="text-2xl font-black text-blue-500 tracking-tighter">R$ {totalAmount.toFixed(2)}</span>
            </div>
            <button 
              type="submit"
              disabled={items.length === 0}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-blue-900/20 active:scale-95"
            >
              Salvar Nota Fiscal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceForm;
