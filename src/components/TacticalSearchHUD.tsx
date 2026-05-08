import { useState, useMemo, useLayoutEffect } from "react";
import { Search, X } from "lucide-react";
import { useStore } from "@/store/useStore";
import { sortSearchResults } from "@/lib/searchUtils";

interface TacticalSearchModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (sku: string) => void;
}

const TacticalSearchHUD = ({ open, onClose, onSelect }: TacticalSearchModalProps) => {
  const [query, setQuery] = useState("");
  const { products, catalog } = useStore();

  // Bloqueio de scroll ULTRA-AGRESSIVO
  useLayoutEffect(() => {
    if (open) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        const top = document.body.style.top;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.height = '';
        document.body.style.overflow = '';
        if (top) {
          window.scrollTo(0, parseInt(top || '0') * -1);
        }
      };
    }
  }, [open]);

  const results = useMemo(() => {
    if (!query.trim()) return [];

    // 1. Preparar itens do inventário (todos, não apenas em estoque)
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

    // 2. Combinar com o catálogo (Deduplicar por SKU)
    const allItemsMap = new Map<string, any>();
    inventoryItems.forEach(item => allItemsMap.set(item.sku, item));
    catalog.forEach(item => allItemsMap.set(item.sku, item));

    const combinedItems = Array.from(allItemsMap.values()).map(item => {
      // Calcular estoque atual para feedback visual
      const stockCount = products.filter(p => 
        p.sku?.trim() === item.sku.trim() && p.status === 'in_stock'
      ).length;

      return {
        ...item,
        stockCount
      };
    });

    // 3. Rankear e ordenar
    return sortSearchResults(combinedItems, query).slice(0, 30);
  }, [query, catalog, products]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1110] flex flex-col bg-black overscroll-none">
      {/* Header Area */}
      <div className="bg-[#050505] border-b border-white/10 px-4 pt-[env(safe-area-inset-top)] pb-2 shrink-0">
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
              <Search className="h-3 w-3" />
            </div>
            <div className="font-mono-tactical text-[8px] uppercase tracking-[0.2em] text-primary/60">BUSCA TÁTICA</div>
          </div>
          <button 
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center text-white/40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Input Area */}
        <div className="relative flex items-center rounded-xl border border-primary/50 bg-white/[0.05] px-3 py-3">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="DIGITE O NOME..."
            className="w-full bg-transparent font-mono-tactical text-base font-black uppercase tracking-widest text-primary outline-none placeholder:text-white/10"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-white/40 p-1">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Results Area */}
      <div className="flex-1 overflow-y-auto bg-black pb-[80vh]">
        <div className="p-4 space-y-2">
          {query.trim().length > 0 ? (
            results.length > 0 ? (
              results.map((item) => (
                <button
                  key={item.sku}
                  onClick={() => {
                    onSelect(item.sku);
                    setQuery("");
                    onClose();
                  }}
                  className="bg-white/[0.03] border border-white/5 w-full flex items-center justify-between rounded-xl p-4 text-left active:bg-primary/20"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="text-xs font-black text-white uppercase truncate mb-1">
                      {item.name}
                    </div>
                    <div className="flex flex-wrap gap-1.5 items-center mt-1">
                      <div className="text-[9px] font-mono-tactical text-primary uppercase bg-primary/5 px-2 py-0.5 rounded border border-primary/20">
                        {item.spec || "PADRÃO"}
                      </div>
                      <div className="text-[8px] font-mono-tactical text-white/30 bg-white/5 px-1.5 py-0.5 rounded">
                        {item.sku}
                      </div>
                      {item.internal_code && (
                        <div className="text-[8px] font-mono-tactical text-white/30 bg-white/5 px-1.5 py-0.5 rounded">
                          ID: {item.internal_code}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`font-mono-tactical text-xs font-black ${item.stockCount > 0 ? "text-success" : "text-danger"}`}>
                      {item.stockCount} UN
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="py-10 text-center text-white/20 font-mono-tactical text-[10px] uppercase">
                Nada encontrado
              </div>
            )
          ) : (
            <div className="py-4 text-center">
              <div className="font-mono-tactical text-[10px] font-black uppercase tracking-[0.4em] text-white/20">
                Aguardando entrada...
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TacticalSearchHUD;
