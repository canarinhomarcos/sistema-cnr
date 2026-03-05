import React, { useState } from 'react';
import { useInventoryStore } from '../../store/useInventoryStore';
import { FileText, Plus, Search, Download, Tag, X, Package, ArrowUpRight, ArrowDownLeft, Trash2, Calendar, DollarSign, AlertCircle, Percent } from 'lucide-react';
import { Invoice } from '../../types/inventory';

const InvoiceManager: React.FC = () => {
  const { invoices, products, deleteInvoice } = useInventoryStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const filteredInvoices = Array.isArray(invoices) ? invoices.filter(inv => 
    inv && inv.number && inv.number.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Data Inválida';
      return date.toLocaleDateString('pt-BR');
    } catch (e) {
      return '---';
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shrink-0">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
            <FileText className="text-blue-500" size={24} />
            Gerenciamento de NFs
          </h2>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest ml-8">
            {invoices.length} notas registradas
          </p>
        </div>
        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por número da NF..."
            className="w-full pl-11 pr-4 py-2.5 bg-black/40 border border-white/5 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-sm transition-all text-white placeholder:text-slate-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-3xl border-2 border-dashed border-white/5">
            <FileText className="mx-auto text-slate-800 mb-4 opacity-20" size={64} />
            <p className="text-lg font-black text-slate-600 uppercase tracking-widest">Nenhuma NF encontrada</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-white/5 bg-black/20 flex-1">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-900">
                  <tr className="bg-white/5 text-slate-400 uppercase tracking-widest text-[10px] font-black">
                    <th className="px-6 py-3">Número</th>
                    <th className="px-6 py-3">Data Emissão</th>
                    <th className="px-6 py-3">Tipo</th>
                    <th className="px-6 py-3 text-right">Desconto</th>
                    <th className="px-6 py-3 text-right">Valor Final</th>
                    <th className="px-6 py-3 text-center">Status</th>
                    <th className="px-6 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-white/5 transition-all group">
                      <td className="px-6 py-3">
                        <span className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-lg font-mono font-black text-[10px] uppercase tracking-wider border border-blue-500/20">
                          #{invoice.number}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-white font-bold text-xs">
                        <div className="flex items-center gap-2">
                          <Calendar size={12} className="text-slate-500" />
                          {formatDate(invoice.issueDate)}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                          invoice.type === 'PURCHASE' ? 'bg-green-500/10 text-green-400' : 'bg-purple-500/10 text-purple-400'
                        }`}>
                          {invoice.type === 'PURCHASE' ? 'Compra' : 'Venda'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right font-black text-red-400 text-xs">
                        {invoice.discount ? `- R$ ${Number(invoice.discount).toFixed(2)}` : '--'}
                      </td>
                      <td className="px-6 py-3 text-right font-black text-white text-base tracking-tighter">
                        R$ {Number(invoice.totalAmount || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-[9px] font-black uppercase tracking-widest border border-blue-500/20">
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setSelectedInvoice(invoice)}
                            className="px-4 py-2 bg-white/5 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg font-black uppercase tracking-widest text-[9px] transition-all border border-white/5"
                          >
                            Detalhes
                          </button>
                          <button 
                            onClick={() => {
                              if (confirm(`Deseja realmente excluir a NF #${invoice.number}?`)) {
                                deleteInvoice(invoice.id);
                              }
                            }}
                            className="p-2 bg-white/5 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all border border-white/5"
                            title="Excluir NF"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Layout */}
            <div className="md:hidden flex-1 overflow-y-auto custom-scrollbar space-y-3">
              {filteredInvoices.map((invoice) => (
                <div key={invoice.id} className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <span className="px-2 py-0.5 bg-blue-600/20 text-blue-400 rounded-md font-mono font-black text-[10px] uppercase border border-blue-500/20">
                        #{invoice.number}
                      </span>
                      <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                        <Calendar size={10} />
                        {formatDate(invoice.issueDate)}
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                      invoice.type === 'PURCHASE' ? 'bg-green-500/10 text-green-400' : 'bg-purple-500/10 text-purple-400'
                    }`}>
                      {invoice.type === 'PURCHASE' ? 'Compra' : 'Venda'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Valor Total</span>
                      <span className="text-base font-black text-white">R$ {Number(invoice.totalAmount || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setSelectedInvoice(invoice)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest text-[9px] transition-all shadow-lg shadow-blue-900/20"
                      >
                        Detalhes
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm(`Deseja realmente excluir a NF #${invoice.number}?`)) {
                            deleteInvoice(invoice.id);
                          }
                        }}
                        className="p-2.5 bg-white/5 text-slate-400 rounded-xl hover:bg-red-600/20 hover:text-red-500 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <div className="modal-overlay p-2 md:p-4 animate-in fade-in duration-300">
          <div 
            className="bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] md:rounded-[3rem] border-2 border-white/5 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 md:p-8 border-b border-white/5 flex justify-between items-center bg-black/20 shrink-0">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-900/20">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">Nota Fiscal #{selectedInvoice.number}</h3>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                    <Calendar size={12} />
                    Emitida em {formatDate(selectedInvoice.issueDate)}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedInvoice(null)} 
                className="p-3 bg-white/5 hover:bg-red-600 text-slate-400 hover:text-white rounded-2xl transition-all shadow-lg group"
                title="Fechar"
              >
                <X size={28} className="group-hover:scale-110 transition-transform" />
              </button>
            </div>
            
            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar space-y-8 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-black/40 p-6 rounded-3xl border border-white/5 space-y-1">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Tag size={10} /> Tipo de Operação
                  </p>
                  <p className="text-xl font-black text-white">{selectedInvoice.type === 'PURCHASE' ? 'Compra' : 'Venda'}</p>
                </div>
                <div className="bg-black/40 p-6 rounded-3xl border border-white/5 space-y-1">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Percent size={10} /> Desconto Aplicado
                  </p>
                  <p className="text-xl font-black text-red-500">R$ {Number(selectedInvoice.discount || 0).toFixed(2)}</p>
                </div>
                <div className="bg-blue-600/10 p-6 rounded-3xl border border-blue-500/20 space-y-1">
                  <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                    <DollarSign size={10} /> Valor Total Final
                  </p>
                  <p className="text-2xl font-black text-blue-400 tracking-tighter">R$ {Number(selectedInvoice.totalAmount || 0).toFixed(2)}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-white font-black uppercase tracking-widest text-xs flex items-center gap-2">
                    <Package size={16} className="text-blue-500" />
                    Itens Vinculados à Nota
                  </h4>
                  <span className="text-[9px] font-black bg-white/5 text-slate-500 px-2 py-0.5 rounded-md uppercase">
                    {Array.isArray(selectedInvoice.items) ? selectedInvoice.items.length : 0} Itens
                  </span>
                </div>

                {(!Array.isArray(selectedInvoice.items) || selectedInvoice.items.length === 0) ? (
                  <div className="p-10 bg-black/40 rounded-3xl border-2 border-dashed border-white/5 text-center space-y-3">
                    <AlertCircle size={40} className="text-slate-700 mx-auto" />
                    <div className="space-y-1">
                      <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Sem detalhes de itens</p>
                      <p className="text-slate-600 text-[10px] font-bold">Esta nota foi lançada antes da atualização do sistema.</p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/5 overflow-hidden shadow-xl">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white/5 text-slate-500 uppercase tracking-widest text-[9px] font-black">
                          <th className="px-6 py-3">Produto / SKU</th>
                          <th className="px-6 py-3 text-center">Qtd</th>
                          <th className="px-6 py-3 text-right">Preço Un.</th>
                          <th className="px-6 py-3 text-right">Desc.</th>
                          <th className="px-6 py-3 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 bg-black/20">
                        {selectedInvoice.items.map((item, idx) => {
                          const product = products.find(p => p.id === item.productId);
                          return (
                            <tr key={idx} className="hover:bg-white/5 transition-colors">
                              <td className="px-6 py-3">
                                <div className="flex flex-col">
                                  <span className="font-black text-white text-sm">{product?.name || 'Produto Removido'}</span>
                                  <span className="text-[9px] text-blue-500 font-mono font-black uppercase tracking-widest">{product?.sku || '---'}</span>
                                </div>
                              </td>
                              <td className="px-6 py-3 text-center font-black text-white text-sm">{item.quantity}</td>
                              <td className="px-6 py-3 text-right font-bold text-slate-400 text-xs">R$ {Number(item.unitPrice).toFixed(2)}</td>
                              <td className="px-6 py-3 text-right font-bold text-red-400 text-xs">{item.discount > 0 ? `- R$ ${Number(item.discount).toFixed(2)}` : '--'}</td>
                              <td className="px-6 py-3 text-right font-black text-white text-sm">R$ {((item.quantity * item.unitPrice) - item.discount).toFixed(2)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6 bg-black/40 border-t border-white/5 flex justify-end shrink-0">
              <button 
                onClick={() => setSelectedInvoice(null)}
                className="w-full md:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl shadow-blue-900/20 active:scale-95"
              >
                Fechar Detalhes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceManager;
