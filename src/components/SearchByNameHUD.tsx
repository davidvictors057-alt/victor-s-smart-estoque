import { X, Search, Package, ChevronRight, AlertTriangle } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useStore, CatalogItem } from "@/store/useStore";

interface SearchByNameHUDProps {
  open: boolean;
  onClose: () => void;
  onSelect: (item: CatalogItem) => void;
}

export const SearchByNameHUD = ({ open, onClose, onSelect }: SearchByNameHUDProps) => {
  const { catalog } = useStore();
  const [term, setTerm] = useState("");

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100vh';
      return () => {
        document.body.style.overflow = '';
        document.body.style.height = '';
      };
    }
  }, [open]);

  const results = useMemo(() => {
    if (!term || term.length < 2) return [];
    const searchLower = term.toLowerCase();

    const catalogResults = catalog.filter(c => 
      c.name.toLowerCase().includes(searchLower) || 
      c.sku.toLowerCase().includes(searchLower) ||
      (c.internal_code && c.internal_code.toLowerCase().includes(searchLower))
    );

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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[300] flex flex-col bg-black">
      {/* Header Area - Static */}
      <div className="sticky top-0 z-20 bg-[#050505] border-b border-white/10 px-4 pt-[env(safe-area-inset-top)] pb-3">
        <div className="flex items-center justify-between py-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
              <Search className="h-3 w-3" />
            </div>
            <div className="font-mono-tactical text-[8px] uppercase tracking-[0.2em] text-primary/60">AUDITORIA GLOBAL</div>
          </div>
          <button 
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Input Area */}
        <div className="group relative flex items-center rounded-xl border border-primary/50 bg-white/[0.05] px-3 py-3 transition-all focus-within:border-primary">
          <input
            autoFocus
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="PROCURAR POR NOME OU SKU..."
            className="w-full bg-transparent font-mono-tactical text-base font-black uppercase tracking-widest text-primary outline-none placeholder:text-white/10"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
          />
          {term && (
            <button onClick={() => setTerm("")} className="text-white/40 p-1">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Results Area */}
      <div className="flex-1 px-4 py-6 bg-black overflow-y-auto pb-[50vh]">
        {term.length < 2 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-20">
            <Search className="w-16 h-16 mb-4 text-white" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Aguardando entrada operacional...</p>
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-3">
            <div className="px-1 mb-4 flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-primary" />
              <span className="text-[9px] font-black text-primary uppercase tracking-widest">{results.length} ITENS ENCONTRADOS</span>
            </div>
            {results.map((item) => (
              <button 
                key={item.sku}
                onClick={() => {
                  onSelect(item);
                  onClose();
                }}
                className="w-full flex items-center justify-between p-4 bg-white/[0.03] border border-white/5 rounded-2xl active:scale-[0.98] transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/5">
                    {item.image_url ? (
                      <img src={item.image_url} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-5 h-5 text-white/20" />
                    )}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-black text-white uppercase truncate max-w-[180px] leading-tight">{item.name}</div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <div className="text-[9px] font-mono-tactical text-primary uppercase tracking-widest">{item.sku}</div>
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-white/20 group-hover:text-primary transition-colors" />
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="text-red-500 w-10 h-10" />
            </div>
            <div>
              <p className="text-xl font-black text-white uppercase tracking-tighter italic">NADA ENCONTRADO</p>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mt-1 max-w-[200px]">
                Este item não consta no seu catálogo inteligente.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
