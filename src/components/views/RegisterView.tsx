import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, Tag, DollarSign, Camera, CheckCircle2, RefreshCw, Zap, Trash2, Percent, Fingerprint, Package, ScanLine, X, ChevronRight, Maximize2, Search, BookOpen } from "lucide-react";
import { CatalogAuditHUD } from "@/components/CatalogAuditHUD";
import { SearchByNameHUD } from "@/components/SearchByNameHUD";
import { CameraView } from "@/components/CameraView";
import { toast } from "sonner";
import { useStore, CatalogItem } from "@/store/useStore";
import { aiService } from "@/services/aiService";

export const RegisterView = () => {
  const [pendingQueue, setPendingQueue] = useState<any[]>([]);
  const [scannerOpen, setScannerOpen] = useState<'label_ai' | 'sku_beep' | 'imei_vision' | 'offline_scan' | 'audit_scan' | 'audit_photo' | 'manual_photo' | null>(null);
  const [beepingItemIndex, setBeepingItemIndex] = useState<number | null>(null);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [auditOpen, setAuditOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [auditSku, setAuditSku] = useState("");
  const [auditPhotoUrl, setAuditPhotoUrl] = useState<string | null>(null);
  const { bulkAddProducts, catalog } = useStore();

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
      imei2: '',
      quantity: 1
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
      imei2: '',
      quantity: 1
    };
    const newIdx = pendingQueue.length;
    setPendingQueue(prev => [...prev, newItem]);
    setEditingItemIndex(newIdx); 
  };

  const [batchAbortController, setBatchAbortController] = useState<AbortController | null>(null);

  const resolveAllWithAi = async () => {
    if (pendingQueue.length === 0) return;
    const controller = new AbortController();
    setBatchAbortController(controller);
    const toastId = toast.loading("IA Vision: Processando lote...", {
      action: {
        label: 'Parar',
        onClick: () => {
          controller.abort();
          setBatchAbortController(null);
          toast.error("Processamento de lote interrompido.");
        }
      }
    });
    
    try {
      const updatedQueue = await Promise.all(pendingQueue.map(async (item) => {
        if (item.status !== 'pending' && item.name !== 'IDENTIFICANDO...') return item;
        try {
          const result = await aiService.analyzeProductBox(item.image_url, controller.signal);
          return {
            ...item,
            name: result?.name || item.name,
            sku: result?.sku || item.sku,
            imei: result?.imei1 || item.imei,
            imei2: result?.imei2 || item.imei2,
            status: 'resolved'
          };
        } catch (e: any) {
          if (e.name === 'AbortError') throw e;
          return { ...item, status: 'error' };
        }
      }));

      setPendingQueue(updatedQueue);
      toast.success("Processamento concluído!", { id: toastId });
    } catch (error: any) {
      if (error.name === 'AbortError') {
        toast.dismiss(toastId);
      } else {
        toast.error("Falha no motor de IA.", { id: toastId });
      }
    } finally {
      setBatchAbortController(null);
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
      {/* Grid de Controle Tático - 2x2 */}
      <div className="grid grid-cols-2 gap-3 mb-8">
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
          onClick={() => setScannerOpen('offline_scan')}
          className="bg-black-piano border border-white/10 p-5 rounded-[30px] flex flex-col items-center gap-2 active:scale-95 transition-all group hover:border-white/30"
        >
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <ScanLine className="text-white w-6 h-6" />
          </div>
          <span className="text-[10px] font-black text-white uppercase tracking-widest">Offline Vision</span>
        </button>

        <button 
          onClick={() => setAuditOpen(true)}
          className="bg-black-piano border border-white/10 p-5 rounded-[30px] flex flex-col items-center gap-2 active:scale-95 transition-all group hover:border-white/30"
        >
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
            <BookOpen className="text-white/60 w-6 h-6" />
          </div>
          <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Auditoria</span>
        </button>

        <button 
          onClick={() => setSearchOpen(true)}
          className="bg-black-piano border border-white/10 p-5 rounded-[30px] flex flex-col items-center gap-2 active:scale-95 transition-all group hover:border-white/30"
        >
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Search className="text-white/60 w-6 h-6" />
          </div>
          <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Busca Nome</span>
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
          scannerOpen === 'offline_scan' ? "Offline Vision (Catalog)" :
          scannerOpen === 'audit_scan' ? "Auditoria de SKU" :
          scannerOpen === 'audit_photo' ? "Foto de Catálogo" :
          scannerOpen === 'manual_photo' ? "Captura de Evidência" :
          "Vision Scanner"
        } 
        mode={(scannerOpen === 'sku_beep' || scannerOpen === 'offline_scan' || scannerOpen === 'audit_scan') ? 'scan' : 'photo'}
        multiCapture={scannerOpen === 'label_ai'}
        multiScan={scannerOpen === 'offline_scan'}
        capturedCount={pendingQueue.length}
        onCapture={(img) => {
          // A captura do Cadastro (Lote) sempre vai para a fila
          if (scannerOpen === 'label_ai') {
            handleCapture(img);
          } else if (scannerOpen === 'audit_photo') {
            setAuditPhotoUrl(img);
            setScannerOpen(null);

          } else if (scannerOpen === 'manual_photo' && editingItemIndex !== null) {
            setPendingQueue(prev => prev.map((it, i) => i === editingItemIndex ? { ...it, image_url: img } : it));
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
          } else if (scannerOpen === 'offline_scan') {
            playBeep();
            const { catalog, products } = useStore.getState();
            const cleanCode = code.trim();
            
            // Busca tática: Catálogo > Histórico de Produtos
            const fromCatalog = catalog.find(c => c.sku.trim() === cleanCode);
            const fromHistory = products.find(p => p.sku?.trim() === cleanCode);
            
            const newItem = {
              id: Math.random().toString(36).substr(2, 9),
              image_url: fromCatalog?.image_url || fromHistory?.image_url || '',
              name: fromCatalog?.name || fromHistory?.name || `NOVO SKU: ${code}`,
              sku: code,
              status: 'resolved',
              sale: fromCatalog?.sale ?? fromHistory?.sale ?? 0,
              cost: fromCatalog?.cost ?? fromHistory?.cost ?? 0,
              imei: '',
              imei2: '',
              quantity: 1
            };
            
            setPendingQueue(prev => [...prev, newItem]);
            toast.success(`Adicionado via Catálogo: ${newItem.name}`, { 
              position: 'top-center',
              icon: '📦'
            });
          } else if (scannerOpen === 'audit_scan') {
            playBeep();
            setAuditSku(code);
            setScannerOpen(null);
            setAuditOpen(true);
            toast.success(`SKU para Auditoria: ${code}`, { position: 'top-center' });
          }
        }}
        onFinalize={() => setScannerOpen(null)}
      />

      {/* HUD de Edição Detalhada (Tela Cheia) */}
      <AnimatePresence>
        {editingItemIndex !== null && (
          <ManualEntryModal 
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
            onScanPhoto={() => {
              setScannerOpen('manual_photo');
            }}
          />
        )}
      </AnimatePresence>
      <CatalogAuditHUD 
        open={auditOpen} 
        onClose={() => {
          setAuditOpen(false);
          setAuditPhotoUrl(null); // Limpar ao fechar
        }} 
        initialSku={auditSku}
        onScanRequest={() => setScannerOpen('audit_scan')}
        onPhotoRequest={() => setScannerOpen('audit_photo')}
        capturedPhoto={auditPhotoUrl}
      />
      <SearchByNameHUD
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={(item) => {
          setAuditSku(item.sku);
          setAuditOpen(true);
        }}
      />
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
        
        {item.quantity > 1 && (
          <div className="absolute top-2 left-2 z-10 bg-primary text-black font-black text-[10px] px-2 py-0.5 rounded-full shadow-glow-cyan animate-pulse">
            {item.quantity}X
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

interface ManualEntryModalProps {
  item: any;
  onSave: (data: any) => void;
  onClose: () => void;
  onScanSKU: () => void;
  onScanIMEIs: () => void;
  onScanPhoto: () => void;
}

const ManualEntryModal = ({ item, onSave, onClose, onScanSKU, onScanIMEIs, onScanPhoto }: ManualEntryModalProps) => {
  const { catalog, products } = useStore();
  const [data, setData] = useState(item);
  const [loading, setLoading] = useState(false);

  // AUTO-FILL LOGIC: Listen to SKU changes
  useEffect(() => {
    if (data.sku && data.sku.length > 3) {
      const existing = products.find(p => p.sku === data.sku || p.imei === data.sku);
      const inCatalog = catalog.find(c => c.sku === data.sku);
      
      if (existing || inCatalog) {
        const foundName = existing?.name || inCatalog?.name;
        if (foundName && !data.name) {
          setData(prev => ({ ...prev, name: foundName }));
          toast.success(`Produto Identificado: ${foundName}`, {
            description: "Dados recuperados do catálogo."
          });
        }
      }
    }
  }, [data.sku, products, catalog, data.name]);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const lastSkuRef = useRef(item.sku);
  const lastItemNameRef = useRef(item.name);
  const lastPhotoRef = useRef(item.image_url);

  // Sincronização Cirúrgica via Referência:
  // Detecta se houve uma mudança REAL vinda do componente pai (ex: Bip Scanner)
  useEffect(() => {
    const skuChangedExternally = item.sku !== lastSkuRef.current;
    const photoChangedExternally = item.image_url !== lastPhotoRef.current;
    const isNewNameReal = item.name && item.name !== 'Identificando...' && item.name !== lastItemNameRef.current;

    if (skuChangedExternally || isNewNameReal || photoChangedExternally) {
      setData(prev => ({ 
        ...prev, 
        sku: skuChangedExternally ? item.sku : prev.sku,
        name: isNewNameReal ? item.name : prev.name,
        image_url: photoChangedExternally ? item.image_url : prev.image_url
      }));
      
      // Atualiza as refs para o próximo ciclo
      lastSkuRef.current = item.sku;
      lastItemNameRef.current = item.name;
      lastPhotoRef.current = item.image_url;
    }
  }, [item.sku, item.name, item.image_url]);

  const stopAi = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (abortController) {
      console.log("🛑 Interrompendo Cérebro Neural...");
      try {
        abortController.abort();
      } catch (err) {
        console.error("Erro ao abortar:", err);
      }
      setAbortController(null);
      setLoading(false);
      toast.error("Operação interrompida", { icon: '🛑' });
    }
  };

  // Listener para Captura de IMEI vinda da IA Vision
  useEffect(() => {
    const handleImeiVision = async (e: any) => {
      if (loading) return;
      const { img } = e.detail;
      const controller = new AbortController();
      setAbortController(controller);
      setLoading(true);
      const toastId = toast.loading("IA Vision: Extraindo seriais...");
      
      // Timeout de segurança de 30s
      const timeoutId = setTimeout(() => {
        if (loading) {
          controller.abort();
          toast.error("IA demorou demais para responder.");
        }
      }, 30000);

      try {
        const result = await aiService.analyzeProductBox(img, controller.signal);
        if (result) {
          setData(prev => ({
            ...prev,
            // Apenas IMEIs são atualizados no modo Raio-X para não sobrescrever SKU correto
            imei: result.imei1 || prev.imei,
            imei2: result.imei2 || prev.imei2
          }));
          toast.success("IMEIs Extraídos!", { id: toastId });
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        toast.error("IA falhou na extração.", { id: toastId });
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
        setAbortController(null);
        toast.dismiss(toastId);
      }
    };

    window.addEventListener('imei-captured', handleImeiVision);
    return () => window.removeEventListener('imei-captured', handleImeiVision);
  }, []);

  const margin = data.cost > 0 ? ((data.sale - data.cost) / data.cost) * 100 : 0;

  const quickAiName = async () => {
    if (!item.image_url || loading) return;
    const controller = new AbortController();
    setAbortController(controller);
    setLoading(true);
    const toastId = toast.loading("Analisando evidência...");

    const timeoutId = setTimeout(() => {
      if (loading) {
        controller.abort();
        toast.error("Aguardando IA tempo demais...");
      }
    }, 30000);

    try {
      const result = await aiService.analyzeProductBox(item.image_url, controller.signal);
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
    } catch (e: any) {
      if (e.name === 'AbortError') return;
      toast.error("IA falhou", { id: toastId });
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
      setAbortController(null);
      toast.dismiss(toastId);
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

          <div 
            onClick={onScanPhoto}
            className="w-full aspect-video rounded-[35px] bg-white/5 border border-white/10 overflow-hidden relative group cursor-pointer hover:border-primary/50 transition-all"
          >
            {data.image_url ? (
              <img src={data.image_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-4 opacity-10">
                <Package className="w-16 h-16" />
                <p className="text-xs font-black uppercase tracking-widest">Sem Evidência Visual</p>
              </div>
            )}
            
            {data.image_url && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  loading ? stopAi() : quickAiName();
                }}
                className={`absolute bottom-6 right-6 px-6 py-3 rounded-2xl font-black uppercase text-[10px] shadow-glow-cyan flex items-center gap-2 active:scale-95 transition-all ${
                  loading ? 'bg-red-500 text-white shadow-red-500/50' : 'bg-primary text-black'
                }`}
              >
                {loading ? <X className="w-4 h-4" /> : <Zap className="w-4 h-4 fill-current" />}
                {loading ? "PARAR IA" : "Preencher via IA"}
              </button>
            )}
            
            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-[8px] font-black text-white uppercase">Clique para trocar foto</p>
            </div>
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
                    onChange={e => {
                      const val = e.target.value;
                      setData({...data, cost: val === '' ? 0 : Number(val)});
                    }}
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
                    onChange={e => {
                      const val = e.target.value;
                      setData({...data, sale: val === '' ? 0 : Number(val)});
                    }}
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

            {/* SELETOR DE QUANTIDADE TÁTICO */}
            <div className="space-y-4 pt-4 border-t border-white/5">
              <label className="text-[10px] text-white/30 font-black uppercase tracking-widest ml-4">Volume do Lote</label>
              <div className="flex items-center justify-center gap-8 bg-white/5 border border-white/10 rounded-[35px] p-4">
                <button 
                  onClick={() => setData(prev => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }))}
                  className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 hover:bg-white/10 hover:text-white transition-all active:scale-90"
                >
                  <Minus className="w-6 h-6" />
                </button>
                
                <div className="flex flex-col items-center">
                  <span className="text-4xl font-black text-primary drop-shadow-glow-cyan">{data.quantity}</span>
                  <span className="text-[8px] font-black uppercase tracking-widest text-white/20 mt-1">UNIDADES</span>
                </div>

                <button 
                  onClick={() => setData(prev => ({ ...prev, quantity: prev.quantity + 1 }))}
                  className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary hover:bg-primary hover:text-black transition-all active:scale-90 shadow-glow-cyan-sm"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>
              <p className="text-[9px] font-black text-center text-white/20 uppercase tracking-[0.2em]">
                {data.quantity > 1 ? `Lote de ${data.quantity} unidades (Apenas a primeira terá IMEI)` : "Unidade única"}
              </p>
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
