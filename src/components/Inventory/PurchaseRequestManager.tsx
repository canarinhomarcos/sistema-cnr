import React, { useState } from 'react';
import { useInventoryStore } from '../../store/useInventoryStore';
import { ShoppingCart, Search, Plus, Clock, CheckCircle2, XCircle, Package, User, Trash2, Edit2, X, Check } from 'lucide-react';

const PurchaseRequestManager: React.FC = () => {
  const { purchaseRequests, products, addPurchaseRequest, updatePurchaseRequest } = useInventoryStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    productId: '',
    productName: '',
    quantity: 1,
  });

  const filteredRequests = Array.isArray(purchaseRequests) ? purchaseRequests.filter(pr => 
    pr && pr.productName && pr.productName.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addPurchaseRequest(formData);
    setIsModalOpen(false);
    setFormData({ productId: '', productName: '', quantity: 1 });
  };

  const handleStatusUpdate = async (id: string, status: any) => {
    await updatePurchaseRequest(id, { status });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1"><Clock size={10} /> Pendente</span>;
      case 'APPROVED':
        return <span className="bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1"><Check size={10} /> Aprovado</span>;
      case 'REJECTED':
        return <span className="bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1"><XCircle size={10} /> Rejeitado</span>;
      case 'COMPLETED':
        return <span className="bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1"><CheckCircle2 size={10} /> Concluído</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shrink-0">
        <h2 className="text-xl md:text-2xl font-black text-white">Compras</h2>
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
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-900/20 active:scale-95 transition-all"
          >
            <Plus size={14} />
            Nova
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {filteredRequests.map((request) => (
            <div key={request.id} className="bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-white/5 shadow-xl hover:border-white/10 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 shrink-0">
                    <ShoppingCart size={20} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-white truncate text-sm">{request.productName}</h3>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Qtd: {request.quantity}</p>
                  </div>
                </div>
                {getStatusBadge(request.status)}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex gap-1">
                  {request.status === 'PENDING' && (
                    <>
                      <button 
                        onClick={() => handleStatusUpdate(request.id, 'APPROVED')}
                        className="p-2 bg-blue-600/10 text-blue-500 hover:bg-blue-600 hover:text-white rounded-lg transition-all"
                        title="Aprovar"
                      >
                        <Check size={14} />
                      </button>
                      <button 
                        onClick={() => handleStatusUpdate(request.id, 'REJECTED')}
                        className="p-2 bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white rounded-lg transition-all"
                        title="Rejeitar"
                      >
                        <X size={14} />
                      </button>
                    </>
                  )}
                  {request.status === 'APPROVED' && (
                    <button 
                      onClick={() => handleStatusUpdate(request.id, 'COMPLETED')}
                      className="px-3 py-1.5 bg-green-600/10 text-green-500 hover:bg-green-600 hover:text-white rounded-lg transition-all text-[9px] font-black uppercase tracking-widest"
                    >
                      Concluir
                    </button>
                  )}
                </div>
                <p className="text-[8px] text-slate-600 font-bold uppercase">
                  {new Date(request.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
          {filteredRequests.length === 0 && (
            <div className="col-span-full py-20 text-center opacity-10">
              <ShoppingCart size={48} className="mx-auto mb-4" />
              <p className="text-xl font-black uppercase tracking-widest">Sem solicitações</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Nova Solicitação */}
      {isModalOpen && (
        <div className="modal-overlay p-4">
          <div className="bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-white/10 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center p-6 border-b border-white/5 bg-black/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 text-white rounded-xl">
                  <Plus size={20} />
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">Nova Solicitação</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-all">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Produto</label>
                <input 
                  type="text" 
                  required
                  placeholder="Nome do produto..."
                  className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-white transition-all"
                  value={formData.productName}
                  onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Quantidade</label>
                <input 
                  type="number" 
                  required
                  min="1"
                  className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-white transition-all"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
              <button 
                type="submit"
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-blue-900/20 mt-4"
              >
                Criar Solicitação
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseRequestManager;
