import React, { useState, useRef, useEffect } from 'react';
import { useInventoryStore } from '../../store/useInventoryStore';
import { X, Package, CheckCircle2, Camera, DollarSign, Trash2, Plus, Edit2, Search, Globe, RefreshCw, AlertCircle, MapPin, Hash, Tag, Ruler, Scan, AlertTriangle } from 'lucide-react';
import { Product } from '../../types/inventory';

interface ProductFormProps {
  onClose: () => void;
  initialData?: Product;
}

const ProductForm: React.FC<ProductFormProps> = ({ onClose, initialData }) => {
  const { addProduct, updateProduct, searchImages, locations } = useInventoryStore();
  const [formData, setFormData] = useState({
    code: '',
    stock: 0,
    min: 1,
    location: '',
    local: '',
    barcode: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        code: initialData.code ?? initialData.sku ?? "",
        stock: initialData.stock ?? initialData.quantity ?? 0,
        min: initialData.min ?? initialData.minimo ?? initialData.minQuantity ?? 1,
        location: initialData.location ?? initialData.local ?? "",
        local: initialData.local ?? initialData.location ?? "",
        barcode: initialData.barcode ?? "",
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code) {
      alert("CODE é obrigatório.");
      return;
    }

    const { products } = useInventoryStore.getState();
    if (formData.barcode && products.some(p => p.barcode === formData.barcode && p.id !== initialData?.id)) {
      alert("Este código de barras já está em uso por outro produto.");
      return;
    }

    const normalizedLocal = (formData.local || "").trim().toUpperCase();

    const dataToSave = {
      ...formData,
      local: normalizedLocal,
      location: normalizedLocal,
    };

    if (initialData) {
      await updateProduct(initialData.id, dataToSave as any);
    } else {
      await addProduct(dataToSave as any);
    }
    onClose();
  };

  return (
    <div className="modal-overlay p-2 md:p-4">
      <div className="bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-white/10 animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 md:p-8 border-b border-white/5 bg-black/20 shrink-0">
          <div className="flex items-center gap-3 md:gap-4">
            <div className={`p-2 md:p-3 ${initialData ? 'bg-blue-600' : 'bg-green-600'} text-white rounded-xl md:rounded-2xl shadow-lg shadow-blue-900/20`}>
              {initialData ? <Edit2 size={20} className="md:w-6 md:h-6" /> : <Plus size={20} className="md:w-6 md:h-6" />}
            </div>
            <div>
              <h3 className="text-lg md:text-2xl font-black text-white tracking-tight">{initialData ? 'Editar Item' : 'Novo Item'}</h3>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[8px] md:text-[10px]">{initialData ? 'Atualizar dados' : 'Cadastro de Peça'}</p>
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
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 flex items-center gap-1">
                <Hash size={10} /> CODE / Código
              </label>
              <input 
                type="text" 
                required
                placeholder="Ex: 001245"
                className="w-full px-4 py-4 bg-black/40 border-2 border-white/5 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-black text-xl text-white transition-all"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 flex items-center gap-1">
                <Scan size={10} /> Código de Barras (Opcional)
              </label>
              <input 
                type="text" 
                placeholder="Bipe ou digite o código..."
                className={`w-full px-4 py-3 bg-black/40 border border-white/5 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-white transition-all text-sm`}
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value.trim() })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Estoque Inicial</label>
                <input 
                  type="number" 
                  className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-white transition-all text-sm"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Mínimo</label>
                <input 
                  type="number" 
                  min="0"
                  className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-white transition-all text-sm"
                  value={formData.min}
                  onChange={(e) => setFormData({ ...formData, min: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 flex items-center gap-1">
                <MapPin size={10} /> Localização
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  list="locations-list"
                  placeholder="Selecione ou digite..."
                  className={`w-full px-4 py-3 bg-black/40 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-white transition-all text-sm ${
                    formData.local && Array.isArray(locations) && !locations.some(l => l.codigo.toUpperCase() === formData.local.toUpperCase()) 
                      ? 'border-amber-500/30' 
                      : 'border-white/5'
                  }`}
                  value={formData.local}
                  onChange={(e) => setFormData({ ...formData, local: e.target.value })}
                />
                <datalist id="locations-list">
                  {Array.isArray(locations) && locations.filter(l => l.ativo).map(l => (
                    <option key={l.id} value={l.codigo}>{l.descricao || l.codigo}</option>
                  ))}
                </datalist>
                {formData.local && Array.isArray(locations) && !locations.some(l => l.codigo.toUpperCase() === formData.local.toUpperCase()) && (
                  <p className="text-[8px] font-bold text-amber-500 mt-1 ml-2 flex items-center gap-1">
                    <AlertTriangle size={8} /> Local não cadastrado
                  </p>
                )}
              </div>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl shadow-blue-900/20 active:scale-95"
          >
            {initialData ? 'Salvar Alterações' : 'Cadastrar Produto'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
