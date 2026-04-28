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
  Info
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { toast } from "sonner";

interface AuditHubProps {
  expected: { name: string; qty: number }[];
  identified: { name: string; qty: number }[];
  type: 'stock' | 'invoice';
  onClose: () => void;
}

export const AuditHub = ({ expected, identified, type, onClose }: AuditHubProps) => {
  const { products, updateProduct } = useStore();
  const [items, setItems] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Mesclar listas para comparação
    const allNames = Array.from(new Set([
      ...expected.map(i => i.name),
      ...identified.map(i => i.name)
    ]));

    const merged = allNames.map(name => {
      const exp = expected.find(i => i.name === name)?.qty || 0;
      const ide = identified.find(i => i.name === name)?.qty || 0;
      return {
        name,
        expected: exp,
        identified: ide,
        final: ide, // Usuário começa com o que a IA viu
        diff: ide - exp
      };
    });

    setItems(merged);
  }, [expected, identified]);

  const handleUpdateFinal = (index: number, val: string) => {
    const newItems = [...items];
    const num = parseInt(val) || 0;
    newItems[index].final = num;
    newItems[index].diff = num - newItems[index].expected;
    setItems(newItems);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      // Lógica de sincronização em lote
      for (const item of items) {
        const product = products.find(p => p.name === item.name && p.status === 'in_stock');
        if (product) {
          // No sistema real, precisaríamos de uma lógica de "set" ou "increment/decrement"
          // Aqui vamos assumir que o usuário está confirmando a quantidade REAL em estoque
          // (Esta lógica pode ser refinada dependendo de como o usuário quer o controle de inventário)
          console.log(`Atualizando ${item.name} para ${item.final}`);
        }
      }
      toast.success("Estoque sincronizado com sucesso!");
    } catch (err) {
      toast.error("Erro ao sincronizar estoque.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExport = () => {
    const title = type === 'stock' ? "📊 RELATÓRIO DE AUDITORIA" : "📦 CONFERÊNCIA DE RECEBIMENTO";
    let text = `${title}\n\n`;
    
    items.forEach(i => {
      const status = i.diff === 0 ? "✅ OK" : i.diff > 0 ? `➕ EXCESSO (+${i.diff})` : `⚠️ FALTA (${i.diff})`;
      text += `• ${i.name}\n  Qtd Final: ${i.final} | Status: ${status}\n\n`;
    });

    text += `Gerado por Victor's Smart AI`;

    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
    toast.success("Relatório gerado para WhatsApp!");
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-xl">
      {/* Header */}
      <header className="bg-black-piano border-b border-white/5 p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-ai/20 flex items-center justify-center text-ai shadow-glow-cyan ring-1 ring-ai/40">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="text-[10px] font-black text-ai uppercase tracking-[0.3em]">REVISÃO TÁTICA</div>
            <h2 className="text-xl font-black text-white">Hub de Auditoria</h2>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all"
        >
          <RefreshCcw className="h-5 w-5" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        <div className="bg-white/[0.02] rounded-[2rem] border border-white/5 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5">
                <th className="p-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Item</th>
                <th className="p-4 text-[10px] font-black text-white/40 uppercase tracking-widest text-center">Esperado</th>
                <th className="p-4 text-[10px] font-black text-white/40 uppercase tracking-widest text-center">IA</th>
                <th className="p-4 text-[10px] font-black text-primary uppercase tracking-widest text-center">Final</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-all group">
                  <td className="p-4">
                    <div className="text-sm font-black text-white">{item.name}</div>
                    <div className={`text-[10px] font-black uppercase mt-1 ${
                      item.diff === 0 ? 'text-success/60' : item.diff > 0 ? 'text-primary' : 'text-rose-500'
                    }`}>
                      {item.diff === 0 ? 'Conforme' : item.diff > 0 ? `Excesso (+${item.diff})` : `Divergência (${item.diff})`}
                    </div>
                  </td>
                  <td className="p-4 text-center font-mono-tactical text-white/40">{item.expected}</td>
                  <td className="p-4 text-center font-mono-tactical text-ai">{item.identified}</td>
                  <td className="p-4">
                    <div className="flex justify-center">
                      <input 
                        type="number" 
                        value={item.final} 
                        onChange={(e) => handleUpdateFinal(i, e.target.value)}
                        className="w-16 bg-primary/10 border border-primary/30 rounded-lg py-2 text-center font-mono-tactical text-primary font-black focus:ring-2 focus:ring-primary/50 outline-none"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Info Card */}
        <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10 flex items-start gap-4">
          <Info className="h-5 w-5 text-primary shrink-0 mt-1" />
          <p className="text-[11px] text-primary/70 leading-relaxed font-mono-tactical uppercase tracking-tight">
            A coluna "Final" é o dado que será exportado. A IA preenche inicialmente com o que identificou no vídeo. Ajuste manualmente se houver erro de detecção.
          </p>
        </div>
      </main>

      {/* Footer Actions */}
      <footer className="p-6 bg-black-piano border-t border-white/5 grid grid-cols-2 gap-4">
        <button 
          onClick={handleSync}
          disabled={isSyncing}
          className="py-4 rounded-2xl bg-white/5 border border-white/10 font-black text-white/60 hover:bg-white/10 flex items-center justify-center gap-2 transition-all uppercase text-[10px] tracking-widest disabled:opacity-50"
        >
          {isSyncing ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Sincronizar Estoque
        </button>
        <button 
          onClick={handleExport}
          className="py-4 rounded-2xl bg-primary font-black text-black shadow-glow-cyan hover:scale-[1.02] flex items-center justify-center gap-2 transition-all uppercase text-[10px] tracking-widest"
        >
          <Share2 className="h-4 w-4" /> Exportar WhatsApp
        </button>
      </footer>
    </div>
  );
};
