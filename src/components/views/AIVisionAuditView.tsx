import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Camera, 
  Upload, 
  Zap, 
  RotateCcw,
  Eye,
  FileText,
  Boxes,
  Truck
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { aiService } from "@/services/aiService";
import { toast } from "sonner";
import { AuditVideoScanner } from "../AuditVideoScanner";
import { AuditHub } from "../AuditHub";

export const AIVisionAuditView = () => {
  const [auditMode, setAuditMode] = useState<'stock' | 'invoice' | null>(null);
  const [invoiceImage, setInvoiceImage] = useState<string | null>(null);
  const [expectedData, setExpectedData] = useState<{ name: string; qty: number }[]>([]);
  const [identifiedData, setIdentifiedData] = useState<{ name: string; qty: number }[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [showHub, setShowHub] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [skipInvoice, setSkipInvoice] = useState(false);
  
  const { products } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInvoiceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLoading(true);
      setSkipInvoice(false);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setInvoiceImage(base64);
        try {
          const result = await aiService.extractInvoiceData(base64);
          setExpectedData(result.items || []);
          toast.success(`${result.items?.length || 0} itens extraídos da NF!`);
        } catch (err) {
          toast.error("Erro ao ler Nota Fiscal.");
        } finally {
          setLoading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const startScanner = () => {
    if (auditMode === 'stock') {
      const currentStock = products
        .filter(p => p.status === 'in_stock')
        .map(p => ({ name: p.name, qty: p.stock }));
      setExpectedData(currentStock);
    }
    // Se skipInvoice for true, expectedData continua vazio e a IA faz identificação livre
    setIsScanning(true);
  };

  const handleScanComplete = async (video: { data: string; mimeType: string }) => {
    setIsScanning(false);
    setLoading(true);
    try {
      const type = auditMode === 'stock' ? 'stock' : 'invoice';
      const result = await aiService.auditMultiModal(video, type, expectedData);
      
      // Tentar extrair o JSON do resultado da IA
      const jsonMatch = result.text.match(/\{.*\}/s);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { identified: [] };
      
      setIdentifiedData(parsed.identified || []);
      setShowHub(true);
      toast.success("Análise de vídeo concluída!");
    } catch (err) {
      toast.error("Erro ao processar auditoria de vídeo.");
    } finally {
      setLoading(false);
    }
  };

  if (isScanning) {
    return <AuditVideoScanner onComplete={handleScanComplete} onCancel={() => setIsScanning(false)} />;
  }

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
      <section className="bg-black-piano neon-blue-border relative overflow-hidden rounded-[2.5rem] p-8 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50" />
        <div className="absolute inset-0 tactical-grid opacity-20" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20 shadow-glow-cyan ring-1 ring-primary/40">
            <Eye className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1">
            <div className="font-mono-tactical text-[11px] font-black uppercase tracking-[0.4em] text-primary/70">
              AUDITORIA VISUAL v2.0
            </div>
            <div className="text-2xl font-black text-white text-glow-cyan">AIVision Audit</div>
          </div>
        </div>
      </section>

      {!auditMode ? (
        <div className="grid grid-cols-1 gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setAuditMode('stock')}
            className="bg-black-piano neon-blue-border rounded-[2.5rem] p-8 flex flex-col items-center gap-4 group transition-all"
          >
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:shadow-glow-cyan transition-all">
              <Boxes className="h-8 w-8" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Auditoria de Estoque</h3>
              <p className="text-[10px] text-white/40 font-mono-tactical uppercase mt-1">Confrontar Prateleira vs Sistema</p>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setAuditMode('invoice')}
            className="bg-black-piano neon-blue-border rounded-[2.5rem] p-8 flex flex-col items-center gap-4 group transition-all"
          >
            <div className="h-16 w-16 rounded-2xl bg-ai/10 flex items-center justify-center text-ai group-hover:shadow-glow-cyan transition-all">
              <Truck className="h-8 w-8" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Conferência de Recebimento</h3>
              <p className="text-[10px] text-white/40 font-mono-tactical uppercase mt-1">Confrontar Nota Fiscal vs Mercadoria no Chão</p>
            </div>
          </motion.button>
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

          {/* Fluxo NF */}
          {auditMode === 'invoice' && !invoiceImage && !skipInvoice && (
            <div className="space-y-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="bg-black-piano border-2 border-dashed border-ai/20 rounded-[2.5rem] p-12 flex flex-col items-center gap-4 cursor-pointer hover:bg-ai/5 transition-all"
              >
                <div className="h-20 w-20 rounded-full bg-ai/10 flex items-center justify-center text-ai shadow-glow-cyan">
                  <FileText className="h-10 w-10" />
                </div>
                <div className="text-center">
                  <h3 className="text-white font-black uppercase tracking-tight">Upload da Nota Fiscal</h3>
                  <p className="text-[10px] text-white/40 font-mono-tactical uppercase mt-1">Envie a foto ou print da NF para iniciar</p>
                </div>
                <input type="file" className="hidden" ref={fileInputRef} onChange={handleInvoiceUpload} accept="image/*" />
              </div>
              
              <button 
                onClick={() => setSkipInvoice(true)}
                className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 font-black text-white/40 hover:text-white transition-all text-[10px] uppercase tracking-widest"
              >
                Continuar Sem Nota (Identificação Livre)
              </button>
            </div>
          )}

          {/* Preview NF / Iniciar Vídeo */}
          {(auditMode === 'stock' || skipInvoice || (auditMode === 'invoice' && expectedData.length > 0)) && (
            <div className="bg-black-piano neon-blue-border rounded-[2.5rem] p-10 flex flex-col items-center gap-6">
               <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-glow-cyan animate-pulse">
                <Camera className="h-12 w-12" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Scanner de Vídeo Pronto</h3>
                <p className="text-[11px] text-white/40 font-mono-tactical uppercase leading-relaxed max-w-[250px]">
                  {auditMode === 'stock' 
                    ? "Filme o estoque por 10 segundos para conferência automática."
                    : "Filme a mercadoria no chão para confrontar com a Nota Fiscal."}
                </p>
              </div>
              <button 
                onClick={startScanner}
                disabled={loading}
                className="w-full bg-primary py-5 rounded-2xl font-black text-black shadow-glow-cyan flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? <Zap className="h-5 w-5 animate-pulse" /> : "INICIAR AUDITORIA DE 10S"}
              </button>
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
            <div className="text-center">
              <div className="text-primary font-black uppercase tracking-[0.4em] text-xs animate-pulse">Processando</div>
              <div className="text-white/40 font-mono-tactical text-[10px] uppercase mt-2">O Cérebro está analisando as evidências...</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

