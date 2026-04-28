import React, { useRef, useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
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

// Catalog Export Components

export const CatalogExport: React.FC<CatalogExportProps> = ({ products, filterQuery }) => {
  const hiddenRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Assets are now built-in (SVG) or fast enough
    const timer = setTimeout(() => setIsReady(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleExport = async () => {
    if (products.length === 0) {
      toast.error("Nenhum produto para exportar.");
      return;
    }

    const toastId = toast.loading("Gerando catálogo premium...");

    try {
      await new Promise(r => setTimeout(r, 1000));

      if (!hiddenRef.current) return;

      const canvas = await html2canvas(hiddenRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#000000',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.85);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2]
      });

      pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width / 2, canvas.height / 2);
      
      const fileName = filterQuery 
        ? `Catalogo-${filterQuery.toUpperCase()}.pdf`
        : 'Catalogo-Victor-Smart.pdf';

      pdf.save(fileName);
      toast.success("Catálogo gerado com sucesso!", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Erro na geração do PDF.", { id: toastId });
    }
  };

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.02 }}
        onClick={handleExport}
        disabled={!isReady}
        className={`bg-black-piano flex w-full items-center justify-center gap-3 rounded-2xl py-5 text-sm font-black shadow-glow-cyan border-[2px] transition-all mb-6 ${
          isReady ? 'text-primary border-primary/20 hover:border-primary' : 'text-gray-500 border-gray-800'
        }`}
      >
        <FileText className="h-6 w-6" />
        {isReady ? `EXPORTAR CATÁLOGO ${filterQuery ? `(${filterQuery.toUpperCase()})` : ''}` : 'CARREGANDO...'}
      </motion.button>

      {/* Hidden Template for PDF Generation */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}>
        <div 
          ref={hiddenRef}
          style={{ 
            width: '850px', 
            padding: '60px', 
            background: '#000', 
            color: '#fff',
            fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Clean Top Space */}
          <div style={{ height: '40px' }} />
            
            <div style={{ 
              height: '3px', 
              width: '220px', 
              background: 'linear-gradient(90deg, #00a3ff, #ff3b30)', 
              margin: '0 auto 30px',
              boxShadow: '0 0 25px rgba(0, 163, 255, 0.4)'
            }}></div>

            <h1 style={{ 
              margin: '0 auto 50px', 
              fontSize: '22px', 
              fontWeight: '900', 
              color: '#fff', 
              letterSpacing: '1.5px', 
              textTransform: 'uppercase',
              textShadow: '0 0 30px rgba(255,255,255,0.3)',
              textAlign: 'center',
              width: '100%',
              lineHeight: '1'
            }}>
              {filterQuery 
                ? `Modelos de ${filterQuery.toUpperCase()} que temos no estoque`
                : "Confira os modelos que temos hoje no estoque"}
            </h1>

          {/* Grid - 2 Columns Premium */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '40px', flex: 1 }}>
            {products.map((p) => (
              <div key={p.id} style={{ 
                background: 'rgba(255,255,255,0.05)', 
                borderRadius: '40px', 
                padding: '30px', 
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow: '0 30px 70px rgba(0,0,0,0.95)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center'
              }}>
                <div style={{ 
                  width: '100%', 
                  aspectRatio: '1/1', 
                  background: '#000', 
                  borderRadius: '30px', 
                  overflow: 'hidden', 
                  marginBottom: '25px',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <img 
                    src={p.image_url || 'https://via.placeholder.com/400x400?text=No+Image'} 
                    alt="" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                
                <div style={{ fontSize: '20px', fontWeight: '900', color: '#fff', marginBottom: '18px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {p.name}
                </div>
              </div>
            ))}
          </div>

          {/* Discreet Neon CTA */}
          <div style={{ 
            marginTop: '60px', 
            padding: '35px', 
            border: '2px solid #ff3b30', 
            borderRadius: '24px', 
            textAlign: 'center',
            boxShadow: '0 0 30px rgba(255,59,48,0.3)',
            background: 'rgba(255,59,48,0.1)'
          }}>
            <p style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#fff', letterSpacing: '2.5px' }}>
              TEM INTERESSE EM ALGUM MODELO? CONSULTE O PREÇO
            </p>
          </div>

          {/* Legal/Technical Info - Bottom Right */}
          <div style={{ marginTop: '50px', textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#fff', opacity: 0.95, fontWeight: '900', letterSpacing: '1.5px' }}>
              VICTOR'S CELULARES • SMART ESTOQUE v2.4.2<br />
              GERADO EM {new Date().toLocaleDateString()} • COCKPIT INTERFACE
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
