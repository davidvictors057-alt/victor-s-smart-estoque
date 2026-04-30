import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Edit2, Check, Package, DollarSign, Camera, AlertTriangle, ScanLine } from "lucide-react";
import { useState, useEffect } from "react";
import { useStore, CatalogItem } from "@/store/useStore";
import { toast } from "sonner";

interface CatalogAuditHUDProps {
  open: boolean;
  onClose: () => void;
  onScanRequest?: () => void;
  onPhotoRequest?: () => void;
  capturedPhoto?: string | null;
  initialSku?: string;
}

export const CatalogAuditHUD = ({ open, onClose, onScanRequest, onPhotoRequest, capturedPhoto, initialSku }: CatalogAuditHUDProps) => {
  const { catalog, updateCatalogItem } = useStore();
  const [sku, setSku] = useState(initialSku || "");
  const [foundItem, setFoundItem] = useState<CatalogItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<CatalogItem>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialSku) setSku(initialSku);
  }, [initialSku]);

  useEffect(() => {
    if (sku) {
      const cleanSku = sku.trim();
      // 1. Tentar encontrar no catálogo inteligente
      let item = catalog.find(c => c.sku.trim() === cleanSku);
      
      // 2. Fallback: Tentar encontrar no estoque atual (products) se não estiver no catálogo
      if (!item) {
        const product = useStore.getState().products.find(p => p.sku?.trim() === cleanSku);
        if (product) {
          item = {
            sku: cleanSku,
            name: product.name,
            spec: product.spec,
            image_url: product.image_url,
            cost: product.cost,
            sale: product.sale,
            last_updated: product.updated_at
          };
        }
      }

      setFoundItem(item || null);
    } else {
      setFoundItem(null);
    }
  }, [sku, catalog]);

  useEffect(() => {
    if (foundItem) {
      setEditData({
        name: foundItem.name,
        image_url: foundItem.image_url,
        cost: foundItem.cost,
        sale: foundItem.sale
      });
    }
  }, [foundItem]);

  useEffect(() => {
    if (capturedPhoto) {
      setEditData(prev => ({ ...prev, image_url: capturedPhoto }));
    }
  }, [capturedPhoto]);

  const handleSave = async () => {
    if (!sku) return;
    setIsSaving(true);
    try {
      await updateCatalogItem(sku.trim(), editData);
      setIsEditing(false);
      // Atualiza o item local para sair do modo de edição com os dados novos
      setFoundItem(prev => prev ? { ...prev, ...editData } : {
        sku: sku.trim(),
        name: editData.name || "Sem Nome",
        ...editData,
        last_updated: new Date().toISOString()
      } as CatalogItem);
    } catch (err) {
      // toast handled in store
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateNew = () => {
    const newSku = sku.trim();
    setFoundItem({
      sku: newSku,
      name: "",
      image_url: null,
      cost: 0,
      sale: 0,
      last_updated: new Date().toISOString()
    });
    setEditData({
      name: "",
      image_url: null,
      cost: 0,
      sale: 0
    });
    setIsEditing(true);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-x-0 bottom-0 z-[110] mx-auto max-w-lg rounded-t-[3rem] bg-black-piano border-t-2 border-primary/20 p-8 shadow-[0_-20px_50px_rgba(0,243,255,0.1)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Search className="text-primary w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-mono-tactical text-[10px] font-black uppercase tracking-[0.4em] text-primary">AUDITORIA DE SKU</h3>
                  <p className="text-xl font-black text-white uppercase tracking-tighter">Consulta de Catálogo</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-white/20 hover:text-white transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Input de Busca */}
            <div className="relative mb-8 group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-primary transition-colors">
                <Package className="h-5 w-5" />
              </div>
              <input 
                type="text" 
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Escaneie ou digite o SKU..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-12 pr-16 text-white font-black tracking-widest focus:border-primary focus:outline-none transition-all"
              />
              <button 
                onClick={onScanRequest}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary hover:bg-primary hover:text-black transition-all shadow-glow-cyan-sm active:scale-90"
              >
                <ScanLine className="w-5 h-5" />
              </button>
            </div>

            {/* Resultado */}
            <div className="min-h-[300px]">
              {sku ? (
                foundItem ? (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                    <div className="flex gap-6 items-start">
                      <div 
                        onClick={() => isEditing && onPhotoRequest?.()}
                        className={`w-32 h-32 rounded-[2rem] bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center group relative ${isEditing ? 'cursor-pointer hover:border-primary/50' : ''}`}
                      >
                        {editData.image_url ? (
                          <img src={editData.image_url} alt={foundItem.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-10 h-10 text-white/10" />
                        )}
                        {isEditing && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="w-6 h-6 text-primary" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 space-y-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[9px] font-mono-tactical text-white/30 uppercase tracking-[0.2em]">Nome do Produto</label>
                            <div className="bg-primary/10 border border-primary/20 text-primary text-[8px] font-black px-2 py-0.5 rounded-full flex items-center gap-1.5 animate-pulse">
                              <Package className="w-2.5 h-2.5" />
                              ESTOQUE ATUAL: {useStore.getState().products.filter(p => p.sku?.trim() === foundItem.sku.trim() && p.status === 'in_stock').length}
                            </div>
                          </div>
                          {isEditing ? (
                            <input 
                              type="text" 
                              value={editData.name}
                              onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                              className="w-full bg-white/10 border border-primary/40 rounded-xl px-4 py-3 text-white font-black text-sm focus:outline-none"
                            />
                          ) : (
                            <div className="text-xl font-black text-white leading-tight uppercase">{foundItem.name}</div>
                          )}
                        </div>

                        <div className="flex gap-4">
                          <div className="flex-1 space-y-1">
                            <label className="text-[9px] font-mono-tactical text-white/30 uppercase tracking-[0.2em]">Custo (R$)</label>
                            {isEditing ? (
                              <input 
                                type="number" 
                                value={editData.cost ?? ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setEditData(prev => ({ ...prev, cost: val === "" ? undefined : Number(val) }));
                                }}
                                className="w-full bg-white/10 border border-primary/40 rounded-xl px-4 py-3 text-white font-black text-sm focus:outline-none"
                              />
                            ) : (
                              <div className="text-lg font-black text-white/80">R$ {foundItem.cost?.toFixed(2) || '0.00'}</div>
                            )}
                          </div>
                          <div className="flex-1 space-y-1">
                            <label className="text-[9px] font-mono-tactical text-white/30 uppercase tracking-[0.2em]">Venda (R$)</label>
                            {isEditing ? (
                              <input 
                                type="number" 
                                value={editData.sale ?? ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setEditData(prev => ({ ...prev, sale: val === "" ? undefined : Number(val) }));
                                }}
                                className="w-full bg-white/10 border border-primary/40 rounded-xl px-4 py-3 text-white font-black text-sm focus:outline-none"
                              />
                            ) : (
                              <div className="text-lg font-black text-primary">R$ {foundItem.sale?.toFixed(2) || '0.00'}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="flex gap-3 pt-4">
                        <button 
                          onClick={() => setIsEditing(false)}
                          className="flex-1 bg-white/5 text-white/40 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px]"
                        >
                          DESCARTAR
                        </button>
                        <button 
                          onClick={handleSave}
                          disabled={isSaving}
                          className="flex-3 bg-primary text-black py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-glow-cyan flex items-center justify-center gap-2"
                        >
                          {isSaving ? (
                            <span className="h-4 w-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              SALVAR ALTERAÇÕES
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="w-full bg-white/10 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-white/20 transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                        EDITAR INFORMAÇÕES
                      </button>
                    )}
                  </motion.div>
                ) : (
                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-12 text-center space-y-6">
                    <div className="space-y-4">
                      <div className="w-16 h-16 rounded-full bg-warning/20 flex items-center justify-center mx-auto">
                        <AlertTriangle className="text-warning w-8 h-8" />
                      </div>
                      <div>
                        <div className="text-lg font-black text-white uppercase italic tracking-tighter">SKU NÃO CATALOGADO</div>
                        <p className="text-white/40 text-[10px] uppercase font-mono-tactical tracking-widest mt-1">Este código ainda não possui inteligência própria.</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={handleCreateNew}
                      className="bg-primary text-black px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-glow-cyan flex items-center gap-2 hover:scale-105 transition-all"
                    >
                      <Package className="w-4 h-4" />
                      CADASTRAR NO CATÁLOGO
                    </button>
                  </motion.div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center py-12 opacity-20 text-center">
                  <Package className="w-20 h-20 mb-4" />
                  <p className="text-xs font-black uppercase tracking-[0.4em]">Aguardando Entrada</p>
                </div>
              )}
            </div>

            {/* Tactical Footer */}
            <div className="mt-8 pt-6 border-t border-white/5 text-center">
              <p className="text-[8px] text-white/20 font-mono-tactical uppercase tracking-[0.4em]">
                Protocolo de Auditoria e Ajuste de Metadados v2.0
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
