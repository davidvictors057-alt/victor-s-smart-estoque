import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Boxes, Filter, MoreVertical, Package, Zap, ArrowRight, X, Camera, ChevronRight, ScanLine } from "lucide-react";
import { CameraView } from "@/components/CameraView";
import { toast } from "sonner";
import { AIVisionAudit } from "@/components/AIVisionAudit";

import { useStore } from "@/store/useStore";
import { CatalogExport } from "@/components/CatalogExport";
import { AIProductInsight } from "@/components/AIProductInsight";

export const StockView = () => {
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [viewItem, setViewItem] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [insightOpen, setInsightOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const { products, deleteProduct, updateProduct } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [camOpen, setCamOpen] = useState(false);

  // Group products by name to calculate stock (ONLY IN_STOCK)
  const groupedProducts = (products || []).reduce((acc, p) => {
    if (p.status !== 'in_stock') return acc;
    
    // Normalize key to avoid issues with case or spaces
    const nameNorm = (p.name || "Sem Nome").trim().toLowerCase();
    const specNorm = (p.spec || "Normal").trim().toLowerCase();
    const key = `${nameNorm}-${specNorm}`;
    
    if (!acc[key]) {
      acc[key] = { ...p, stock: 0 };
    }
    acc[key].stock += 1;
    return acc;
  }, {} as Record<string, any>);

  const items = Object.values(groupedProducts);
  const filtered = items.filter((i: any) => i.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="space-y-4 px-3 pb-24">
      {/* Search Header - Tactical Refinement */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black-piano neon-blue-border flex items-center gap-3 rounded-2xl px-4 py-3.5 shadow-lg"
      >
        <Search className="h-5 w-5 text-primary/60" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rastrear item no inventário..."
          className="flex-1 bg-transparent font-black text-sm text-white outline-none placeholder:text-white/10"
        />
        <button
          onClick={() => setAuditOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-primary hover:bg-white/10 transition-all"
        >
          <ScanLine className="h-4 w-4" />
        </button>
      </motion.div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        whileHover={{ scale: 1.01, y: -2 }}
        onClick={() => setAddOpen(true)}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-black-piano neon-blue-border flex w-full items-center justify-center gap-3 rounded-2xl py-5 text-sm font-black text-primary shadow-glow-cyan border-[3px] border-primary/20 hover:border-primary transition-all"
      >
        <Plus className="h-5 w-5" />
        ADICIONAR NOVO PRODUTO
      </motion.button>

      {/* Export Module */}
      <CatalogExport products={filtered} filterQuery={query} />

      {/* Stock List Section - Tactical Refinement */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-black-piano neon-blue-border rounded-[2rem] p-4 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between px-1">
          <div className="flex items-center gap-2 font-mono-tactical text-[10px] font-black uppercase tracking-[0.2em] text-primary">
            <Boxes className="h-4 w-4" />
            INVENTÁRIO ({filtered.length})
          </div>
          <span className="font-mono-tactical text-[9px] font-black text-white/20 uppercase tracking-widest">
            {products.filter(p => p.status === 'in_stock').length} UN EM ESTOQUE
          </span>
        </div>

        <div className="space-y-4">
          {filtered.map((it, i) => {
            const isLow = it.stock <= 5;
            return (              <motion.div
                key={it.name + it.spec}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`group flex items-center gap-3 rounded-2xl p-3 ring-1 transition-all cursor-pointer ${
                  it.stock <= 1 
                    ? "bg-danger/10 ring-danger/30 hover:bg-danger/20" 
                    : "bg-white/[0.02] ring-white/5 hover:bg-white/[0.05]"
                }`}
                onClick={() => {
                  setSelectedProduct(it);
                  setInsightOpen(true);
                }}
              >
                {/* Imagem Compacta */}
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-black border border-white/5">
                  <img src={it.image_url || "/products/placeholder.png"} alt={it.name} className="h-full w-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                  {isLow && <div className="absolute inset-0 bg-danger/10" />}
                </div>
                
                {/* Info Principal */}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-black text-white group-hover:text-primary transition-colors tracking-tight leading-tight">
                    {it.name}
                  </div>
                  <div className="font-mono-tactical text-[8px] font-black uppercase tracking-widest text-white/20 truncate">
                    {it.spec}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 px-2 border-r border-white/5 min-w-[70px]">
                  <span className={`font-mono-tactical text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                    it.stock === 1 
                      ? "bg-danger text-white shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-pulse" 
                      : it.stock <= 5 
                        ? "bg-danger/50 text-white" 
                        : "text-success"
                  }`}>
                    {it.stock === 1 ? "CRÍTICO" : `${it.stock} UN`}
                  </span>
                  {(() => {
                    const lastUpdate = new Date(it.updated_at || Date.now());
                    const diffDays = Math.ceil((new Date().getTime() - lastUpdate.getTime()) / (1000 * 3600 * 24));
                    return diffDays >= 30 ? (
                      <span className="font-mono-tactical text-[7px] font-black uppercase px-1 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        FRIO ({diffDays}D)
                      </span>
                    ) : null;
                  })()}
                  <span className="font-mono-tactical text-[10px] font-black text-white/40">
                    R${it.sale}
                  </span>
                </div>

                {/* Ações */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedItem(it);
                  }}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-white/20 hover:bg-primary/20 hover:text-primary transition-all"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      <AnimatePresence mode="wait">
        {addOpen && <AddProductModal onClose={() => setAddOpen(false)} />}
        
        {selectedItem && !isEditing && (
          <ActionSheet 
            key="action-sheet"
            item={selectedItem} 
            onClose={() => setSelectedItem(null)} 
            onEdit={() => setIsEditing(true)}
            onDelete={async () => {
              const confirmDelete = window.confirm(`Deseja excluir permanentemente todas as ${selectedItem.stock} unidades de ${selectedItem.name}?`);
              if (confirmDelete) {
                const toastId = toast.loading("Removendo do estoque...");
                try {
                  const targets = products.filter(p => p.name === selectedItem.name && p.spec === selectedItem.spec);
                  for (const p of targets) {
                    await deleteProduct(p.id);
                  }
                  setSelectedItem(null);
                  toast.success("Estoque removido com sucesso", { id: toastId });
                } catch (err) {
                  toast.error("Erro ao remover itens", { id: toastId });
                }
              }
            }}
            onCamera={() => setCamOpen(true)}
          />
        )}

        {isEditing && selectedItem && (
          <EditProductModal 
            key="edit-modal"
            item={selectedItem} 
            onClose={() => {
              setIsEditing(false);
              setSelectedItem(null);
            }} 
          />
        )}

        {viewItem && (
          <ProductViewModal 
            item={viewItem} 
            onClose={() => setViewItem(null)} 
          />
        )}
      </AnimatePresence>

      <AIProductInsight 
        product={selectedProduct}
        isOpen={insightOpen}
        onClose={() => setInsightOpen(false)}
      />
      <AIVisionAudit 
        isOpen={auditOpen} 
        onClose={() => setAuditOpen(false)} 
      />
      <CameraView 
        open={camOpen} 
        onClose={() => setCamOpen(false)} 
        title="Atualizar Foto" 
        mode="photo" 
        onCapture={async (url) => {
          const targets = products.filter(p => p.name === selectedItem.name && p.spec === selectedItem.spec);
          for (const p of targets) {
            await updateProduct(p.id, { image_url: url });
          }
          setCamOpen(false);
          setSelectedItem(null);
          toast.success("Foto atualizada em lote");
        }}
      />
      <CameraView open={scanOpen} onClose={() => setScanOpen(false)} title="Busca Tática" mode="scan" />
    </div>
  );
};

const AddProductModal = ({ onClose }: { onClose: () => void }) => {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [imei, setImei] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [camOpen, setCamOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [brand, setBrand] = useState("Geral");
  const [category, setCategory] = useState("Geral");
  const [cost, setCost] = useState(0);
  const [sale, setSale] = useState(0);
  const [spec, setSpec] = useState("Novo");
  
  const { addProduct, products } = useStore();

  useEffect(() => {
    if (sku || imei) {
      const existing = products.find(p => 
        (sku && p.sku === sku) || (imei && p.imei === imei)
      );
      if (existing) {
        setName(existing.name);
        setBrand(existing.brand || "Geral");
        setCategory(existing.category || "Geral");
        setCost(existing.cost || 0);
        setSale(existing.sale || 0);
        setSpec(existing.spec || "Novo");
        if (existing.image_url) setPhoto(existing.image_url);
        toast.info(`Dados auto-preenchidos: ${existing.name}`, {
          icon: <Zap className="h-4 w-4 text-primary" />
        });
      }
    }
  }, [sku, imei, products]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl"
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="bg-black-piano neon-blue-border fixed inset-x-0 bottom-0 z-50 max-h-[95vh] overflow-y-auto rounded-t-[3.5rem] p-10 shadow-[0_0_100px_rgba(0,163,255,0.4)]"
      >
        <div className="mx-auto mb-10 h-1.5 w-20 rounded-full bg-white/10" />
        
        <div className="mb-10 flex items-center justify-between">
          <div>
            <div className="font-mono-tactical text-[12px] font-black uppercase tracking-[0.5em] text-primary">
              MÓDULO DE REGISTRO
            </div>
            <div className="text-3xl font-black text-white tracking-tighter">Entrada de Item</div>
          </div>
          <button onClick={onClose} className="h-14 w-14 rounded-full bg-white/5 flex items-center justify-center text-white/30 hover:bg-white/10 hover:text-white transition-all shadow-xl">
            <X className="h-7 w-7" />
          </button>
        </div>

        <div className="space-y-8">
          <button
            type="button"
            onClick={() => setCamOpen(true)}
            className="bg-black-piano neon-blue-border group relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-[2.5rem] border-3 border-dashed border-primary/20 hover:border-primary transition-all shadow-inner"
          >
            {photo ? (
              <img src={photo} alt="Produto" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-4 text-white/10 group-hover:text-primary transition-all">
                <Camera className="h-16 w-16" />
                <span className="font-mono-tactical text-[11px] font-black uppercase tracking-[0.4em]">CAPTURA DE IMAGEM</span>
              </div>
            )}
            <div className="tactical-corner absolute inset-8 opacity-20 group-hover:opacity-100 transition-opacity" />
          </button>

          <div className="space-y-6">
            <div className="group rounded-[2rem] bg-white/[0.03] p-6 ring-2 ring-white/5 focus-within:ring-primary/50 transition-all shadow-xl border-b border-white/5">
              <div className="font-mono-tactical mb-3 text-[10px] font-black uppercase tracking-[0.3em] text-white/20 group-focus-within:text-primary">NOME DO MODELO</div>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Xiaomi Redmi 13C..."
                className="w-full bg-transparent font-black text-lg text-white outline-none placeholder:text-white/5"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="group rounded-[2rem] bg-white/[0.03] p-6 ring-2 ring-white/5 focus-within:ring-primary/50 transition-all shadow-xl border-b border-white/5">
                <div className="font-mono-tactical mb-3 text-[10px] font-black uppercase tracking-[0.3em] text-white/20 group-focus-within:text-primary">SKU / CÓDIGO</div>
                <input
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="BIPE AQUI"
                  className="font-mono-tactical w-full bg-transparent font-black text-sm tracking-[0.2em] text-primary outline-none placeholder:text-white/5"
                />
              </div>
              <div className="group rounded-[2rem] bg-white/[0.03] p-6 ring-2 ring-white/5 focus-within:ring-primary/50 transition-all shadow-xl border-b border-white/5">
                <div className="font-mono-tactical mb-3 text-[10px] font-black uppercase tracking-[0.3em] text-white/20 group-focus-within:text-primary">IMEI (OPCIONAL)</div>
                <input
                  value={imei}
                  onChange={(e) => setImei(e.target.value)}
                  placeholder="123456..."
                  className="font-mono-tactical w-full bg-transparent font-black text-sm tracking-[0.2em] text-white outline-none placeholder:text-white/5"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="group rounded-[2rem] bg-white/[0.03] p-6 ring-2 ring-white/5 focus-within:ring-primary/50 transition-all shadow-xl border-b border-white/5">
                <div className="font-mono-tactical mb-3 text-[10px] font-black uppercase tracking-[0.3em] text-white/20 group-focus-within:text-primary">QUANTIDADE</div>
                <div className="flex items-center gap-4">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:bg-white/10">-</button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="font-mono-tactical w-full bg-transparent text-center font-black text-lg text-primary outline-none"
                  />
                  <button onClick={() => setQuantity(quantity + 1)} className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary hover:bg-primary/30">+</button>
                </div>
              </div>
              <div className="group rounded-[2rem] bg-white/[0.03] p-6 ring-2 ring-white/5 focus-within:ring-primary/50 transition-all shadow-xl border-b border-white/5">
                <div className="font-mono-tactical mb-3 text-[10px] font-black uppercase tracking-[0.3em] text-white/20 group-focus-within:text-primary">VALOR VENDA (OPC)</div>
                <input
                  type="number"
                  value={sale}
                  onChange={(e) => setSale(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="font-mono-tactical w-full bg-transparent font-black text-sm tracking-[0.2em] text-white outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-5 pt-6">
            <button
              onClick={onClose}
              className="flex-1 rounded-[2rem] bg-white/5 py-6 text-sm font-black uppercase tracking-widest text-white/30 hover:bg-white/10 transition-all border border-white/5"
            >
              CANCELAR
            </button>
            <button
              onClick={async () => {
                if (!name || !sku) {
                  toast.error("Nome e SKU são obrigatórios");
                  return;
                }
                try {
                  const toastId = toast.loading(`Registrando ${quantity} item(s)...`);
                  await addProduct({
                    name,
                    sku,
                    imei: (imei || "N/A"),
                    spec,
                    brand,
                    category,
                    cost,
                    sale,
                    status: 'in_stock',
                    image_url: photo,
                    quantity: quantity // Store handles the loop
                  });
                  toast.success(`${quantity} item(s) processado(s)`, { description: name, id: toastId });
                  onClose();
                } catch (err) {
                  toast.error("Erro ao adicionar itens");
                }
              }}
              className="flex-1 rounded-[2rem] bg-primary py-6 text-sm font-black uppercase tracking-widest text-black shadow-glow-cyan transition-all hover:scale-105 active:scale-95"
            >
              FINALIZAR REGISTRO
            </button>
          </div>
        </div>

        <CameraView open={camOpen} onClose={() => setCamOpen(false)} title="Terminal Óptico" mode="photo" onCapture={setPhoto} />
      </motion.div>
    </>
  );
};

const ActionSheet = ({ item, onClose, onEdit, onDelete, onCamera }: any) => (
  <>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md"
    />
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      className="bg-black-piano neon-blue-border fixed inset-x-0 bottom-0 z-[70] rounded-t-[3rem] p-8 shadow-[0_-20px_60px_rgba(0,163,255,0.3)]"
    >
      <div className="mx-auto mb-6 h-1.5 w-16 rounded-full bg-white/10" />
      <div className="mb-8 flex items-center gap-4">
        <div className="h-16 w-16 overflow-hidden rounded-2xl bg-black border border-white/10">
          <img src={item.image_url} alt="" className="h-full w-full object-cover opacity-60" />
        </div>
        <div>
          <div className="text-xl font-black text-white">{item.name}</div>
          <div className="font-mono-tactical text-[10px] uppercase tracking-widest text-primary">{item.stock} UNIDADES NO SISTEMA</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <button onClick={onEdit} className="flex w-full items-center gap-4 rounded-2xl bg-white/5 p-5 text-left transition-all hover:bg-white/10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary"><Zap className="h-5 w-5" /></div>
          <div>
            <div className="text-sm font-black text-white">EDITAR DADOS</div>
            <div className="text-[10px] text-white/30">Alterar nome, preços ou especificações</div>
          </div>
          <ChevronRight className="ml-auto h-5 w-5 text-white/10" />
        </button>

        <button onClick={onCamera} className="flex w-full items-center gap-4 rounded-2xl bg-white/5 p-5 text-left transition-all hover:bg-white/10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/20 text-success"><Camera className="h-5 w-5" /></div>
          <div>
            <div className="text-sm font-black text-white">TROCAR FOTO</div>
            <div className="text-[10px] text-white/30">Atualizar imagem em todo o estoque</div>
          </div>
          <ChevronRight className="ml-auto h-5 w-5 text-white/10" />
        </button>

        <button onClick={onDelete} className="flex w-full items-center gap-4 rounded-2xl bg-danger/10 p-5 text-left transition-all hover:bg-danger/20">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger/20 text-danger"><X className="h-5 w-5" /></div>
          <div>
            <div className="text-sm font-black text-danger">EXCLUIR ESTOQUE</div>
            <div className="text-[10px] text-danger/40">Remover permanentemente do sistema</div>
          </div>
          <ChevronRight className="ml-auto h-5 w-5 text-danger/20" />
        </button>
      </div>

      <button onClick={onClose} className="mt-6 w-full py-4 text-sm font-black text-white/20 uppercase tracking-widest">CANCELAR OPERAÇÃO</button>
    </motion.div>
  </>
);

const EditProductModal = ({ item, onClose }: any) => {
  const { products, updateProduct } = useStore();
  const [name, setName] = useState(item.name);
  const [cost, setCost] = useState(item.cost.toString());
  const [sale, setSale] = useState(item.sale.toString());
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    const toastId = toast.loading("Atualizando estoque...");
    try {
      const targets = products.filter(p => p.name === item.name && p.spec === item.spec);
      for (const p of targets) {
        await updateProduct(p.id, {
          name,
          cost: parseFloat(cost),
          sale: parseFloat(sale)
        });
      }
      toast.success("Dados atualizados em lote!", { id: toastId });
      onClose();
    } catch (err) {
      toast.error("Erro na atualização", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-black-piano neon-blue-border w-full max-w-lg rounded-[2.5rem] p-8"
      >
        <div className="mb-8">
          <div className="font-mono-tactical text-[10px] font-black text-primary tracking-[0.4em] uppercase">MÓDULO DE EDIÇÃO</div>
          <div className="text-2xl font-black text-white">Ajuste de Catálogo</div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 focus-within:ring-primary">
            <label className="font-mono-tactical block text-[9px] font-black text-white/30 uppercase mb-2">NOME DO MODELO</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-transparent font-bold text-white outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 focus-within:ring-primary">
              <label className="font-mono-tactical block text-[9px] font-black text-white/30 uppercase mb-2">CUSTO (R$)</label>
              <input type="number" value={cost} onChange={e => setCost(e.target.value)} className="w-full bg-transparent font-bold text-white outline-none" />
            </div>
            <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 focus-within:ring-primary">
              <label className="font-mono-tactical block text-[9px] font-black text-white/30 uppercase mb-2">VENDA (R$)</label>
              <input type="number" value={sale} onChange={e => setSale(e.target.value)} className="w-full bg-transparent font-bold text-white outline-none" />
            </div>
          </div>
        </div>

        <div className="mt-10 flex gap-4">
          <button onClick={onClose} className="flex-1 rounded-2xl bg-white/5 py-4 font-black text-white/30 text-xs">CANCELAR</button>
          <button onClick={handleSave} disabled={isSaving} className="flex-1 rounded-2xl bg-primary py-4 font-black text-black text-xs shadow-glow-cyan">SALVAR ALTERAÇÕES</button>
        </div>
      </motion.div>
    </div>
  );
};

const ProductViewModal = ({ item, onClose }: any) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-xl">
    <motion.div 
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-black-piano neon-blue-border w-full max-w-[360px] rounded-[2rem] p-5 sm:p-8 shadow-[0_0_50px_rgba(0,163,255,0.1)] overflow-y-auto max-h-[95vh]"
    >
      <div className="relative mb-5 aspect-square w-full overflow-hidden rounded-3xl bg-black border border-white/5">
        <img src={item.image_url || "/products/placeholder.png"} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4">
          <div className="flex items-center gap-2 rounded-full bg-success/20 px-2 py-0.5 ring-1 ring-success/50 backdrop-blur-md">
            <div className="h-1 w-1 rounded-full bg-success animate-pulse" />
            <span className="text-[8px] font-black text-success uppercase">DISPONÍVEL</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="font-mono-tactical text-[8px] font-black text-white/20 tracking-[0.3em] uppercase">IDENTIFICAÇÃO</div>
          <h2 className="text-xl sm:text-2xl font-black text-white leading-tight uppercase">{item.name}</h2>
          <p className="font-mono-tactical text-[10px] text-primary mt-1 uppercase tracking-widest">{item.spec} · {item.brand || "Geral"}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
            <div className="font-mono-tactical text-[8px] font-black text-white/30 uppercase mb-1">ESTOQUE</div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-white">{item.stock}</span>
              <span className="text-[8px] font-bold text-white/20 uppercase">UN</span>
            </div>
          </div>
          <div className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
            <div className="font-mono-tactical text-[8px] font-black text-white/30 uppercase mb-1">VALOR VENDA</div>
            <div className="flex items-baseline gap-1">
              <span className="text-[8px] font-bold text-white/40">R$</span>
              <span className="text-lg font-black text-primary">{item.sale || "0.00"}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white/5 p-3 border-l-2 border-primary/50">
          <div className="font-mono-tactical text-[8px] font-black text-white/30 uppercase">CÓDIGO SKU / IMEI</div>
          <div className="font-mono-tactical text-[10px] font-bold text-white tracking-widest truncate">{item.sku || item.imei || "N/A"}</div>
        </div>
      </div>

      <button 
        onClick={onClose}
        className="mt-6 w-full rounded-2xl bg-white/5 py-4 font-black text-white/40 text-[10px] uppercase tracking-[0.2em] hover:bg-white/10 transition-all border border-white/5"
      >
        FECHAR
      </button>
    </motion.div>
  </div>
);
