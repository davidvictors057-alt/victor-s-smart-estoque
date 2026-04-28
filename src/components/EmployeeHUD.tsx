import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScanLine, ArrowDownToLine, ArrowUpFromLine, Camera, Hash, Tag, X, Check, Image as ImageIcon, Package } from "lucide-react";
import { CameraView } from "@/components/CameraView";
import { ManualInputModal } from "@/components/ManualInputModal";
import { toast } from "sonner";

type Action = "in" | "out" | null;

interface Activity {
  time: string;
  action: "in" | "out";
  product: string;
  imei: string;
}

import { useStore } from "@/store/useStore";

export const EmployeeHUD = () => {
  const { currentUser, movements, addMovement, products, addProduct } = useStore();
  const [action, setAction] = useState<Action>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [manualInputOpen, setManualInputOpen] = useState(false);
  const [scannedImei, setScannedImei] = useState("");

  const todayStr = new Date().toISOString().split('T')[0];
  const myMovementsToday = movements.filter(m => m.operator_id === currentUser?.id && m.timestamp?.startsWith(todayStr));
  
  const stats = [
    { label: "Seus Bipes", value: myMovementsToday.length.toString(), color: "text-primary" },
    { label: "Entradas", value: myMovementsToday.filter(m => m.type === 'in').length.toString(), color: "text-success" },
    { label: "Saídas", value: myMovementsToday.filter(m => m.type === 'out').length.toString(), color: "text-danger" },
  ];

  const handleSubmit = async (productName: string, identifier: string, qty: number = 1) => {
    if (!action || !currentUser) return;
    
    const toastId = toast.loading(`Processando ${qty} unidades...`);
    try {
      if (action === "in") {
        await addProduct({
          name: productName,
          sku: identifier,
          imei: identifier.trim() || null,
          quantity: qty,
          status: 'in_stock',
          brand: "Geral",
          category: "Smartphone",
          spec: "Padrão",
          cost: 0,
          sale: 0,
          image_url: "" 
        });
      } else {
        // --- LÓGICA DE SAÍDA TÁTICA (MODO TANTO FAZ) ---
        const normInput = identifier?.trim() || "";
        const normName = productName?.trim().toLowerCase() || "";

        let potentialTargets = products.filter(p => p.status === 'in_stock');

        // 1. Filtrar por Identificador (Se houver bip)
        if (normInput) {
          potentialTargets = potentialTargets.filter(p => 
            p.imei === normInput || p.sku === normInput
          );
        }

        // 2. Filtrar por Nome (Se houver nome ou se a busca por código falhou)
        // Se a busca por SKU/IMEI não retornou nada, tentamos pelo nome para permitir o "Zerar Estoque"
        if (potentialTargets.length === 0 && normName) {
          potentialTargets = products.filter(p => 
            p.status === 'in_stock' && 
            (p.name || "").toLowerCase().includes(normName)
          );
        } else if (normName && !normInput) {
           // Se só tem o nome, filtra direto
           potentialTargets = potentialTargets.filter(p => 
            (p.name || "").toLowerCase().includes(normName)
          );
        }

        // ORDENAÇÃO INTELIGENTE (MODO TANTO FAZ): 
        // Prioriza itens SEM IMEI, mas se acabar, pega os COM IMEI para zerar o estoque.
        const targets = potentialTargets.sort((a, b) => {
          const aHasRealImei = a.imei && a.imei !== "N/A" && a.imei !== a.sku;
          const bHasRealImei = b.imei && b.imei !== "N/A" && b.imei !== b.sku;
          
          if (!aHasRealImei && bHasRealImei) return -1; 
          if (aHasRealImei && !bHasRealImei) return 1;  
          return 0;
        }).slice(0, qty);
        
        if (targets.length === 0) {
          toast.error("Produto não localizado", { 
            id: toastId,
            description: `Não há unidades de "${normInput || normName}" disponíveis para saída.`
          });
          return;
        }

        for (const p of targets) {
          await useStore.getState().updateProduct(p.id, { status: 'sold' });
          await addMovement({
            product_id: p.id,
            operator_id: currentUser.id,
            type: 'out',
            notes: `Saída: ${p.name}${p.imei && p.imei !== p.sku ? ` (IMEI: ${p.imei})` : " (S/ IMEI)"}`
          });
        }
      }

      setAction(null);
      setScannedImei("");
      toast.success("Operação concluída!", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Erro na operação", { id: toastId });
    }
  };


  const handleScan = (code: string) => {
    setScannedImei(code);
    
    // AUTO-FILL SEARCH
    const existing = products.find(p => p.imei === code || p.sku === code);
    if (existing) {
      toast.success(`Produto Identificado: ${existing.name}`, {
        description: "Os dados foram pré-preenchidos.",
      });
      // We can use a ref or state to pass this to the modal
    } else {
      toast.info(`Código ${code} capturado`, {
        description: "Produto novo. Prossiga com o preenchimento.",
      });
    }
    
    if (!action) setAction("in");
  };

  return (
    <div className="space-y-4 px-3">
      {/* Operator chip */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.01, y: -2 }}
        className="bg-black-piano neon-blue-border cursor-pointer flex items-center justify-between rounded-2xl px-5 py-4 transition-all"
      >
        <div className="flex items-center gap-4">
          <div className="relative h-12 w-12 rounded-full border-2 border-primary/40 p-0.5 shadow-[0_0_15px_rgba(0,163,255,0.3)] group-hover:border-primary">
            <img 
              src={currentUser?.avatar_url?.startsWith('http') 
                ? currentUser.avatar_url 
                : `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.avatar_url || currentUser?.full_name}${currentUser?.full_name === "Raul Seixas" ? "&skinColor=9e5622" : ""}`
              } 
              alt={currentUser?.full_name || "User"} 
              className="h-full w-full rounded-full bg-[#1a1c1e] object-cover" 
            />
            <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-success ring-2 ring-black" />
          </div>
          <div>
            <div className="text-base font-black leading-none text-white tracking-wide uppercase">{currentUser?.full_name || "OPERADOR"}</div>
            <div className="font-mono-tactical mt-1.5 text-[10px] uppercase tracking-[0.2em] text-primary/70">
              {currentUser?.role === 'admin' ? 'ADMINISTRADOR' : 'ID · OPERACIONAL'}
            </div>
          </div>
        </div>
        <div className="font-mono-tactical text-right">
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-0.5">Turno</div>
          <div className="text-sm font-black text-success text-glow-success animate-pulse">ATIVO</div>
        </div>
      </motion.div>

      {/* Scanner viewport — clicking opens REAL camera */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02, y: -4 }}
        transition={{ delay: 0.05 }}
        className="bg-black-piano neon-blue-border group relative overflow-hidden rounded-[2.5rem] transition-all shadow-[0_15px_50px_rgba(0,0,0,0.7)] hover:shadow-[0_0_50px_rgba(0,163,255,0.3)]"
      >
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-3 transition-colors group-hover:bg-primary/5">
          <div className="font-mono-tactical text-[11px] font-black uppercase tracking-[0.4em] text-primary">
            SCAN BIP
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-success shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            <span className="font-mono-tactical text-[11px] font-black uppercase tracking-[0.2em] text-success">LIVE</span>
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setCameraOpen(true)}
          className="relative block aspect-[16/10] w-full overflow-hidden bg-[radial-gradient(ellipse_at_center,rgba(0,163,255,0.15)_0%,rgba(0,0,0,1)_80%)]"
          aria-label="Abrir scanner de código de barras"
        >
          <div className="tactical-corner absolute inset-6 opacity-40 group-hover:opacity-100 transition-opacity" />
          <div className="absolute inset-6 rounded-lg border border-primary/10 group-hover:border-primary/30 transition-colors" />

          <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2">
            <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-primary/20 group-hover:bg-primary/40 transition-colors" />
            <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-primary/20 group-hover:bg-primary/40 transition-colors" />
            <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/60 shadow-glow-cyan" />
          </div>

          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="animate-scan absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_25px_rgba(0,163,255,0.8)]" />
          </div>

          <div className="absolute inset-x-0 bottom-4 flex justify-center gap-3 px-4">
            <button className="font-mono-tactical flex-1 rounded-full bg-primary/20 px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.3em] text-primary ring-1 ring-primary/40 backdrop-blur-md hover:bg-primary hover:text-black transition-all shadow-[0_0_15px_rgba(0,163,255,0.2)]">
              TOUCH TO SCAN
            </button>
            <button 
              onClick={() => setManualInputOpen(true)}
              className="font-mono-tactical flex-1 rounded-full bg-white/10 px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.3em] text-white ring-1 ring-white/20 backdrop-blur-md hover:bg-white hover:text-black transition-all"
            >
              DIGITAR MANUAL
            </button>
          </div>
        </motion.button>
      </motion.section>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-4">
        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ y: -4, scale: 1.02 }}
          onClick={() => {
            setAction("in");
            setCameraOpen(true);
          }}
          className="bg-black-piano relative overflow-hidden rounded-3xl border-2 border-success/40 px-5 py-7 text-left transition-all hover:border-success hover:shadow-[0_0_40px_rgba(34,197,94,0.3)] group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-success/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-success/20 mb-4 ring-1 ring-success/50">
              <ArrowDownToLine className="h-7 w-7 text-success drop-shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
            </div>
            <div className="font-mono-tactical text-[11px] font-black uppercase tracking-[0.3em] text-success/60">Entrada</div>
            <div className="text-xl font-black text-success text-glow-success mt-1">REGISTRAR</div>
          </div>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ y: -4, scale: 1.02 }}
          onClick={() => {
            setAction("out");
            setCameraOpen(true);
          }}
          className="bg-black-piano relative overflow-hidden rounded-3xl border-2 border-danger/40 px-5 py-7 text-left transition-all hover:border-danger hover:shadow-[0_0_40px_rgba(239,68,68,0.3)] group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-danger/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-danger/20 mb-4 ring-1 ring-danger/50">
              <ArrowUpFromLine className="h-7 w-7 text-danger drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
            </div>
            <div className="font-mono-tactical text-[11px] font-black uppercase tracking-[0.3em] text-danger/60">Saída</div>
            <div className="text-xl font-black text-danger text-glow-danger mt-1">RETIRADA</div>
          </div>
        </motion.button>
      </div>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.01, y: -2 }}
        transition={{ delay: 0.1 }}
        className="bg-black-piano neon-blue-border grid grid-cols-3 divide-x divide-white/5 rounded-2xl overflow-hidden transition-all"
      >
        {stats.map((s) => (
          <div key={s.label} className="px-3 py-4 text-center group hover:bg-white/10 transition-colors cursor-pointer">
            <div className="font-mono-tactical text-[9px] font-black uppercase tracking-widest text-white/40 group-hover:text-white/60">
              {s.label}
            </div>
            <div className={`font-mono-tactical mt-1.5 text-2xl font-black ${s.color} drop-shadow-[0_0_8px_currentColor] group-hover:scale-110 transition-transform`}>{s.value}</div>
          </div>
        ))}
      </motion.div>

      {/* Activity log */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.01 }}
        transition={{ delay: 0.15 }}
        className="bg-black-piano neon-blue-border rounded-2xl p-5 transition-all group"
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="font-mono-tactical text-[11px] font-black uppercase tracking-[0.4em] text-primary">
            LOG DO TURNO
          </div>
          <div className="font-mono-tactical text-[10px] font-black uppercase tracking-widest text-white/30 bg-white/5 px-2 py-0.5 rounded border border-white/5 group-hover:border-primary/40 group-hover:text-primary transition-all">
            {movements.length} EVENTOS
          </div>
        </div>
        <div className="relative space-y-1">
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
          {myMovementsToday.slice(0, 10).map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="relative flex items-start gap-3 py-2"
            >
              <div
                className={`relative z-10 mt-1.5 h-3.5 w-3.5 rounded-full ring-2 ring-background ${
                  m.type === "in" ? "bg-success shadow-glow-success" : "bg-danger shadow-glow-danger"
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm text-foreground">{m.product?.name || "Item Indefinido"}</span>
                  <span className="font-mono-tactical text-[10px] text-muted-foreground">
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="font-mono-tactical mt-0.5 flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                  <span className={m.type === "in" ? "text-success" : "text-danger"}>
                    {m.type === "in" ? "ENTRADA" : "SAÍDA"}
                  </span>
                  <span>·</span>
                  <span>IMEI {m.product?.imei || "—"}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <AnimatePresence>
        {action && (
          <RegisterModal 
            action={action} 
            initialImei={scannedImei}
            onClose={() => {
              setAction(null);
              setScannedImei("");
            }} 
            onSubmit={handleSubmit} 
          />
        )}
      </AnimatePresence>

      <CameraView
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        title="Leitor de Código de Barras"
        mode="scan"
        onScan={handleScan}
      />

      <ManualInputModal 
        open={manualInputOpen} 
        onClose={() => setManualInputOpen(false)} 
        onConfirm={handleScan} 
      />
    </div>
  );
};

interface RegisterModalProps {
  action: "in" | "out";
  initialImei?: string;
  onClose: () => void;
  onSubmit: (product: string, imei: string, qty: number) => void;
}

const RegisterModal = ({ action, initialImei, onClose, onSubmit }: RegisterModalProps) => {
  const { products } = useStore();
  const existing = products.find(p => p.imei === initialImei || p.sku === initialImei);
  
  const [product, setProduct] = useState(existing?.name || "");
  const [imei, setImei] = useState(initialImei || "");
  const [quantity, setQuantity] = useState("1");
  const [imei2, setImei2] = useState("");
  const [showImei2, setShowImei2] = useState(false);
  const [scannerOpen, setScannerOpen] = useState<"imei1" | "imei2" | null>(null);

  // Synchronize state when initialImei changes (e.g. after a scan while modal is open)
  useEffect(() => {
    if (initialImei) {
      const found = products.find(p => p.imei === initialImei || p.sku === initialImei);
      if (found) {
        setProduct(found.name);
        // TACTICAL FIX: If identified by SKU, we store it but allow imei field to be empty for new entry
        // On Stock Out, we MUST ensure the identifier reaches the handleSubmit
        if (found.sku === initialImei && found.imei !== initialImei) {
          setImei(""); // Clear for visual UI, but initialImei is still in the parent state
        } else {
          setImei(initialImei);
        }
      } else {
        setImei(initialImei);
      }
    }
  }, [initialImei, products]);

  const isIn = action === "in";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 backdrop-blur-md sm:items-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 40, opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        className={`bg-black-piano relative w-full max-w-md overflow-hidden rounded-t-[2.5rem] border-[3px] sm:rounded-[2.5rem] ${
          isIn ? "neon-green-border shadow-[0_0_50px_rgba(34,197,94,0.3)]" : "neon-red-border shadow-[0_0_50px_rgba(239,68,68,0.3)]"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border/40 px-5 py-4">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                isIn ? "bg-success/15 text-success" : "bg-danger/15 text-danger"
              }`}
            >
              {isIn ? <ArrowDownToLine className="h-4 w-4" /> : <ArrowUpFromLine className="h-4 w-4" />}
            </div>
            <div>
              <div className="font-mono-tactical text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                Registro físico
              </div>
              <div className={`text-base font-bold ${isIn ? "text-success" : "text-danger"}`}>
                {isIn ? "DAR ENTRADA" : "DAR SAÍDA"}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {/* Inputs */}
          <Field icon={Tag} label="Nome / Especificação">
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                placeholder="Xiaomi Redmi Note 13 Pro+ · 512GB · Aurora Purple"
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
              />
              {product.toLowerCase().includes("redmi") && (
                <div className="flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-[8px] font-black text-primary ring-1 ring-primary/30">
                  <Package className="h-2.5 w-2.5" />
                  CADASTRADO
                </div>
              )}
            </div>
          </Field>

          <Field 
            icon={Hash} 
            label="IMEI / Serial Principal" 
            mono 
            trailing={
              <button 
                onClick={() => setShowImei2(!showImei2)}
                className={`font-mono-tactical text-[8px] font-black px-2 py-0.5 rounded border transition-all ${
                  showImei2 ? "bg-primary text-black border-primary" : "text-white/40 border-white/20 hover:border-primary/60 hover:text-primary"
                }`}
              >
                {showImei2 ? "- REMOVER 2º" : "+ ADICIONAR 2º"}
              </button>
            }
          >
            <div className="flex items-center gap-2">
              <input
                value={imei}
                onChange={(e) => setImei(e.target.value)}
                placeholder="Ex: 352841098..."
                className="font-mono-tactical w-full bg-transparent text-sm tracking-wider text-foreground outline-none placeholder:text-muted-foreground/60"
              />
              <button 
                onClick={() => setScannerOpen("imei1")}
                className="text-primary hover:text-primary/80 transition-all active:scale-90"
              >
                <ScanLine className="h-5 w-5 drop-shadow-glow-cyan" />
              </button>
            </div>
          </Field>

          <AnimatePresence>
            {showImei2 && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 12 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="overflow-hidden"
              >
                <Field icon={Hash} label="IMEI / Serial Secundário" mono>
                  <div className="flex items-center gap-2">
                    <input
                      value={imei2}
                      onChange={(e) => setImei2(e.target.value)}
                      placeholder="Ex: 352841098..."
                      className="font-mono-tactical w-full bg-transparent text-sm tracking-wider text-foreground outline-none placeholder:text-muted-foreground/60"
                    />
                    <button 
                      onClick={() => setScannerOpen("imei2")}
                      className="text-primary hover:text-primary/80 transition-all active:scale-90"
                    >
                      <ScanLine className="h-5 w-5 drop-shadow-glow-cyan" />
                    </button>
                  </div>
                </Field>
              </motion.div>
            )}
          </AnimatePresence>

          <CameraView
            open={!!scannerOpen}
            onClose={() => setScannerOpen(null)}
            title={`Escanear ${scannerOpen === 'imei1' ? 'IMEI 1' : 'IMEI 2'}`}
            mode="scan"
            onScan={(code) => {
              if (scannerOpen === 'imei1') setImei(code);
              else if (scannerOpen === 'imei2') setImei2(code);
              setScannerOpen(null);
            }}
          />

          <Field icon={Package} label="Quantidade (Lote)">
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                onBlur={() => {
                  if (!quantity || parseInt(quantity) < 1) setQuantity("1");
                }}
                className="w-full bg-transparent text-sm font-black text-primary outline-none"
              />
              <div className="flex gap-1">
                {[5, 10].map(n => (
                  <button key={n} onClick={() => setQuantity(n.toString())} className="rounded bg-primary/10 px-2 py-1 text-[8px] font-black text-primary">+{n}</button>
                ))}
              </div>
            </div>
          </Field>

          {/* Unit Preview - Visibility for 'Zeroing' Stock */}
          {!isIn && product && (
            <div className="rounded-2xl bg-white/[0.02] p-4 ring-1 ring-white/5 border border-white/5">
              <div className="font-mono-tactical mb-2 text-[8px] font-black uppercase tracking-[0.2em] text-white/20">STATUS DO INVENTÁRIO</div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white/60">Disponíveis para este modelo:</span>
                <span className="font-mono-tactical text-xs font-black text-primary">
                  {products.filter(p => p.status === 'in_stock' && (p.name || "").toLowerCase().includes(product.toLowerCase())).length} UN
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={onClose}
              className="glass-panel flex-1 rounded-xl py-3 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </button>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => onSubmit(product, imei || initialImei || "", parseInt(quantity) || 1)}
              className={`btn-tactical flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold ${
                isIn
                  ? "bg-success text-success-foreground shadow-glow-success"
                  : "bg-danger text-danger-foreground shadow-glow-danger"
              }`}
            >
              <Check className="h-4 w-4" />
              CONFIRMAR
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const Field = ({
  icon: Icon,
  label,
  children,
  mono = false,
  trailing,
}: {
  icon: typeof ScanLine;
  label: string;
  children: React.ReactNode;
  mono?: boolean;
  trailing?: React.ReactNode;
}) => (
  <div className="rounded-xl border border-border/60 bg-background/40 px-3 py-2.5 transition-colors focus-within:border-primary/60 focus-within:shadow-[0_0_15px_hsl(180_100%_50%/0.25)]">
    <div className="font-mono-tactical mb-1 flex items-center justify-between gap-1.5 text-[9px] uppercase tracking-widest text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      {trailing}
    </div>
    {children}
  </div>
);
