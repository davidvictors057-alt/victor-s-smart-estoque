import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, Search, Boxes, Filter, MoreVertical, Package, Zap, ArrowRight, X, Camera, ChevronRight, ScanLine, Trash2 } from "lucide-react";
import { CameraView } from "@/components/CameraView";
import { toast } from "sonner";
import { AIVisionAudit } from "@/components/AIVisionAudit";

import { useStore } from "@/store/useStore";
import { CatalogExport } from "@/components/CatalogExport";
import { AIProductInsight } from "@/components/AIProductInsight";

import { imageService } from "@/services/imageService";
import { sortSearchResults } from "@/lib/searchUtils";
import { DEFAULT_PLACEHOLDER } from "@/lib/constants";

export const StockView = () => {
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [viewItem, setViewItem] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [insightOpen, setInsightOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const { products, deleteProductsBulk, updateProductsBulk, deleteCatalogItem, currentUser } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [camOpen, setCamOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Group products by name to calculate stock (ONLY IN_STOCK)
  const groupedProducts = (products || []).reduce((acc, p) => {
    if (p.status !== 'in_stock') return acc;

    // Normalize key to avoid issues with case or spaces
    const nameNorm = (p.name || "Sem Nome").trim().toLowerCase();
    const specNorm = (p.spec || "Padrão").trim().toLowerCase();
    const key = `${nameNorm}-${specNorm}`;

    if (!acc[key]) {
      // Tentar buscar imagem no catálogo com busca profunda (SKU -> Nome -> Qualquer correspondência com foto)
      const catalog = useStore.getState().catalog;
      const bestImage = p.image_url ||
        catalog.find(c => c.sku === p.sku && c.image_url)?.image_url ||
        catalog.find(c => c.name === p.name && c.image_url)?.image_url;

      acc[key] = {
        ...p,
        image_url: bestImage || null,
        stock: 0,
        allSkus: new Set<string>(),
        internal_codes: new Set<string>(p.internal_code ? [p.internal_code] : [])
      };
    }
    acc[key].stock += 1;
    if (p.sku) acc[key].allSkus.add(p.sku);
    if (p.internal_code) {
      if (!acc[key].internal_codes) acc[key].internal_codes = new Set<string>();
      acc[key].internal_codes.add(p.internal_code);
    }
    return acc;
  }, {} as Record<string, any>);

  const items = Object.values(groupedProducts);
  const filtered = useMemo(() => {
    const searchableItems = items.map(it => ({
      ...it,
      sku: it.allSkus,
      internal_code: it.internal_codes
    }));
    return sortSearchResults(searchableItems, query);
  }, [items, query]);

  return (
    <div className="space-y-4 px-3 pb-24">
      {/* Search Header - Tactical Refinement */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black-piano neon-blue-border flex items-center gap-3 rounded-2xl px-4 py-3.5 shadow-lg"
      >
        <Search className="h-5 w-5 text-primary" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rastrear item no inventário..."
          className="flex-1 bg-transparent font-black text-sm text-white outline-none placeholder:text-white"
        />
        <button
          onClick={() => setAuditOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-primary hover:bg-white/10 transition-all"
        >
          <ScanLine className="h-4 w-4" />
        </button>
      </motion.div>

      <div className="flex gap-3">
        <motion.button
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.01, y: -2 }}
          onClick={() => setAddOpen(true)}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-black-piano neon-blue-border flex-1 flex items-center justify-center gap-3 rounded-2xl py-5 text-[10px] font-black text-primary shadow-glow-cyan border-[3px] border-primary/20 hover:border-primary transition-all uppercase tracking-widest"
        >
          <Plus className="h-5 w-5" />
          Adicionar Item
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.01, y: -2 }}
          onClick={() => setInventoryOpen(true)}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.07 }}
          className="bg-black-piano neon-purple-border flex-1 flex items-center justify-center gap-3 rounded-2xl py-5 text-[10px] font-black text-ai shadow-glow-ai border-[3px] border-ai/20 hover:border-ai transition-all uppercase tracking-widest"
        >
          <Package className="h-5 w-5" />
          Inventário Full
        </motion.button>
      </div>

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
          <span className="font-mono-tactical text-[9px] font-black text-white uppercase tracking-widest">
            {products.filter(p => p.status === 'in_stock').length} UN EM ESTOQUE
          </span>
        </div>

        <div className="space-y-4">
          {filtered.map((it, i) => {
            const isLow = it.stock <= 5;
            return (
              <motion.div
                key={`stock-${it.name}-${it.spec}-${i}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`group flex flex-col gap-4 rounded-[2rem] p-5 ring-1 transition-all cursor-pointer ${it.stock <= 1
                  ? "bg-danger/10 ring-danger/30 hover:bg-danger/20"
                  : "bg-white/[0.03] ring-white/10 hover:bg-white/[0.06] shadow-xl"
                  }`}
                onClick={() => {
                  setSelectedProduct(it);
                  setInsightOpen(true);
                }}
              >
                {/* Top Section: Model Identification (Max 2 Lines) */}
                <div className="flex-1 min-h-[3rem] flex flex-col justify-center">
                  <div className="text-base font-black text-white group-hover:text-primary transition-colors tracking-tighter leading-tight line-clamp-2 uppercase">
                    {it.name}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1 items-center">
                    <span className="font-mono-tactical text-[9px] font-black uppercase tracking-widest text-primary">
                      {it.spec}
                    </span>
                    {Array.from(it.allSkus as Set<string>).map((s: string, idx: number) => (
                      <span key={`sku-${s}-${idx}`} className="font-mono-tactical text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-white/5 text-white/40 border border-white/10">
                        {s}
                      </span>
                    ))}
                    {it.internal_code && (
                      <span className="font-mono-tactical text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-white/5 text-white/60 border border-white/10">
                        #{it.internal_code}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Section: Tactical Row (Photo, Units, Price, Action) */}
                <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/5">
                  <div className="flex items-center gap-4">
                    {/* Imagem Tática */}
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-black ring-1 ring-white/10">
                      <img src={it.image_url || DEFAULT_PLACEHOLDER} alt={it.name} className="h-full w-full object-cover transition-opacity group-hover:scale-110 duration-500" />
                      {isLow && <div className="absolute inset-0 bg-danger/20" />}
                    </div>

                    {/* Unidades & Preço */}
                    <div className="flex flex-col">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-white tracking-tighter">
                          {it.stock}
                        </span>
                        <span className="font-mono-tactical text-[10px] font-black text-primary uppercase tracking-widest">
                          UNIDADES
                        </span>
                      </div>
                      <div className="font-mono-tactical text-[11px] font-black text-white/80">
                        <span className="text-[9px] mr-1">R$</span>{it.sale}
                      </div>
                    </div>
                  </div>

                  {/* Ação: Editar */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedItem(it);
                    }}
                    className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-white hover:bg-primary/20 hover:text-primary transition-all shadow-lg border border-white/10"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      <AnimatePresence mode="wait">
        {addOpen && <AddProductModal key="add-modal" onClose={() => setAddOpen(false)} />}

        {selectedItem && !isEditing && (
          <ActionSheet
            key="action-sheet"
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            onEdit={() => setIsEditing(true)}
            onDelete={() => setItemToDelete({
              name: selectedItem.name,
              spec: selectedItem.spec,
              stock: selectedItem.stock,
              onConfirm: async () => {
                try {
                  await deleteCatalogItem(selectedItem.name, selectedItem.spec);
                  setSelectedItem(null);
                } catch (err) {
                  // Erro já logado na store
                }
              }
            })}
            onCamera={() => fileInputRef.current?.click()}
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
            key="view-modal"
            item={viewItem}
            onClose={() => setViewItem(null)}
          />
        )}
      </AnimatePresence>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;

          const toastId = toast.loading("Processando imagem da galeria...");
          const reader = new FileReader();
          reader.onload = async (event) => {
            const base64 = event.target?.result as string;
            try {
              const storedUrl = await imageService.processBase64(base64, `gallery-update-${selectedItem.name}.webp`);
              
              if (storedUrl) {
                const targets = products.filter(p => p.name === selectedItem.name && p.spec === selectedItem.spec);
                await updateProductsBulk(targets.map(p => p.id), { image_url: storedUrl });
                toast.success("Imagem atualizada com sucesso!", { id: toastId });
                setSelectedItem(null);
              } else {
                toast.error("Falha ao processar imagem", { id: toastId });
              }
            } catch (err) {
              console.error(err);
              toast.error("Erro na sincronização", { id: toastId });
            }
          };
          reader.onerror = () => toast.error("Erro ao ler arquivo", { id: toastId });
          reader.readAsDataURL(file);
          if (e.target) e.target.value = "";
        }}
      />

      <AIProductInsight
        product={selectedProduct}
        isOpen={insightOpen}
        onClose={() => setInsightOpen(false)}
      />
      <AIVisionAudit
        isOpen={auditOpen}
        onClose={() => setAuditOpen(false)}
      />
      <InventoryModal
        isOpen={inventoryOpen}
        onClose={() => setInventoryOpen(false)}
        onSetItemToDelete={setItemToDelete}
      />
      <CameraView
        open={camOpen}
        onClose={() => setCamOpen(false)}
        title="Atualizar Foto"
        mode="photo"
        onCapture={async (url) => {
          if (isUploading) return;
          setIsUploading(true);
          const toastId = toast.loading("Otimizando e subindo imagem...");
          try {
            const storedUrl = await imageService.processBase64(url, `update-${selectedItem.name}.webp`);
            if (!storedUrl) throw new Error("Falha no upload");

            const targets = products.filter(p => p.name === selectedItem.name && p.spec === selectedItem.spec);
            await updateProductsBulk(targets.map(p => p.id), { image_url: storedUrl });

            setCamOpen(false);
            setSelectedItem(null);
            toast.success("Foto atualizada e comprimida com sucesso!", { id: toastId });
          } catch (err) {
            toast.error("Erro ao atualizar foto.", { id: toastId });
          } finally {
            setIsUploading(false);
          }
        }}
      />
      <CameraView open={scanOpen} onClose={() => setScanOpen(false)} title="Busca Tática" mode="scan" />

      {/* NOVO: Modal de Confirmação Tática */}
      <AnimatePresence>
        {itemToDelete && (
          <ConfirmDeleteModal
            key="confirm-delete"
            item={itemToDelete}
            onClose={() => setItemToDelete(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const AddProductModal = ({ onClose }: { onClose: () => void }) => {
  const { products, addProduct, catalog } = useStore();
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");

  // AUTO-FILL LOGIC: Listen to SKU changes
  useEffect(() => {
    if (sku && sku.length > 3) {
      const existing = products.find(p => p.sku === sku || p.imei === sku);
      const inCatalog = catalog.find(c => c.sku === sku);

      if (existing || inCatalog) {
        const foundName = existing?.name || inCatalog?.name;
        if (foundName && !name) {
          setName(foundName);
          toast.success(`Produto Identificado: ${foundName}`, {
            description: "Dados recuperados do catálogo."
          });
        }
      }
    }
  }, [sku, products, catalog, name]);

  const [imei, setImei] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [camOpen, setCamOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [brand, setBrand] = useState("Geral");
  const [category, setCategory] = useState("Geral");
  const [cost, setCost] = useState(0);
  const [sale, setSale] = useState(0);
  const [spec, setSpec] = useState("Novo");
  const [imei2, setImei2] = useState("");



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
          <button onClick={onClose} className="h-14 w-14 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 hover:text-white transition-all shadow-xl">
            <X className="h-7 w-7" />
          </button>
        </div>

        <div className="space-y-8">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="bg-black-piano neon-blue-border group relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-[2.5rem] border-3 border-dashed border-primary/20 hover:border-primary transition-all shadow-inner"
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                const toastId = toast.loading("Processando imagem...");
                const reader = new FileReader();
                reader.onload = async (event) => {
                  const base64 = event.target?.result as string;
                  try {
                    const storedUrl = await imageService.processBase64(base64, `new-product-${Date.now()}.webp`);
                    if (storedUrl) {
                      setPhoto(storedUrl);
                      toast.success("Foto processada!", { id: toastId });
                    } else {
                      toast.error("Erro no processamento", { id: toastId });
                    }
                  } catch (err) {
                    toast.error("Erro ao salvar imagem", { id: toastId });
                  }
                };
                reader.onerror = () => toast.error("Erro ao ler arquivo", { id: toastId });
                reader.readAsDataURL(file);
                if (e.target) e.target.value = "";
              }}
            />
            {photo ? (
              <img src={photo} alt="Produto" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-4 text-white group-hover:text-primary transition-all">
                <Camera className="h-16 w-16" />
                <span className="font-mono-tactical text-[11px] font-black uppercase tracking-[0.4em]">SELECIONAR DA GALERIA</span>
              </div>
            )}
            <div className="tactical-corner absolute inset-8 opacity-20 group-hover:opacity-100 transition-opacity" />
          </button>

          <div className="space-y-6">
            <div className="group rounded-[2rem] bg-white/[0.03] p-6 ring-2 ring-white/5 focus-within:ring-primary/50 transition-all shadow-xl border-b border-white/5">
              <div className="font-mono-tactical mb-3 text-[10px] font-black uppercase tracking-[0.3em] text-white group-focus-within:text-primary">NOME DO MODELO</div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Xiaomi Redmi 13C..."
                className="w-full bg-transparent font-black text-lg text-white outline-none placeholder:text-white"
              />
            </div>

            <div className="group rounded-[2rem] bg-white/[0.03] p-6 ring-2 ring-white/5 focus-within:ring-primary/50 transition-all shadow-xl border-b border-white/5">
              <div className="font-mono-tactical mb-3 text-[10px] font-black uppercase tracking-[0.3em] text-white group-focus-within:text-primary">SKU / CÓDIGO</div>
              <input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="BIPE AQUI"
                className="font-mono-tactical w-full bg-transparent font-black text-sm tracking-[0.2em] text-primary outline-none placeholder:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="group rounded-[2rem] bg-white/[0.03] p-6 ring-2 ring-white/5 focus-within:ring-primary/50 transition-all shadow-xl border-b border-white/5">
                <div className="font-mono-tactical mb-3 text-[10px] font-black uppercase tracking-[0.3em] text-white group-focus-within:text-primary">IMEI 1</div>
                <input
                  value={imei}
                  onChange={(e) => setImei(e.target.value)}
                  placeholder="123456..."
                  className="font-mono-tactical w-full bg-transparent font-black text-sm tracking-[0.2em] text-white outline-none placeholder:text-white"
                />
              </div>
              <div className="group rounded-[2rem] bg-white/[0.03] p-6 ring-2 ring-white/5 focus-within:ring-primary/50 transition-all shadow-xl border-b border-white/5">
                <div className="font-mono-tactical mb-3 text-[10px] font-black uppercase tracking-[0.3em] text-white group-focus-within:text-primary">IMEI 2</div>
                <input
                  value={imei2}
                  onChange={(e) => setImei2(e.target.value)}
                  placeholder="OPCIONAL"
                  className="font-mono-tactical w-full bg-transparent font-black text-sm tracking-[0.2em] text-white outline-none placeholder:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="group rounded-[2rem] bg-white/[0.03] p-6 ring-2 ring-white/5 focus-within:ring-primary/50 transition-all shadow-xl border-b border-white/5">
                <div className="font-mono-tactical mb-3 text-[10px] font-black uppercase tracking-[0.3em] text-white group-focus-within:text-primary">QUANTIDADE</div>
                <div className="flex items-center justify-between bg-black/40 border border-white/10 rounded-[2rem] p-2 gap-2 shadow-inner">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center text-white hover:bg-white/10 active:scale-90 transition-all border border-white/5"
                  >
                    <Minus className="h-6 w-6" />
                  </button>

                  <div className="flex-1 flex flex-col items-center justify-center relative">
                    <input
                      type="number"
                      inputMode="numeric"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      className="w-full bg-transparent text-center font-black text-3xl text-primary outline-none drop-shadow-glow-cyan"
                    />
                    <div className="text-[8px] font-black uppercase tracking-[0.3em] text-white -mt-1">VOLUME</div>
                  </div>

                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="h-14 w-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary hover:bg-primary/30 active:scale-90 transition-all border border-primary/20 shadow-glow-cyan-sm"
                  >
                    <Plus className="h-6 w-6" />
                  </button>
                </div>
              </div>
              <div className="group rounded-[2rem] bg-white/[0.03] p-6 ring-2 ring-white/5 focus-within:ring-primary/50 transition-all shadow-xl border-b border-white/5">
                <div className="font-mono-tactical mb-3 text-[10px] font-black uppercase tracking-[0.3em] text-white group-focus-within:text-primary">VALOR VENDA (OPC)</div>
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
              className="flex-1 rounded-[2rem] bg-white/5 py-6 text-sm font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all border border-white/5"
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
                    imei2: (imei2 || null),
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
          <img src={item.image_url} alt="" className="h-full w-full object-cover" />
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
            <div className="text-[10px] text-white">Alterar nome, preços ou especificações</div>
          </div>
          <ChevronRight className="ml-auto h-5 w-5 text-white" />
        </button>

        <button onClick={onCamera} className="flex w-full items-center gap-4 rounded-2xl bg-white/5 p-5 text-left transition-all hover:bg-white/10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/20 text-success"><Plus className="h-5 w-5" /></div>
          <div>
            <div className="text-sm font-black text-white">TROCAR FOTO</div>
            <div className="text-[10px] text-white">Selecionar da Galeria do Aparelho</div>
          </div>
          <ChevronRight className="ml-auto h-5 w-5 text-white" />
        </button>

        <button onClick={onDelete} className="flex w-full items-center gap-4 rounded-2xl bg-danger/10 p-5 text-left transition-all hover:bg-danger/20">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger/20 text-danger"><X className="h-5 w-5" /></div>
          <div>
            <div className="text-sm font-black text-danger">EXCLUIR ESTOQUE</div>
            <div className="text-[10px] text-danger">Remover permanentemente do sistema</div>
          </div>
          <ChevronRight className="ml-auto h-5 w-5 text-danger" />
        </button>
      </div>

      <button onClick={onClose} className="mt-6 w-full py-4 text-sm font-black text-white uppercase tracking-widest">CANCELAR OPERAÇÃO</button>
    </motion.div>
  </>
);

const EditProductModal = ({ item, onClose }: any) => {
  const { products, updateProductsBulk } = useStore();
  const [name, setName] = useState(item.name);
  const [spec, setSpec] = useState(item.spec || "Novo");
  const [cost, setCost] = useState(item.cost?.toString() || "0");
  const [sale, setSale] = useState(item.sale?.toString() || "0");
  const [photo, setPhoto] = useState(item.image_url);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [camOpen, setCamOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("O nome do produto não pode estar vazio");
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading("Atualizando estoque...");
    try {
      const targets = products.filter(p => p.name === item.name && p.spec === item.spec);
      const targetIds = targets.map(p => p.id);

      const updates = {
        name: name.trim(),
        spec: spec.trim(),
        cost: Math.max(0, parseFloat(cost) || 0),
        sale: Math.max(0, parseFloat(sale) || 0),
        image_url: photo
      };

      await updateProductsBulk(targetIds, updates);

      toast.success("Dados atualizados em lote!", { id: toastId });
      onClose();
    } catch (err) {
      console.error("Erro no salvamento:", err);
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
        className="bg-black-piano neon-blue-border w-full max-w-lg rounded-[2.5rem] p-8 overflow-y-auto max-h-[90vh]"
      >
        <div className="mb-6 flex justify-between items-start">
          <div>
            <div className="font-mono-tactical text-[10px] font-black text-primary tracking-[0.4em] uppercase">MÓDULO DE EDIÇÃO</div>
            <div className="text-2xl font-black text-white">Ajuste de Catálogo</div>
          </div>
          <button onClick={onClose} className="text-white hover:text-white"><X /></button>
        </div>

        <div className="space-y-6">
          {/* Foto Edit */}
          <div className="relative group aspect-video w-full overflow-hidden rounded-3xl border-2 border-white/5 bg-black/40 shadow-inner">
            <img
              src={photo || DEFAULT_PLACEHOLDER}
              alt=""
              className="h-full w-full object-cover transition-opacity group-hover:opacity-100"
            />
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                const toastId = toast.loading("Processando imagem...");
                const reader = new FileReader();
                reader.onload = async (event) => {
                  const base64 = event.target?.result as string;
                  try {
                    const storedUrl = await imageService.processBase64(base64, `edit-update-${Date.now()}.webp`);
                    if (storedUrl) {
                      setPhoto(storedUrl);
                      toast.success("Foto processada!", { id: toastId });
                    } else {
                      toast.error("Falha no processamento", { id: toastId });
                    }
                  } catch (err) {
                    toast.error("Erro ao atualizar foto", { id: toastId });
                  }
                };
                reader.onerror = () => toast.error("Erro ao ler arquivo", { id: toastId });
                reader.readAsDataURL(file);
                if (e.target) e.target.value = "";
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <Camera className="h-8 w-8 text-primary shadow-glow-cyan" />
              <span className="font-mono-tactical text-[9px] font-black uppercase tracking-widest text-primary">SELECIONAR GALERIA</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 focus-within:ring-primary transition-all">
              <label className="font-mono-tactical block text-[9px] font-black text-white uppercase mb-2 tracking-widest">NOME DO MODELO</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-transparent font-black text-lg text-white outline-none"
              />
            </div>
            <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 focus-within:ring-primary transition-all">
              <label className="font-mono-tactical block text-[9px] font-black text-white uppercase mb-2 tracking-widest">ESPECIFICAÇÃO</label>
              <input
                value={spec}
                onChange={e => setSpec(e.target.value)}
                className="w-full bg-transparent font-black text-lg text-primary outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 focus-within:ring-primary transition-all">
              <label className="font-mono-tactical block text-[9px] font-black text-white uppercase mb-2 tracking-widest">CUSTO (R$)</label>
              <input
                type="number"
                value={cost}
                onChange={e => setCost(e.target.value)}
                className="w-full bg-transparent font-mono-tactical font-black text-white outline-none"
              />
            </div>
            <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 focus-within:ring-primary transition-all">
              <label className="font-mono-tactical block text-[9px] font-black text-white uppercase mb-2 tracking-widest">VENDA (R$)</label>
              <input
                type="number"
                value={sale}
                onChange={e => setSale(e.target.value)}
                className="w-full bg-transparent font-mono-tactical font-black text-primary outline-none"
              />
            </div>
          </div>
        </div>

        <div className="mt-10 flex gap-4">
          <button onClick={onClose} className="flex-1 rounded-2xl bg-white/5 py-5 font-black text-white text-xs tracking-[0.2em]">CANCELAR</button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 rounded-2xl bg-primary py-5 font-black text-black text-xs tracking-[0.2em] shadow-glow-cyan active:scale-95 transition-transform"
          >
            {isSaving ? "PROCESSANDO..." : "SALVAR ALTERAÇÕES"}
          </button>
        </div>

        <CameraView open={camOpen} onClose={() => setCamOpen(false)} title="Capturar Foto" mode="photo" onCapture={setPhoto} />
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
        <img src={item.image_url || DEFAULT_PLACEHOLDER} alt="" className="h-full w-full object-cover" />
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
          <div className="font-mono-tactical text-[8px] font-black text-white tracking-[0.3em] uppercase">IDENTIFICAÇÃO</div>
          <h2 className="text-xl sm:text-2xl font-black text-white leading-tight uppercase">{item.name}</h2>
          <p className="font-mono-tactical text-[10px] text-primary mt-1 uppercase tracking-widest">{item.spec} · {item.brand || "Geral"}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
            <div className="font-mono-tactical text-[8px] font-black text-white uppercase mb-1">ESTOQUE</div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-white">{item.stock}</span>
              <span className="text-[8px] font-bold text-white uppercase">UN</span>
            </div>
          </div>
          <div className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
            <div className="font-mono-tactical text-[8px] font-black text-white uppercase mb-1">VALOR VENDA</div>
            <div className="flex items-baseline gap-1">
              <span className="text-[8px] font-bold text-white">R$</span>
              <span className="text-lg font-black text-primary">{item.sale || "0.00"}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white/5 p-3 border-l-2 border-primary/50">
          <div className="font-mono-tactical text-[8px] font-black text-white uppercase">SKU / IDENTIFICADORES</div>
          <div className="font-mono-tactical text-[10px] font-bold text-white tracking-widest truncate">
            {item.sku && <div>SKU: {item.sku}</div>}
            {item.imei && item.imei !== 'N/A' && <div>IMEI 1: {item.imei}</div>}
            {item.imei2 && <div>IMEI 2: {item.imei2}</div>}
            {!item.sku && (!item.imei || item.imei === 'N/A') && !item.imei2 && "N/A"}
          </div>
        </div>
      </div>

      <button
        onClick={onClose}
        className="mt-6 w-full rounded-2xl bg-white/5 py-4 font-black text-white text-[10px] uppercase tracking-[0.2em] hover:bg-white/10 transition-all border border-white/5"
      >
        FECHAR
      </button>
    </motion.div>
  </div>
);

const InventoryModal = ({ isOpen, onClose, onSetItemToDelete }: { isOpen: boolean; onClose: () => void; onSetItemToDelete: (item: any) => void }) => {
  const { catalog, products, deleteCatalogItem, currentUser } = useStore();
  const [search, setSearch] = useState("");
  const [selectedDetailItem, setSelectedDetailItem] = useState<any | null>(null);

  const allItems = useMemo(() => {
    const itemsMap = new Map<string, any>();

    // Helper to generate identity key
    const getIdentity = (name: string, spec: string) => `${name.trim().toLowerCase()}@@@${(spec || "Geral").trim().toLowerCase()}`;

    // 1. Processar produtos em estoque primeiro (para ter contagem real)
    products.forEach(p => {
      const id = getIdentity(p.name, p.spec);
      if (!itemsMap.has(id)) {
        itemsMap.set(id, {
          name: p.name,
          spec: p.spec,
          skus: new Set([p.sku]),
          internal_codes: new Set([p.internal_code]),
          stockCount: products.filter(p2 => getIdentity(p2.name, p2.spec) === id && p2.status === 'in_stock').length
        });
      } else {
        const item = itemsMap.get(id);
        if (p.sku) item.skus.add(p.sku);
        if (p.internal_code) item.internal_codes.add(p.internal_code);
      }
    });

    // 2. Mesclar com Catálogo (para itens cadastrados mas sem estoque)
    catalog.forEach(c => {
      const id = getIdentity(c.name, c.spec);
      if (!itemsMap.has(id)) {
        itemsMap.set(id, {
          name: c.name,
          spec: c.spec,
          skus: new Set([c.sku]),
          internal_codes: new Set([c.internal_code]),
          stockCount: 0
        });
      } else {
        const item = itemsMap.get(id);
        if (c.sku) item.skus.add(c.sku);
        if (c.internal_code) item.internal_codes.add(c.internal_code);
      }
    });

    return Array.from(itemsMap.values())
      .map(item => ({
        ...item,
        skus: Array.from(item.skus).filter(Boolean),
        internal_codes: Array.from(item.internal_codes).filter(Boolean)
      }))
      .sort((a, b) => b.stockCount - a.stockCount);
  }, [catalog, products]);

  const totalUnique = allItems.length;
  const totalUnits = products.filter(p => p.status === 'in_stock').length;

  const filtered = allItems.filter(item => {
    const s = `${item.name} ${item.spec || ""} ${item.sku} ${item.internal_code || ""}`.toLowerCase();
    return s.includes(search.toLowerCase());
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div key="inventory-modal-overlay" className="fixed inset-0 z-[100] flex flex-col bg-black-piano backdrop-blur-3xl overflow-hidden">
          {/* Header */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="p-6 border-b border-white/5"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="font-mono-tactical text-[10px] font-black text-primary tracking-[0.4em] uppercase mb-1">DETALHAMENTO GLOBAL</div>
                <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Inventário Consolidado</h2>
              </div>
              <button
                onClick={onClose}
                className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-danger/20 hover:text-danger transition-all"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                <div className="font-mono-tactical text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">PRODUTOS CADASTRADOS</div>
                <div className="text-2xl font-black text-white">{totalUnique} <span className="text-[10px] text-primary">TIPOS</span></div>
              </div>
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                <div className="font-mono-tactical text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">TOTAL DE UNIDADES</div>
                <div className="text-2xl font-black text-success">{totalUnits} <span className="text-[10px] text-white/40">UN</span></div>
              </div>
            </div>

            {/* Internal Search */}
            <div className="bg-white/5 rounded-xl flex items-center gap-3 px-4 py-3 border border-white/10">
              <Search className="h-4 w-4 text-white/40" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filtrar por nome, SKU ou código..."
                className="bg-transparent flex-1 font-bold text-sm text-white outline-none placeholder:text-white/20"
              />
            </div>
          </motion.div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar pb-10">
            {filtered.map((item, idx) => (
              <motion.div
                key={`inv-${item.name}-${item.spec}-${idx}`}
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: idx * 0.02 }}
                className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex items-center justify-between group hover:bg-white/[0.05] transition-all"
              >
                <div
                  className="flex-1 min-w-0 pr-4 cursor-pointer active:opacity-70"
                  onClick={() => setSelectedDetailItem(item)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-black text-white truncate uppercase">{item.name}</span>
                    <span className="text-[9px] font-black bg-primary/20 text-primary px-1.5 py-0.5 rounded uppercase">{item.spec}</span>
                  </div>
                  <div className="font-mono-tactical text-[9px] text-white/40 flex flex-wrap gap-x-3 gap-y-1 uppercase tracking-widest">
                    {item.skus.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.skus.map((sku: string, sIdx: number) => (
                          <span key={`inv-sku-${sku}-${sIdx}`} className="bg-white/5 px-1.5 py-0.5 rounded border border-white/5">SKU: {sku}</span>
                        ))}
                      </div>
                    )}
                    {item.internal_codes.length > 0 && (
                      <div className="flex flex-wrap gap-1 text-primary/60">
                        {item.internal_codes.map((code: string, cIdx: number) => (
                          <span key={`inv-code-${code}-${cIdx}`}>#{code}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0 flex items-center gap-4">
                  <div>
                    <div className={`text-xl font-black ${item.stockCount > 0 ? 'text-white' : 'text-danger/50'}`}>
                      {item.stockCount} <span className="text-[9px] text-white/20">UN</span>
                    </div>
                    {item.stockCount === 0 && (
                      <div className="text-[8px] font-black text-danger uppercase tracking-tighter">SEM ESTOQUE</div>
                    )}
                  </div>

                  {currentUser?.role === 'admin' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetItemToDelete({
                          name: item.name,
                          spec: item.spec,
                          stock: item.stockCount,
                          onConfirm: async () => {
                            try {
                              await deleteCatalogItem(item.name, item.spec);
                            } catch (err) {
                              // Erro já logado na store
                            }
                          }
                        });
                      }}
                      className="h-10 w-10 flex items-center justify-center rounded-xl bg-danger/10 text-danger hover:bg-danger/20 transition-all border border-danger/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}

            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 opacity-20">
                <Boxes className="h-12 w-12 mb-4" />
                <p className="font-black text-xs uppercase tracking-widest text-center">Nenhum item encontrado no registro consolidado</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* NOVO: HUD de Detalhes (Solicitado via Áudio) */}
      <AnimatePresence>
        {selectedDetailItem && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDetailItem(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-2xl"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-black-piano neon-blue-border w-full max-w-sm rounded-[2rem] p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 blur-[80px] rounded-full" />

              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="font-mono-tactical text-[9px] font-black text-primary tracking-[0.4em] uppercase mb-1">DETALHAMENTO DO ITEM</div>
                    <h2 className="text-2xl font-black text-white leading-tight uppercase break-words">
                      {selectedDetailItem.name}
                    </h2>
                  </div>
                  <button
                    onClick={() => setSelectedDetailItem(null)}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-white/40" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <div className="font-mono-tactical text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">ESPECIFICAÇÃO</div>
                    <div className="text-sm font-black text-primary uppercase">
                      {selectedDetailItem.spec || 'PADRÃO'}
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <div className="font-mono-tactical text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">ESTOQUE ATUAL</div>
                    <div className={`text-sm font-black ${selectedDetailItem.stockCount > 0 ? 'text-success' : 'text-danger'}`}>
                      {selectedDetailItem.stockCount} UN
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {currentUser?.role === 'admin' && (
                    <button
                      onClick={() => {
                        const item = selectedDetailItem;
                        setSelectedDetailItem(null);
                        onSetItemToDelete({
                          name: item.name,
                          spec: item.spec,
                          stock: item.stockCount,
                          onConfirm: async () => {
                            try {
                              await deleteCatalogItem(item.name, item.spec);
                            } catch (err) { }
                          }
                        });
                      }}
                      className="w-full py-5 bg-danger/10 hover:bg-danger/20 border border-danger/30 rounded-2xl text-danger font-black text-[10px] tracking-[0.2em] transition-all flex items-center justify-center gap-2 group"
                    >
                      <Trash2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
                      INICIAR PURGA ATÔMICA
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedDetailItem(null)}
                    className="w-full py-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white/40 font-black text-[10px] tracking-[0.2em] transition-all"
                  >
                    VOLTAR AO INVENTÁRIO
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
};

// COMPONENTE: Modal de Confirmação Tática (Black Piano Style)
const ConfirmDeleteModal = ({ item, onClose }: { item: any; onClose: () => void }) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-black-piano neon-danger-border w-full max-w-md rounded-[2.5rem] p-10 shadow-[0_0_80px_rgba(255,50,50,0.2)] relative overflow-hidden"
      >
        <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-danger/10 blur-3xl" />

        <div className="relative z-10 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-danger/10 text-danger shadow-glow-danger">
            <Trash2 className="h-10 w-10" />
          </div>

          <div className="font-mono-tactical text-[11px] font-black uppercase tracking-[0.4em] text-danger mb-2">
            ALERTA DE SEGURANÇA
          </div>

          <h2 className="text-3xl font-black text-white tracking-tighter mb-4 leading-tight">
            Deseja realizar a <span className="text-danger">Purga Atômica</span>?
          </h2>

          <div className="bg-white/5 rounded-2xl p-5 mb-8 border border-white/10 text-left">
            <p className="text-sm text-white/70 leading-relaxed">
              Você está prestes a excluir <span className="text-white font-black">{item.name} ({item.spec})</span>.
              Isso removerá o registro do catálogo, as <span className="text-white font-black">{item.stock} unidades</span> e todo o histórico.
            </p>
            <div className="mt-3 font-mono-tactical text-[10px] text-danger/80 font-black uppercase flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-danger animate-pulse" />
              Esta ação é irreversível
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={async () => {
                await item.onConfirm();
                onClose();
              }}
              className="w-full rounded-2xl bg-danger py-5 font-black text-white text-xs tracking-[0.3em] uppercase shadow-glow-danger hover:scale-[1.02] active:scale-95 transition-all"
            >
              CONFIRMAR EXCLUSÃO
            </button>
            <button
              onClick={onClose}
              className="w-full rounded-2xl bg-white/5 py-5 font-black text-white/40 text-xs tracking-[0.3em] uppercase hover:bg-white/10 transition-all border border-white/5"
            >
              ABORTAR OPERAÇÃO
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

