import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapPin, Plus, X, CheckCircle2, AlertCircle, Search, Trash2, Upload, FileSpreadsheet, Printer } from 'lucide-react';
import { exportLocationLabels } from '../../lib/labelExport';

interface StorageLocation {
  id: string;
  codigo: string;
  descricao?: string;
  ativo: boolean;
}

const LocationsPage: React.FC = () => {
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    codigo: '',
    descricao: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load locations from localStorage safely
  useEffect(() => {
    const loadLocations = () => {
      try {
        const raw = localStorage.getItem('cnr_locations');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setLocations(parsed);
          } else {
            setLocations([]);
          }
        }
      } catch (e) {
        console.error('Erro ao carregar locais:', e);
        setLocations([]);
      }
    };
    loadLocations();
  }, []);

  // Save locations to localStorage safely
  const saveLocations = (newLocations: StorageLocation[]) => {
    try {
      localStorage.setItem('cnr_locations', JSON.stringify(newLocations));
      setLocations(newLocations);
    } catch (e) {
      console.error('Erro ao salvar locais:', e);
      alert('Erro ao salvar dados no navegador.');
    }
  };

  const filteredLocations = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return locations.filter(l => 
      l.codigo.toLowerCase().includes(term) || 
      (l.descricao || '').toLowerCase().includes(term)
    );
  }, [locations, searchTerm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const codigo = formData.codigo.trim().toUpperCase();
    
    if (codigo.length < 2) {
      alert('O código deve ter pelo menos 2 caracteres.');
      return;
    }

    // Check for duplicates
    if (locations.some(l => l.codigo.toUpperCase() === codigo)) {
      alert('Este código de local já existe.');
      return;
    }

    const newLocation: StorageLocation = {
      id: Math.random().toString(36).substr(2, 9),
      codigo,
      descricao: formData.descricao.trim(),
      ativo: true,
    };

    saveLocations([newLocation, ...locations]);
    setIsModalOpen(false);
    setFormData({ codigo: '', descricao: '' });
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').map(l => l.trim()).filter(l => l !== '');
        
        if (lines.length === 0) return;

        // Detect header
        const hasHeader = lines[0].toLowerCase().includes('codigo') || lines[0].toLowerCase().includes('código');
        const dataLines = hasHeader ? lines.slice(1) : lines;

        const newLocs: StorageLocation[] = [];
        const seenCodigos = new Set<string>(locations.map(l => l.codigo.toUpperCase()));
        
        let totalRead = dataLines.length;
        let imported = 0;
        let duplicates = 0;
        let invalid = 0;

        dataLines.forEach(line => {
          const parts = line.split(',').map(p => p.trim());
          const codigo = parts[0].toUpperCase();
          
          if (!codigo || codigo.length < 2) {
            invalid++;
            return;
          }

          if (seenCodigos.has(codigo)) {
            duplicates++;
            return;
          }

          seenCodigos.add(codigo);
          newLocs.push({
            id: Math.random().toString(36).substr(2, 9),
            codigo,
            descricao: parts[1] || '',
            ativo: true
          });
          imported++;
        });

        if (newLocs.length > 0) {
          saveLocations([...newLocs, ...locations]);
        }
        
        alert(`Resumo da Importação:\n- Lidas: ${totalRead}\n- Importadas: ${imported}\n- Duplicadas: ${duplicates}\n- Inválidas: ${invalid}`);
      } catch (err) {
        console.error('Erro ao processar CSV:', err);
        alert('Erro ao processar o arquivo CSV.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleStatus = (id: string) => {
    const updated = locations.map(l => 
      l.id === id ? { ...l, ativo: !l.ativo } : l
    );
    saveLocations(updated);
  };

  const handlePrintLabels = () => {
    const activeLocations = locations.filter(l => l.ativo);
    if (activeLocations.length === 0) {
      alert('Nenhum local ativo para imprimir.');
      return;
    }

    // Mock products for label export
    const mockProducts = activeLocations.map(l => ({
      name: l.descricao || 'LOCAL',
      sku: '-',
      location: l.codigo,
      barcode: `LOC-${l.codigo.replace(/\s+/g, '-')}`
    }));

    exportLocationLabels(mockProducts as any);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-full">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 shrink-0">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-3">
            <MapPin className="text-blue-500" size={24} />
            Gestão de Locais
          </h2>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Organização das prateleiras e corredores</p>
        </div>

        <div className="flex gap-2 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder="Buscar local..."
              className="w-full pl-10 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl text-sm font-bold text-white outline-none focus:border-blue-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={handlePrintLabels}
            className="bg-slate-800 hover:bg-slate-700 text-white p-2.5 rounded-xl transition-all shadow-sm active:scale-95"
            title="Imprimir Etiquetas"
          >
            <Printer size={20} />
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
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all font-bold shadow-lg shadow-blue-900/20 active:scale-95 shrink-0"
          >
            <Plus size={18} />
            <span className="text-[10px] uppercase">Novo Local</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="overflow-x-auto rounded-2xl border border-white/5 bg-black/20 flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-900">
              <tr className="bg-white/5 text-slate-400 uppercase tracking-widest text-[10px] font-black">
                <th className="px-8 py-4">Código</th>
                <th className="px-8 py-4">Descrição</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredLocations.map(loc => (
                <tr key={loc.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-8 py-4">
                    <span className="font-black text-white text-base tracking-tight">{loc.codigo}</span>
                  </td>
                  <td className="px-8 py-4">
                    <span className="text-slate-400 font-medium">{loc.descricao || '-'}</span>
                  </td>
                  <td className="px-8 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      loc.ativo ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${loc.ativo ? 'bg-green-500' : 'bg-red-500'}`} />
                      {loc.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <button 
                      onClick={() => toggleStatus(loc.id)}
                      className={`p-2 rounded-lg transition-all ${loc.ativo ? 'bg-red-500/10 text-red-500 hover:bg-red-500' : 'bg-green-500/10 text-green-500 hover:bg-green-500'} hover:text-white`}
                      title={loc.ativo ? 'Inativar' : 'Reativar'}
                    >
                      {loc.ativo ? <Trash2 size={16} /> : <CheckCircle2 size={16} />}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredLocations.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-20 text-center opacity-10">
                    <MapPin size={48} className="mx-auto mb-4" />
                    <p className="text-xl font-black uppercase tracking-widest">Nenhum local encontrado</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Novo Local */}
      {isModalOpen && (
        <div className="modal-overlay p-2 md:p-4 z-[100]">
          <div className="bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-white/10 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center p-6 border-b border-white/5 bg-black/20">
              <h3 className="text-xl font-black text-white tracking-tight">Novo Local</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-white/5 hover:bg-red-600 text-slate-400 hover:text-white rounded-xl transition-all">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Código do Local (Ex: A1-01)</label>
                <input 
                  type="text" 
                  required
                  placeholder="A1-01"
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white font-bold outline-none focus:border-blue-500 transition-all"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Descrição (Opcional)</label>
                <input 
                  type="text" 
                  placeholder="Ex: Prateleira superior"
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white font-bold outline-none focus:border-blue-500 transition-all"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                />
              </div>
              <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-blue-900/20">
                Cadastrar Local
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationsPage;
