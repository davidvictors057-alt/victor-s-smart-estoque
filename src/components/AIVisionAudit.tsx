import React, { useState } from 'react';
import { Drawer } from 'vaul';
import { CameraView } from './CameraView';
import { aiService } from '@/services/aiService';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Scan, X, AlertTriangle, CheckCircle2, Loader2, Image as ImageIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

interface AIVisionAuditProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIVisionAudit: React.FC<AIVisionAuditProps> = ({ isOpen, onClose }) => {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  const { products } = useStore();

  const handleCapture = async (dataUrl: string) => {
    setCapturedImage(dataUrl);
    setIsLoading(true);
    setReport(null);
    
    try {
      // Agrupar produtos em estoque para o contexto
      const inStock = products.filter(p => p.status === 'in_stock');
      const grouped = inStock.reduce((acc: any, p) => {
        const key = `${p.name} ${p.spec || ''}`;
        if (!acc[key]) acc[key] = { name: key, stock: 0 };
        acc[key].stock += 1;
        return acc;
      }, {});

      const currentStockList = Object.values(grouped);
      const response = await aiService.auditStock(dataUrl, currentStockList);
      setReport(response.text);
    } catch (error) {
      console.error('Audit error:', error);
      toast.error('Falha na auditoria neural.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Drawer.Content className="bg-[#0f172a] flex flex-col rounded-t-[20px] h-[85vh] mt-24 fixed bottom-0 left-0 right-0 z-50 border-t border-white/10">
          {/* Fixed Header */}
          <div className="p-4 bg-[#0f172a] rounded-t-[20px] border-b border-white/5 shrink-0">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-white/20 mb-6" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
                  <Scan className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white leading-tight">Auditoria Visual</h2>
                  <p className="text-xs text-cyan-400 font-medium tracking-wider uppercase">Oráculo Vision v1.0</p>
                </div>
              </div>
              <button onClick={onClose} className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10">
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="p-4 flex-1 overflow-y-auto">
            <div className="max-w-md mx-auto">

              {!capturedImage && !report && (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                  <div className="w-24 h-24 rounded-full bg-cyan-500/10 flex items-center justify-center border-2 border-dashed border-cyan-500/30">
                    <ImageIcon className="w-10 h-10 text-cyan-500/50" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">Inicie o Escaneamento</h3>
                    <p className="text-white text-sm px-10">Tire uma foto nítida das caixas dos produtos para que a IA conte e compare com o sistema.</p>
                  </div>
                  <Button 
                    className="bg-cyan-500 hover:bg-cyan-400 text-black font-black px-8 h-14 rounded-2xl shadow-glow-cyan"
                    onClick={() => setCameraOpen(true)}
                  >
                    ABRIR CÂMERA VISION
                  </Button>
                </div>
              )}

              {isLoading && (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="relative">
                    <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
                  </div>
                  <p className="text-white text-sm animate-pulse font-medium">IA Analisando imagem e estoque...</p>
                </div>
              )}

              {report && (
                <div className="space-y-6 pb-20">
                  <div className="relative rounded-2xl overflow-hidden border border-white/10">
                    <img src={capturedImage!} alt="Auditoria" className="w-full h-48 object-cover opacity-50" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] to-transparent" />
                    <div className="absolute bottom-4 left-4 flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-success animate-ping" />
                      <span className="font-mono-tactical text-[10px] text-white font-black tracking-widest uppercase">CAPTURA PROCESSADA</span>
                    </div>
                  </div>

                  <div className="prose prose-invert max-w-none bg-white/[0.02] border border-white/5 rounded-2xl p-5">
                    <ReactMarkdown
                      components={{
                        h3: ({children}) => <h3 className="text-cyan-400 font-black uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" /> {children}
                        </h3>,
                        li: ({children}) => <li className="text-sm text-white mb-2 border-b border-white/5 pb-2 last:border-0">{children}</li>,
                        strong: ({children}) => <strong className="text-white font-bold">{children}</strong>
                      }}
                    >
                      {report}
                    </ReactMarkdown>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      className="flex-1 border-white/10 bg-white/5 text-white h-12 rounded-xl"
                      onClick={() => {
                        setCapturedImage(null);
                        setReport(null);
                        setCameraOpen(true);
                      }}
                    >
                      Nova Auditoria
                    </Button>
                    <Button 
                      className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white h-12 rounded-xl"
                      onClick={onClose}
                    >
                      Concluir
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>

      <CameraView 
        open={cameraOpen} 
        onClose={() => setCameraOpen(false)} 
        mode="photo" 
        title="Escaneamento Vision"
        onCapture={handleCapture}
      />
    </Drawer.Root>
  );
};
