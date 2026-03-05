import React, { useState, useMemo, useRef } from 'react';
import { useInventoryStore } from '../../store/useInventoryStore';
import { Truck } from '../../types/inventory';
import { Search, Plus, Upload, Trash2, Edit2, CheckCircle2, X, Car, MapPin, Filter, ChevronLeft, ChevronRight, AlertCircle, FileSpreadsheet } from 'lucide-react';

const TruckManager: React.FC = () => {
  const { trucks, addTruck, updateTruck, deleteTruck, bulkAddTrucks } = useInventoryStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTruck, setEditingTruck] = useState<Truck | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    placa: '',
    filial: '',
    tipo: '',
    ativo: true,
  });

  const filteredTrucks = useMemo(() => {
    if (!Array.isArray(trucks)) return [];
    const term = searchTerm.toLowerCase();
    return trucks.filter(t => 
      t.placa.toLowerCase().includes(term) ||
      (t.filial || '').toLowerCase().includes(term) ||
      (t.tipo || '').toLowerCase().includes(term)
    );
  }, [trucks, searchTerm]);

  const totalPages = Math.ceil(filteredTrucks.length / itemsPerPage);
  const paginatedTrucks = filteredTrucks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').map(l => l.trim()).filter(l => l !== '');
      
      if (lines.length === 0) return;

      // Skip header if exists
      const hasHeader = lines[0].toLowerCase().includes('placa');
      const startIdx = hasHeader ? 1 : 0;
      const dataLines = lines.slice(startIdx);

      const newTrucks: Omit<Truck, 'id'>[] = [];
      const seenPlacas = new Set<string>(trucks.map(t => t.placa.toUpperCase()));
      
      let totalRead = dataLines.length;
      let imported = 0;
      let duplicates = 0;
      let invalid = 0;

      dataLines.forEach(line => {
        const parts = line.split(',').map(p => p.trim());
        const rawPlaca = parts[0];
        
        if (!rawPlaca) {
          invalid++;
          return;
        }

        const placa = rawPlaca.toUpperCase().replace(/\s+/g, '');
        
        if (seenPlacas.has(placa)) {
          duplicates++;
          return;
        }

        seenPlacas.add(placa);
        newTrucks.push({
          placa,
          filial: parts[1] || '',
          tipo: parts[2] || '',
          ativo: true
        });
        imported++;
      });

      if (newTrucks.length > 0) {
        await bulkAddTrucks(newTrucks);
      }
      
      alert(`Resumo da Importação:\n- Lidas: ${totalRead}\n- Importadas: ${imported}\n- Duplicadas: ${duplicates}\n- Inválidas: ${invalid}`);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadCSVTemplate = () => {
    const csvContent = "placa,filial,tipo\nABC1234,Matriz,Carreta\nXYZ5678,Filial 01,Truck";
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'modelo_caminhoes.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.placa.trim()) return;

    if (editingTruck) {
      await updateTruck(editingTruck.id, formData);
    } else {
      // Check if plate already exists
      if (trucks.some(t => t.placa === formData.placa.toUpperCase())) {
        alert("Esta placa já está cadastrada.");
        return;
      }
      await addTruck(formData);
    }
    
    setIsModalOpen(false);
    setEditingTruck(null);
    setFormData({ placa: '', filial: '', tipo: '', ativo: true });
  };

  const openEditModal = (truck: Truck) => {
    setEditingTruck(truck);
    setFormData({
      placa: truck.placa,
      filial: truck.filial || '',
      tipo: truck.tipo || '',
      ativo: truck.ativo,
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-3">
            <Car className="text-blue-500" size={24} />
            Gerenciamento de Caminhões
          </h2>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Cadastro de frotas e placas autorizadas</p>
        </div>

        <div className="flex gap-2 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder="Buscar placa..."
              className="w-full pl-10 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl text-sm font-bold text-white outline-none focus:border-blue-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={downloadCSVTemplate}
            className="bg-slate-800 hover:bg-slate-700 text-white p-2.5 rounded-xl transition-all shadow-sm active:scale-95"
            title="Baixar modelo CSV"
          >
            <FileSpreadsheet size={20} />
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-slate-800 hover:bg-slate-700 text-white p-2.5 rounded-xl transition-all shadow-sm active:scale-95"
            title="Importar CSV"
          >
            <Upload size={20} />
          </button>
          <input type="file" ref={fileInputRef} onChange={handleImportCSV} accept=".csv" className="hidden" />
          <button 
            onClick={() => {
              setEditingTruck(null);
              setFormData({ placa: '', filial: '', tipo: '', ativo: true });
              setIsModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all font-bold shadow-lg shadow-blue-900/20 active:scale-95 shrink-0"
          >
            <Plus size={18} />
            <span className="text-[10px] uppercase">Novo</span>
          </button>
        </div>
      </div>

      <div className="bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-slate-400 uppercase tracking-widest text-[10px] font-black">
                <th className="px-8 py-4">Placa</th>
                <th className="px-8 py-4">Filial</th>
                <th className="px-8 py-4">Tipo</th>
                <th className="px-8 py-4 text-center">Status</th>
                <th className="px-8 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedTrucks.map(truck => (
                <tr key={truck.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                        <Car size={16} />
                      </div>
                      <span className="font-black text-white text-lg tracking-wider">{truck.placa}</span>
                    </div>
                  </td>
                  <td className="px-8 py-4 text-sm font-bold text-slate-300">{truck.filial || '-'}</td>
                  <td className="px-8 py-4 text-sm font-bold text-slate-300">{truck.tipo || '-'}</td>
                  <td className="px-8 py-4 text-center">
                    <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                      truck.ativo ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {truck.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => openEditModal(truck)}
                        className="p-2 text-slate-500 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm(`Deseja excluir o caminhão ${truck.placa}?`)) deleteTruck(truck.id);
                        }}
                        className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
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

        {paginatedTrucks.length === 0 && (
          <div className="py-20 text-center opacity-10">
            <Car size={48} className="mx-auto mb-4" />
            <p className="text-xl font-black uppercase tracking-widest">Nenhum caminhão cadastrado</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="p-2 bg-white/5 rounded-lg text-white disabled:opacity-30"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="p-2 bg-white/5 rounded-lg text-white disabled:opacity-30"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay p-2 md:p-4 z-[100]">
          <div className="bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-white/10 flex flex-col animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center p-6 border-b border-white/5 bg-black/20">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${editingTruck ? 'bg-blue-600' : 'bg-green-600'} text-white shadow-lg`}>
                  <Car size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight">{editingTruck ? 'Editar Caminhão' : 'Novo Caminhão'}</h3>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Cadastro de Placa</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 text-slate-500 hover:text-white rounded-xl transition-all">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Placa (Obrigatório)</label>
                <input 
                  type="text" 
                  required
                  placeholder="ABC1D23"
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl font-black text-xl text-white outline-none focus:border-blue-500 transition-all uppercase"
                  value={formData.placa}
                  onChange={(e) => setFormData({ ...formData, placa: e.target.value.toUpperCase() })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Filial</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Matriz"
                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl font-bold text-white outline-none focus:border-blue-500 transition-all"
                    value={formData.filial}
                    onChange={(e) => setFormData({ ...formData, filial: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Tipo</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Cavalo"
                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl font-bold text-white outline-none focus:border-blue-500 transition-all"
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                <input 
                  type="checkbox" 
                  id="ativo"
                  className="w-5 h-5 rounded border-white/10 bg-black/40 text-blue-600 focus:ring-blue-500/20"
                  checked={formData.ativo}
                  onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                />
                <label htmlFor="ativo" className="text-sm font-bold text-white cursor-pointer">Caminhão Ativo</label>
              </div>

              <button 
                type="submit"
                className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-sm transition-all shadow-lg active:scale-95 ${
                  editingTruck ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
                } text-white`}
              >
                {editingTruck ? 'Salvar Alterações' : 'Cadastrar Caminhão'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TruckManager;
