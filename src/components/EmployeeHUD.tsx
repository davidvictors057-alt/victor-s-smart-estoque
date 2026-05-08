import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScanLine, ArrowDownToLine, ArrowUpFromLine, Camera, Hash, Tag, X, Check, Image as ImageIcon, Package, Plus, Minus, Cpu, DollarSign, Search, Keyboard } from "lucide-react";
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
  const [lastScannedCode, setLastScannedCode] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [manualInputOpen, setManualInputOpen] = useState(false);

  const { catalog } = useStore();

  const filteredCatalog = useMemo(() => {
    const queryTerms = searchQuery.toLowerCase().split(" ").filter(t => t);
    const itemsMap = new Map<string, any>();

    // Função para normalizar e criar a chave de identidade
    const getIdentityKey = (name: string, spec: string) => {
      const n = (name || "Sem Nome").trim().toLowerCase();
      const s = (spec || "").trim().toLowerCase();
      return `${n}@@@${s}`;
    };

    // 1. Processar Catálogo
    catalog.forEach(item => {
      const key = getIdentityKey(item.name, item.spec || "");
      if (!itemsMap.has(key)) {
        itemsMap.set(key, {
          name: item.name,
          spec: item.spec,
          skus: new Set([item.sku]),
          internal_codes: new Set(item.internal_code ? [item.internal_code] : []),
          image_url: item.image_url,
          cost: item.cost,
          sale: item.sale
        });
      } else {
        const existing = itemsMap.get(key);
        existing.skus.add(item.sku);
        if (item.internal_code) existing.internal_codes.add(item.internal_code);
        if (!existing.image_url && item.image_url) existing.image_url = item.image_url;
      }
    });

    // 2. Processar Produtos no Estoque (para SKUs não catalogados)
    products.forEach(p => {
      if (p.status !== 'in_stock') return;
      const key = getIdentityKey(p.name, p.spec || "");
      if (!itemsMap.has(key)) {
        itemsMap.set(key, {
          name: p.name,
          spec: p.spec,
          skus: new Set(p.sku ? [p.sku] : []),
          internal_codes: new Set(p.internal_code ? [p.internal_code] : []),
          image_url: p.image_url,
          cost: p.cost,
          sale: p.sale
        });
      } else {
        const existing = itemsMap.get(key);
        if (p.sku) existing.skus.add(p.sku);
        if (p.internal_code) existing.internal_codes.add(p.internal_code);
      }
    });

    return Array.from(itemsMap.values())
      .map(item => {
        const skusArray = Array.from(item.skus as Set<string>);
        
        // Calcular estoque individual por SKU
        const skusWithStock = skusArray.map(s => ({
          sku: s,
          stock: products.filter(p => p.sku === s && p.status === 'in_stock').length
        }));

        // Estoque total (soma de todos os SKUs)
        const totalStock = skusWithStock.reduce((acc, curr) => acc + curr.stock, 0);

        return {
          ...item,
          sku: skusArray[0] || "", 
          allSkus: skusArray,
          skusWithStock,
          stockCount: totalStock
        };
      })
      .filter(item => {
        const cleanTerm = searchQuery.toLowerCase().replace(/[\s\.]/g, '');
        if (!cleanTerm) return true;

        const nameClean = item.name.toLowerCase().replace(/[\s\.]/g, '');
        const specClean = (item.spec || "").toLowerCase().replace(/[\s\.]/g, '');
        const skusClean = item.allSkus.map((s: string) => s.toLowerCase().replace(/[\s\.]/g, '')).join(" ");
        const internalClean = Array.from(item.internal_codes as Set<string> || []).map((c: string) => c.toLowerCase().replace(/[\s\.]/g, '')).join(" ");
        
        const searchPool = `${nameClean} ${specClean} ${skusClean} ${internalClean}`;
        return searchPool.includes(cleanTerm);
      })
      .sort((a, b) => b.stockCount - a.stockCount);
  }, [searchQuery, catalog, products]);

  const todayStr = new Date().toISOString().split('T')[0];
  const myMovementsToday = movements.filter(m => m.operator_id === currentUser?.id && m.timestamp?.startsWith(todayStr));
  
  const stats = [
    { label: "Seus Bipes", value: myMovementsToday.length.toString(), color: "text-primary" },
    { label: "Entradas", value: myMovementsToday.filter(m => m.type === 'in').length.toString(), color: "text-success" },
    { label: "Saídas", value: myMovementsToday.filter(m => m.type === 'out').length.toString(), color: "text-danger" },
  ];

  const handleSubmit = async (productName: string, sku: string, imei: string, qty: number = 1, spec: string = "", cost: number = 0, sale: number = 0) => {
    if (!productName) {
      toast.error("Nome do produto é obrigatório.");
      return;
    }
    if (!action || !currentUser) return;
    
    const toastId = toast.loading(`Processando ${qty} unidades...`);
    try {
      if (action === "in") {
          // AUTO-HEAL: Busca imagem no catálogo se não houver no input
          const catalogItem = useStore.getState().catalog.find(c => 
            c.sku === (sku || imei) || (c.internal_code && c.internal_code === (sku || imei))
          );

          await addProduct({
            name: productName,
            sku: sku || imei,
            imei: imei.trim() || null,
            imei2: null,
            quantity: qty,
            status: 'in_stock',
            brand: "Geral",
            category: "Smartphone",
            spec: spec || "Padrão",
            cost: cost || 0,
            sale: sale || 0,
            image_url: catalogItem?.image_url || "" 
          });
      } else {
        // --- LÓGICA DE SAÍDA TÁTICA (MODO TANTO FAZ) ---
        const normInput = (sku || imei || "").trim();
        const normName = productName?.trim().toLowerCase() || "";

        let potentialTargets = products.filter(p => p.status === 'in_stock');

        // 1. Filtrar por Identificador (Se houver bip)
        if (normInput) {
          potentialTargets = potentialTargets.filter(p => 
            p.imei === normInput || p.sku === normInput || p.internal_code === normInput
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
      setLastScannedCode("");
      toast.success("Operação concluída!", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Erro na operação", { id: toastId });
    }
  };


  const handleScan = (code: string) => {
    setLastScannedCode(code);
    
    // AUTO-FILL SEARCH (DATABASE + CATALOG)
    const existing = products.find(p => p.imei === code || p.sku === code || p.internal_code === code);
    const catalogItem = useStore.getState().catalog.find(c => c.sku === code || c.internal_code === code);
    
    if (existing || catalogItem) {
      const name = existing?.name || catalogItem?.name;
      toast.success(`Produto Identificado: ${name}`, {
        description: "Os dados foram pré-preenchidos.",
      });
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
          <div className="text-[10px] uppercase tracking-[0.2em] text-white mb-0.5">Turno</div>
          <div className="text-sm font-black text-success text-glow-success animate-pulse">ATIVO</div>
        </div>
      </motion.div>

      {/* TACTICAL SEARCH ENGINE */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-20"
      >
        <div className="bg-black-piano neon-blue-border flex items-center gap-3 rounded-2xl px-4 py-3 transition-all focus-within:shadow-[0_0_20px_rgba(0,163,255,0.2)]">
          <Search className="h-5 w-5 text-primary/60" />
          <input
            type="text"
            placeholder="BUSCAR PRODUTO (NOME, COR, MODELO)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent font-mono-tactical text-xs font-black uppercase tracking-widest text-white outline-none placeholder:text-white/20"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="text-white/40 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        <AnimatePresence>
          {searchQuery.trim().length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute inset-x-0 top-full mt-2 overflow-hidden rounded-2xl border-2 border-white/10 bg-[#0a0a0a]/95 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
            >
              <div className="max-h-[350px] overflow-y-auto custom-scrollbar p-2 space-y-1">
                {filteredCatalog.length > 0 ? (
                  filteredCatalog.map((item) => (
                    <motion.button
                      key={item.sku}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setLastScannedCode(item.sku);
                        setAction("out");
                        setSearchQuery("");
                      }}
                      className="flex w-full items-center justify-between rounded-xl p-3 text-left transition-all hover:bg-white/5 active:bg-white/10 group"
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="text-[11px] font-black text-white uppercase tracking-tight leading-tight group-hover:text-primary transition-colors">
                          {item.name}
                        </div>
                        <div className="font-mono-tactical mt-0.5 text-[9px] uppercase tracking-widest text-white/40 flex items-center gap-2">
                          <span className="text-primary/60">{item.spec || "ESPECIFICAÇÃO PADRÃO"}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {item.skusWithStock.map((ss: any) => (
                            <div 
                              key={ss.sku} 
                              onClick={(e) => {
                                e.stopPropagation();
                                setLastScannedCode(ss.sku);
                                setAction("out");
                                setSearchQuery("");
                              }}
                              className="flex items-center gap-1.5 bg-white/5 border border-white/5 px-2 py-0.5 rounded-md hover:bg-primary/20 hover:border-primary/40 transition-colors cursor-pointer"
                            >
                                <span className="text-[7px] font-black text-white/30 tracking-tight">{ss.sku}</span>
                                <span className={`text-[8px] font-black ${ss.stock > 0 ? "text-primary" : "text-white/20"}`}>{ss.stock}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className={`font-mono-tactical text-xs font-black px-2 py-0.5 rounded ${
                          item.stockCount > 0 ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                        }`}>
                          {item.stockCount} UN
                        </div>
                        <div className="text-[7px] font-black text-white/20 uppercase tracking-widest">ESTOQUE</div>
                      </div>
                    </motion.button>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <div className="font-mono-tactical text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
                      Nenhum produto localizado
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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

          <div className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-[100%]">
            <div className="absolute left-0 top-0 h-6 w-6 border-l border-t border-primary/60" />
            <div className="absolute right-0 top-0 h-6 w-6 border-r border-t border-primary/60" />
            <div className="absolute bottom-0 left-0 h-6 w-6 border-b border-l border-primary/60" />
            <div className="absolute bottom-0 right-0 h-6 w-6 border-b border-r border-primary/60" />
            <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/40 shadow-glow-cyan" />
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
            <div className="font-mono-tactical text-[9px] font-black uppercase tracking-widest text-white group-hover:text-white">
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
          <div className="font-mono-tactical text-[10px] font-black uppercase tracking-widest text-white bg-white/5 px-2 py-0.5 rounded border border-white/5 group-hover:border-primary/40 group-hover:text-primary transition-all">
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
        {action && !cameraOpen && (
          <RegisterModal 
            action={action} 
            initialCode={lastScannedCode}
            onClose={() => {
              setAction(null);
              setLastScannedCode("");
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
  initialCode?: string;
  onClose: () => void;
  onSubmit: (product: string, sku: string, imei: string, qty: number, spec: string, cost: number, sale: number) => void;
}

const RegisterModal = ({ action, initialCode, onClose, onSubmit }: RegisterModalProps) => {
  const { products, catalog } = useStore();
  
  // TACTICAL SEARCH: Try stock first, then catalog
  const existingProduct = products.find(p => p.imei === initialCode || p.sku === initialCode || p.internal_code === initialCode);
  const catalogItem = catalog.find(c => c.sku === initialCode || c.internal_code === initialCode);
  
  const [product, setProduct] = useState(existingProduct?.name || catalogItem?.name || "");
  const [sku, setSku] = useState(catalogItem?.sku || existingProduct?.sku || "");
  const [imei, setImei] = useState(existingProduct?.imei || "");
  const [spec, setSpec] = useState(existingProduct?.spec || catalogItem?.spec || "");
  const [cost, setCost] = useState<string>(existingProduct?.cost?.toString() || catalogItem?.cost?.toString() || "");
  const [sale, setSale] = useState<string>(existingProduct?.sale?.toString() || catalogItem?.sale?.toString() || "");
  const [quantity, setQuantity] = useState("1");
  const [imei2, setImei2] = useState("");
  const [showImei2, setShowImei2] = useState(false);
  const [scannerOpen, setScannerOpen] = useState<"sku" | "imei1" | "imei2" | null>(null);

  // Synchronize state when initialCode changes (e.g. after a scan while modal is open)
  useEffect(() => {
    if (initialCode) {
      const found = products.find(p => p.imei === initialCode || p.sku === initialCode || p.internal_code === initialCode);
      const inCatalog = catalog.find(c => c.sku === initialCode || c.internal_code === initialCode);
      
      if (found || inCatalog) {
        setProduct(found?.name || inCatalog?.name || "");
        setSpec(found?.spec || inCatalog?.spec || "");
        setCost(found?.cost?.toString() || inCatalog?.cost?.toString() || "");
        setSale(found?.sale?.toString() || inCatalog?.sale?.toString() || "");
        
        // INTELLIGENT ROUTING
        if (inCatalog || found?.sku === initialCode) {
          setSku(initialCode);
        } else {
          setImei(initialCode);
        }
      } else {
        // Unknown code: If SKU is empty, put it there, otherwise IMEI
        if (!sku) {
          setSku(initialCode);
        } else {
          setImei(initialCode);
        }
      }
    }
  }, [initialCode]);

  const isIn = action === "in";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-end justify-center bg-background/70 backdrop-blur-md sm:items-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className={`bg-black-piano relative w-full h-full sm:h-[95vh] sm:max-w-md flex flex-col overflow-hidden sm:rounded-[2.5rem] border-x-[3px] border-t-[3px] ${
          isIn ? "neon-green-border shadow-[0_0_50px_rgba(34,197,94,0.3)]" : "neon-red-border shadow-[0_0_50px_rgba(239,68,68,0.3)]"
        }`}
      >
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between border-b border-border/40 px-5 py-4 sticky top-0 bg-black-piano z-10">
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
          <Field icon={Tag} label="Nomenclatura">
            <div className="flex items-center gap-2">
              <input
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                placeholder="Xiaomi Redmi Note 13 Pro+"
                className="w-full bg-transparent text-sm text-foreground font-black uppercase italic outline-none placeholder:text-muted-foreground/60"
              />
              {product.toLowerCase().includes("redmi") && (
                <div className="flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-[8px] font-black text-primary ring-1 ring-primary/30">
                  <Package className="h-2.5 w-2.5" />
                  CADASTRADO
                </div>
              )}
            </div>
          </Field>

          <Field icon={Cpu} label="Especificação Técnica">
            <div className="flex items-center gap-2">
              <input
                value={spec}
                onChange={(e) => setSpec(e.target.value)}
                placeholder="Ex: 512GB · 12GB RAM · Aurora Purple"
                className="w-full bg-transparent text-sm text-foreground font-bold uppercase outline-none placeholder:text-muted-foreground/60"
              />
            </div>
          </Field>

          <Field icon={ScanLine} label="SKU / Código do Produto" mono>
            <div className="flex items-center gap-2">
              <input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Ex: SKU-12345"
                className="font-mono-tactical w-full bg-transparent text-sm tracking-wider text-primary outline-none placeholder:text-muted-foreground/60"
              />
              <button 
                onClick={() => setScannerOpen("sku")}
                className="text-primary hover:text-primary/80 transition-all active:scale-90"
              >
                <ScanLine className="h-5 w-5 drop-shadow-glow-cyan" />
              </button>
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
                  showImei2 ? "bg-primary text-black border-primary" : "text-white border-white/20 hover:border-primary/60 hover:text-primary"
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
            title={`Escanear ${scannerOpen === 'sku' ? 'SKU' : scannerOpen === 'imei1' ? 'IMEI 1' : 'IMEI 2'}`}
            mode="scan"
            onScan={(code) => {
              if (scannerOpen === 'sku') setSku(code);
              else if (scannerOpen === 'imei1') setImei(code);
              else if (scannerOpen === 'imei2') setImei2(code);
              setScannerOpen(null);
            }}
          />

          <div className="grid grid-cols-2 gap-3">
            <Field icon={DollarSign} label="Custo Unitário">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-black text-muted-foreground/50">R$</span>
                <input
                  type="number"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="0,00"
                  className="w-full bg-transparent text-sm font-black text-foreground outline-none placeholder:text-muted-foreground/60"
                />
              </div>
            </Field>
            <Field icon={DollarSign} label="Preço Venda">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-black text-muted-foreground/50">R$</span>
                <input
                  type="number"
                  value={sale}
                  onChange={(e) => setSale(e.target.value)}
                  placeholder="0,00"
                  className="w-full bg-transparent text-sm font-black text-primary outline-none placeholder:text-muted-foreground/60"
                />
              </div>
            </Field>
          </div>

          <Field icon={Package} label="Volume de Entrada">
            <div className="flex items-center justify-between bg-white/[0.03] rounded-2xl p-1 border border-white/5">
              <button 
                type="button"
                onClick={() => setQuantity(prev => Math.max(1, (parseInt(prev) || 0) - 1).toString())}
                className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white hover:bg-white/10 hover:text-white transition-all active:scale-90"
              >
                <Minus className="w-5 h-5" />
              </button>
              
              <div className="flex flex-col items-center flex-1">
                <input
                  type="number"
                  inputMode="numeric"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  onBlur={() => {
                    if (!quantity || parseInt(quantity) < 1) setQuantity("1");
                  }}
                  className="w-full bg-transparent text-center text-2xl font-black text-foreground outline-none"
                />
                <span className="text-[7px] font-black text-white uppercase tracking-[0.2em] -mt-1">Unidades</span>
              </div>

              <button 
                type="button"
                onClick={() => setQuantity(prev => ((parseInt(prev) || 0) + 1).toString())}
                className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary hover:bg-primary hover:text-black transition-all active:scale-90 shadow-glow-cyan-sm"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </Field>

          {/* Unit Preview - Visibility for 'Zeroing' Stock */}
          {!isIn && product && (
            <div className="rounded-2xl bg-white/[0.02] p-4 ring-1 ring-white/5 border border-white/5">
              <div className="font-mono-tactical mb-2 text-[8px] font-black uppercase tracking-[0.2em] text-white">STATUS DO INVENTÁRIO</div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Disponíveis para este modelo:</span>
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
              onClick={() => onSubmit(
                product, 
                sku || "", 
                imei || "", 
                parseInt(quantity) || 1,
                spec,
                parseFloat(cost) || 0,
                parseFloat(sale) || 0
              )}
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
