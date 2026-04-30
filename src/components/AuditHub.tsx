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
  Boxes
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { toast } from "sonner";
import jsPDF from "jspdf";

interface AuditHubProps {
  expected: { name: string; qty: number; sku?: string; qr?: string }[];
  identified: { name: string; qty: number; sku?: string; qr?: string }[];
  type: 'stock' | 'invoice';
  onClose: () => void;
}

export const AuditHub = ({ expected, identified, type, onClose }: AuditHubProps) => {
  const { products, updateProduct } = useStore();
  const [items, setItems] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showOnlyIdentified, setShowOnlyIdentified] = useState(type === 'stock');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

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

    // Mesclar listas para comparação
    const allKeys = Array.from(new Set([
      ...expected.map(i => i.sku || i.qr || i.name),
      ...identified.map(i => i.sku || i.qr || i.name)
    ]));

    const merged = allKeys.map(key => {
      const expItem = expected.find(i => (i.sku || i.qr || i.name) === key);
      const ideItem = identified.find(i => (i.sku || i.qr || i.name) === key);
      
      const exp = expItem?.qty || 0;
      const ide = ideItem?.qty || 0;
      const isAudited = persistedAuditedSkus.includes(key as string);
      
      // Se já foi auditado e salvo, usamos a lógica de final = expected se bater, ou ide se divergir
      // Mas para manter a integridade, vamos usar o flag isAudited para o progresso
      return {
        key,
        name: ideItem?.name || expItem?.name || 'Item não identificado',
        expected: exp,
        identified: ide,
        final: isAudited ? exp : ide, // Se salvo, assume conferência OK (ou o valor que estava)
        diff: (isAudited ? exp : ide) - exp,
        sku: ideItem?.sku || expItem?.sku || '',
        qr: ideItem?.qr || expItem?.qr || '',
        isAudited: isAudited,
        isManual: ideItem?.name?.includes('DIGITAR NOME') || (ideItem as any)?.isManual
      };
    });

    setItems(merged);
  }, [expected, identified, type]);

  // Salvar sempre que a lista de auditados mudar
  useEffect(() => {
    if (items.length > 0) {
      const auditedSkus = items.filter(i => i.isAudited).map(i => i.key);
      localStorage.setItem(`audit_session_${type}`, JSON.stringify({
        skus: auditedSkus,
        date: new Date().toISOString()
      }));
    }
  }, [items, type]);

  const handleUpdateName = (index: number, name: string) => {
    const newItems = [...items];
    newItems[index].name = name;
    setItems(newItems);
    
    // Se tiver SKU, já vamos sugerindo a atualização do catálogo (opcional, mas proativo)
    if (newItems[index].sku) {
      useStore.getState().addToCatalog({ sku: newItems[index].sku, name: name });
    }
  };

  const handleUpdateFinal = (index: number, val: number) => {
    const newItems = [...items];
    const num = Math.max(0, val);
    newItems[index].final = num;
    newItems[index].diff = num - newItems[index].expected;
    // Se o usuário ajustou manualmente, marcamos como conferido
    newItems[index].isAudited = true;
    setItems(newItems);
  };

  const handleResetAudit = () => {
    const resetItems = items.map(item => ({ 
      ...item, 
      isAudited: false, 
      final: item.identified, 
      diff: item.identified - item.expected 
    }));
    setItems(resetItems);
    localStorage.removeItem(`audit_session_${type}`);
    toast.info("Sessão de auditoria reiniciada");
  };

  const handleSaveItem = async (index: number) => {
    const item = items[index];
    setIsSyncing(true);
    try {
      // Sincronização Atômica: Se for ajuste de estoque, sincroniza este SKU imediatamente
      if (type === 'stock') {
        await useStore.getState().reconcileStockAudit([item]);
      }
      
      const newItems = [...items];
      newItems[index].isAudited = true;
      setItems(newItems);
      
      // Feedback visual de sucesso
      toast.success(`${item.name} auditado com sucesso!`);
    } catch (error) {
      toast.error("Erro ao salvar auditoria do item");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSync = async () => {
    if (items.length === 0) return;
    setIsSyncing(true);
    try {
      const { addProduct, currentUser } = useStore.getState();
      
      if (type === 'invoice') {
        // Para conferência de recebimento, adicionamos os produtos novos
        for (const item of items) {
          if (item.final > 0) {
            await addProduct({
              name: item.name,
              sku: item.sku || null,
              spec: item.description || null,
              cost: 0, // Deveria ser preenchido, mas por enquanto 0
              sale: 0,
              brand: null,
              category: 'Celulares', // Default
              image_url: null,
              imei: '', // Será preenchido depois
              status: 'in_stock',
              quantity: item.final
            });
          }
        }
        // Sincronizar catálogo para todos os itens identificados
        for (const item of items) {
          if (item.sku) {
            await useStore.getState().addToCatalog({ sku: item.sku, name: item.name });
          }
        }
        
        toast.success(`${items.length} itens registrados no estoque!`);
      } else {
        // Para auditoria de estoque (ajuste), reconcilia o banco com os dados finais
        await useStore.getState().reconcileStockAudit(items);
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

      items.forEach(i => {
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
    const title = "📦 CONFERÊNCIA DE RECEBIMENTO";
    let text = `${title}\n\n`;
    
    items.forEach(i => {
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
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-xl">
      {/* Header Tático */}
      {/* Header Tático */}
      <header className="bg-black-piano border-b border-white/5 p-6 flex flex-col gap-4">
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
              <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">Revisão Tática</h2>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowOnlyIdentified(!showOnlyIdentified)}
              className={`px-4 py-2 rounded-xl border text-[8px] font-black uppercase tracking-widest transition-all ${
                showOnlyIdentified ? 'bg-primary text-black border-primary shadow-glow-cyan' : 'bg-white/5 text-white/40 border-white/10'
              }`}
            >
              {showOnlyIdentified ? "VER TUDO" : "FILTRAR BIPADOS"}
            </button>
            <button 
              onClick={onClose}
              className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-95 border border-white/10"
            >
              <RefreshCcw className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar Tática - HUD Blindado */}
        {type === 'stock' && (
          <div className="bg-black/80 p-5 rounded-3xl border border-white/10 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-primary animate-pulse shadow-[0_0_10px_#00A3FF]" />
                <span className="text-[11px] font-black text-white/60 uppercase tracking-[0.2em]">Auditoria de Estoque</span>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/5 flex items-center gap-2">
                  <span className="text-[8px] font-bold text-white/30 uppercase">SKUs:</span>
                  <span className="text-xs font-mono-tactical text-primary font-black">
                    {items.filter(i => i.isAudited).length}/{expected.length}
                  </span>
                </div>
                
                <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/5 flex items-center gap-2">
                  <span className="text-[8px] font-bold text-white/30 uppercase">Eficiência:</span>
                  <span className="text-xs font-black text-primary italic">
                    {Math.round((items.filter(i => i.isAudited).length / expected.length) * 100)}%
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
                animate={{ width: `${(items.filter(i => i.isAudited).length / expected.length) * 100}%` }}
                className="h-full bg-gradient-to-r from-success via-primary to-cyan-400 rounded-full shadow-[0_0_20px_#00A3FF] relative"
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </motion.div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-8 custom-scrollbar">
        {/* Sumário de Auditoria */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Itens', val: items.length, icon: Boxes, color: 'text-white' },
            { label: 'Conformes', val: items.filter(i => i.diff === 0).length, icon: CheckCircle2, color: 'text-success' },
            { label: 'Divergentes', val: items.filter(i => i.diff !== 0).length, icon: AlertTriangle, color: 'text-rose-500' },
            { label: 'Esperados', val: items.reduce((acc, i) => acc + i.expected, 0), icon: Info, color: 'text-primary/60' },
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnimatePresence>
            {items.map((item, originalIndex) => {
              if (showOnlyIdentified && item.identified === 0) return null;
              
              return (
                <motion.div 
                  key={originalIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: originalIndex * 0.05 }}
                  className={`bg-black-piano/50 backdrop-blur-md rounded-[2rem] p-5 flex flex-col gap-4 relative overflow-hidden group border ${
                    item.diff !== 0 ? 'border-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.05)]' : 'border-white/5 hover:border-primary/20'
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
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Produto / Registro</span>
                      </div>
                      <div className="flex items-center gap-2">
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
                      <p className="text-[7px] font-black text-white/20 uppercase tracking-widest">Sistema</p>
                      <p className="text-sm font-black text-white/60">{item.expected}</p>
                    </div>
                    <div className="text-center space-y-0.5 border-x border-white/5">
                      <p className="text-[7px] font-black text-primary/40 uppercase tracking-widest">Físico</p>
                      <p className={`text-sm font-black ${item.diff === 0 ? 'text-primary' : 'text-rose-500'}`}>{item.identified}</p>
                    </div>
                    <div className="text-center space-y-0.5">
                      <p className="text-[7px] font-black text-white/20 uppercase tracking-widest">Diferença</p>
                      <p className={`text-sm font-black ${item.diff === 0 ? 'text-success' : 'text-rose-500'}`}>
                        {item.diff > 0 ? `+${item.diff}` : item.diff}
                      </p>
                    </div>
                  </div>

                  {/* Controles de Ajuste Final */}
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleUpdateFinal(originalIndex, item.final - 1)}
                      className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-90 border border-white/10"
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
      {/* Footer Actions Compacto */}
      <footer className="p-4 pb-8 sm:pb-4 bg-black-piano border-t border-white/5 flex items-center gap-3">
        <button 
          onClick={handleSync}
          disabled={isSyncing}
          className="flex-1 h-12 rounded-2xl bg-success/20 border border-success/40 font-black text-success hover:bg-success/30 flex items-center justify-center gap-2 transition-all uppercase text-[10px] tracking-widest disabled:opacity-50 shadow-glow-green"
        >
          {isSyncing ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span className="hidden xs:inline">FINALIZAR</span>
          <span className="xs:hidden">SALVAR</span>
        </button>
        
        <button 
          onClick={handleExportPDF}
          className="h-12 px-5 rounded-2xl bg-white/5 border border-white/10 font-black text-white/60 hover:bg-white/10 flex items-center justify-center gap-2 transition-all uppercase text-[9px] tracking-widest"
        >
          <FileDown className="h-4 w-4" /> <span>PDF</span>
        </button>
        
        <button 
          onClick={handleExport}
          className="h-12 px-5 rounded-2xl bg-primary font-black text-black shadow-glow-cyan hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 transition-all uppercase text-[9px] tracking-widest"
        >
          <Share2 className="h-4 w-4" /> <span>ZAP</span>
        </button>
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
                  <span className="text-xs font-black text-white/30 uppercase">Esperado (Sistema)</span>
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
                  className="h-14 rounded-2xl bg-white/5 border border-white/10 font-black text-white/60 text-[10px] tracking-widest uppercase flex items-center justify-center gap-2"
                >
                  <FileDown className="h-4 w-4" /> PDF
                </button>
              </div>

              <button 
                onClick={() => setSelectedItem(null)}
                className="w-full h-14 rounded-2xl bg-white/5 font-black text-white/20 text-[10px] tracking-widest uppercase hover:text-white transition-all"
              >
                FECHAR DETALHES
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
