import React, { useState, useEffect } from 'react';
import { useInventoryStore } from '../../store/useInventoryStore';
import { X, Package, Hash, CheckCircle2, AlertCircle, RefreshCw, ArrowRight, Car, User } from 'lucide-react';
import { Product } from '../../types/inventory';

interface AdjustStockModalProps {
  product: Product;
  onClose: () => void;
}

const AdjustStockModal: React.FC<AdjustStockModalProps> = ({ product, onClose }) => {
  const { addMovement } = useInventoryStore();
  const [newBalance, setNewBalance] = useState(product.quantity || 0);
  const [observation, setObservation] = useState('');
  const [placa, setPlaca] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const delta = newBalance - (product.quantity || 0);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newBalance < 0) {
      setToast({ message: "O saldo não pode ser negativo.", type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      const normalizedPlaca = placa.trim().toUpperCase().replace(/\s+/g, ' ');
      
      await addMovement({
        productId: product.id,
        tipo: 'AJUSTE',
        quantidade: 0, // Backend will calculate delta if newBalance is provided
        newBalance: newBalance,
        placa: normalizedPlaca || undefined,
        responsavel: responsavel.trim() || 'Ajuste Manual',
        observacao: observation || 'Ajuste de saldo via tabela de produtos',
        dataHora: Math.floor(Date.now() / 1000),
      });
      
      setToast({ message: "Estoque ajustado com sucesso!", type: 'success' });
      setTimeout(onClose, 1500);
    } catch (err) {
      setToast({ message: "Erro ao ajustar estoque.", type: 'error' });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay p-2 md:p-4">
      <div className="bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/10 animate-in zoom-in-95 duration-300 flex flex-col relative">
        {/* Toast Notification */}
        {toast && (
          <div className={`absolute top-0 left-0 right-0 p-4 text-center font-black uppercase tracking-widest text-[10px] animate-in slide-in-from-top duration-300 z-50 ${
            toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}>
            <div className="flex items-center justify-center gap-2">
              {toast.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
              {toast.message}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center p-6 md:p-8 border-b border-white/5 bg-black/20 shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-900/20">
              <RefreshCw size={24} />
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">Ajustar Estoque</h3>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Correção de Saldo</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-3 bg-white/5 hover:bg-red-600 text-slate-400 hover:text-white rounded-2xl transition-all shadow-lg group"
          >
            <X size={24} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 overflow-y-auto custom-scrollbar">
          {/* Product Info */}
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
              <Package size={24} className="text-blue-500" />
            </div>
            <div className="min-w-0">
              <h4 className="text-white font-black truncate">{product.name}</h4>
              <span className="text-[10px] font-mono font-black text-blue-500 uppercase bg-blue-500/10 px-1.5 py-0.5 rounded">{product.sku}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Saldo Atual</label>
              <div className="w-full px-6 py-4 bg-black/20 border-2 border-white/5 rounded-2xl font-black text-2xl text-slate-400">
                {product.quantity}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Novo Saldo</label>
              <input 
                type="number" 
                min="0"
                required
                autoFocus
                className="w-full px-6 py-4 bg-black/40 border-2 border-blue-500/30 rounded-2xl focus:ring-8 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-black text-2xl text-white transition-all"
                value={newBalance}
                onChange={(e) => setNewBalance(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Delta Preview */}
          <div className="flex items-center justify-center gap-4 py-2">
            <div className="text-center">
              <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest">Diferença</span>
              <div className={`flex items-center gap-2 font-black text-lg ${delta > 0 ? 'text-green-500' : delta < 0 ? 'text-red-500' : 'text-slate-500'}`}>
                {delta > 0 ? '+' : ''}{delta}
                <ArrowRight size={16} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 flex items-center gap-1">
                <Car size={10} /> Placa (Opcional)
              </label>
              <input 
                type="text" 
                placeholder="ABC-1234"
                className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-white transition-all text-sm"
                value={placa}
                onChange={(e) => setPlaca(e.target.value.toUpperCase())}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 flex items-center gap-1">
                <User size={10} /> Responsável
              </label>
              <input 
                type="text" 
                placeholder="Nome..."
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-white transition-all text-sm"
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Motivo do Ajuste (Opcional)</label>
            <textarea 
              placeholder="Ex: Inventário rotativo, erro de contagem..."
              className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-white transition-all h-24 resize-none"
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
            />
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full py-5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl shadow-blue-900/20 active:scale-95 flex items-center justify-center gap-3"
          >
            {isSubmitting ? (
              <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 size={20} />
                Confirmar Ajuste
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdjustStockModal;
