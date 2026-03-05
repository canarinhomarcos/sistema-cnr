import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useInventoryStore } from '../../store/useInventoryStore';
import { Scan, ArrowUpRight, ArrowDownLeft, Trash2, CheckCircle2, AlertCircle, Car, Package, MapPin, Hash, X, Save, Plus, Minus, Edit3, RefreshCw, AlertTriangle } from 'lucide-react';

interface ScannedItem {
  productId: string;
  code: string;
  local: string;
  quantity: number;
  barcode: string;
}

const BarcodeBeeper: React.FC = () => {
  const { products, trucks, addMovement, fetchData } = useInventoryStore();
  const [type, setType] = useState<'ENTRADA' | 'SAIDA'>('SAIDA');
  const [placa, setPlaca] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingItem, setEditingProduct] = useState<{ id: string; qty: number } | null>(null);
  const [lastScannedId, setLastScannedId] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep focus on input
  useEffect(() => {
    const interval = setInterval(() => {
      if (
        document.activeElement?.tagName !== 'INPUT' && 
        document.activeElement?.tagName !== 'TEXTAREA' && 
        !editingItem && 
        !isSubmitting
      ) {
        inputRef.current?.focus();
      }
    }, 500);
    return () => clearInterval(interval);
  }, [editingItem, isSubmitting]);

  useEffect(() => {
    if (!editingItem && !isSubmitting) {
      inputRef.current?.focus();
    }
  }, [type, editingItem, isSubmitting]);

  const filteredTrucks = useMemo(() => {
    if (!placa || !Array.isArray(trucks)) return [];
    const term = placa.toLowerCase();
    return trucks.filter(t => t.placa.toLowerCase().includes(term) && t.ativo).slice(0, 5);
  }, [trucks, placa]);

  const playBeep = (success: boolean) => {
    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(success ? 880 : 220, context.currentTime);
      
      gain.gain.setValueAtTime(0.1, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.2);
      
      oscillator.connect(gain);
      gain.connect(context.destination);
      
      oscillator.start();
      oscillator.stop(context.currentTime + 0.2);
    } catch (e) {
      console.warn('Audio feedback failed', e);
    }
  };

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    const product = products.find(p => p.barcode === code);

    if (product) {
      setScannedItems(prev => {
        const existing = prev.find(item => item.productId === product.id);
        if (existing) {
          return prev.map(item => 
            item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
          );
        }
        return [{
          productId: product.id,
          code: product.code,
          local: product.local || product.location || '-',
          quantity: 1,
          barcode: code
        }, ...prev];
      });
      
      setLastScannedId(product.id);
      setFeedback({ message: `Adicionado: ${product.code}`, type: 'success' });
      playBeep(true);
      
      // Clear highlight after 1s
      setTimeout(() => setLastScannedId(null), 1000);
    } else {
      setFeedback({ message: 'Código não cadastrado!', type: 'error' });
      playBeep(false);
    }

    setBarcodeInput('');
    setTimeout(() => setFeedback(null), 2000);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setScannedItems(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
    inputRef.current?.focus();
  };

  const setManualQuantity = (productId: string, qty: number) => {
    setScannedItems(prev => prev.map(item => {
      if (item.productId === productId) {
        return { ...item, quantity: Math.max(1, qty) };
      }
      return item;
    }));
    setEditingProduct(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleFinalize = async () => {
    if (scannedItems.length === 0) return;
    if (type === 'SAIDA' && !placa.trim()) {
      alert('Informe a placa do veículo para saídas.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Register movements in batch
      await Promise.all(scannedItems.map(item => 
        addMovement({
          productId: item.productId,
          tipo: type,
          quantidade: item.quantity,
          placa: type === 'SAIDA' ? placa.trim().toUpperCase() : undefined,
          responsavel: 'Bipador Rápido',
          observacao: 'Registro via modo bipador',
          dataHora: Math.floor(Date.now() / 1000),
        })
      ));
      
      setScannedItems([]);
      setPlaca('');
      setFeedback({ message: 'Movimentações registradas com sucesso!', type: 'success' });
      playBeep(true);
      await fetchData();
    } catch (err) {
      setFeedback({ message: 'Erro ao finalizar movimentações.', type: 'error' });
      playBeep(false);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => {
        setFeedback(null);
        inputRef.current?.focus();
      }, 3000);
    }
  };

  const removeItem = (productId: string) => {
    setScannedItems(prev => prev.filter(item => item.productId !== productId));
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-full">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 shrink-0">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-3">
            <Scan className="text-blue-500" size={24} />
            Modo Bipador
          </h2>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Leitura rápida de código de barras</p>
        </div>

        <div className="flex items-center gap-4 bg-black/40 p-1 rounded-2xl border border-white/10">
          <button
            onClick={() => setType('SAIDA')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
              type === 'SAIDA' ? 'bg-red-600 text-white shadow-lg shadow-red-900/20' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <ArrowDownLeft size={14} /> Saída
          </button>
          <button
            onClick={() => setType('ENTRADA')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
              type === 'ENTRADA' ? 'bg-green-600 text-white shadow-lg shadow-green-900/20' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <ArrowUpRight size={14} /> Entrada
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Left Column: Controls */}
        <div className="space-y-6">
          {type === 'SAIDA' && (
            <div className="space-y-3 relative">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 flex items-center gap-1">
                <Car size={10} /> Placa do Veículo (Obrigatório)
              </label>
              <input 
                type="text" 
                placeholder="ABC-1234"
                className="w-full px-4 py-4 bg-black/40 border-2 border-white/5 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-black text-xl text-white transition-all"
                value={placa}
                onChange={(e) => setPlaca(e.target.value.toUpperCase())}
              />
              {filteredTrucks.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-slate-800 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-white/5">
                  {filteredTrucks.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setPlaca(t.placa)}
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
            </div>
          )}

          <div className="space-y-3">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 flex items-center gap-1">
              <Scan size={10} /> Campo de Leitura
            </label>
            <form onSubmit={handleScan}>
              <input 
                ref={inputRef}
                type="text" 
                placeholder="Bipe o código aqui..."
                className={`w-full px-4 py-6 bg-black/40 border-4 rounded-2xl focus:ring-8 focus:ring-blue-500/10 outline-none font-black text-2xl text-center text-white transition-all ${
                  feedback?.type === 'success' ? 'border-green-500/50' : 
                  feedback?.type === 'error' ? 'border-red-500/50' : 'border-blue-500/20'
                }`}
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                autoComplete="off"
                autoFocus
              />
            </form>
            {feedback && (
              <div className={`p-4 rounded-xl flex items-center gap-3 animate-in zoom-in-95 duration-200 ${
                feedback.type === 'success' ? 'bg-green-600/20 text-green-400 border border-green-500/20' : 'bg-red-600/20 text-red-400 border border-red-500/20'
              }`}>
                {feedback.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                <span className="font-bold text-sm">{feedback.message}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <button
              onClick={() => {
                if (window.confirm('Limpar lista da sessão?')) setScannedItems([]);
                inputRef.current?.focus();
              }}
              disabled={scannedItems.length === 0}
              className="py-4 bg-white/5 hover:bg-red-600/20 text-slate-400 hover:text-red-500 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all border border-white/5 disabled:opacity-20"
            >
              <Trash2 size={18} className="mx-auto mb-1" />
              Limpar
            </button>
            <button
              onClick={handleFinalize}
              disabled={scannedItems.length === 0 || isSubmitting}
              className="py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl shadow-blue-900/20 disabled:opacity-20 active:scale-95"
            >
              {isSubmitting ? <RefreshCw className="animate-spin mx-auto mb-1" size={18} /> : <Save size={18} className="mx-auto mb-1" />}
              Finalizar
            </button>
          </div>
        </div>

        {/* Right Column: Scanned List */}
        <div className="lg:col-span-2 flex flex-col min-h-0">
          <div className="bg-black/20 rounded-3xl border border-white/5 flex flex-col flex-1 overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Package size={16} className="text-blue-500" />
                Itens na Sessão ({scannedItems.reduce((acc, i) => acc + i.quantity, 0)})
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-900">
                  <tr className="bg-white/5 text-slate-500 uppercase tracking-widest text-[8px] font-black">
                    <th className="px-6 py-3">CODE</th>
                    <th className="px-6 py-3">Local</th>
                    <th className="px-6 py-3 text-center">Qtd</th>
                    <th className="px-6 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {scannedItems.map(item => (
                    <tr 
                      key={item.productId} 
                      className={`transition-all duration-500 group ${
                        lastScannedId === item.productId ? 'bg-blue-600/20 scale-[1.01]' : 'hover:bg-white/5'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <span className="text-sm font-black text-white uppercase tracking-tight">{item.code}</span>
                      </td>
                      <td className="px-6 py-4">
                        {item.local && item.local !== '-' ? (
                          <div className="flex items-center gap-1 text-slate-400 text-xs font-bold">
                            <MapPin size={10} /> {item.local}
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1 text-amber-500 text-[10px] font-black uppercase tracking-widest">
                              <AlertTriangle size={10} /> SEM LOCAL
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-3">
                          <button 
                            onClick={() => updateQuantity(item.productId, -1)}
                            className="p-1.5 bg-white/5 hover:bg-white/10 text-slate-400 rounded-lg transition-all"
                          >
                            <Minus size={14} />
                          </button>
                          <span className={`inline-block px-3 py-1 rounded-lg font-black text-lg min-w-[40px] text-center transition-all duration-300 ${
                            lastScannedId === item.productId ? 'bg-blue-600 text-white scale-110' : 'bg-blue-600/20 text-blue-400'
                          }`}>
                            {item.quantity}
                          </span>
                          <button 
                            onClick={() => updateQuantity(item.productId, 1)}
                            className="p-1.5 bg-white/5 hover:bg-white/10 text-slate-400 rounded-lg transition-all"
                          >
                            <Plus size={14} />
                          </button>
                          <button 
                            onClick={() => setEditingProduct({ id: item.productId, qty: item.quantity })}
                            className="p-1.5 bg-white/5 hover:bg-blue-600/20 text-slate-500 hover:text-blue-400 rounded-lg transition-all"
                            title="Editar quantidade"
                          >
                            <Edit3 size={14} />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => removeItem(item.productId)}
                          className="p-2 hover:bg-red-500/20 text-slate-600 hover:text-red-500 rounded-lg transition-all"
                        >
                          <X size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {scannedItems.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-20 text-center opacity-10">
                        <Scan size={48} className="mx-auto mb-4" />
                        <p className="text-xl font-black uppercase tracking-widest">Aguardando leitura...</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Qty Modal */}
      {editingItem && (
        <div className="modal-overlay p-2 md:p-4 z-[110]">
          <div className="bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-xs overflow-hidden border border-white/10 animate-in zoom-in-95 duration-300">
            <div className="p-6 space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-widest text-center">Definir Quantidade</h3>
              <input 
                type="number" 
                min="1"
                autoFocus
                className="w-full px-4 py-4 bg-black/40 border-2 border-blue-500/50 rounded-2xl outline-none font-black text-3xl text-center text-white transition-all"
                value={editingItem.qty}
                onChange={(e) => setEditingProduct({ ...editingItem, qty: parseInt(e.target.value) || 0 })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setManualQuantity(editingItem.id, editingItem.qty);
                  if (e.key === 'Escape') setEditingProduct(null);
                }}
              />
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setEditingProduct(null)}
                  className="py-3 bg-white/5 hover:bg-white/10 text-slate-400 rounded-xl font-bold text-[10px] uppercase transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => setManualQuantity(editingItem.id, editingItem.qty)}
                  className="py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-[10px] uppercase transition-all shadow-lg shadow-blue-900/20"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BarcodeBeeper;
