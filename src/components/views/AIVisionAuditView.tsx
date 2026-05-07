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
  X,
  Image as ImageIcon,
  ScanLine
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { aiService } from "@/services/aiService";
import { toast } from "sonner";
import { AuditHub } from "../AuditHub";
import { CameraView } from "../CameraView";
import { AuditVideoScanner } from "../AuditVideoScanner";

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
  const [inputMode, setInputMode] = useState<'photo' | 'scan'>('scan');
  const [isManualMode, setIsManualMode] = useState(false);
  const [lastModel, setLastModel] = useState<string | null>(null);

  const { products } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  useEffect(() => {
    const mainScroll = document.querySelector('.custom-scrollbar');
    if (mainScroll) {
      mainScroll.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [auditMode, showHub]);

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
        const CONCURRENCY_LIMIT = 2;
        for (let i = 0; i < files.length; i += CONCURRENCY_LIMIT) {
          const chunk = files.slice(i, i + CONCURRENCY_LIMIT);
          const chunkPromises = chunk.map(async (file, index) => {
            const currentIndex = i + index;
            const base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(file);
            });

            const type = auditMode === 'stock' ? 'stock' : 'invoice';
            const result = await aiService.auditMultiModal(
              { data: base64.split(',')[1], mimeType: file.type },
              type,
              expectedData,
              controller.signal
            );
            
            setProcessingProgress(Math.round(((currentIndex + 1) / files.length) * 100));
            setLastModel(result.modelUsed);

            return result.identified || [];
          });

          const results = await Promise.all(chunkPromises);
          results.forEach(items => allIdentified.push(...items));
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
    
    if (inputMode === 'photo') {
      setCameraOpen(true);
    } else {
      setIsScanning(true);
    }
  };

  const handlePhotoCapture = (dataUrl: string) => {
    setCapturedPhotos(prev => [...prev, dataUrl]);
    toast.success(`Foto ${capturedPhotos.length + 1} capturada!`, {
      duration: 1000,
      position: 'top-center'
    });
  };

  const handleSKUScan = (code: string) => {
    const currentCount = Array.from(scannedSKUsRef.current).filter(c => c === code).length;

    if (currentCount >= 3) {
      toast.error("Limite de 3 bipes por item! Ajuste no Hub se necessário.");
      return;
    }

    scannedSKUsRef.current.add(code);
    setScannedSKUs(prev => [...prev, code]);

    toast.success(`Bipe: ${code}`, {
      duration: 800,
      position: 'top-center'
    });

    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      audio.volume = 0.3;
      audio.play();
    } catch (e) { }
  };

  const handleProcessAudit = async (video?: { data: string; mimeType: string }) => {
    if (!video && capturedPhotos.length === 0 && scannedSKUs.length === 0) return;

    if (isManualMode) {
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
        : capturedPhotos.map((_, i) => ({ name: `FOTO ${i + 1} (EDITAR)`, qty: 1, isManual: true }));

      setIdentifiedData(manualItems);
      setShowHub(true);
      setCameraOpen(false);
      setIsScanning(false);
      return;
    }

    const controller = new AbortController();
    setAbortController(controller);
    setLoading(true);
    setCameraOpen(false);
    setIsScanning(false);
    setProcessingProgress(0);
    let allIdentified: any[] = [];

    try {
      if (video) {
        if (video.data === "LOCAL_AUDIT_DATA") {
          const parsed = JSON.parse(video.mimeType);
          allIdentified = parsed || [];
          toast.success("Auditoria Local consolidada!");
        } else {
          const type = auditMode === 'stock' ? 'stock' : 'invoice';
          const result = await aiService.auditMultiModal(video, type, expectedData, controller.signal);
          setLastModel(result.modelUsed);
          
          if (result.identified) {
             allIdentified = result.identified;
          } else if (result.text) {
             const jsonMatch = result.text.match(/\{.*\}/s);
             const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { identified: [] };
             allIdentified = parsed.identified || [];
          }
          toast.success("Análise de vídeo via Gemini concluída!");
        }
      } else if (capturedPhotos.length > 0) {
        const CONCURRENCY_LIMIT = 2;
        const totalItems = capturedPhotos.length + (scannedSKUs.length > 0 ? 1 : 0);

        for (let i = 0; i < capturedPhotos.length; i += CONCURRENCY_LIMIT) {
          const chunk = capturedPhotos.slice(i, i + CONCURRENCY_LIMIT);
          const chunkPromises = chunk.map(async (photo, index) => {
            const currentIndex = i + index;
            const type = auditMode === 'stock' ? 'stock' : 'invoice';
            
            const result = await aiService.auditMultiModal(
              { data: photo.split(',')[1], mimeType: 'image/jpeg' },
              type,
              expectedData,
              controller.signal
            );
            
            setProcessingProgress(Math.round(((currentIndex + 1) / totalItems) * 100));
            setLastModel(result.modelUsed);

            if (result.identified && result.identified.length > 0) {
              return result.identified.map((item: any) => {
                const existingProduct = products.find(p => p.sku === item.sku);
                return {
                  ...item,
                  name: existingProduct ? existingProduct.name.toUpperCase() : item.name.toUpperCase()
                };
              });
            }
            return [];
          });

          const chunkResults = await Promise.all(chunkPromises);
          chunkResults.forEach(items => allIdentified.push(...items));
        }
      }

      if (scannedSKUs.length > 0) {
        setProcessingProgress(90);

        const { catalog } = useStore.getState();
        const localItems: any[] = [];
        const unknownSKUs: string[] = [];

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

        if (unknownSKUs.length > 0) {
          const resolution = await aiService.resolveSKUs(unknownSKUs, controller.signal);
          setLastModel(resolution.modelUsed);
          if (resolution.identified) {
            const enriched = resolution.identified.map((item: any) => {
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
    <div className="flex flex-col h-[100dvh] bg-black relative overflow-hidden">
      {/* Header Tático - Sticky and Safe-Area Optimized */}
      <div className="sticky top-0 z-30 p-6 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-4 border-b border-white/5 bg-black/80 backdrop-blur-xl shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 shadow-glow-cyan">
              <Eye className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="font-mono-tactical text-[8px] font-black uppercase tracking-[0.2em] text-primary">
                AUDITORIA VISUAL
              </div>
              <div className="text-lg font-black text-white italic">AIVISION AUDIT</div>
            </div>
          </div>
          {lastModel && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
              <Zap className="h-3 w-3 text-primary animate-pulse" />
              <span className="text-[8px] font-black text-primary uppercase tracking-widest">
                {lastModel}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pb-32">
        {!auditMode ? (
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 gap-4"
            >
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
                  <p className="text-[9px] text-white font-mono-tactical uppercase mt-0.5">Nota Fiscal vs Chão</p>
                </div>
                <ChevronRight className="h-5 w-5 text-white group-hover:text-primary transition-all" />
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
                  <p className="text-[9px] text-white font-mono-tactical uppercase mt-0.5">Contagem Geral</p>
                </div>
                <ChevronRight className="h-5 w-5 text-white group-hover:text-primary transition-all" />
              </motion.button>
            </motion.div>

            <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 flex items-start gap-4">
              <Info className="h-5 w-5 text-primary shrink-0 mt-1" />
              <p className="text-[10px] text-primary uppercase leading-relaxed font-mono-tactical">
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
            <button
              onClick={() => { setAuditMode(null); setInvoiceImage(null); setSkipInvoice(false); }}
              className="flex items-center gap-2 text-white hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
            >
              <RotateCcw className="h-4 w-4" /> Alterar Modo
            </button>

            {auditMode === 'invoice' && !invoiceImage && !skipInvoice && (
              <div className="space-y-4">
                <div className="bg-primary/5 rounded-3xl p-6 border border-primary/20 mb-4">
                  <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 text-glow-cyan">Início de Recebimento</h4>
                  <p className="text-xs text-white leading-relaxed uppercase font-mono-tactical">Escolha o método de entrada dos dados esperados.</p>
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
                      <p className="text-[8px] text-white font-mono-tactical uppercase mt-0.5">Fotos de NF</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-white group-hover:text-primary transition-all" />
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
                      <p className="text-[8px] text-white font-mono-tactical uppercase mt-0.5">Identificação Livre</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-white group-hover:text-primary transition-all" />
                  </motion.button>
                </div>
              </div>
            )}

            {(auditMode === 'stock' || skipInvoice || (auditMode === 'invoice' && expectedData.length > 0)) && (
              <div className="space-y-8">
                <div className="bg-black-piano/30 p-2 rounded-[2.5rem] border border-white/5 flex gap-2">
                  <button
                    onClick={() => setInputMode('scan')}
                    className={`flex-1 py-4 rounded-[2rem] font-black text-[10px] tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${inputMode === 'scan' ? 'bg-primary text-black shadow-glow-cyan' : 'text-white hover:text-white'
                      }`}
                  >
                    <Boxes className="h-4 w-4" /> BIPE
                  </button>
                  <button
                    onClick={() => setInputMode('photo')}
                    className={`flex-1 py-3 rounded-[1.5rem] font-black text-[10px] tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${inputMode === 'photo' ? 'bg-primary text-black shadow-glow-cyan' : 'text-white hover:text-white'
                      }`}
                  >
                    <Camera className="h-4 w-4" /> FOTO (IA)
                  </button>
                </div>

                <div className="relative group">
                  <div className="relative bg-black-piano rounded-3xl p-6 flex flex-col items-center gap-6 border border-white/10">
                    <div className="relative">
                      <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/20 to-black-piano border border-primary flex items-center justify-center text-primary shadow-glow-cyan">
                        {inputMode === 'scan' ? <Boxes className="h-8 w-8" /> : <Camera className="h-8 w-8" />}
                      </div>
                    </div>

                    <div className="text-center space-y-1">
                      <h3 className="text-lg font-black text-white uppercase tracking-tight">
                        {inputMode === 'scan' ? "Scanner" : "Visão"}
                      </h3>
                      <p className="text-[9px] text-white font-mono-tactical uppercase max-w-[150px] mx-auto text-center">
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

                    <div className="flex flex-col items-center gap-2">
                      <span className="text-[8px] font-black text-white uppercase tracking-widest">Protocolo de Rede</span>
                      <div
                        onClick={() => setIsManualMode(!isManualMode)}
                        className={`relative h-7 w-28 rounded-full cursor-pointer transition-all duration-500 p-0.5 border ${isManualMode
                            ? 'bg-danger/10 border-danger/30 shadow-glow-danger'
                            : 'bg-success/10 border-success/30 shadow-glow-success'
                          }`}
                      >
                        <div className="absolute inset-0 flex items-center justify-between px-3">
                          <span className={`text-[7px] font-black uppercase transition-all ${isManualMode ? 'text-danger' : 'text-white'}`}>OFF</span>
                          <span className={`text-[7px] font-black uppercase transition-all ${!isManualMode ? 'text-success' : 'text-white'}`}>ON</span>
                        </div>

                        <motion.div
                          animate={{ x: isManualMode ? 0 : 64 }}
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          className={`h-full w-10 rounded-full flex items-center justify-center shadow-md transition-colors ${isManualMode ? 'bg-danger shadow-glow-danger' : 'bg-success shadow-glow-success'
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
      </div>

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
                {lastModel && (
                  <div className="mt-2 flex items-center justify-center gap-1.5">
                    <div className="h-1 w-1 rounded-full bg-primary" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-primary">
                      Engine: {lastModel}
                    </span>
                  </div>
                )}
                <div className="text-white font-mono-tactical text-[10px] uppercase mt-2">O Cérebro está analisando as etiquetas...</div>
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
        onFinalize={() => handleProcessAudit()}
      />

      {isScanning && (
        <AuditVideoScanner 
          onComplete={handleProcessAudit}
          onCancel={() => setIsScanning(false)}
        />
      )}

      <AnimatePresence>
        {(capturedPhotos.length > 0 || scannedSKUs.length > 0) && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-[90px] left-0 right-0 z-40 px-4 pointer-events-none"
          >
            <div className="max-w-md mx-auto glass-panel-strong rounded-[2.5rem] p-3 flex items-center justify-between gap-3 border border-primary/30 shadow-glow-cyan/20 pointer-events-auto">
              <div className="flex items-center gap-3 ml-2">
                <div className="relative">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                    <Boxes className="h-5 w-5 text-primary" />
                  </div>
                  <div className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-black text-[8px] font-black rounded-full flex items-center justify-center border border-black animate-pulse">
                    {inputMode === 'photo' ? capturedPhotos.length : scannedSKUs.length}
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[7px] font-black text-primary/60 uppercase tracking-[0.2em]">Neural Batch</span>
                  <span className="text-[10px] font-black text-white uppercase italic tracking-tighter">
                    {inputMode === 'photo' ? 'Imagens' : 'SKUs'} Capturados
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setCapturedPhotos([]); setScannedSKUs([]); scannedSKUsRef.current.clear(); }}
                  className="h-11 w-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-danger hover:bg-danger/10 transition-all active:scale-90"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>

                <button
                  onClick={() => handleProcessAudit()}
                  className="h-11 px-6 rounded-2xl bg-primary text-black font-black text-[10px] shadow-glow-cyan uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 border border-white/20"
                >
                  <Zap className="h-3.5 w-3.5 fill-current" />
                  PROCESSAR
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
