import React, { useState, useRef } from 'react';
import { useInventoryStore } from '../../store/useInventoryStore';
import { X, Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Database, Trash2, Plus, FileUp, RefreshCw } from 'lucide-react';

interface ImportModalProps {
  onClose: () => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ onClose }) => {
  const { bulkAddProducts, replaceProducts } = useInventoryStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMode, setImportMode] = useState<'add' | 'replace'>('add');
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'loading'>('idle');
  const [message, setMessage] = useState('');

  const processCSV = async (text: string) => {
    setStatus('loading');
    try {
      const lines = text.trim().split('\n');
      const products = lines.map((line, index) => {
        let delimiter = ',';
        if (line.includes('\t')) delimiter = '\t';
        else if (line.includes(';')) delimiter = ';';
        
        let parts = line.split(delimiter).map(s => s.trim());
        
        if (parts.length === 1 && line.trim().includes(' ')) {
          const trimmedLine = line.trim();
          const firstSpaceIndex = trimmedLine.indexOf(' ');
          parts = [
            trimmedLine.substring(0, firstSpaceIndex).trim(),
            trimmedLine.substring(firstSpaceIndex + 1).trim()
          ];
        }

        const firstPart = parts[0]?.toLowerCase();
        if (index === 0 && (firstPart === 'sku' || firstPart === 'code' || firstPart === 'codigo' || firstPart === 'código')) {
          return null;
        }

        const code = String(parts[0] || '').trim();
        
        if (!code || code.toLowerCase() === 'sku' || code.toLowerCase() === 'code' || code.toLowerCase() === 'codigo' || code.toLowerCase() === 'código') return null;

        return {
          code,
          stock: parseFloat(parts[1]) || 0,
          min: parseFloat(parts[2]) || 1,
          location: String(parts[3] || '').trim(),
        };
      }).filter(p => p !== null);

      if (!products || products.length === 0) {
        throw new Error('Nenhum produto válido encontrado.');
      }

      if (importMode === 'replace') {
        await replaceProducts(products as any);
      } else {
        await bulkAddProducts(products as any);
      }

      setStatus('success');
      setMessage(`${products.length} produtos importados com sucesso!`);
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Erro ao processar arquivo.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      processCSV(text);
    };
    reader.onerror = () => {
      setStatus('error');
      setMessage('Erro ao ler o arquivo.');
    };
    reader.readAsText(file);
  };

  return (
    <div className="modal-overlay p-2 md:p-4">
      <div className="bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl w-full max-w-3xl overflow-hidden border border-white/10 animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 md:p-8 border-b border-white/5 bg-black/20 shrink-0">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="p-2 md:p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-900/20">
              <Database size={20} className="md:w-6 md:h-6" />
            </div>
            <div>
              <h3 className="text-lg md:text-2xl font-black text-white tracking-tight">Importar Base</h3>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[8px] md:text-[10px]">Excel / CSV</p>
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

        <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          {status === 'success' ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-6 animate-in zoom-in-95">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle2 size={48} className="text-green-500" />
              </div>
              <div className="text-center">
                <h4 className="text-xl font-black text-white mb-2">Importação Concluída!</h4>
                <p className="text-slate-400 font-medium text-sm">{message}</p>
              </div>
              <button 
                onClick={onClose}
                className="px-12 py-4 bg-green-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-green-700 transition-all shadow-xl shadow-green-900/20"
              >
                Fechar Janela
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <button 
                  onClick={() => setImportMode('add')}
                  className={`p-4 rounded-2xl border-2 transition-all text-left flex gap-3 ${
                    importMode === 'add' ? 'border-blue-600 bg-blue-600/10' : 'border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 ${importMode === 'add' ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-500'}`}>
                    <Plus size={20} />
                  </div>
                  <div>
                    <p className="font-black text-white text-sm">Adicionar Novos</p>
                    <p className="text-[10px] text-slate-400 font-medium">Mantém o estoque atual.</p>
                  </div>
                </button>

                <button 
                  onClick={() => setImportMode('replace')}
                  className={`p-4 rounded-2xl border-2 transition-all text-left flex gap-3 ${
                    importMode === 'replace' ? 'border-red-600 bg-red-600/10' : 'border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 ${importMode === 'replace' ? 'bg-red-600 text-white' : 'bg-white/5 text-slate-500'}`}>
                    <Trash2 size={20} />
                  </div>
                  <div>
                    <p className="font-black text-white text-sm">Substituir Tudo</p>
                    <p className="text-[10px] text-slate-400 font-medium">Apaga a base e gera nova.</p>
                  </div>
                </button>
              </div>

              <div className="bg-black/20 border-2 border-white/5 p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-white font-black uppercase tracking-widest text-[10px] flex items-center gap-2">
                    <FileSpreadsheet size={16} className="text-blue-500" />
                    Instruções
                  </h4>
                </div>
                
                <div className="space-y-2">
                  <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                    Formato aceito: <span className="text-blue-400">CODE, Estoque, Mínimo, Local</span>
                  </p>
                  <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                    O sistema também aceita arquivos Excel (.xlsx, .xls).
                  </p>
                </div>

                <div className="flex flex-col gap-4">
                  <label 
                    htmlFor="csv-file-input"
                    className="w-full py-8 border-4 border-dashed border-white/5 rounded-2xl text-white hover:border-blue-600 hover:bg-blue-600/10 transition-all font-black text-sm uppercase tracking-widest flex flex-col items-center justify-center gap-3 cursor-pointer group"
                  >
                    <Upload className="text-slate-600 group-hover:text-blue-500 transition-colors" size={48} />
                    <div className="text-center">
                      <p className="text-sm font-black text-white">Selecionar Arquivo</p>
                      <p className="text-slate-500 font-bold uppercase tracking-widest text-[8px]">Excel ou CSV</p>
                    </div>
                    <input 
                      id="csv-file-input"
                      type="file" 
                      accept=".csv,.xlsx,.xls" 
                      className="hidden" 
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              </div>

              {status === 'error' && (
                <div className="p-4 bg-red-600/10 border border-red-600/20 rounded-xl flex items-center gap-3 text-red-500">
                  <AlertCircle size={20} />
                  <p className="text-xs font-bold">{message}</p>
                </div>
              )}

              {status === 'loading' && (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <RefreshCw size={32} className="text-blue-500 animate-spin" />
                  <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Processando arquivo...</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
