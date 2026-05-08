import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Share2, 
  RefreshCcw, 
  Save,
  ChevronRight,
  Info,
  Plus,
  Minus,
  FileDown,
  Boxes,
  X,
  FileText,
  Trash2,
  Edit2
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { toast } from "sonner";
import jsPDF from "jspdf";
import TacticalSearchHUD from "./TacticalSearchHUD";
import { sortSearchResults } from "@/lib/searchUtils";

interface AuditHubProps {
  expected: { name: string; qty: number; sku?: string; qr?: string; spec?: string }[];
  identified: { name: string; qty: number; sku?: string; qr?: string; spec?: string; isManual?: boolean }[];
  type: 'stock' | 'invoice' | 'receiving';
  onClose: () => void;
}

export const AuditHub = ({ expected, identified, type, onClose }: AuditHubProps) => {
  const { products } = useStore();
  const [isSyncing, setIsSyncing] = useState(false);
  const [showOnlyIdentified, setShowOnlyIdentified] = useState(type === 'stock');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const [localItems, setLocalItems] = useState<any[]>([]);
  const [isSearchingForItem, setIsSearchingForItem] = useState<number | null>(null);

  useEffect(() => {
    // Carregar sessão persistente do dia
    const saved = localStorage.getItem(`audit_session_${type}`);
    let persistedAuditedSkus: string[] = [];
    if (saved) {
      try {
        const { skus, date } = JSON.parse(saved);
        const isToday = new Date(date).toDateString() === new Date().toDateString();
        if (isToday) persistedAuditedSkus = skus;
      } catch (e) {
        console.error("Erro ao carregar auditoria persistente");
      }
    }

    // Mapear estoque atual para visibilidade no recebimento
    const currentStockMap = products.reduce((acc, p) => {
      if (p.status === 'in_stock') {
        const key = `${p.sku || p.name}-${p.spec || ''}`;
        acc[key] = (acc[key] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Mesclar listas para comparação usando SKU + Spec (ou Nome + Spec)
    const allKeys = Array.from(new Set([
      ...expected.map(i => `${i.sku || i.name}-${i.spec || ''}`),
      ...identified.map(i => `${i.sku || i.name}-${i.spec || ''}`)
    ]));

    const merged = allKeys.map(key => {
      const expItem = expected.find(i => `${i.sku || i.name}-${i.spec || ''}` === key);
      const ideItem = identified.find(i => `${i.sku || i.name}-${i.spec || ''}` === key);
      
      // Stock matching by key
      const stock = currentStockMap[key as string] || 0;
      
      const exp = expItem?.qty || 0;
      const ide = ideItem?.qty || 0;
      const isAudited = persistedAuditedSkus.includes(key as string);
      
      return {
        key,
        name: (ideItem?.name || expItem?.name || 'Item não identificado').toUpperCase(),
        spec: expItem?.spec || ideItem?.spec || '',
        expected: exp,
        identified: ide,
        stock: stock,
        final: (isAudited || ide > 0) ? ide : exp, 
        diff: ((isAudited || ide > 0) ? ide : exp) - exp,
        sku: ideItem?.sku || expItem?.sku || '',
        qr: ideItem?.qr || expItem?.qr || '',
        isAudited: isAudited,
        isManual: ideItem?.isManual || (!expItem && ideItem),
        isMissing: expItem && !ideItem
      };
    });

    setLocalItems(merged);
  }, [expected, identified, type, products]);

  // Salvar sempre que a lista de auditados mudar
  useEffect(() => {
    if (localItems.length > 0) {
      const auditedSkus = localItems.filter(i => i.isAudited).map(i => i.key);
      localStorage.setItem(`audit_session_${type}`, JSON.stringify({
        skus: auditedSkus,
        date: new Date().toISOString()
      }));
    }
  }, [localItems, type]);

  const handleUpdateName = (index: number, name: string) => {
    const newItems = [...localItems];
    newItems[index].name = name;
    setLocalItems(newItems);
    
    // Se tiver SKU, já vamos sugerindo a atualização do catálogo (opcional, mas proativo)
    if (newItems[index].sku) {
      useStore.getState().addToCatalog({ sku: newItems[index].sku, name: name });
    }
  };

  const handleUpdateFinal = (index: number, val: number) => {
    const newItems = [...localItems];
    const num = Math.max(0, val);
    newItems[index].final = num;
    newItems[index].diff = num - newItems[index].expected;
    // Se o usuário ajustou manualmente no hub, marcamos como auditado
    newItems[index].isAudited = true;
    setLocalItems(newItems);
  };

  const handleResetAudit = () => {
    const resetItems = localItems.map(item => ({ 
      ...item, 
      isAudited: false, 
      final: item.identified, 
      diff: item.identified - item.expected 
    }));
    setLocalItems(resetItems);
    localStorage.removeItem(`audit_session_${type}`);
    toast.info("Sessão de auditoria reiniciada");
  };

  const handleAssociateProduct = (sku: string) => {
    if (isSearchingForItem === null) return;
    const index = isSearchingForItem;
    const { products, catalog } = useStore.getState();
    
    // Preparar lista combinada (mesma lógica do Explorar Catálogo)
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

    const combinedItems = Array.from(allItemsMap.values());
    
    // 1. Tentar match exato por SKU
    let product = allItemsMap.get(sku);
    
    // 2. Se não houver match exato, usar o motor de busca inteligente
    if (!product) {
      const matched = sortSearchResults(combinedItems, sku);
      if (matched.length > 0) {
        product = matched[0];
      }
    }

    if (product) {
      const newItems = [...localItems];
      newItems[index] = {
        ...newItems[index],
        name: product.name.toUpperCase(),
        sku: product.sku || sku,
        spec: product.spec || '',
        isManual: false,
        stock: products.filter(p => p.sku === (product?.sku || sku) && p.status === 'in_stock').length
      };
      setLocalItems(newItems);
      toast.success(`Vinculado ao produto: ${product.name}`);
    } else {
      toast.error("Produto não encontrado no sistema.");
    }
    setIsSearchingForItem(null);
  };

  const handleSaveItem = async (index: number) => {
    const item = localItems[index];
    setIsSyncing(true);
    try {
      // Sincronização Atômica: Se for ajuste de estoque, sincroniza este SKU imediatamente
      if (type === 'stock') {
        await useStore.getState().reconcileStockAudit([item]);
      }
      
      const newItems = [...localItems];
      newItems[index].isAudited = true;
      setLocalItems(newItems);
      
      // Feedback visual de sucesso
      toast.success(`${item.name} auditado com sucesso!`);
    } catch (error: any) {
      console.error("Erro ao salvar item:", error);
      toast.error(`Erro ao salvar: ${error.message || 'Falha na conexão'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSync = async () => {
    if (localItems.length === 0) return;
    setIsSyncing(true);
    try {
      const { addProduct, currentUser } = useStore.getState();
      
      if (type === 'invoice' || type === 'receiving') {
        // Para conferência de recebimento, adicionamos os produtos novos
        for (const item of localItems) {
          if (item.final > 0) {
            const cleanProduct = {
              sku: item.sku || null,
              name: item.name || 'Sem Nome',
              spec: item.spec || 'Padrão',
              brand: null,
              category: 'Geral',
              cost: 0,
              sale: 0,
              status: 'in_stock' as const,
              quantity: item.final
            };
            await addProduct(cleanProduct);
          }
        }
        // Sincronizar catálogo para todos os itens identificados
        for (const item of localItems) {
          if (item.sku) {
            await useStore.getState().addToCatalog({ 
              sku: item.sku, 
              name: item.name
            });
          }
        }
        
        toast.success(`${localItems.length} itens registrados no estoque!`);
      } else {
        // Para auditoria de estoque (ajuste), reconcilia o banco com os dados finais
        await useStore.getState().reconcileStockAudit(localItems);
      }
      onClose();
    } catch (err: any) {
      toast.error(`Erro ao sincronizar: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      const title = type === 'stock' ? "AUDITORIA DE ESTOQUE" : "CONFERENCIA DE RECEBIMENTO";
      const date = new Date().toLocaleString('pt-BR');

      doc.setFontSize(20);
      doc.setTextColor(0, 0, 0);
      doc.text("VICTOR'S SMART ESTOQUE", 20, 20);
      
      doc.setFontSize(14);
      doc.text(title, 20, 30);
      doc.setFontSize(10);
      doc.text(`Data: ${date}`, 20, 38);

      let y = 50;
      doc.setFontSize(12);
      doc.text("Item", 20, y);
      doc.text("Esperado", 100, y);
      doc.text("Final", 140, y);
      doc.text("Status", 170, y);

      doc.line(20, y + 2, 190, y + 2);
      y += 10;

      localItems.forEach(i => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        const status = i.diff === 0 ? "OK" : i.diff > 0 ? `+${i.diff}` : `${i.diff}`;
        doc.text(i.name.substring(0, 30), 20, y);
        doc.text(i.expected.toString(), 100, y);
        doc.text(i.final.toString(), 140, y);
        doc.text(status, 170, y);
        y += 8;
      });

      doc.save(`audit_${Date.now()}.pdf`);
      toast.success("PDF gerado com sucesso!");
    } catch (err) {
      toast.error("Erro ao gerar PDF.");
    }
  };

  const handleExport = () => {
    const title = type === 'stock' ? "📦 AUDITORIA DE ESTOQUE" : "📦 CONFERÊNCIA DE RECEBIMENTO";
    let text = `${title}\n\n`;
    
    localItems.forEach(i => {
      if (i.final > 0) {
        text += `${i.name}: ${i.final} \n\n`;
      }
    });

    text += `Gerado por Victor's Smart Estoque`;

    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
    toast.success("Relatório gerado para WhatsApp!");
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black h-[100dvh] overflow-hidden">
      {/* Header Tático - Sticky and Safe-Area Optimized */}
      <header className="sticky top-0 z-30 bg-black-piano border-b border-white/5 p-6 pt-[calc(env(safe-area-inset-top)+1.5rem)] flex flex-col gap-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-glow-cyan border border-primary/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <div className="h-0.5 w-4 bg-primary rounded-full" />
                <span className="text-[9px] font-black text-primary uppercase tracking-[0.4em]">Audit Intelligence Hub</span>
              </div>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">
                {type === 'stock' ? 'Auditoria' : (type === 'receiving' ? 'Recebimento' : 'Conferência')}
              </h2>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowOnlyIdentified(!showOnlyIdentified)}
              className={`px-4 py-2 rounded-xl border text-[8px] font-black uppercase tracking-widest transition-all ${
                showOnlyIdentified ? 'bg-primary text-black border-primary shadow-glow-cyan' : 'bg-white/5 text-white border-white/10'
              }`}
            >
              {showOnlyIdentified ? "VER TUDO" : "FILTRAR BIPADOS"}
            </button>
            <button 
              onClick={onClose}
              className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center text-white hover:text-white hover:bg-rose-500/10 hover:text-rose-500 transition-all active:scale-95 border border-white/10"
              aria-label="Fechar Hub"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar Tática - HUD Blindado */}
        {type === 'stock' ? (
          <div className="bg-black/80 p-5 rounded-3xl border border-white/10 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-primary animate-pulse shadow-[0_0_10px_#00A3FF]" />
                <span className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Auditoria de Estoque</span>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/5 flex items-center gap-2">
                  <span className="text-[8px] font-bold text-white uppercase">SKUs:</span>
                  <span className="text-xs font-mono-tactical text-primary font-black">
                    {localItems.filter(i => i.isAudited).length}/{expected.length}
                  </span>
                </div>
                
                <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/5 flex items-center gap-2">
                  <span className="text-[8px] font-bold text-white uppercase">Eficiência:</span>
                  <span className="text-xs font-black text-primary italic">
                    {expected.length > 0 ? Math.round((localItems.filter(i => i.isAudited).length / expected.length) * 100) : 0}%
                  </span>
                </div>

                <button 
                  onClick={handleResetAudit}
                  className="px-4 py-2 bg-rose-500/10 border border-rose-500/30 rounded-xl text-[10px] font-black text-rose-500 hover:bg-rose-500 hover:text-white transition-all uppercase tracking-tighter"
                >
                  RESETAR SESSÃO
                </button>
              </div>
            </div>
            
            <div className="h-4 w-full bg-black/40 rounded-full overflow-hidden border border-white/10 p-0.5 relative">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${expected.length > 0 ? (localItems.filter(i => i.isAudited).length / expected.length) * 100 : 0}%` }}
                className="h-full bg-gradient-to-r from-success via-primary to-cyan-400 rounded-full shadow-[0_0_20px_#00A3FF] relative"
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </motion.div>
            </div>
          </div>
        ) : (
          <div className="bg-black/80 p-5 rounded-3xl border border-white/10 shadow-2xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-success animate-pulse shadow-glow-success" />
                <span className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Fluxo de Entrada</span>
              </div>
              <div className="px-3 py-1 bg-success/10 rounded-lg border border-success/20">
                <span className="text-[9px] font-black text-success uppercase">
                  {type === 'receiving' ? 'MODO LIVRE' : 'CONFERÊNCIA NF'}
                </span>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-8 custom-scrollbar">
        {/* Sumário de Auditoria */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Itens', val: localItems.length, icon: Boxes, color: 'text-white' },
            { 
              label: type === 'stock' ? 'Conformes' : 'Bipados', 
              val: type === 'stock' ? localItems.filter(i => i.diff === 0).length : localItems.reduce((acc, i) => acc + i.final, 0), 
              icon: CheckCircle2, 
              color: 'text-success' 
            },
            { 
              label: type === 'stock' ? 'Divergentes' : 'Fora da Nota', 
              val: type === 'stock' ? localItems.filter(i => i.diff !== 0).length : localItems.filter(i => i.isManual).length, 
              icon: AlertTriangle, 
              color: type === 'stock' ? 'text-rose-500' : 'text-primary' 
            },
            { 
              label: type === 'stock' ? 'Esperados' : 'Esperados NF', 
              val: expected.reduce((acc, i) => acc + i.qty, 0), 
              icon: Info, 
              color: 'text-white/40' 
            },
          ].map((stat, i) => (stat && (
            <div key={i} className="bg-black-piano/40 p-5 rounded-3xl border border-white/5 flex flex-col gap-1">
              <div className="flex items-center gap-2 opacity-30 mb-1">
                <stat.icon className="h-3 w-3" />
                <span className="text-[9px] font-black uppercase tracking-widest">{stat.label}</span>
              </div>
              <span className={`text-2xl font-black ${stat.color}`}>{stat.val}</span>
            </div>
          )))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-40">
          <AnimatePresence>
            {localItems.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full flex flex-col items-center justify-center py-20 opacity-40 border-2 border-dashed border-white/10 rounded-[3rem]"
              >
                <Boxes className="h-16 w-16 mb-4 text-primary animate-pulse" />
                <p className="text-sm font-black uppercase tracking-[0.3em] text-white">Nenhum item detectado</p>
                <p className="text-[10px] font-mono-tactical uppercase mt-2">O lote de auditoria está vazio.</p>
              </motion.div>
            )}
            {localItems.map((item, originalIndex) => {
              if (showOnlyIdentified && item.identified === 0) return null;
              
              return (
                <motion.div 
                  key={originalIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: originalIndex * 0.05 }}
                  className={`bg-black-piano/50 backdrop-blur-md rounded-[2rem] p-5 flex flex-col gap-4 relative overflow-hidden group border ${
                    item.diff !== 0 && type === 'stock' ? 'border-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.05)]' : 'border-white/5 hover:border-primary/20'
                  } transition-all`}
                >
                  {/* Background Pattern */}
                  <div className="absolute -top-4 -right-4 opacity-5 group-hover:opacity-10 transition-all">
                    <Boxes className="h-32 w-32 text-white" />
                  </div>

                  <div className="flex flex-col gap-4 relative">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${item.diff === 0 ? 'bg-success' : 'bg-rose-500 animate-pulse'}`} />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Produto / Registro</span>
                      </div>
                      {item.spec && (
                        <div className="text-[10px] text-white/40 font-medium truncate uppercase">
                          {item.spec}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        {item.isManual && (
                          <button 
                            onClick={() => setIsSearchingForItem(originalIndex)}
                            className="px-2 py-1 bg-primary text-black rounded-lg text-[7px] font-black uppercase shadow-glow-cyan z-10 border border-white/20 active:scale-95"
                          >
                            Vincular
                          </button>
                        )}
                        {item.diff !== 0 && (
                          <button 
                            onClick={() => setSelectedItem(item)}
                            className="px-2 py-1 bg-rose-500/20 text-rose-500 rounded-lg text-[7px] font-black uppercase border border-rose-500/30 hover:bg-rose-500 hover:text-white transition-all z-10"
                          >
                            Detalhar
                          </button>
                        )}
                        {item.sku && (
                          <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10">
                            <span className="text-[9px] font-mono-tactical text-primary uppercase tracking-tighter">SKU: {item.sku}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="relative">
                      <textarea 
                        value={item.name}
                        onChange={(e) => handleUpdateName(originalIndex, e.target.value)}
                        rows={1}
                        className={`w-full bg-black/40 border-2 rounded-xl p-3 text-xs font-black text-white focus:ring-4 focus:ring-primary/20 outline-none resize-none transition-all ${
                          item.isManual ? 'border-rose-500/40 shadow-glow-danger/20' : 'border-white/5 group-hover:border-primary/30'
                        }`}
                        placeholder="Identificando nome do produto..."
                      />
                      {item.isManual && (
                        <div className="absolute -top-2 -right-2 bg-rose-500 text-white text-[8px] font-black px-2 py-1 rounded shadow-lg uppercase tracking-tighter animate-bounce">
                          Ação Necessária
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Comparativo Tático */}
                  <div className="grid grid-cols-3 gap-2 bg-black/40 rounded-2xl p-3 border border-white/5">
                    <div className="text-center space-y-0.5">
                      <p className="text-[7px] font-black text-white/40 uppercase tracking-widest">
                        {type === 'stock' ? 'Sistema' : 'Estoque Atual'}
                      </p>
                      <p className="text-sm font-black text-white">{type === 'stock' ? item.expected : item.stock}</p>
                    </div>
                    <div className="text-center space-y-0.5 border-x border-white/5">
                      <p className="text-[7px] font-black text-primary uppercase tracking-widest">
                        {type === 'stock' ? 'Físico' : 'Entrada'}
                      </p>
                      <p className={`text-sm font-black ${item.diff === 0 && type === 'stock' ? 'text-primary' : 'text-success'}`}>{item.final}</p>
                    </div>
                    <div className="text-center space-y-0.5">
                      <p className="text-[7px] font-black text-white/40 uppercase tracking-widest">
                        {type === 'stock' ? 'Diferença' : 'Novo Total'}
                      </p>
                      <p className={`text-sm font-black ${item.diff === 0 && type === 'stock' ? 'text-success' : 'text-primary'}`}>
                        {type === 'stock' ? (item.diff > 0 ? `+${item.diff}` : item.diff) : (item.stock + item.final)}
                      </p>
                    </div>
                  </div>

                  {/* Controles de Ajuste Final */}
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleUpdateFinal(originalIndex, item.final - 1)}
                      className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-white hover:text-white hover:bg-white/10 transition-all active:scale-90 border border-white/10"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    
                    <div className="flex-1 h-10 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between px-4">
                      <span className="text-[8px] font-black text-primary/40 uppercase tracking-widest">QTD</span>
                      <span className="text-sm font-black text-primary">{item.final}</span>
                    </div>

                    <button 
                      onClick={() => handleUpdateFinal(originalIndex, item.final + 1)}
                      className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary/60 hover:text-primary hover:bg-primary/20 transition-all active:scale-90 border border-primary/20 shadow-glow-cyan/10"
                    >
                      <Plus className="h-4 w-4" />
                    </button>

                    <button 
                      onClick={() => handleSaveItem(originalIndex)}
                      className={`px-4 h-10 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all border ${
                        item.isAudited 
                        ? 'bg-success/20 text-success border-success/30 cursor-default' 
                        : 'bg-primary text-black border-primary shadow-glow-cyan hover:scale-105 active:scale-95'
                      }`}
                    >
                      {item.isAudited ? "OK" : "SALVAR"}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer Actions */}
      {/* Finalization Dock - Tactical Command */}
      <footer className="p-4 sm:p-6 bg-black-piano border-t border-white/5 relative z-10">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button 
            onClick={handleSync}
            disabled={isSyncing}
            className="flex-1 h-14 rounded-2xl bg-success text-black font-black shadow-glow-green hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 transition-all uppercase text-[11px] tracking-widest disabled:opacity-50 border-2 border-white/20"
          >
            {isSyncing ? <RefreshCcw className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
            <span>CONCLUIR</span>
          </button>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleExportPDF}
              className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all active:scale-90"
              title="Exportar PDF"
            >
              <FileDown className="h-5 w-5" />
            </button>
            
            <button 
              onClick={handleExport}
              className="h-14 w-14 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shadow-glow-cyan-sm hover:bg-primary hover:text-black transition-all active:scale-90"
              title="Enviar via WhatsApp"
            >
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </footer>
      {/* Popup de Detalhamento de Divergência */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-black-piano border-2 border-rose-500/30 w-full max-w-md rounded-[2.5rem] p-8 shadow-[0_0_50px_rgba(244,63,94,0.2)]"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-500">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Divergência Detectada</div>
                  <h3 className="text-xl font-black text-white uppercase">{selectedItem.name}</h3>
                </div>
              </div>

              <div className="bg-black/40 rounded-3xl p-6 border border-white/5 space-y-4 mb-8">
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <span className="text-xs font-black text-white uppercase">Esperado (Sistema)</span>
                  <span className="text-xl font-black text-white">{selectedItem.expected} un</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <span className="text-xs font-black text-primary/40 uppercase">Identificado (Físico)</span>
                  <span className="text-xl font-black text-primary">{selectedItem.final} un</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-rose-500/40 uppercase">Diferença</span>
                  <span className="text-xl font-black text-rose-500">{selectedItem.diff > 0 ? `+${selectedItem.diff}` : selectedItem.diff} un</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <button 
                  onClick={() => {
                    const text = `🚨 DIVERGÊNCIA DE ESTOQUE\nItem: ${selectedItem.name}\nSKU: ${selectedItem.sku || 'N/A'}\nSistema: ${selectedItem.expected}\nFísico: ${selectedItem.final}\nDiferença: ${selectedItem.diff}\n\nGerado por Victor's Smart Estoque`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                  className="h-14 rounded-2xl bg-success font-black text-black text-[10px] tracking-widest uppercase flex items-center justify-center gap-2 shadow-glow-green"
                >
                  <Share2 className="h-4 w-4" /> WHATSAPP
                </button>
                <button 
                  onClick={() => {
                    const doc = new jsPDF();
                    doc.setFontSize(20);
                    doc.text("DETALHE DE DIVERGÊNCIA", 20, 20);
                    doc.setFontSize(14);
                    doc.text(`Item: ${selectedItem.name}`, 20, 40);
                    doc.text(`SKU: ${selectedItem.sku || 'N/A'}`, 20, 50);
                    doc.text(`Sistema: ${selectedItem.expected}`, 20, 60);
                    doc.text(`Físico: ${selectedItem.final}`, 20, 70);
                    doc.text(`Diferença: ${selectedItem.diff}`, 20, 80);
                    doc.save(`divergencia_${selectedItem.sku || 'item'}.pdf`);
                  }}
                  className="h-14 rounded-2xl bg-white/5 border border-white/10 font-black text-white text-[10px] tracking-widest uppercase flex items-center justify-center gap-2"
                >
                  <FileDown className="h-4 w-4" /> PDF
                </button>
              </div>

              <button 
                onClick={() => setSelectedItem(null)}
                className="w-full h-14 rounded-2xl bg-white/5 font-black text-white text-[10px] tracking-widest uppercase hover:text-white transition-all"
              >
                FECHAR DETALHES
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <TacticalSearchHUD 
        open={isSearchingForItem !== null}
        onClose={() => setIsSearchingForItem(null)}
        onSelect={handleAssociateProduct}
      />
    </div>
  );
};
