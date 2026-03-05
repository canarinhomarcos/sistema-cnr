import React, { useState, useEffect, useRef } from 'react';
import { useInventoryStore } from '../../store/useInventoryStore';
import { X, Scan, Search, CheckCircle2, AlertCircle, Package, Camera, RefreshCw, ArrowDownLeft } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface BarcodeScannerProps {
  onClose: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onClose }) => {
  const { products, addTransaction } = useInventoryStore();
  const [barcode, setBarcode] = useState('');
  const [foundProduct, setFoundProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'scanning'>('scanning');
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const startScanner = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;
        
        const config = { 
          fps: 15, 
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
            const qrboxSize = Math.floor(minEdgeSize * 0.7);
            return { width: qrboxSize, height: qrboxSize };
          },
          aspectRatio: 1.0
        };
        
        await html5QrCode.start(
          { facingMode: "environment" }, 
          config, 
          (decodedText) => {
            setBarcode(decodedText);
            const product = products.find(p => p.sku === decodedText);
            if (product) {
              setFoundProduct(product);
              setStatus('idle');
              if (window.navigator.vibrate) window.navigator.vibrate(100);
            } else {
              setFoundProduct(null);
              setStatus('error');
            }
          },
          () => {}
        );
      } catch (err) {
        console.error("Erro ao iniciar scanner:", err);
        setStatus('error');
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(e => console.error("Erro ao parar scanner:", e));
      }
    };
  }, [products]);

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find(p => p.sku === barcode);
    if (product) {
      setFoundProduct(product);
      setStatus('idle');
    } else {
      setFoundProduct(null);
      setStatus('error');
    }
  };

  const handleConfirm = async () => {
    if (!foundProduct) return;
    await addTransaction({
      productId: foundProduct.id,
      type: 'OUT',
      quantity,
      date: new Date().toISOString(),
      description: 'Saída via Scanner',
    });
    setStatus('success');
    setTimeout(() => {
      setFoundProduct(null);
      setBarcode('');
      setQuantity(1);
      setStatus('scanning');
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col animate-in fade-in duration-300 safe-area-top safe-area-bottom">
      {/* Header do Scanner */}
      <div className="flex justify-between items-center p-4 bg-black/40 backdrop-blur-md border-b border-white/10 z-20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 text-white rounded-xl">
            <Scan size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-tight">Leitor de QR Code</h3>
            <p className="text-white/50 font-bold uppercase tracking-widest text-[8px]">Aponte para a etiqueta</p>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="p-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all"
        >
          <X size={24} />
        </button>
      </div>

      {/* Área da Câmera */}
      <div className="flex-1 relative bg-black flex flex-col items-center justify-center overflow-hidden">
        <div id="reader" className="w-full h-full"></div>
        
        {/* Overlay de Mira */}
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-10">
          <div className="w-64 h-64 border-2 border-blue-500/30 rounded-3xl relative">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-2xl"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-2xl"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-2xl"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-2xl"></div>
            <div className="absolute top-0 left-0 w-full h-0.5 bg-red-500/50 animate-scan-line"></div>
          </div>
          <p className="mt-6 text-white/30 font-black uppercase tracking-[0.3em] text-[8px]">Escaneando...</p>
        </div>

        {/* Feedback de Status */}
        {(status === 'error' || status === 'success') && (
          <div className={`absolute top-24 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl flex items-center gap-3 shadow-2xl z-30 animate-in slide-in-from-top-4 ${
            status === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {status === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span className="font-black text-xs uppercase tracking-widest">
              {status === 'success' ? 'Saída Registrada!' : 'Código Inválido'}
            </span>
          </div>
        )}
      </div>

      {/* Painel Inferior */}
      <div className="bg-slate-900 border-t border-white/10 p-6 space-y-6 z-20">
        {!foundProduct ? (
          <form onSubmit={handleManualSearch} className="space-y-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <input 
                type="text" 
                placeholder="Ou digite o SKU..."
                className="w-full pl-12 pr-4 py-4 bg-black/40 border-2 border-white/5 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-black text-lg text-center transition-all text-white"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
              />
            </div>
          </form>
        ) : (
          <div className="space-y-5 animate-in zoom-in-95">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/5 rounded-xl overflow-hidden flex items-center justify-center border border-white/10 shrink-0">
                {foundProduct.imageUrl ? (
                  <img src={foundProduct.imageUrl} alt={foundProduct.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="text-blue-500" size={20} />
                )}
              </div>
              <div className="min-w-0">
                <h4 className="text-base font-black text-white truncate">{foundProduct.name}</h4>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-black text-blue-500 uppercase">{foundProduct.sku}</span>
                  <span className="text-[10px] text-slate-400 font-bold">Estoque: {foundProduct.quantity}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 space-y-1">
                <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest ml-2">Quantidade</label>
                <input 
                  type="number" 
                  min="1"
                  max={foundProduct.quantity}
                  className="w-full px-4 py-3.5 bg-black/40 border-2 border-white/5 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-black text-xl text-center transition-all text-white"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                />
              </div>
              <button 
                onClick={handleConfirm}
                className="flex-[2] h-[60px] bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
              >
                <ArrowDownLeft size={20} />
                Confirmar Saída
              </button>
            </div>
            <button 
              onClick={() => setFoundProduct(null)}
              className="w-full py-2 text-slate-500 font-bold uppercase text-[8px] tracking-[0.2em] hover:text-white transition-colors"
            >
              Cancelar e Voltar ao Scanner
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BarcodeScanner;
