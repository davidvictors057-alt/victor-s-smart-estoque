import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Package, ChevronRight, AlertTriangle } from "lucide-react";
import { useState, useMemo } from "react";
import { useStore, CatalogItem } from "@/store/useStore";

interface SearchByNameHUDProps {
  open: boolean;
  onClose: () => void;
  onSelect: (item: CatalogItem) => void;
}

export const SearchByNameHUD = ({ open, onClose, onSelect }: SearchByNameHUDProps) => {
  const { catalog } = useStore();
  const [term, setTerm] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const results = useMemo(() => {
    if (!term || term.length < 2) return [];
    const searchLower = term.toLowerCase();

    // 1. Coletar itens do catálogo
    const catalogResults = catalog.filter(c => 
      c.name.toLowerCase().includes(searchLower) || 
      c.sku.toLowerCase().includes(searchLower) ||
      (c.internal_code && c.internal_code.toLowerCase().includes(searchLower))
    );

    // 2. Fallback: Coletar itens únicos do estoque (products) que não estão no catálogo
    const productList = useStore.getState().products;
    const existingSkus = new Set(catalogResults.map(c => c.sku.trim()));
    
    const inventoryResults: CatalogItem[] = [];
    const processedSkus = new Set();

    productList.forEach(p => {
      if (!p.sku) return;
      const cleanSku = p.sku.trim();
      
      if (!existingSkus.has(cleanSku) && !processedSkus.has(cleanSku)) {
        if (p.name.toLowerCase().includes(searchLower) || cleanSku.toLowerCase().includes(searchLower)) {
          inventoryResults.push({
            sku: cleanSku,
            name: p.name,
            spec: p.spec,
            image_url: p.image_url,
            cost: p.cost,
            sale: p.sale,
            internal_code: p.internal_code,
            last_updated: p.updated_at
          });
          processedSkus.add(cleanSku);
        }
      }
    });

    return [...catalogResults, ...inventoryResults].slice(0, 10);
  }, [term, catalog]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setHasSearched(true);
    }
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
            className="fixed inset-x-0 bottom-0 z-[110] mx-auto max-w-lg max-h-[92vh] flex flex-col rounded-t-[3rem] bg-black-piano border-t-2 border-primary/20 p-8 pt-10 shadow-[0_-20px_50px_rgba(0,243,255,0.1)] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Search className="text-primary w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-mono-tactical text-[10px] font-black uppercase tracking-[0.4em] text-primary">BUSCA POR NOME</h3>
                  <p className="text-xl font-black text-white uppercase tracking-tighter">Explorar Catálogo</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-white hover:text-white transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Input com Botão de Busca */}
            <div className="relative mb-8 group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white group-focus-within:text-primary transition-colors">
                <Package className="h-5 w-5" />
              </div>
              <input 
                type="text" 
                value={term}
                onChange={(e) => {
                  setTerm(e.target.value);
                  setHasSearched(false);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Nome, SKU ou Código Interno..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-12 pr-16 text-white font-black tracking-tight focus:border-primary focus:outline-none transition-all placeholder:text-white"
              />
              <button 
                onClick={() => setHasSearched(true)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-black shadow-glow-cyan active:scale-90 transition-all"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>

            {/* Lista de Resultados com Feedback */}
            <div className="min-h-[350px] max-h-[450px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {term.length < 2 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center opacity-20">
                  <Search className="w-16 h-16 mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em]">Digite pelo menos 2 caracteres</p>
                </div>
              ) : results.length > 0 ? (
                <>
                  <div className="px-2 mb-2 flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-primary" />
                    <span className="text-[9px] font-black text-primary uppercase tracking-widest">{results.length} Itens Encontrados</span>
                  </div>
                  {results.map((item) => (
                    <button 
                      key={item.sku}
                      onClick={() => {
                        onSelect(item);
                        onClose();
                      }}
                      className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-primary/10 hover:border-primary/20 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/5">
                          {item.image_url ? (
                            <img src={item.image_url} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-6 h-6 text-white" />
                          )}
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-black text-white uppercase truncate max-w-[180px] leading-tight">{item.name}</div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <div className="text-[9px] font-mono-tactical text-primary uppercase tracking-widest">{item.sku}</div>
                            {item.internal_code && (
                              <div className="text-[9px] font-mono-tactical text-white uppercase tracking-widest">ID: {item.internal_code}</div>
                            )}
                            <div className="bg-primary/20 text-primary text-[8px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-1">
                              <Package className="w-2 h-2" />
                              ESTOQUE: {useStore.getState().products.filter(p => p.sku?.trim() === item.sku.trim() && p.status === 'in_stock').length}
                            </div>
                          </div>
                          <div className="flex gap-3 mt-1 opacity-40">
                            <span className="text-[9px] font-black">C: R${item.cost?.toFixed(2)}</span>
                            <span className="text-[9px] font-black text-primary">V: R${item.sale?.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-white group-hover:text-primary transition-colors" />
                    </button>
                  ))}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-warning/10 flex items-center justify-center">
                    <AlertTriangle className="text-warning w-10 h-10" />
                  </div>
                  <div>
                    <p className="text-xl font-black text-white uppercase tracking-tighter italic">NADA ENCONTRADO</p>
                    <p className="text-[10px] font-black text-white uppercase tracking-[0.2em] mt-1 max-w-[200px]">
                      Este item não consta no seu catálogo inteligente.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Tactical Footer */}
            <div className="mt-8 pt-6 border-t border-white/5 text-center">
              <p className="text-[8px] text-white font-mono-tactical uppercase tracking-[0.4em]">
                Engine de Busca Tática v2.1 • Victor's Smart Estoque
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
