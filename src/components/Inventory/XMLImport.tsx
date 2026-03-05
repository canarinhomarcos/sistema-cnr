import React, { useState } from 'react';
import { useInventoryStore } from '../../store/useInventoryStore';
import { X, FileCode, Upload, CheckCircle2, AlertCircle, Info, RefreshCw } from 'lucide-react';
import { XMLParser } from 'fast-xml-parser';

interface XMLImportProps {
  onClose: () => void;
}

const XMLImport: React.FC<XMLImportProps> = ({ onClose }) => {
  const { products, addInvoice } = useInventoryStore();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus('loading');
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const xmlData = event.target?.result as string;
        const parser = new XMLParser();
        const jsonObj = parser.parse(xmlData);

        const nfe = jsonObj.nfeProc?.NFe?.infNFe || jsonObj.infNFe;
        
        if (!nfe) throw new Error('Formato de XML de NF-e inválido.');

        const number = nfe.ide?.nNF || 'XML-' + Math.floor(Math.random() * 1000);
        const date = nfe.ide?.dhEmi?.split('T')[0] || new Date().toISOString().split('T')[0];
        
        const det = Array.isArray(nfe.det) ? nfe.det : [nfe.det];
        const items = det.map((item: any) => {
          const prod = item.prod;
          const code = prod.cProd;
          const qCom = parseFloat(prod.qCom);
          const vUnCom = parseFloat(prod.vUnCom);
          const vDesc = parseFloat(prod.vDesc || 0);

          let existingProduct = products.find(p => (p.code || p.sku) === code);
          
          return {
            productId: existingProduct?.id || 'NEW-' + code,
            code,
            quantity: qCom,
            unitPrice: vUnCom,
            discount: vDesc
          };
        });

        const totalAmount = items.reduce((acc, i) => acc + (i.quantity * i.unitPrice) - i.discount, 0);

        addInvoice({
          id: Math.random().toString(36).substr(2, 9),
          number: String(number),
          issueDate: date,
          type: 'PURCHASE',
          totalAmount,
          status: 'PAID',
          items: items.map(i => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            discount: i.discount
          }))
        });

        setStatus('success');
        setMessage(`NF #${number} importada com ${items.length} itens!`);
        setTimeout(onClose, 2000);
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'Erro ao ler o XML.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="modal-overlay p-2 md:p-4">
      <div className="bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/10 animate-in zoom-in-95 duration-300 flex flex-col">
        <div className="flex justify-between items-center p-6 md:p-8 border-b border-white/5 bg-black/20 shrink-0">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="p-2 md:p-3 bg-purple-600 text-white rounded-xl md:rounded-2xl shadow-lg shadow-purple-900/20">
              <FileCode size={20} className="md:w-6 md:h-6" />
            </div>
            <div>
              <h3 className="text-lg md:text-2xl font-black text-white tracking-tight">Importar XML</h3>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[8px] md:text-[10px]">Nota Fiscal Eletrônica</p>
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

        <div className="p-6 md:p-8 space-y-6">
          {status === 'idle' && (
            <div className="space-y-6">
              <div className="bg-blue-600/10 border border-blue-500/20 p-4 rounded-2xl flex items-start gap-3">
                <Info className="text-blue-500 shrink-0" size={20} />
                <p className="text-xs font-bold text-blue-200/70 leading-relaxed">
                  Selecione o arquivo .xml da NF-e para importar os produtos e atualizar o estoque automaticamente.
                </p>
              </div>

              <label className="w-full py-12 border-4 border-dashed border-white/5 rounded-3xl text-white hover:border-purple-600 hover:bg-purple-600/10 transition-all font-black text-sm uppercase tracking-widest flex flex-col items-center justify-center gap-4 cursor-pointer group">
                <Upload className="text-slate-600 group-hover:text-purple-500 transition-colors" size={48} />
                <div className="text-center">
                  <p className="text-base font-black text-white">Selecionar XML</p>
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Arraste ou clique aqui</p>
                </div>
                <input type="file" accept=".xml" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
          )}

          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <RefreshCw size={48} className="text-purple-500 animate-spin" />
              <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Processando XML...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-6 animate-in zoom-in-95">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle2 size={48} className="text-green-500" />
              </div>
              <div className="text-center">
                <h4 className="text-xl font-black text-white mb-2">Sucesso!</h4>
                <p className="text-slate-400 font-medium text-sm">{message}</p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-6">
              <div className="p-4 bg-red-600/10 border border-red-600/20 rounded-2xl flex items-center gap-3 text-red-500">
                <AlertCircle size={24} />
                <p className="text-sm font-bold">{message}</p>
              </div>
              <button 
                onClick={() => setStatus('idle')}
                className="w-full py-4 bg-white/5 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all"
              >
                Tentar Novamente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default XMLImport;
