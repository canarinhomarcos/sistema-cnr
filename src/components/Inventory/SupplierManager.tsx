import React, { useState } from 'react';
import { useInventoryStore } from '../../store/useInventoryStore';
import { UserPlus, Search, Mail, Phone, User, Trash2, Edit2, X, CheckCircle2 } from 'lucide-react';

const SupplierManager: React.FC = () => {
  const { suppliers, addSupplier } = useInventoryStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    email: '',
    phone: '',
  });

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addSupplier(formData);
    setIsModalOpen(false);
    setFormData({ name: '', contact: '', email: '', phone: '' });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <h2 className="text-3xl font-black text-white">Fornecedores</h2>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Buscar fornecedor..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-200 active:scale-95 transition-all"
          >
            <UserPlus size={18} />
            Novo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSuppliers.map((supplier) => (
          <div key={supplier.id} className="bg-slate-900/60 backdrop-blur-md p-6 rounded-[2rem] border border-white/5 shadow-xl hover:border-white/10 transition-all group">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 font-black text-xl">
                {supplier.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <h3 className="font-black text-white truncate">{supplier.name}</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{supplier.contact || 'Sem contato'}</p>
              </div>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-white">
                <Mail size={16} className="text-blue-400" />
                <span className="text-sm font-medium truncate">{supplier.email || '--'}</span>
              </div>
              <div className="flex items-center gap-3 text-white">
                <Phone size={16} className="text-blue-400" />
                <span className="text-sm font-medium">{supplier.phone || '--'}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-slate-50 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="flex-1 py-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all font-black text-[10px] uppercase tracking-widest">Editar</button>
              <button className="flex-1 py-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all font-black text-[10px] uppercase tracking-widest">Excluir</button>
            </div>
          </div>
        ))}
        
        {filteredSuppliers.length === 0 && (
          <div className="col-span-full py-20 text-center bg-slate-50 rounded-[2.5rem] border-4 border-dashed border-slate-100">
            <User className="mx-auto text-slate-200 mb-4" size={64} />
            <p className="text-xl font-black text-slate-300 uppercase tracking-widest">Nenhum fornecedor encontrado</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[90] p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center p-8 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200">
                  <UserPlus size={24} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Novo Fornecedor</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-all">
                <X size={28} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome da Empresa</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold transition-all"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Pessoa de Contato</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold transition-all"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">E-mail</label>
                  <input 
                    type="email" 
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold transition-all"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Telefone</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold transition-all"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-4 border-2 border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition-all font-black text-sm uppercase tracking-widest"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-[2] px-6 py-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-200 transition-all font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={20} />
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierManager;
