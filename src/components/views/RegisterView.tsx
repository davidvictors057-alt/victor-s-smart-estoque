import { useState, useEffect } from "react";
// Tactical Update: 2026-04-26 15:58
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Tag, Hash, DollarSign, Camera, Save, Package, ScanLine, X, CheckCircle2 } from "lucide-react";
import { CameraView } from "@/components/CameraView";
import { ManualInputModal } from "@/components/ManualInputModal";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";

export const RegisterView = () => {
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState<"imei1" | "imei2" | "name" | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [imei, setImei] = useState("");
  const [imei2, setImei2] = useState("");
  const [showImei2, setShowImei2] = useState(false);
  const [cost, setCost] = useState("");
  const [sale, setSale] = useState("");
  const [quantity, setQuantity] = useState("1");
  const { addProduct } = useStore();

  const margin = cost && sale ? (((+sale - +cost) / +cost) * 100).toFixed(1) : "—";

  // Simulate AI Background Removal
  useEffect(() => {
    if (photo) {
      setIsProcessing(true);
      const timer = setTimeout(() => setIsProcessing(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [photo]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photo || !sku || !name) {
      toast.error("Faltam dados obrigatórios: Foto, SKU ou Descrição");
      return;
    }

    const toastId = toast.loading("Registrando produto no terminal...");
    try {
      // Normalize currency inputs (support comma and dots)
      const parsedCost = typeof cost === 'string' 
        ? parseFloat(cost.replace(',', '.')) || 0 
        : Number(cost) || 0;
        
      const parsedSale = typeof sale === 'string' 
        ? parseFloat(sale.replace(',', '.')) || 0 
        : Number(sale) || 0;

      const qty = parseInt(quantity) || 1;
      
      await addProduct({
        sku,
        name,
        imei: imei.trim() || null,
        spec: showImei2 ? `IMEI2: ${imei2}` : "Novo",
        brand: "Geral",
        category: "Smartphone",
        cost: parsedCost,
        sale: parsedSale,
        status: 'in_stock',
        image_url: photo,
        quantity: qty // Send quantity once, addProduct handles the loop
      });

      toast.success(`${qty} unidades registradas no banco`, { 
        id: toastId,
        description: `${name} · SKU ${sku}`,
      });
      
      // Reset form
      setSku(""); setName(""); setImei(""); setImei2(""); setCost(""); setSale(""); setPhoto(null); setQuantity("1");
    } catch (err) {
      toast.error("Erro ao salvar produto no banco", { id: toastId });
      console.error(err);
    }
  };

  const handleScan = (code: string) => {
    if (scannerOpen === "name") {
      setSku(code);
    } else if (scannerOpen === "imei1") {
      setImei(code);
    } else if (scannerOpen === "imei2") {
      setImei2(code);
    }
    setScannerOpen(null);
  };

  return (
    <form onSubmit={submit} className="space-y-4 px-3 pb-24">
      <motion.header
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-primary/10 border-2 border-primary flex items-center justify-between rounded-2xl p-5 shadow-[0_0_30px_rgba(0,163,255,0.2)] backdrop-blur-md"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-black shadow-glow-cyan">
            <Plus className="h-6 w-6 stroke-[3]" />
          </div>
          <div>
            <div className="font-mono-tactical text-[11px] font-black uppercase tracking-[0.3em] text-primary">
              CADASTRAR ITEM
            </div>
            <div className="text-base font-black text-white tracking-tight">Novo Produto de Elite</div>
          </div>
        </div>
        <button 
          type="button"
          onClick={() => setManualOpen(true)}
          className="flex h-10 items-center gap-2 rounded-xl bg-white/10 px-4 text-[10px] font-black uppercase tracking-widest text-white/80 border border-white/20 hover:bg-white/20 hover:text-primary transition-all"
        >
          <ScanLine className="h-4 w-4" />
          DIGITAR
        </button>
      </motion.header>

        {/* Main Content Area */}
        <div className="grid grid-cols-12 gap-4 items-stretch">
          {/* Photo Section - Ultra Luminous */}
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="col-span-3"
          >
            <div className="font-mono-tactical text-[8px] font-black text-primary/40 mb-2 uppercase tracking-widest text-center">FOTO PRODUTO</div>
            <button
              type="button"
              onClick={() => setPhotoOpen(true)}
              className="bg-black-piano group relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-[2.5rem] border-2 border-primary/60 hover:border-primary transition-all shadow-[0_10px_40px_rgba(0,0,0,0.8)]"
            >
              {photo ? (
                <div className="relative h-full w-full">
                  <img 
                    src={photo} 
                    alt="Foto" 
                    className={`h-full w-full object-cover transition-all duration-1000 ${isProcessing ? 'brightness-150 blur-sm scale-110' : 'brightness-110'}`} 
                    style={{ 
                      maskImage: 'radial-gradient(circle at center, black 55%, transparent 95%)',
                      WebkitMaskImage: 'radial-gradient(circle at center, black 55%, transparent 95%)'
                    }}
                  />
                  {isProcessing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                      <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-glow-cyan" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-primary group-hover:scale-110 transition-all duration-500">
                  <Camera className="h-10 w-10 drop-shadow-glow-cyan" />
                  <span className="font-mono-tactical text-[8px] font-black uppercase tracking-[0.3em]">FOTO</span>
                </div>
              )}
              <div className="tactical-corner absolute inset-3 opacity-30 group-hover:opacity-100 transition-opacity" />
            </button>
          </motion.div>

          {/* SKU Scanner - Side by Side with Photo */}
          <div className="col-span-9 h-full">
            <div className="relative h-full">
              <FormField 
                icon={ScanLine} 
                label="BIP / SKU"
                className="h-full"
                labelClassName="text-[10px] tracking-widest font-black"
                trailing={
                  <button 
                    type="button" 
                    onClick={() => setScannerOpen("name")} 
                    className="absolute inset-y-0 right-0 flex w-12 flex-col items-center justify-center rounded-r-2xl bg-primary text-black shadow-glow-cyan transition-all active:scale-95 active:brightness-125"
                  >
                    <div className="relative">
                      <Camera className="h-4 w-4 stroke-[3]" />
                      <ScanLine className="absolute -bottom-1 -right-1 h-2 w-2 stroke-[4] text-black" />
                    </div>
                    <span className="font-mono-tactical text-[7px] font-black uppercase">SCAN</span>
                  </button>
                }
              >
                <input
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="BIPE O SKU..."
                  className="font-mono-tactical w-full bg-transparent pr-14 font-black text-primary placeholder-primary outline-none text-[10px] sm:text-sm py-3"
                />
              </FormField>
            </div>
          </div>
        </div>

        {/* Full Width Description - Below Camera */}
        <div className="mt-4">
          <FormField icon={Tag} label="DESCRIÇÃO DO ITEM">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: iPhone 15 Pro Max 256GB"
              className="w-full bg-transparent font-black text-white placeholder-white/80 outline-none text-base py-1"
            />
          </FormField>
        </div>

        {/* IMEI Section */}
        <div className="mt-4">
          <FormField 
            icon={Hash} 
            label="IMEI / SERIAL DO DISPOSITIVO" 
            mono
            trailing={
              <button 
                type="button"
                onClick={() => setShowImei2(!showImei2)}
                className={`font-mono-tactical text-[9px] font-black px-3 py-1 rounded-lg border-2 transition-all ${
                  showImei2 ? "bg-primary text-black border-primary shadow-glow-cyan" : "text-white/40 border-white/20 hover:text-primary hover:border-primary"
                }`}
              >
                {showImei2 ? "- REMOVER" : "+ 2º IMEI"}
              </button>
            }
          >
            <div className="flex items-center gap-3">
              <input
                value={imei}
                onChange={(e) => setImei(e.target.value)}
                placeholder="Número de Série..."
                className="font-mono-tactical w-full bg-transparent text-sm tracking-[0.2em] font-black text-primary outline-none placeholder:text-white/80"
              />
              <button type="button" onClick={() => setScannerOpen("imei1")} className="text-primary hover:text-primary/80 transition-all active:scale-90 p-1 border border-primary/20 rounded-lg">
                <ScanLine className="h-5 w-5 drop-shadow-glow-cyan" />
              </button>
            </div>
          </FormField>
        </div>

      <AnimatePresence>
        {showImei2 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <FormField icon={Hash} label="IMEI SECUNDÁRIO" mono>
              <div className="flex items-center gap-2">
                <input
                  value={imei2}
                  onChange={(e) => setImei2(e.target.value)}
                  placeholder="000000..."
                  className="font-mono-tactical w-full bg-transparent text-sm tracking-widest font-black text-primary outline-none placeholder:text-white/5"
                />
                <button type="button" onClick={() => setScannerOpen("imei2")} className="text-primary/60 hover:text-primary transition-all active:scale-90">
                  <ScanLine className="h-4 w-4" />
                </button>
              </div>
            </FormField>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4 bg-black border-2 border-primary/20 rounded-3xl p-5 shadow-[0_10px_50px_rgba(0,0,0,0.8)]">
        <div className="grid grid-cols-2 gap-3">
          <FormField icon={DollarSign} label="CUSTO (R$)">
            <input
              type="number"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="0.00"
              className="font-mono-tactical w-full bg-transparent text-xl font-black text-white outline-none placeholder:text-white/80"
            />
          </FormField>
          <FormField icon={DollarSign} label="VENDA (R$)">
            <input
              type="number"
              value={sale}
              onChange={(e) => setSale(e.target.value)}
              placeholder="0.00"
              className="font-mono-tactical w-full bg-transparent text-xl font-black text-success outline-none placeholder:text-white/80"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <FormField icon={Package} label="QUANTIDADE DE ITENS (CONFERÊNCIA)">
            <div className="flex items-center gap-4">
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                onBlur={() => {
                  if (!quantity || parseInt(quantity) < 1) setQuantity("1");
                }}
                placeholder="1"
                className="font-mono-tactical flex-1 bg-transparent text-xl font-black text-primary outline-none"
              />
              <div className="flex gap-2">
                {[5, 10, 20].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setQuantity(n.toString())}
                    className="font-mono-tactical rounded-lg bg-primary/10 px-3 py-1 text-[10px] font-black text-primary border border-primary/20 hover:bg-primary hover:text-black transition-all"
                  >
                    +{n}
                  </button>
                ))}
              </div>
            </div>
          </FormField>
        </div>

        <div className="flex items-center justify-between rounded-2xl bg-success/10 border-2 border-success/40 px-5 py-4 shadow-[0_0_20px_rgba(34,197,94,0.1)]">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-success shadow-glow-success" />
            <div className="font-mono-tactical text-[10px] font-black uppercase tracking-[0.2em] text-success">
              LUCRO ESTIMADO
            </div>
          </div>
          <div className="font-mono-tactical text-2xl font-black text-success drop-shadow-[0_0_15px_rgba(34,197,94,0.7)]">
            {margin === "—" ? margin : `+${margin}%`}
          </div>
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.96 }}
        whileHover={{ y: -4 }}
        type="submit"
        className="relative flex w-full items-center justify-center gap-4 overflow-hidden rounded-3xl bg-primary py-6 text-base font-black text-black shadow-[0_0_40px_rgba(0,163,255,0.4)] transition-all hover:shadow-[0_0_60px_rgba(0,163,255,0.6)]"
      >
        <Save className="h-6 w-6 stroke-[3]" />
        SALVAR NO SMART ESTOQUE
      </motion.button>

      {/* Camera modals */}
      <CameraView 
        open={photoOpen} 
        onClose={() => setPhotoOpen(false)} 
        title="Foto do Produto" 
        mode="photo" 
        onCapture={setPhoto} 
      />

      <CameraView 
        open={!!scannerOpen} 
        onClose={() => setScannerOpen(null)} 
        title={`Escanear ${scannerOpen === 'name' ? 'Produto' : 'IMEI'}`} 
        mode="scan" 
        onScan={handleScan} 
      />

      <ManualInputModal open={manualOpen} onClose={() => setManualOpen(false)} onConfirm={handleScan} />
    </form>
  );
};

const FormField = ({ icon: Icon, label, children, mono = false, trailing, className = "", labelClassName = "" }: any) => (
  <div className={`group relative rounded-2xl border-[3px] border-white/80 bg-white/10 px-4 py-3.5 transition-all focus-within:border-primary focus-within:bg-white/[0.2] shadow-[0_5px_15px_rgba(255,255,255,0.1)] hover:border-white hover:bg-white/[0.15] ${className}`}>
    <div className={`font-mono-tactical mb-1.5 flex items-center justify-between gap-2 text-[12px] font-black uppercase tracking-[0.2em] text-white group-focus-within:text-primary transition-colors ${labelClassName}`}>
      <div className="flex items-center gap-1.5">
        <Icon className="h-4 w-4 text-primary drop-shadow-[0_0_15px_rgba(0,163,255,1)]" />
        <span className="drop-shadow-[0_0_12px_rgba(255,255,255,0.9)] text-white vivid-shadow">{label}</span>
      </div>
      {trailing}
    </div>
    {children}
  </div>
);
