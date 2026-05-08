import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Edit2, Check, Package, DollarSign, Camera, AlertTriangle, ScanLine, RefreshCw, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useStore, CatalogItem } from "@/store/useStore";
import { toast } from "sonner";
import { sortSearchResults } from "@/lib/searchUtils";

interface CatalogAuditHUDProps {
  open: boolean;
  onClose: () => void;
  onScanRequest?: () => void;
  onPhotoRequest?: () => void;
  capturedPhoto?: string | null;
  initialSku?: string;
}

export const CatalogAuditHUD = ({ open, onClose, onScanRequest, onPhotoRequest, capturedPhoto, initialSku }: CatalogAuditHUDProps) => {
  const { catalog, updateCatalogItem, remapCatalogItem } = useStore();
  const [sku, setSku] = useState(initialSku || "");
  const [foundItem, setFoundItem] = useState<CatalogItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<CatalogItem>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isRemapping, setIsRemapping] = useState(false);
  const [pendingNewSku, setPendingNewSku] = useState<string | null>(null);
  const [sourceItem, setSourceItem] = useState<CatalogItem | null>(null);

  useEffect(() => {
    if (initialSku) {
      if (isRemapping) {
        setPendingNewSku(initialSku);
      } else {
        setSku(initialSku);
      }
    }
  }, [initialSku, isRemapping]);

  useEffect(() => {
    if (sku) {
      const cleanSearch = sku.trim().toUpperCase();
      
      // 1. Tentar encontrar match exato primeiro (Alta Prioridade)
      let item = catalog.find(c => 
        c.sku.trim().toUpperCase() === cleanSearch || 
        (c.internal_code && c.internal_code.trim().toUpperCase() === cleanSearch)
      );
      
      // 2. Se não houver match exato, usar o motor de busca inteligente (Explorar Catálogo)
      if (!item) {
        // Preparar lista combinada (mesma lógica do Explorar Catálogo)
        const products = useStore.getState().products;
        const inventoryItems = products
          .filter(p => p.sku)
          .map(p => ({
            sku: p.sku!.trim(),
            name: p.name,
            spec: p.spec,
            image_url: p.image_url,
            cost: p.cost,
            sale: p.sale,
            internal_code: p.internal_code,
            last_updated: p.updated_at
          }));

        const allItemsMap = new Map<string, any>();
        inventoryItems.forEach(i => allItemsMap.set(i.sku, i));
        catalog.forEach(i => allItemsMap.set(i.sku, i));

        const matched = sortSearchResults(Array.from(allItemsMap.values()), cleanSearch);
        if (matched.length > 0) {
          item = matched[0];
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
        sale: foundItem.sale,
        internal_code: foundItem.internal_code
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

  const handleRemap = async () => {
    if (!sourceItem || !pendingNewSku) return;
    setIsSaving(true);
    try {
      await remapCatalogItem(sourceItem.sku, pendingNewSku);
      setSku(pendingNewSku);
      setIsRemapping(false);
      setPendingNewSku(null);
      setSourceItem(null);
      toast.success("SKU ATUALIZADO COM SUCESSO");
    } catch (err) {
      // handled in store
    } finally {
      setIsSaving(false);
    }
  };

  const startRemap = () => {
    if (!foundItem) return;
    setSourceItem(foundItem);
    setIsRemapping(true);
    setPendingNewSku(null);
    onScanRequest?.();
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
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            className="fixed inset-x-0 bottom-0 z-[110] max-h-[95vh] flex flex-col bg-black-piano backdrop-blur-2xl rounded-t-[3rem] border-t border-white/10 shadow-glow-cyan overflow-hidden"
          >
            {/* Header Fixo - Garantindo que nunca saia da tela */}
            <div className="bg-black/40 border-b border-white/5 backdrop-blur-md safe-pt">
              <div className="max-w-md mx-auto px-8 py-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Search className="text-primary w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-mono-tactical text-[10px] font-black uppercase tracking-[0.4em] text-primary">
                    {isRemapping ? "REMAPEAR SKU" : "AUDITORIA DE SKU"}
                  </h3>
                  <p className="text-xl font-black text-white uppercase tracking-tighter">
                    {isRemapping ? "Aguardando Novo Bip" : "Consulta de Catálogo"}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  if (isRemapping) {
                    setIsRemapping(false);
                    setSourceItem(null);
                    setPendingNewSku(null);
                  } else {
                    onClose();
                  }
                }} 
                className="p-2 text-white hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

            <div className="flex-1 overflow-y-auto px-8 pb-8">
              {/* Input de Busca */}
              <div className="relative mb-8 group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white group-focus-within:text-primary transition-colors">
                  <Package className="h-5 w-5" />
                </div>
                <input 
                  type="text" 
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="Escaneie ou digite o SKU..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-10 pr-14 text-white font-black tracking-widest focus:border-primary focus:outline-none transition-all placeholder:text-white/20"
                />
                <button 
                  onClick={onScanRequest}
                  disabled={isRemapping}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary hover:bg-primary hover:text-black transition-all shadow-glow-cyan-sm active:scale-90 disabled:opacity-20"
                >
                  <ScanLine className="w-5 h-5" />
                </button>
              </div>

              {/* Resultado */}
              <div className="min-h-[300px]">
              {isRemapping && sourceItem && pendingNewSku ? (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 py-8">
                  <div className="bg-primary/5 border border-primary/20 rounded-3xl p-6 space-y-6">
                    <div className="flex flex-col items-center gap-4 text-center">
                      <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                        <Check className="text-primary w-8 h-8" />
                      </div>
                      <div>
                        <div className="text-sm font-mono-tactical text-primary uppercase tracking-widest mb-1">Confirmação de Vínculo</div>
                        <div className="text-xl font-black text-white uppercase">{sourceItem.name}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 py-4 border-y border-white/5">
                      <div className="text-center flex-1">
                        <div className="text-[8px] font-mono-tactical text-white uppercase mb-2">SKU ANTIGO</div>
                        <div className="text-xs font-black text-white line-through">{sourceItem.sku}</div>
                      </div>
                      <ChevronRight className="text-primary animate-bounce-x" />
                      <div className="text-center flex-1">
                        <div className="text-[8px] font-mono-tactical text-primary uppercase mb-2">NOVO SKU</div>
                        <div className="text-sm font-black text-primary shadow-glow-cyan-sm">{pendingNewSku}</div>
                      </div>
                    </div>

                    <p className="text-[10px] text-white text-center uppercase leading-relaxed font-medium">
                      Ao confirmar, todos os itens em estoque e históricos deste produto serão movidos para o novo SKU.
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={() => {
                        setIsRemapping(false);
                        setPendingNewSku(null);
                      }}
                      className="flex-1 bg-white/5 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[10px]"
                    >
                      CANCELAR
                    </button>
                    <button 
                      onClick={handleRemap}
                      disabled={isSaving}
                      className="flex-2 bg-primary text-black py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-glow-cyan flex items-center justify-center gap-2"
                    >
                      {isSaving ? (
                        <span className="h-4 w-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      ) : (
                        "CONFIRMAR VÍNCULO"
                      )}
                    </button>
                  </div>
                </motion.div>
              ) : isRemapping ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                  <div className="w-20 h-20 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                  <div>
                    <div className="text-xl font-black text-white uppercase italic tracking-tighter">AGUARDANDO NOVO CÓDIGO...</div>
                    <p className="text-white text-[10px] uppercase font-mono-tactical tracking-widest mt-2">
                      Bipe o código correto para vincular a <br/>
                      <span className="text-primary">{sourceItem?.name}</span>
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      setIsRemapping(false);
                      setSourceItem(null);
                    }}
                    className="text-white text-[10px] font-black uppercase tracking-widest underline decoration-primary/30"
                  >
                    CANCELAR OPERAÇÃO
                  </button>
                </motion.div>
              ) : sku ? (
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
                          <Package className="w-10 h-10 text-white" />
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
                            <label className="text-[9px] font-mono-tactical text-white uppercase tracking-[0.2em]">Nome do Produto</label>
                            <div className="bg-primary/10 border border-primary/20 text-primary text-[8px] font-black px-2 py-0.5 rounded-full flex items-center gap-1.5 animate-pulse">
                              <Package className="w-2.5 h-2.5" />
                              ESTOQUE ATUAL: {
                                (() => {
                                  const allProducts = useStore.getState().products;
                                  return allProducts.filter(p => {
                                    if (p.status !== 'in_stock') return false;
                                    
                                    const matchSku = p.sku?.trim().toUpperCase() === foundItem.sku.trim().toUpperCase();
                                    const matchInternal = foundItem.internal_code && (
                                      p.internal_code?.trim().toUpperCase() === foundItem.internal_code.trim().toUpperCase() ||
                                      p.sku?.trim().toUpperCase() === foundItem.internal_code.trim().toUpperCase()
                                    );
                                    const matchName = p.name.trim().toUpperCase() === foundItem.name.trim().toUpperCase();
                                    
                                    return matchSku || matchInternal || matchName;
                                  }).length;
                                })()
                              }
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
                            <label className="text-[9px] font-mono-tactical text-white uppercase tracking-[0.2em]">Custo (R$)</label>
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
                              <div className="text-lg font-black text-white">R$ {foundItem.cost?.toFixed(2) || '0.00'}</div>
                            )}
                          </div>
                          <div className="flex-1 space-y-1">
                            <label className="text-[9px] font-mono-tactical text-white uppercase tracking-[0.2em]">Venda (R$)</label>
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

                        <div className="space-y-1">
                          <label className="text-[9px] font-mono-tactical text-white uppercase tracking-[0.2em]">CÓDIGO INTERNO DA LOJA (1-4 DÍGITOS)</label>
                          {isEditing ? (
                            <input 
                              type="text" 
                              maxLength={4}
                              placeholder="Ex: 1234"
                              value={editData.internal_code || ""}
                              onChange={(e) => setEditData(prev => ({ ...prev, internal_code: e.target.value }))}
                              className="w-full bg-white/10 border border-primary/40 rounded-xl px-4 py-3 text-white font-black text-sm focus:outline-none"
                            />
                          ) : (
                            <div className="text-sm font-black text-primary/60 tracking-widest italic">{foundItem.internal_code || "NÃO DEFINIDO"}</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="flex gap-3 pt-4">
                        <button 
                          onClick={() => setIsEditing(false)}
                          className="flex-1 bg-white/5 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[10px]"
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
                      <div className="space-y-3">
                        <button 
                          onClick={() => setIsEditing(true)}
                          className="w-full bg-white/10 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-white/20 transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                          EDITAR INFORMAÇÕES
                        </button>
                        <button 
                          onClick={startRemap}
                          className="w-full bg-primary/10 text-primary border border-primary/20 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-primary/20 transition-all"
                        >
                          <RefreshCw className="w-4 h-4" />
                          ALTERAR/REMAPEAR SKU
                        </button>
                      </div>
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
                        <p className="text-white text-[10px] uppercase font-mono-tactical tracking-widest mt-1">Este código ainda não possui inteligência própria.</p>
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
          </div>

            {/* Tactical Footer */}
            <div className="mt-8 pt-6 border-t border-white/5 text-center">
              <p className="text-[8px] text-white font-mono-tactical uppercase tracking-[0.4em]">
                Protocolo de Auditoria e Ajuste de Metadados v2.0
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
