import React, { useState, useEffect } from 'react';
import { useInventoryStore } from '../../store/useInventoryStore';
import { X, Image as ImageIcon, Search, Globe, RefreshCw, AlertCircle, CheckCircle2, SkipForward, Package } from 'lucide-react';

interface BulkImageAssistantProps {
  onClose: () => void;
}

const BulkImageAssistant: React.FC<BulkImageAssistantProps> = ({ onClose }) => {
  const { products, updateProduct, searchImages } = useInventoryStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const productsWithoutImage = products.filter(p => !p.imageUrl);
  const currentProduct = productsWithoutImage[currentIndex];

  useEffect(() => {
    if (currentProduct) {
      handleSearch();
    }
  }, [currentIndex, currentProduct]);

  const handleSearch = async () => {
    if (!currentProduct) return;
    setIsSearching(true);
    setSearchError('');
    try {
      const results = await searchImages(currentProduct.name);
      setSearchResults(results);
    } catch (err) {
      setSearchError('Erro ao buscar imagens.');
    } finally {
      setIsSearching(false);
    }
  };

  const selectImage = async (url: string) => {
    if (!currentProduct) return;
    await updateProduct(currentProduct.id, { imageUrl: url });
    if (currentIndex < productsWithoutImage.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handleSkip = () => {
    if (currentIndex < productsWithoutImage.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onClose();
    }
  };

  if (!currentProduct) {
    return (
      <div className="modal-overlay p-4">
        <div className="bg-slate-900 rounded-[2rem] p-10 text-center space-y-6 max-w-md border border-white/10">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={40} className="text-green-500" />
          </div>
          <h3 className="text-2xl font-black text-white">Tudo Pronto!</h3>
          <p className="text-slate-400">Todos os seus produtos já possuem fotos cadastradas.</p>
          <button onClick={onClose} className="w-full py-4 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest text-xs">Fechar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay p-2 md:p-4">
      <div className="bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden border border-white/10 animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 md:p-8 border-b border-white/5 bg-black/20 shrink-0">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="p-2 md:p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-900/20">
              <ImageIcon size={20} className="md:w-6 md:h-6" />
            </div>
            <div>
              <h3 className="text-lg md:text-2xl font-black text-white tracking-tight">Assistente de Fotos</h3>
              <p className="text-blue-400 font-bold uppercase tracking-widest text-[8px] md:text-[10px]">
                {productsWithoutImage.length - currentIndex} itens restantes
              </p>
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

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Lado Esquerdo: Produto Atual */}
          <div className="w-full md:w-80 p-6 md:p-8 border-b md:border-b-0 md:border-r border-white/5 bg-black/20 space-y-4 md:space-y-6 shrink-0">
            <div className="space-y-1.5">
              <span className="px-2 py-0.5 bg-blue-600/20 text-blue-400 rounded-md font-mono font-black text-[10px] uppercase border border-blue-500/20">
                {currentProduct.sku}
              </span>
              <h4 className="text-xl md:text-2xl font-black text-white leading-tight truncate md:whitespace-normal">{currentProduct.name}</h4>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">{currentProduct.category}</p>
            </div>

            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-3">
              <div className="flex items-center justify-between text-[8px] font-black text-slate-500 uppercase tracking-widest">
                <span>Progresso</span>
                <span>{currentIndex + 1} / {productsWithoutImage.length}</span>
              </div>
              <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-500" 
                  style={{ width: `${((currentIndex + 1) / productsWithoutImage.length) * 100}%` }}
                />
              </div>
            </div>

            <button 
              onClick={handleSkip}
              className="w-full py-3 border-2 border-white/5 text-slate-400 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-white/5 transition-all flex items-center justify-center gap-2"
            >
              <SkipForward size={14} />
              Pular este item
            </button>
          </div>

          {/* Lado Direito: Resultados da Busca */}
          <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar space-y-6">
            <div className="flex items-center justify-between">
              <h5 className="text-white font-black uppercase tracking-widest text-xs flex items-center gap-2">
                <Globe size={16} className="text-blue-500" />
                Sugestões da Internet
              </h5>
              {isSearching && <RefreshCw size={18} className="text-blue-500 animate-spin" />}
            </div>

            {searchError ? (
              <div className="p-8 bg-red-600/10 border-2 border-red-600/20 rounded-3xl text-center space-y-4">
                <AlertCircle size={32} className="text-red-500 mx-auto" />
                <p className="text-red-400 font-black uppercase text-[10px]">{searchError}</p>
                <p className="text-slate-500 text-[10px] font-medium">Tente buscar manualmente no cadastro do produto.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {searchResults.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => selectImage(img.url)}
                    className="group relative aspect-square bg-black/40 rounded-2xl overflow-hidden border-2 border-white/5 hover:border-blue-500 transition-all shadow-lg"
                  >
                    <img src={img.thumb} alt="Sugestão" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/20 transition-colors flex items-center justify-center">
                      <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-all">
                        <CheckCircle2 size={24} />
                      </div>
                    </div>
                  </button>
                ))}
                {searchResults.length === 0 && !isSearching && (
                  <div className="col-span-full py-12 text-center opacity-20">
                    <ImageIcon size={48} className="mx-auto mb-2" />
                    <p className="text-sm font-black uppercase tracking-widest">Nenhuma imagem encontrada</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkImageAssistant;
