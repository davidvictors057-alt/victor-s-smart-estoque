import React, { useRef } from 'react';
import { FileText, Download, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  spec: string;
  brand?: string;
  image_url?: string;
}

interface CatalogExportProps {
  products: Product[];
  filterQuery: string;
}

export const CatalogExport: React.FC<CatalogExportProps> = ({ products, filterQuery }) => {
  const hiddenRef = useRef<HTMLDivElement>(null);

  const handleExport = async () => {
    if (products.length === 0) {
      toast.error("Nenhum produto para exportar.");
      return;
    }

    const toastId = toast.loading("Gerando catálogo premium...");

    try {
      // Small delay to ensure hidden div is rendered if needed
      await new Promise(r => setTimeout(r, 100));

      if (!hiddenRef.current) return;

      const canvas = await html2canvas(hiddenRef.current, {
        scale: 2, // Higher quality
        useCORS: true, // For images from external URLs
        logging: false,
        backgroundColor: '#000000', // Matches app theme
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.85);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2]
      });

      pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width / 2, canvas.height / 2);
      
      const fileName = filterQuery 
        ? `Catalogo-${filterQuery.charAt(0).toUpperCase() + filterQuery.slice(1)}.pdf`
        : 'Catalogo-Estoque.pdf';

      pdf.save(fileName);
      toast.success("Catálogo exportado com sucesso!", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar PDF.", { id: toastId });
    }
  };

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.97 }}
        whileHover={{ scale: 1.02 }}
        onClick={handleExport}
        className="bg-black-piano neon-blue-border flex w-full items-center justify-center gap-3 rounded-2xl py-4 text-sm font-black text-primary shadow-glow-cyan border-[2px] border-primary/20 hover:border-primary transition-all mb-4"
      >
        <FileText className="h-5 w-5" />
        EXPORTAR CATÁLOGO {filterQuery ? `(${filterQuery.toUpperCase()})` : ''}
      </motion.button>

      {/* Hidden Template for PDF Generation */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <div 
          ref={hiddenRef}
          style={{ 
            width: '800px', 
            padding: '40px', 
            background: '#000', 
            color: '#fff',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '40px', paddingBottom: '30px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <img 
              src="/logo_victors.png" 
              alt="Victor's Smart Logo" 
              style={{ height: '80px', marginBottom: '15px' }} 
            />
            <div style={{ height: '3px', width: '100px', background: 'linear-gradient(90deg, #00a3ff, #ff3b30)', margin: '0 auto 15px' }}></div>
            <div style={{ fontSize: '10px', fontWeight: 'black', color: 'rgba(255,255,255,0.3)', letterSpacing: '6px', textTransform: 'uppercase' }}>
              Catálogo de Inventário Exclusivo
            </div>
          </div>

          {/* Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '25px' }}>
            {products.map((p) => (
              <div key={p.id} style={{ 
                background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)', 
                borderRadius: '24px', 
                padding: '20px', 
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
              }}>
                <div style={{ 
                  width: '100%', 
                  aspectRatio: '1/1', 
                  background: '#0a0a0a', 
                  borderRadius: '16px', 
                  overflow: 'hidden', 
                  marginBottom: '15px',
                  border: '1px solid rgba(255,255,255,0.05)'
                }}>
                  <img 
                    src={p.image_url || 'https://via.placeholder.com/300x300?text=No+Image'} 
                    alt="" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div style={{ fontSize: '13px', fontWeight: '900', color: '#fff', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px', lineHeight: '1.2' }}>
                  {p.name}
                </div>
                <div style={{ fontSize: '9px', color: '#00a3ff', fontWeight: 'black', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {p.spec}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ 
            marginTop: '50px', 
            padding: '30px', 
            background: 'rgba(255,255,255,0.02)', 
            borderRadius: '20px', 
            textAlign: 'center',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <p style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: 'bold', color: '#fff', letterSpacing: '1px' }}>
              Interessado em algum modelo? Entre em contato agora!
            </p>
            <p style={{ margin: 0, fontSize: '9px', color: 'rgba(255,255,255,0.3)', fontWeight: 'bold', letterSpacing: '1px', lineHeight: '1.5' }}>
              GERADO POR SMART ESTOQUE v2.4.0 • COCKPIT INTERFACE<br />
              ESTE DOCUMENTO É PARA FINS DE CONSULTA DE DISPONIBILIDADE.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
