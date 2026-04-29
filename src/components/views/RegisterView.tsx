import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Tag, DollarSign, Camera, CheckCircle2, RefreshCw, Zap, Trash2, Percent, Fingerprint, Package, ScanLine, X, ChevronRight, Maximize2 } from "lucide-react";
import { CameraView } from "@/components/CameraView";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";

export const RegisterView = () => {
  const [pendingQueue, setPendingQueue] = useState<any[]>([]);
  const [scannerOpen, setScannerOpen] = useState<'label_ai' | 'sku_beep' | 'imei_vision' | null>(null);
  const [beepingItemIndex, setBeepingItemIndex] = useState<number | null>(null);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const { bulkAddProducts } = useStore();

  const playBeep = () => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      audio.volume = 0.3;
      audio.play();
    } catch (e) {}
  };

  const handleCapture = (img: string) => {
    const newItem = {
      id: Math.random().toString(36).substr(2, 9),
      image_url: img,
      name: 'IDENTIFICANDO...',
      sku: '',
      status: 'pending',
      sale: 0,
      cost: 0,
      imei: '',
      imei2: ''
    };
    setPendingQueue(prev => [...prev, newItem]);
    toast.success("Foto capturada!", { icon: '📸' });
  };

  const addManualItem = () => {
    const newItem = {
      id: Math.random().toString(36).substr(2, 9),
      image_url: '',
      name: '',
      sku: '',
      status: 'resolved',
      sale: 0,
      cost: 0,
      imei: '',
      imei2: ''
    };
    const newIdx = pendingQueue.length;
    setPendingQueue(prev => [...prev, newItem]);
    setEditingItemIndex(newIdx); 
  };

  const resolveAllWithAi = async () => {
    if (pendingQueue.length === 0) return;
    const toastId = toast.loading("IA Vision: Processando lote...");
    
    try {
      const { aiService } = await import('@/services/aiService');
      const updatedQueue = await Promise.all(pendingQueue.map(async (item) => {
        if (item.status !== 'pending' && item.name !== 'IDENTIFICANDO...') return item;
        try {
          const result = await aiService.analyzeProductBox(item.image_url);
          return {
            ...item,
            name: result?.name || item.name,
            sku: result?.sku || item.sku,
            imei: result?.imei1 || item.imei,
            imei2: result?.imei2 || item.imei2,
            status: 'resolved'
          };
        } catch (e) {
          return { ...item, status: 'error' };
        }
      }));

      setPendingQueue(updatedQueue);
      toast.success("Processamento concluído!", { id: toastId });
    } catch (error) {
      toast.error("Falha no motor de IA.", { id: toastId });
    }
  };

  const saveBatch = async () => {
    if (pendingQueue.length === 0) return;
    const toastId = toast.loading(`Registrando ${pendingQueue.length} itens...`);
    try {
      await bulkAddProducts(pendingQueue);
      setPendingQueue([]);
      toast.success("Lote registrado com sucesso!", { id: toastId });
    } catch (error) {
      toast.error("Erro ao salvar lote.");
    }
  };

  return (
    <div className="relative min-h-screen px-4 pb-64 pt-4">
      {/* HUD de Controle Superior */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button 
          onClick={() => setScannerOpen('label_ai')}
          className="bg-black-piano border border-primary/20 p-5 rounded-[30px] flex flex-col items-center gap-2 shadow-glow-cyan-sm active:scale-95 transition-all group"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-glow-cyan-sm">
            <Camera className="text-primary w-6 h-6" />
          </div>
          <span className="text-[10px] font-black text-white uppercase tracking-widest">IA Vision</span>
        </button>

        <button 
          onClick={addManualItem}
          className="bg-white/5 border border-white/10 p-5 rounded-[30px] flex flex-col items-center gap-2 active:scale-95 transition-all group"
        >
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus className="text-white w-6 h-6" />
          </div>
          <span className="text-[10px] font-black text-white uppercase tracking-widest">Digitar</span>
        </button>
      </div>

      {/* Grid de Itens (Previews) */}
      <AnimatePresence mode="popLayout">
        {pendingQueue.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-black text-primary uppercase tracking-widest italic">Inventory Intake Hub</span>
              </div>
              <button 
                onClick={resolveAllWithAi}
                className="flex items-center gap-2 bg-primary/10 border border-primary/30 px-4 py-2 rounded-full text-primary hover:bg-primary hover:text-black transition-all active:scale-95"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span className="text-[9px] font-black uppercase">Resolver Lote</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {pendingQueue.map((item, idx) => (
                <ProductPreviewCard 
                  key={item.id}
                  item={item}
                  onDelete={() => setPendingQueue(prev => prev.filter((_, i) => i !== idx))}
                  onEdit={() => setEditingItemIndex(idx)}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="py-32 flex flex-col items-center justify-center opacity-10">
            <Package className="w-24 h-24 mb-4" />
            <p className="text-sm font-black uppercase tracking-[0.4em]">Empty Intake</p>
          </div>
        )}
      </AnimatePresence>

      {/* Footer Finalizador */}
      {pendingQueue.length > 0 && (
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-24 left-0 right-0 z-50 p-6 pointer-events-none"
        >
          <button
            onClick={saveBatch}
            className="w-full max-w-lg mx-auto bg-primary py-5 rounded-[25px] text-black font-black uppercase tracking-[0.2em] shadow-glow-cyan active:scale-95 transition-all flex items-center justify-center gap-4 pointer-events-auto"
          >
            <CheckCircle2 className="w-6 h-6" />
            REGISTRAR LOTE
          </button>
        </motion.div>
      )}

      {/* Camera Modal */}
      <CameraView 
        open={!!scannerOpen} 
        onClose={() => setScannerOpen(null)} 
        title={
          scannerOpen === 'label_ai' ? "Vision Capture" : 
          scannerOpen === 'imei_vision' ? "Extração de Seriais" :
          "Vision Scanner"
        } 
        mode={scannerOpen === 'sku_beep' ? 'scan' : 'photo'}
        multiCapture={scannerOpen === 'label_ai'}
        capturedCount={pendingQueue.length}
        onCapture={(img) => {
          // A captura do Cadastro (Lote) sempre vai para a fila
          if (scannerOpen === 'label_ai') {
            handleCapture(img);
          } 
          // Capturas específicas do HUD são tratadas pelo próprio HUD (via emit/event ou callback injetado)
          // Mas como CameraView é global aqui, vamos disparar um evento customizado que o HUD escuta
          if (scannerOpen === 'imei_vision') {
            window.dispatchEvent(new CustomEvent('imei-captured', { detail: { img } }));
            setScannerOpen(null);
          }
        }}
        onScan={(code) => {
          if (beepingItemIndex !== null) {
            playBeep();
            const catalog = useStore.getState().catalog;
            const match = catalog.find(c => c.sku === code);
            const updates: any = { sku: code };
            if (match) updates.name = match.name;
            setPendingQueue(prev => prev.map((it, i) => i === beepingItemIndex ? { ...it, ...updates } : it));
            setBeepingItemIndex(null);
            setScannerOpen(null);
            toast.success(`SKU Bipado: ${code}`, { position: 'top-center' });
          }
        }}
        onFinalize={() => setScannerOpen(null)}
      />

      {/* HUD de Edição Detalhada (Tela Cheia) */}
      <AnimatePresence>
        {editingItemIndex !== null && (
          <ProductEditorHUD 
            item={pendingQueue[editingItemIndex]}
            onClose={() => setEditingItemIndex(null)}
            onSave={(updates: any) => {
              setPendingQueue(prev => prev.map((it, i) => i === editingItemIndex ? { ...it, ...updates } : it));
              setEditingItemIndex(null);
            }}
            onScanSKU={() => {
              setBeepingItemIndex(editingItemIndex);
              setScannerOpen('sku_beep');
            }}
            onScanIMEIs={() => {
              setScannerOpen('imei_vision');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const ProductPreviewCard = ({ item, onDelete, onEdit }: any) => {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-black-piano border border-white/10 rounded-[25px] flex flex-col items-stretch overflow-hidden relative group"
    >
      <button 
        onClick={onDelete}
        className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md text-red-500 border border-white/10 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-lg"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <div className="w-full aspect-square bg-white/5 relative overflow-hidden flex items-center justify-center">
        {item.image_url ? (
          <img src={item.image_url} alt="" className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all" />
        ) : (
          <div className="flex flex-col items-center gap-2 opacity-10">
            <Package className="w-10 h-10" />
            <span className="text-[8px] font-black uppercase">MANUAL ENTRY</span>
          </div>
        )}
        
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
          <p className="text-[9px] font-black text-white uppercase truncate tracking-tight italic">
            {item.name || "PENDENTE"}
          </p>
        </div>
      </div>

      <button 
        onClick={onEdit}
        className="w-full py-4 bg-primary/10 border-t border-white/5 flex items-center justify-center gap-2 hover:bg-primary hover:text-black transition-all group/btn"
      >
        <Plus className="w-4 h-4 group-hover/btn:rotate-90 transition-transform" />
        <span className="text-[10px] font-black uppercase tracking-widest">Detalhes</span>
      </button>
    </motion.div>
  );
};

const ProductEditorHUD = ({ item, onClose, onSave, onScanSKU, onScanIMEIs }: any) => {
  const [data, setData] = useState({ ...item });
  const [loading, setLoading] = useState(false);

  // Sincronizar dados apenas para campos que foram atualizados via Scanner externo (Ex: SKU)
  useEffect(() => {
    if (item.sku !== data.sku) {
      setData(prev => ({ ...prev, sku: item.sku, name: item.name || prev.name }));
    }
  }, [item.sku, item.name]);

  // Listener para Captura de IMEI vinda da IA Vision
  useEffect(() => {
    const handleImeiVision = async (e: any) => {
      const { img } = e.detail;
      const toastId = toast.loading("IA Vision: Extraindo seriais...");
      try {
        const { aiService } = await import('@/services/aiService');
        const result = await aiService.analyzeProductBox(img);
        if (result) {
          setData(prev => ({
            ...prev,
            name: result.name || prev.name,
            sku: result.sku || prev.sku,
            imei: result.imei1 || prev.imei,
            imei2: result.imei2 || prev.imei2
          }));
          toast.success("Dados Extraídos!", { id: toastId });
        }
      } catch (err) {
        toast.error("IA falhou na extração.", { id: toastId });
      }
    };

    window.addEventListener('imei-captured', handleImeiVision);
    return () => window.removeEventListener('imei-captured', handleImeiVision);
  }, []);

  const margin = data.cost > 0 ? ((data.sale - data.cost) / data.cost) * 100 : 0;

  const quickAiName = async () => {
    if (!item.image_url) return;
    setLoading(true);
    const toastId = toast.loading("Analisando evidência...");
    try {
      const { aiService } = await import('@/services/aiService');
      const result = await aiService.analyzeProductBox(item.image_url);
      if (result) {
        setData(prev => ({
          ...prev,
          name: result.name || prev.name,
          sku: result.sku || prev.sku,
          imei: result.imei1 || prev.imei,
          imei2: result.imei2 || prev.imei2,
        }));
        toast.success("Dados Atualizados", { id: toastId });
      }
    } catch (e) {
      toast.error("IA falhou", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col"
    >
      <div className="flex-1 overflow-y-auto pt-8 pb-32 px-4">
        <div className="max-w-md mx-auto flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-primary font-black uppercase tracking-[0.3em]">Tactical Intake</p>
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Detalhes do Item</h2>
            </div>
            <button onClick={onClose} className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="w-full aspect-video rounded-[35px] bg-white/5 border border-white/10 overflow-hidden relative group">
            {item.image_url ? (
              <img src={item.image_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-4 opacity-10">
                <Package className="w-16 h-16" />
                <p className="text-xs font-black uppercase tracking-widest">Sem Evidência Visual</p>
              </div>
            )}
            
            {item.image_url && (
              <button 
                onClick={quickAiName}
                disabled={loading}
                className="absolute bottom-6 right-6 bg-primary px-6 py-3 rounded-2xl text-black font-black uppercase text-[10px] shadow-glow-cyan flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-current" />}
                Preencher via IA
              </button>
            )}
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] text-white/30 font-black uppercase tracking-widest ml-4">Nomenclatura Operacional</label>
              <div className="bg-white/5 border border-white/10 rounded-3xl p-5 flex items-center gap-4 group focus-within:border-primary/50 transition-all">
                <input 
                  value={data.name}
                  onChange={e => setData({...data, name: e.target.value.toUpperCase()})}
                  placeholder="EX: IPHONE 15 PRO MAX 256GB"
                  className="flex-1 bg-transparent text-lg font-black text-white outline-none placeholder:text-white/10 italic uppercase tracking-[0.05em]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-white/30 font-black uppercase tracking-widest ml-4">SKU / Part Number</label>
              <div className="bg-white/5 border border-white/10 rounded-3xl p-5 flex items-center gap-4 focus-within:border-primary/50 transition-all">
                <Tag className="w-5 h-5 text-primary/40" />
                <input 
                  value={data.sku}
                  onChange={e => setData({...data, sku: e.target.value.toUpperCase()})}
                  placeholder="CÓDIGO DE BARRAS"
                  className="flex-1 bg-transparent text-sm font-black text-white outline-none font-mono tracking-[0.2em]"
                />
                <button onClick={onScanSKU} className="p-4 bg-primary/20 rounded-2xl text-primary hover:bg-primary hover:text-black transition-all shadow-glow-cyan-sm">
                  <ScanLine className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] text-white/30 font-black uppercase tracking-widest ml-4">Valor Custo</label>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-5 flex items-center gap-3">
                  <DollarSign className="w-4 h-4 text-red-500/40" />
                  <input 
                    type="number"
                    value={data.cost || ''}
                    onChange={e => setData({...data, cost: Number(e.target.value)})}
                    placeholder="0.00"
                    className="w-full bg-transparent text-lg font-black text-white outline-none"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-white/30 font-black uppercase tracking-widest ml-4">Valor Venda</label>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-5 flex items-center gap-3">
                  <DollarSign className="w-4 h-4 text-emerald-500/40" />
                  <input 
                    type="number"
                    value={data.sale || ''}
                    onChange={e => setData({...data, sale: Number(e.target.value)})}
                    placeholder="0.00"
                    className="w-full bg-transparent text-lg font-black text-white outline-none"
                  />
                </div>
              </div>
            </div>

            {data.cost > 0 && data.sale > 0 && (
              <div className={`p-6 rounded-[35px] border flex items-center justify-between shadow-2xl ${
                margin >= 30 ? 'bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/10' : 'bg-amber-500/10 border-amber-500/20 shadow-amber-500/10'
              }`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    margin >= 30 ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'
                  }`}>
                    <Percent className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Margem de Lucro</p>
                    <p className={`text-2xl font-black ${margin >= 30 ? 'text-emerald-500' : 'text-amber-500'}`}>
                      +{margin.toFixed(1)}%
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Ganho Líquido</p>
                  <p className="text-lg font-black text-white">R$ {(data.sale - data.cost).toFixed(2)}</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between px-4">
                <label className="text-[10px] text-white/30 font-black uppercase tracking-widest">Identificadores Seriais</label>
                <button 
                  onClick={onScanIMEIs}
                  className="flex items-center gap-2 text-primary/60 hover:text-primary transition-colors active:scale-95"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Raio-X IA</span>
                </button>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-5 flex items-center gap-4">
                  <Fingerprint className="w-5 h-5 text-white/20" />
                  <input 
                    value={data.imei}
                    onChange={e => setData({...data, imei: e.target.value})}
                    placeholder="IMEI 1"
                    className="flex-1 bg-transparent text-sm font-black text-white outline-none font-mono tracking-[0.2em]"
                  />
                </div>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-5 flex items-center gap-4">
                  <Fingerprint className="w-5 h-5 text-white/20" />
                  <input 
                    value={data.imei2}
                    onChange={e => setData({...data, imei2: e.target.value})}
                    placeholder="IMEI 2"
                    className="flex-1 bg-transparent text-sm font-black text-white outline-none font-mono tracking-[0.2em]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-black/90 border-t border-white/10 z-[110]">
        <button 
          onClick={() => onSave(data)}
          className="w-full max-w-md mx-auto bg-primary py-4 rounded-[20px] text-black font-black uppercase tracking-[0.2em] shadow-glow-cyan active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-5 h-5" />
          Confirmar Operação
        </button>
      </div>
    </motion.div>
  );
};
