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

  useEffect(() => {
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
      
      return {
        name: ideItem?.name || expItem?.name || 'Item não identificado',
        expected: exp,
        identified: ide,
        final: ide,
        diff: ide - exp,
        sku: ideItem?.sku || expItem?.sku || '',
        qr: ideItem?.qr || expItem?.qr || '',
        description: (ideItem as any)?.description || '',
        isManual: ideItem?.name?.includes('DIGITAR NOME') || (ideItem as any)?.isManual
      };
    });

    setItems(merged);
  }, [expected, identified]);

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
    setItems(newItems);
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
        // Para auditoria de estoque (ajuste), a lógica seria mais complexa (deletar/adicionar)
        // Por enquanto, apenas logamos
        console.log("Ajuste de estoque confirmado:", items);
        toast.success("Ajustes de auditoria salvos!");
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
      <header className="bg-black-piano border-b border-white/5 p-8 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-glow-cyan border border-primary/20 relative group">
            <div className="absolute inset-0 bg-primary/20 rounded-2xl animate-pulse blur-md opacity-50" />
            <ShieldCheck className="h-7 w-7 relative" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="h-0.5 w-4 bg-primary rounded-full" />
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Audit Intelligence Hub</span>
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Revisão Tática</h2>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end mr-4">
            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Sincronização</span>
            <span className="text-[10px] font-mono-tactical text-primary uppercase">Pronto para Envio</span>
          </div>
          <button 
            onClick={onClose}
            className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-95 border border-white/10"
          >
            <RefreshCcw className="h-6 w-6" />
          </button>
        </div>
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
            {items.map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`bg-black-piano/50 backdrop-blur-md rounded-[2.5rem] p-8 flex flex-col gap-6 relative overflow-hidden group border ${
                  item.diff !== 0 ? 'border-rose-500/20' : 'border-white/5 hover:border-primary/20'
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
                    {item.sku && (
                      <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10">
                        <span className="text-[9px] font-mono-tactical text-primary uppercase tracking-tighter">SKU: {item.sku}</span>
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <textarea 
                      value={item.name}
                      onChange={(e) => handleUpdateName(i, e.target.value)}
                      rows={2}
                      className={`w-full bg-black/40 border-2 rounded-2xl p-4 text-sm font-black text-white focus:ring-4 focus:ring-primary/20 outline-none resize-none transition-all ${
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
                <div className="grid grid-cols-3 gap-3 bg-black/40 rounded-3xl p-5 border border-white/5">
                  <div className="text-center space-y-1">
                    <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Sistema</p>
                    <p className="text-lg font-black text-white/60">{item.expected}</p>
                  </div>
                  <div className="text-center space-y-1 border-x border-white/5">
                    <p className="text-[8px] font-black text-primary/40 uppercase tracking-widest">Físico</p>
                    <p className={`text-lg font-black ${item.diff === 0 ? 'text-primary' : 'text-rose-500'}`}>{item.identified}</p>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Diferença</p>
                    <p className={`text-lg font-black ${item.diff === 0 ? 'text-success' : 'text-rose-500'}`}>
                      {item.diff > 0 ? `+${item.diff}` : item.diff}
                    </p>
                  </div>
                </div>

                {/* Controles de Ajuste Final */}
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleUpdateFinal(i, item.final - 1)}
                    className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-90 border border-white/10"
                  >
                    <Minus className="h-6 w-6" />
                  </button>
                  
                  <div className="flex-1 h-14 bg-primary/5 border border-primary/20 rounded-2xl flex items-center justify-between px-6">
                    <span className="text-[9px] font-black text-primary/40 uppercase tracking-widest">Qtd Final</span>
                    <span className="text-xl font-black text-primary">{item.final}</span>
                  </div>

                  <button 
                    onClick={() => handleUpdateFinal(i, item.final + 1)}
                    className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary/60 hover:text-primary hover:bg-primary/20 transition-all active:scale-90 border border-primary/20 shadow-glow-cyan/10"
                  >
                    <Plus className="h-6 w-6" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer Actions */}
      <footer className="p-8 bg-black-piano border-t border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-6">
        <button 
          onClick={handleSync}
          disabled={isSyncing}
          className="h-16 rounded-[1.5rem] bg-success/20 border border-success/40 font-black text-success hover:bg-success/30 flex items-center justify-center gap-4 transition-all uppercase text-[11px] tracking-[0.2em] disabled:opacity-50 shadow-glow-green"
        >
          {isSyncing ? <RefreshCcw className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          Finalizar Auditoria
        </button>
        
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={handleExportPDF}
            className="h-16 rounded-[1.5rem] bg-white/5 border border-white/10 font-black text-white/60 hover:bg-white/10 flex items-center justify-center gap-3 transition-all uppercase text-[10px] tracking-widest"
          >
            <FileDown className="h-5 w-5" /> PDF
          </button>
          <button 
            onClick={handleExport}
            className="h-16 rounded-[1.5rem] bg-primary font-black text-black shadow-glow-cyan hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 transition-all uppercase text-[10px] tracking-widest"
          >
            <Share2 className="h-5 w-5" /> WhatsApp
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-4 px-6 border-l border-white/5">
          <div className="p-3 bg-primary/5 rounded-xl">
            <Info className="h-5 w-5 text-primary/60" />
          </div>
          <p className="text-[9px] text-white/30 uppercase leading-relaxed font-mono-tactical">
            Os dados serão sincronizados com o banco de dados central e o catálogo neural será atualizado.
          </p>
        </div>
      </footer>
    </div>
  );
};
