import React, { useState, useMemo, useEffect } from 'react';
import { useInventoryStore } from '../../store/useInventoryStore';
import { Search, Package, Car, CheckCircle2, AlertCircle, ArrowDownLeft, X, User, FileText, AlertTriangle } from 'lucide-react';

const MechanicMode: React.FC = () => {
  const { products, trucks, addMovement } = useInventoryStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    productId: '',
    quantity: 1,
    placa: '',
    responsavel: '',
    observacao: '',
  });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];
    if (!searchTerm) return [];
    const term = searchTerm.toLowerCase();
    return products.filter(p => 
      (p.code || '').toLowerCase().includes(term)
    ).slice(0, 5);
  }, [products, searchTerm]);

  const filteredTrucks = useMemo(() => {
    if (!formData.placa) return [];
    const term = formData.placa.toLowerCase();
    return trucks.filter(t => t.placa.toLowerCase().includes(term) && t.ativo).slice(0, 5);
  }, [trucks, formData.placa]);

  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === formData.productId);
  }, [products, formData.productId]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const isFormValid = useMemo(() => {
    return (
      formData.productId !== '' &&
      formData.quantity > 0 &&
      formData.placa.trim() !== ''
    );
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      setToast({ message: "Informe a placa do caminhão", type: 'error' });
      return;
    }

    const normalizedPlaca = formData.placa.trim().toUpperCase().replace(/\s+/g, ' ');

    if (selectedProduct && formData.quantity > selectedProduct.stock) {
      if (!confirm(`Estoque insuficiente (${selectedProduct.stock}). Deseja continuar mesmo assim?`)) return;
    }

    setIsSubmitting(true);
    try {
      await addMovement({
        productId: formData.productId,
        tipo: 'SAIDA',
        quantidade: formData.quantity,
        placa: normalizedPlaca,
        responsavel: formData.responsavel.trim() || 'Mecânico (Balcão)',
        observacao: formData.observacao.trim(),
        dataHora: Math.floor(Date.now() / 1000),
      });
      
      setToast({ message: "Saída registrada com sucesso!", type: 'success' });
      setFormData({ productId: '', quantity: 1, placa: '', responsavel: '', observacao: '' });
      setSearchTerm('');
    } catch (err) {
      setToast({ message: "Erro ao registrar saída.", type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-slate-900/50 backdrop-blur-xl p-8 md:p-12 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden">
        {/* Toast Notification */}
        {toast && (
          <div className={`absolute top-0 left-0 right-0 p-4 text-center font-black uppercase tracking-widest text-xs animate-in slide-in-from-top duration-300 z-10 ${
            toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}>
            <div className="flex items-center justify-center gap-2">
              {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {toast.message}
            </div>
          </div>
        )}

        {/* Product Search */}
        <div className="space-y-4">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">1. Buscar Peça (CODE)</label>
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-500 group-focus-within:scale-110 transition-transform" size={20} />
            <input 
              type="text" 
              placeholder="Digite o código..."
              className="w-full pl-14 pr-6 py-5 bg-black/40 border-2 border-white/5 rounded-2xl focus:ring-8 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-black text-lg text-white transition-all placeholder:text-slate-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {searchTerm && filteredProducts.length > 0 && !formData.productId && (
            <div className="rounded-2xl border-2 border-white/5 bg-black/40 divide-y divide-white/5 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {filteredProducts.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, productId: p.id });
                    setSearchTerm(p.code);
                  }}
                  className="w-full p-5 text-left hover:bg-blue-600/10 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-blue-500/20 transition-colors">
                      <Package size={20} className="text-slate-500 group-hover:text-blue-500" />
                    </div>
                    <div className="min-w-0">
                      <span className="block font-black text-white truncate text-xl uppercase tracking-tight">{p.code}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-xs font-black text-slate-500 uppercase tracking-widest">Estoque</span>
                    <span className={`text-lg font-black ${p.stock <= 0 ? 'text-red-500' : 'text-white'}`}>{p.stock}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {formData.productId && selectedProduct && (
            <div className="p-5 bg-blue-600/10 border-2 border-blue-500/20 rounded-2xl flex items-center justify-between animate-in slide-in-from-left-4 duration-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <CheckCircle2 className="text-blue-500" size={24} />
                </div>
                <div>
                  <span className="block font-black text-white text-xl uppercase tracking-tight">{selectedProduct.code}</span>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setFormData({ ...formData, productId: '' });
                  setSearchTerm('');
                }}
                className="p-2 hover:bg-red-500/20 text-slate-500 hover:text-red-500 rounded-lg transition-all"
              >
                <X size={20} />
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {/* Quantity */}
          <div className="space-y-4">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">2. Quantidade</label>
            <input 
              type="number" 
              min="1"
              required
              className="w-full px-6 py-5 bg-black/40 border-2 border-white/5 rounded-2xl focus:ring-8 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-black text-2xl text-white transition-all"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
            />
          </div>

          {/* Plate */}
          <div className="space-y-4 relative">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 flex items-center gap-2">
              <Car size={12} /> 3. Placa do Veículo
            </label>
            <input 
              type="text" 
              required
              placeholder="ABC-1234"
              className={`w-full px-6 py-5 bg-black/40 border-2 rounded-2xl focus:ring-8 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-black text-2xl text-white transition-all placeholder:text-slate-800 ${
                !formData.placa.trim() ? 'border-red-500/50' : 'border-white/5'
              }`}
              value={formData.placa}
              onChange={(e) => setFormData({ ...formData, placa: e.target.value.toUpperCase() })}
            />
            {filteredTrucks.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-slate-800 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-white/5">
                {filteredTrucks.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, placa: t.placa })}
                    className="w-full p-4 text-left hover:bg-blue-600/20 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <Car size={18} className="text-blue-500" />
                      <span className="font-black text-white text-lg">{t.placa}</span>
                    </div>
                    <span className="text-[10px] font-black text-slate-500 uppercase">{t.filial}</span>
                  </button>
                ))}
              </div>
            )}
            {!formData.placa.trim() && (
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="space-y-4">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 flex items-center gap-2">
              <User size={12} /> 4. Responsável
            </label>
            <input 
              type="text" 
              placeholder="Nome do mecânico..."
              className="w-full px-6 py-5 bg-black/40 border-2 border-white/5 rounded-2xl focus:ring-8 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-white transition-all"
              value={formData.responsavel}
              onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
            />
          </div>

          <div className="space-y-4">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 flex items-center gap-2">
              <FileText size={12} /> 5. Observação
            </label>
            <input 
              type="text" 
              placeholder="Ex: Troca preventiva..."
              className="w-full px-6 py-5 bg-black/40 border-2 border-white/5 rounded-2xl focus:ring-8 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-white transition-all"
              value={formData.observacao}
              onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
            />
          </div>
        </div>

        <button 
          onClick={handleSubmit}
          disabled={!isFormValid || isSubmitting}
          className="w-full mt-12 py-6 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-[2rem] font-black uppercase tracking-widest text-lg transition-all shadow-2xl shadow-red-900/40 active:scale-95 flex items-center justify-center gap-4"
        >
          {isSubmitting ? <RefreshCw className="animate-spin" size={24} /> : <ArrowDownLeft size={24} />}
          Registrar Saída Rápida
        </button>
      </div>
    </div>
  );
};

export default MechanicMode;
