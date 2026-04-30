import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Camera, 
  Upload, 
  Zap, 
  RotateCcw,
  Eye,
  FileText,
  Boxes,
  Truck,
  ChevronRight,
  Info,
  Image as ImageIcon
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { aiService } from "@/services/aiService";
import { toast } from "sonner";
import { AuditHub } from "../AuditHub";
import { CameraView } from "../CameraView";

export const AIVisionAuditView = () => {
  const [auditMode, setAuditMode] = useState<'stock' | 'invoice' | null>(null);
  const [invoiceImage, setInvoiceImage] = useState<string | null>(null);
  const [expectedData, setExpectedData] = useState<{ name: string; qty: number }[]>([]);
  const [identifiedData, setIdentifiedData] = useState<{ name: string; qty: number }[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [showHub, setShowHub] = useState(false);
  const [loading, setLoading] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  
  const [skipInvoice, setSkipInvoice] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [scannedSKUs, setScannedSKUs] = useState<string[]>([]);
  const scannedSKUsRef = useRef<Set<string>>(new Set());
  const [inputMode, setInputMode] = useState<'photo' | 'scan'>('scan'); // Default para Bipe
  const [isManualMode, setIsManualMode] = useState(false);
  
  const { products } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const stopAi = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setLoading(false);
      toast.error("Análise interrompida.");
    }
  };

  const handlePhotosUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const controller = new AbortController();
      setAbortController(controller);
      setLoading(true);
      setProcessingProgress(0);
      const allIdentified: any[] = [];

      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });

          setProcessingProgress(Math.round(((i + 1) / files.length) * 100));
          
          const type = auditMode === 'stock' ? 'stock' : 'invoice';
          const result = await aiService.auditMultiModal(
            { data: base64.split(',')[1], mimeType: file.type }, 
            type, 
            expectedData,
            controller.signal
          );

          try {
            const jsonMatch = result.text.match(/\{.*\}/s);
            if (jsonMatch) {
              const cleanedJson = jsonMatch[0].replace(/[\u0000-\u001F\u007F-\u009F]/g, ""); // Remove control characters
              const parsed = JSON.parse(cleanedJson);
              if (parsed.identified) {
                allIdentified.push(...parsed.identified);
              }
            }
          } catch (parseErr) {
            console.error("Erro ao analisar resposta da IA para foto:", i, parseErr);
          }
        }

        setIdentifiedData(allIdentified);
        setShowHub(true);
        toast.success(`${files.length} fotos processadas com sucesso!`);
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.error(err);
        toast.error("Erro ao processar lote de imagens.");
      } finally {
        setLoading(false);
        setProcessingProgress(0);
        setAbortController(null);
      }
    }
  };

  const startScanner = () => {
    if (auditMode === 'stock') {
      const currentStockMap = products
        .filter(p => p.status === 'in_stock')
        .reduce((acc: Record<string, { name: string; qty: number; sku: string | null }>, p) => {
          const key = p.sku || p.name;
          if (!acc[key]) {
            acc[key] = { name: p.name, qty: 0, sku: p.sku || null };
          }
          acc[key].qty += 1;
          return acc;
        }, {});
      const currentStock = Object.values(currentStockMap);
      setExpectedData(currentStock as any);
    }
    setCameraOpen(true);
  };

  const handlePhotoCapture = (dataUrl: string) => {
    setCapturedPhotos(prev => [...prev, dataUrl]);
    toast.success(`Foto ${capturedPhotos.length + 1} capturada!`, {
      duration: 1000,
      position: 'top-center'
    });
  };

  const handleSKUScan = (code: string) => {
    // Agora permitimos múltiplos bipes para incrementar quantidade, mas com alerta de limite se exagerar
    const currentCount = Array.from(scannedSKUsRef.current).filter(c => c === code).length;
    
    if (currentCount >= 3) {
      toast.error("Limite de 3 bipes por item! Ajuste no Hub se necessário.");
      return;
    }

    scannedSKUsRef.current.add(code);
    setScannedSKUs(prev => [...prev, code]);
    
    // Feedback sonoro tático
    toast.success(`Bipe: ${code}`, {
      duration: 800,
      position: 'top-center'
    });
    
    // Feedback sonoro (Opcional, mas melhora muito a UX)
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      audio.volume = 0.3;
      audio.play();
    } catch (e) {}
  };

  const handleProcessAudit = async () => {
    if (capturedPhotos.length === 0 && scannedSKUs.length === 0) return;
    
    if (isManualMode) {
      // MODO MANUAL: Tentar resolver localmente antes de pedir para digitar
      const manualItems = scannedSKUs.length > 0 
        ? Object.entries(scannedSKUs.reduce((acc, sku) => {
            acc[sku] = (acc[sku] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)).map(([sku, qty]) => {
            const existing = products.find(p => p.sku === sku);
            return {
              name: existing ? existing.name.toUpperCase() : `DIGITAR NOME (${sku})`,
              sku,
              qty,
              isManual: !existing
            };
          })
        : capturedPhotos.map((_, i) => ({ name: `FOTO ${i+1} (EDITAR)`, qty: 1, isManual: true }));
      
      setIdentifiedData(manualItems);
      setShowHub(true);
      setCameraOpen(false);
      return;
    }
    
    const controller = new AbortController();
    setAbortController(controller);
    setLoading(true);
    setCameraOpen(false);
    setProcessingProgress(0);
    let allIdentified: any[] = [];

    try {
      // 1. Processar FOTOS (se houver)
      if (capturedPhotos.length > 0) {
        for (let i = 0; i < capturedPhotos.length; i++) {
          const photo = capturedPhotos[i];
          setProcessingProgress(Math.round(((i + 1) / (capturedPhotos.length + (scannedSKUs.length > 0 ? 1 : 0))) * 100));
          
          const type = auditMode === 'stock' ? 'stock' : 'invoice';
          const result = await aiService.auditMultiModal(
            { data: photo.split(',')[1], mimeType: 'image/jpeg' }, 
            type, 
            expectedData,
            controller.signal
          );

          const jsonMatch = result.text.match(/\{.*\}/s);
          if (jsonMatch) {
            const cleanedJson = jsonMatch[0].replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
            const parsed = JSON.parse(cleanedJson);
            if (parsed.identified) {
              const enriched = parsed.identified.map((item: any) => {
                const existingProduct = products.find(p => p.sku === item.sku);
                return {
                  ...item,
                  name: existingProduct ? existingProduct.name.toUpperCase() : item.name.toUpperCase()
                };
              });
              allIdentified.push(...enriched);
            }
          }
        }
      }

      // 2. Processar BIPES (se houver) - Com Inteligência Local & Catálogo
      if (scannedSKUs.length > 0) {
        setProcessingProgress(90);
        
        const { catalog } = useStore.getState();
        const localItems: any[] = [];
        const unknownSKUs: string[] = [];

        // Agrupar bipes por SKU para contar quantidade
        const skuCounts = scannedSKUs.reduce((acc, sku) => {
          acc[sku] = (acc[sku] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        Object.entries(skuCounts).forEach(([sku, qty]) => {
          const existingProduct = products.find(p => p.sku === sku);
          const catalogItem = catalog.find(c => c.sku === sku);
          
          if (existingProduct || catalogItem) {
            localItems.push({
              name: (existingProduct?.name || catalogItem?.name || '').toUpperCase(),
              sku,
              qty
            });
          } else {
            unknownSKUs.push(sku);
          }
        });

        // Somente enviar para a IA o que não temos no banco local nem no catálogo
        if (unknownSKUs.length > 0) {
          const resolution = await aiService.resolveSKUs(unknownSKUs, controller.signal);
          if (resolution.identified) {
            const enriched = resolution.identified.map((item: any) => {
              // Aprender SKU novo no catálogo
              useStore.getState().addToCatalog({ sku: item.sku, name: item.name });
              
              return {
                ...item,
                qty: skuCounts[item.sku] || 1,
                name: item.name.toUpperCase()
              };
            });
            allIdentified.push(...enriched);
          }
        }

        allIdentified.push(...localItems);
      }

      setIdentifiedData(allIdentified);
      setShowHub(true);
      setCapturedPhotos([]);
      setScannedSKUs([]);
      scannedSKUsRef.current.clear();
      toast.success(`Auditoria concluída com sucesso!`);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      toast.error("Erro ao processar auditoria.");
      console.error(err);
    } finally {
      setLoading(false);
      setAbortController(null);
    }
  };

  // Removido AuditVideoScanner em favor do CameraView (Photo)

  if (showHub) {
    return (
      <AuditHub 
        expected={expectedData} 
        identified={identifiedData} 
        type={auditMode === 'stock' ? 'stock' : 'invoice'}
        onClose={() => setShowHub(false)}
      />
    );
  }

  return (
    <div className="space-y-6 px-3 pb-32">
      {/* Header Tático */}
      <section className="bg-black-piano neon-blue-border relative overflow-hidden rounded-3xl p-4 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 shadow-glow-cyan">
            <Eye className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="font-mono-tactical text-[8px] font-black uppercase tracking-[0.2em] text-primary/70">
              AUDITORIA VISUAL
            </div>
            <div className="text-lg font-black text-white">AIVision Audit</div>
          </div>
        </div>
      </section>

      {/* Header Tático */}
      <div className="flex flex-col gap-1 mb-8 sticky top-0 bg-black-piano/95 backdrop-blur-2xl z-20 py-4 -mx-3 px-3 rounded-b-3xl border-b border-primary/20 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="h-1 w-8 bg-primary rounded-full" />
          <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Neural Engine v6.3</span>
        </div>
        <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic">Vision Audit</h1>
        <p className="text-xs text-white/40 font-mono-tactical uppercase">Hibrid AI & SKU-Scan Control</p>
      </div>

      {!auditMode ? (
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 gap-4"
          >
            {/* Card: Conferência de Recebimento */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setAuditMode('invoice')}
              className="bg-black-piano border border-white/10 rounded-3xl p-6 flex items-center gap-4 group transition-all text-left relative overflow-hidden"
            >
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:shadow-glow-cyan transition-all shrink-0">
                <Truck className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black text-white uppercase tracking-tight group-hover:text-primary transition-colors">Recebimento</h3>
                <p className="text-[9px] text-white/40 font-mono-tactical uppercase mt-0.5">Nota Fiscal vs Chão</p>
              </div>
              <ChevronRight className="h-5 w-5 text-white/20 group-hover:text-primary transition-all" />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setAuditMode('stock')}
              className="bg-black-piano border border-white/10 rounded-3xl p-6 flex items-center gap-4 group transition-all text-left relative overflow-hidden"
            >
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:shadow-glow-cyan transition-all shrink-0">
                <Boxes className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black text-white uppercase tracking-tight group-hover:text-primary transition-colors">Estoque</h3>
                <p className="text-[9px] text-white/40 font-mono-tactical uppercase mt-0.5">Contagem Geral</p>
              </div>
              <ChevronRight className="h-5 w-5 text-white/20 group-hover:text-primary transition-all" />
            </motion.button>
          </motion.div>

          <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 flex items-start gap-4">
            <Info className="h-5 w-5 text-primary shrink-0 mt-1" />
            <p className="text-[10px] text-primary/70 uppercase leading-relaxed font-mono-tactical">
              Selecione o modo de operação. O sistema utilizará a Memória Neural para identificar SKUs conhecidos automaticamente.
            </p>
          </div>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Voltar */}
          <button 
            onClick={() => { setAuditMode(null); setInvoiceImage(null); setSkipInvoice(false); }}
            className="flex items-center gap-2 text-white/40 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
          >
            <RotateCcw className="h-4 w-4" /> Alterar Modo
          </button>


          {/* Fluxo NF - Seleção Tática */}
          {auditMode === 'invoice' && !invoiceImage && !skipInvoice && (
            <div className="space-y-4">
              <div className="bg-primary/5 rounded-3xl p-6 border border-primary/20 mb-4">
                <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 text-glow-cyan">Início de Recebimento</h4>
                <p className="text-xs text-white/60 leading-relaxed uppercase font-mono-tactical">Escolha o método de entrada dos dados esperados.</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-black-piano border border-white/10 rounded-3xl p-6 flex items-center gap-4 group relative overflow-hidden text-left"
                >
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-glow-cyan transition-all shrink-0">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-black text-white uppercase tracking-tight group-hover:text-primary transition-colors">Análise em Lote</h3>
                    <p className="text-[8px] text-white/40 font-mono-tactical uppercase mt-0.5">Fotos de NF</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-white/20 group-hover:text-primary transition-all" />
                  <input type="file" className="hidden" ref={fileInputRef} onChange={handlePhotosUpload} accept="image/*" multiple />
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSkipInvoice(true)}
                  className="bg-black-piano border border-white/10 rounded-3xl p-6 flex items-center gap-4 group relative overflow-hidden text-left transition-all"
                >
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary transition-all shrink-0">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-black text-white uppercase tracking-tight group-hover:text-primary transition-colors">Sem Nota Fiscal</h3>
                    <p className="text-[8px] text-white/40 font-mono-tactical uppercase mt-0.5">Identificação Livre</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-white/20 group-hover:text-primary transition-all" />
                </motion.button>
              </div>
            </div>
          )}

          {/* Modo de Entrada Tático */}
          {(auditMode === 'stock' || skipInvoice || (auditMode === 'invoice' && expectedData.length > 0)) && (
            <div className="space-y-8">
              <div className="bg-black-piano/30 p-2 rounded-[2.5rem] border border-white/5 flex gap-2">
                <button
                  onClick={() => setInputMode('scan')}
                  className={`flex-1 py-4 rounded-[2rem] font-black text-[10px] tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${
                    inputMode === 'scan' ? 'bg-primary text-black shadow-glow-cyan' : 'text-white/20 hover:text-white/40'
                  }`}
                >
                  <Boxes className="h-4 w-4" /> BIPE
                </button>
                <button
                  onClick={() => setInputMode('photo')}
                  className={`flex-1 py-3 rounded-[1.5rem] font-black text-[10px] tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${
                    inputMode === 'photo' ? 'bg-primary text-black shadow-glow-cyan' : 'text-white/20 hover:text-white/40'
                  }`}
                >
                  <Camera className="h-4 w-4" /> FOTO (IA)
                </button>
              </div>

              {/* Action Master Card */}
              <div className="relative group">
                <div className="relative bg-black-piano rounded-3xl p-6 flex flex-col items-center gap-6 border border-white/10">
                  
                  {/* Status Ring */}
                  <div className="relative">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/20 to-black-piano border border-primary flex items-center justify-center text-primary shadow-glow-cyan">
                      {inputMode === 'scan' ? <Boxes className="h-8 w-8" /> : <Camera className="h-8 w-8" />}
                    </div>
                  </div>

                  <div className="text-center space-y-1">
                    <h3 className="text-lg font-black text-white uppercase tracking-tight">
                      {inputMode === 'scan' ? "Scanner" : "Visão"}
                    </h3>
                    <p className="text-[9px] text-white/40 font-mono-tactical uppercase max-w-[150px] mx-auto">
                      {isManualMode 
                        ? "Modo Offline Ativo"
                        : (inputMode === 'scan' 
                          ? "Bipe de alta velocidade"
                          : "Identificação por fotos")}
                    </p>
                  </div>

                  <button 
                    onClick={startScanner}
                    disabled={loading}
                    className="w-full bg-primary py-4 rounded-xl font-black text-black shadow-glow-cyan flex items-center justify-center gap-3 transition-all active:scale-95 group/btn"
                  >
                    {loading ? <Zap className="h-5 w-5 animate-pulse" /> : (
                      <>
                        <Zap className="h-4 w-4" />
                        <span className="text-xs tracking-widest uppercase">INICIAR</span>
                      </>
                    )}
                  </button>

                  {/* Mini Tactical Switch - Centralizado */}
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Protocolo de Rede</span>
                    <div 
                      onClick={() => setIsManualMode(!isManualMode)}
                      className={`relative h-7 w-28 rounded-full cursor-pointer transition-all duration-500 p-0.5 border ${
                        isManualMode 
                        ? 'bg-danger/10 border-danger/30 shadow-glow-danger' 
                        : 'bg-success/10 border-success/30 shadow-glow-success'
                      }`}
                    >
                      <div className="absolute inset-0 flex items-center justify-between px-3">
                        <span className={`text-[7px] font-black uppercase transition-all ${isManualMode ? 'text-danger' : 'text-white/10'}`}>OFF</span>
                        <span className={`text-[7px] font-black uppercase transition-all ${!isManualMode ? 'text-success' : 'text-white/10'}`}>ON</span>
                      </div>
                      
                      <motion.div 
                        animate={{ x: isManualMode ? 0 : 64 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className={`h-full w-10 rounded-full flex items-center justify-center shadow-md transition-colors ${
                          isManualMode ? 'bg-danger shadow-glow-danger' : 'bg-success shadow-glow-success'
                        }`}
                      >
                        <div className="h-2 w-0.5 bg-white/40 rounded-full mx-0.5" />
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Loading Overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center gap-6"
          >
            <div className="relative">
              <div className="h-24 w-24 rounded-full border-4 border-primary/20" />
              <div className="h-24 w-24 rounded-full border-4 border-primary border-t-transparent animate-spin absolute inset-0" />
              <Zap className="h-10 w-10 text-primary absolute inset-0 m-auto animate-pulse" />
            </div>
            <div className="text-center flex flex-col items-center gap-4">
              <div>
                <div className="text-primary font-black uppercase tracking-[0.4em] text-xs animate-pulse">
                  {processingProgress > 0 ? `Processando Lote: ${processingProgress}%` : 'Analisando Evidências'}
                </div>
                <div className="text-white/40 font-mono-tactical text-[10px] uppercase mt-2">O Cérebro está analisando as etiquetas...</div>
              </div>
              
              <button 
                onClick={stopAi}
                className="mt-4 bg-red-500/10 border border-red-500/30 px-8 py-3 rounded-2xl text-red-500 font-black uppercase text-[10px] tracking-widest hover:bg-red-500 hover:text-white transition-all active:scale-95 flex items-center gap-2 shadow-glow-danger-sm"
              >
                <X className="w-4 h-4" />
                Interromper
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Camera Capture */}
      <CameraView 
        open={cameraOpen}
        onClose={() => { setCameraOpen(false); setCapturedPhotos([]); setScannedSKUs([]); }}
        mode={inputMode}
        title={inputMode === 'photo' ? "Auditoria Visual" : "Scanner de SKU"}
        onCapture={handlePhotoCapture}
        onScan={handleSKUScan}
        multiCapture={inputMode === 'photo'}
        multiScan={inputMode === 'scan'}
        capturedCount={inputMode === 'photo' ? capturedPhotos.length : scannedSKUs.length}
        onFinalize={handleProcessAudit}
      />
    </div>
  );
};

