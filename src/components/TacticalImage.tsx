import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';

interface TacticalImageProps {
  productId?: string;
  catalogSku?: string;
  initialSrc?: string | null;
  alt: string;
  className?: string;
  placeholder?: string;
  onLoad?: () => void;
}

export const TacticalImage: React.FC<TacticalImageProps> = ({ 
  productId,
  catalogSku,
  initialSrc,
  alt, 
  className = "", 
  placeholder = "/products/placeholder.png",
  onLoad
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(initialSrc || null);
  const [loading, setLoading] = useState(!initialSrc);
  const [isVisible, setIsVisible] = useState(false);
  const fetchProductImage = useStore(state => state.fetchProductImage);
  const fetchCatalogImage = useStore(state => state.fetchCatalogImage);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync with initialSrc if it changes externally
  useEffect(() => {
    if (initialSrc) {
      setImageUrl(initialSrc);
      setLoading(false);
    }
  }, [initialSrc]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isVisible && !imageUrl) {
      const loadImage = async () => {
        setLoading(true);
        let url = null;
        
        if (productId) {
          url = await fetchProductImage(productId);
        } else if (catalogSku) {
          url = await fetchCatalogImage(catalogSku);
        }
        
        setImageUrl(url);
        setLoading(false);
      };
      loadImage();
    }
  }, [isVisible, productId, catalogSku, fetchProductImage, fetchCatalogImage, imageUrl]);

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      {loading && isVisible && (
        <div className="absolute inset-0 animate-pulse bg-white/5 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      
      <img 
        src={imageUrl || placeholder} 
        alt={alt} 
        className={`h-full w-full object-cover transition-all duration-700 ${loading ? 'opacity-0 scale-110' : 'opacity-100 scale-100'}`}
        onLoad={() => {
          setLoading(false);
          onLoad?.();
        }}
      />

      {/* Tactical overlay effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
    </div>
  );
};
