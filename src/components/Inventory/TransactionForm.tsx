import React, { useState, useMemo } from 'react';
import { useInventoryStore } from '../../store/useInventoryStore';
import { X, Search, ArrowUpRight, ArrowDownLeft, CheckCircle2, Hash, DollarSign, Package, User, Car, Info, Plus, Minus, Equal, AlertCircle, AlertTriangle } from 'lucide-react';

interface TransactionFormProps {
  onClose: () => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onClose }) => {
  const { products, trucks, addMovement } = useInventoryStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    productId: '',
    type: 'ENTRADA' as 'ENTRADA' | 'SAIDA' | 'AJUSTE',
    quantity: 1,
    description: '',
    placa: '',
    responsavel: '',
    ajusteSubtype: 'AUMENTAR' as 'AUMENTAR' | 'DIMINUIR' | 'DEFINIR',
    newBalance: 0,
  });

  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === formData.productId);
  }, [products, formData.productId]);

  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];
    if (!searchTerm) return products.slice(0, 10);
    const term = searchTerm.toLowerCase();
    return products.filter(p => 
      (p.code || '').toLowerCase().includes(term)
    ).slice(0, 20);
  }, [products, searchTerm]);

  const filteredTrucks = useMemo(() => {
    if (!formData.placa) return [];
    const term = formData.placa.toLowerCase();
    return trucks.filter(t => t.placa.toLowerCase().includes(term) && t.ativo).slice(0, 5);
  }, [trucks, formData.placa]);

  const isFormValid = useMemo(() => {
    if (!formData.productId) return false;
    
    const isAjusteDefinir = formData.type === 'AJUSTE' && formData.ajusteSubtype === 'DEFINIR';
    
    if (!isAjusteDefinir && formData.quantity <= 0) return false;
    if (formData.type === 'SAIDA' && !formData.placa.trim()) return false;
    
    return true;
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    const normalizedPlaca = formData.placa.trim().toUpperCase().replace(/\s+/g, ' ');

    const movementData: any = {
      productId: formData.productId,
      tipo: formData.type,
      placa: normalizedPlaca || undefined,
      responsavel: formData.responsavel.trim(),
      observacao: formData.description.trim(),
      dataHora: Math.floor(Date.now() / 1000),
    };

    if (formData.type === 'AJUSTE') {
      if (formData.ajusteSubtype === 'DEFINIR') {
        movementData.newBalance = formData.newBalance;
        movementData.quantidade = 0; // Will be calculated by backend
      } else if (formData.ajusteSubtype === 'DIMINUIR') {
        movementData.quantidade = -Math.abs(formData.quantity);
      } else {
        movementData.quantidade = Math.abs(formData.quantity);
      }
    } else {
      movementData.quantidade = formData.quantity;
    }

    await addMovement(movementData);
    onClose();
  };

  return (
    <div className="modal-overlay p-2 md:p-4">
      <div className="bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-white/10 animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 md:p-8 border-b border-white/5 bg-black/20 shrink-0">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${formData.type === 'ENTRADA' ? 'bg-green-600 text-white' : formData.type === 'SAIDA' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}>
              {formData.type === 'ENTRADA' ? <ArrowUpRight size={24} /> : formData.type === 'SAIDA' ? <ArrowDownLeft size={24} /> : <Info size={24} />}
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">Movimentação</h3>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Registro de Auditoria</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-3 bg-white/5 hover:bg-red-600 text-slate-400 hover:text-white rounded-2xl transition-all shadow-lg group"
            title="Fechar"
          >
            <X size={28} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          <div className="space-y-3">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">1. Selecione o Produto (CODE)</label>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por CODE..."
                className="w-full pl-11 pr-4 py-3.5 bg-black/40 border-2 border-white/5 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-white transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="max-h-40 overflow-y-auto rounded-xl border-2 border-white/5 bg-black/20 divide-y divide-white/5 custom-scrollbar">
              {filteredProducts.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, productId: p.id, newBalance: p.stock });
                    setSearchTerm(p.code);
                  }}
                  className={`w-full p-4 text-left hover:bg-white/5 transition-all flex items-center justify-between group ${formData.productId === p.id ? 'bg-blue-600/10' : ''}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                      <Package size={16} className="text-slate-600" />
                    </div>
                    <div className="min-w-0">
                      <span className="block font-black text-white truncate text-lg uppercase tracking-tight">{p.code}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-slate-400">Estoque: {p.stock}</span>
                    {formData.productId === p.id && <CheckCircle2 className="text-blue-500" size={20} />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">2. Tipo de Operação</label>
            <div className="flex p-1 bg-black/40 rounded-xl border-2 border-white/5">
              {(['ENTRADA', 'SAIDA', 'AJUSTE'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: t })}
                  className={`flex-1 py-3 rounded-lg font-black uppercase tracking-widest text-[10px] transition-all ${
                    formData.type === t 
                      ? t === 'ENTRADA' ? 'bg-green-600 text-white shadow-lg' : t === 'SAIDA' ? 'bg-red-600 text-white shadow-lg' : 'bg-blue-600 text-white shadow-lg'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {formData.type === 'AJUSTE' && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Tipo de Ajuste</label>
              <div className="flex p-1 bg-black/40 rounded-xl border-2 border-white/5 gap-1">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, ajusteSubtype: 'AUMENTAR' })}
                  className={`flex-1 py-2 rounded-lg font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 ${
                    formData.ajusteSubtype === 'AUMENTAR' ? 'bg-green-600/20 text-green-500 border border-green-500/30' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Plus size={12} /> Aumentar
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, ajusteSubtype: 'DIMINUIR' })}
                  className={`flex-1 py-2 rounded-lg font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 ${
                    formData.ajusteSubtype === 'DIMINUIR' ? 'bg-red-600/20 text-red-500 border border-red-500/30' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Minus size={12} /> Diminuir
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, ajusteSubtype: 'DEFINIR' })}
                  className={`flex-1 py-2 rounded-lg font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 ${
                    formData.ajusteSubtype === 'DEFINIR' ? 'bg-blue-600/20 text-blue-500 border border-blue-500/30' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Equal size={12} /> Definir Saldo
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">
                {formData.type === 'AJUSTE' && formData.ajusteSubtype === 'DEFINIR' ? '3. Novo Saldo' : '3. Quantidade'}
              </label>
              <input 
                type="number" 
                min={formData.type === 'AJUSTE' && formData.ajusteSubtype === 'DEFINIR' ? "0" : "1"}
                required
                className="w-full px-4 py-3.5 bg-black/40 border-2 border-white/5 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-black text-xl text-white transition-all"
                value={formData.type === 'AJUSTE' && formData.ajusteSubtype === 'DEFINIR' ? formData.newBalance : formData.quantity}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  if (formData.type === 'AJUSTE' && formData.ajusteSubtype === 'DEFINIR') {
                    setFormData({ ...formData, newBalance: val });
                  } else {
                    setFormData({ ...formData, quantity: val });
                  }
                }}
              />
              {formData.type === 'AJUSTE' && formData.ajusteSubtype === 'DEFINIR' && selectedProduct && (
                <p className="text-[10px] font-bold text-slate-500 ml-2">
                  Delta calculado: {formData.newBalance - selectedProduct.stock > 0 ? '+' : ''}{formData.newBalance - selectedProduct.stock}
                </p>
              )}
            </div>

            <div className="space-y-3 relative">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 flex items-center gap-1">
                <Car size={10} /> 4. Placa do Veículo {formData.type === 'SAIDA' ? '(Obrigatório)' : '(Opcional)'}
              </label>
              <input 
                type="text" 
                required={formData.type === 'SAIDA'}
                placeholder="ABC-1234"
                className={`w-full px-4 py-3.5 bg-black/40 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-black text-xl text-white transition-all ${
                  formData.type === 'SAIDA' && !formData.placa.trim() ? 'border-red-500/50' : 'border-white/5'
                }`}
                value={formData.placa}
                onChange={(e) => setFormData({ ...formData, placa: e.target.value.toUpperCase() })}
              />
              {filteredTrucks.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-slate-800 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-white/5">
                  {filteredTrucks.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, placa: t.placa })}
                      className="w-full p-3 text-left hover:bg-blue-600/20 transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2">
                        <Car size={14} className="text-blue-500" />
                        <span className="font-black text-white">{t.placa}</span>
                      </div>
                      <span className="text-[8px] font-black text-slate-500 uppercase">{t.filial}</span>
                    </button>
                  ))}
                </div>
              )}
              {formData.type === 'SAIDA' && !formData.placa.trim() && (
                <p className="text-[10px] font-bold text-red-500 ml-2 flex items-center gap-1">
                  <AlertCircle size={10} /> Informe a placa do caminhão
                </p>
              )}
              {formData.placa.trim() && !trucks.some(t => t.placa.toUpperCase() === formData.placa.trim().toUpperCase()) && (
                <p className="text-[10px] font-bold text-amber-500 ml-2 flex items-center gap-1">
                  <AlertTriangle size={10} /> Placa não cadastrada
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 flex items-center gap-1">
                <User size={10} /> 5. Responsável
              </label>
              <input 
                type="text" 
                placeholder="Nome do responsável..."
                className="w-full px-4 py-3.5 bg-black/40 border-2 border-white/5 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-white transition-all"
                value={formData.responsavel}
                onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
              />
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">6. Observação (Opcional)</label>
              <textarea 
                placeholder="Detalhes adicionais..."
                className="w-full px-4 py-3.5 bg-black/40 border-2 border-white/5 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-white transition-all h-20 resize-none"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={!isFormValid}
            className="w-full py-5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl shadow-blue-900/20 active:scale-95"
          >
            Registrar Movimentação
          </button>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;
