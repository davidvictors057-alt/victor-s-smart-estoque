import { useState, useMemo, useLayoutEffect } from "react";
import { Search, X } from "lucide-react";
import { useStore } from "@/store/useStore";

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

    const searchTerms = query.toLowerCase().split(" ").filter(t => t);
    const itemsMap = new Map<string, any>();

    const getIdentityKey = (name: string, spec: string) => {
      const n = (name || "Sem Nome").trim().toLowerCase();
      const s = (spec || "").trim().toLowerCase();
      return `${n}@@@${s}`;
    };

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
        const stockCount = products.filter(p => 
          p.status === 'in_stock' && 
          (skusArray.includes(p.sku || "") || (p.name === item.name && (p.spec || "") === (item.spec || "")))
        ).length;

        return {
          ...item,
          sku: skusArray[0] || "",
          allSkus: skusArray,
          stockCount
        };
      })
      .filter(item => {
        const cleanTerm = query.toLowerCase().replace(/[\s\.]/g, '');
        if (!cleanTerm) return true;

        const nameClean = item.name.toLowerCase().replace(/[\s\.]/g, '');
        const specClean = (item.spec || "").toLowerCase().replace(/[\s\.]/g, '');
        const skusClean = item.allSkus.map((s: string) => s.toLowerCase().replace(/[\s\.]/g, '')).join(" ");
        const internalClean = Array.from(item.internal_codes as Set<string> || []).map((c: string) => c.toLowerCase().replace(/[\s\.]/g, '')).join(" ");
        
        const searchPool = `${nameClean} ${specClean} ${skusClean} ${internalClean}`;
        return searchPool.includes(cleanTerm);
      })
      .sort((a, b) => b.stockCount - a.stockCount);
  }, [query, catalog, products]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[300] flex flex-col bg-black overscroll-none">
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
                      {item.allSkus.map((s: string) => (
                        <div key={s} className="text-[8px] font-mono-tactical text-white/30 bg-white/5 px-1.5 py-0.5 rounded">
                          {s}
                        </div>
                      ))}
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
