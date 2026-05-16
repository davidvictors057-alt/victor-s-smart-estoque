import imageCompression from 'browser-image-compression';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

/**
 * Tactical Image Service
 * Handles severe compression (WebP ~100KB) and Supabase Storage uploads.
 */
export const imageService = {
  /**
   * Compresses a file using severe settings for PWA performance.
   * Targets ~30KB as requested.
   */
  async compressImage(file: File): Promise<File> {
    const options = {
      maxSizeMB: 0.03, // Target ~30KB max
      maxWidthOrHeight: 1280, // High enough for "premium" but manageable
      useWebWorker: true,
      fileType: 'image/webp' as string, // Tactical WebP format
      initialQuality: 0.6, // Slightly lower quality for aggressive size target
    };

    try {
      // Handle HEIC if necessary (optional improvement)
      let fileToCompress = file;
      if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
        const heic2any = (await import('heic2any')).default;
        const converted = await heic2any({ blob: file, toType: 'image/jpeg' });
        fileToCompress = new File([converted as Blob], file.name.replace(/\.heic$/i, '.jpg'), { type: 'image/jpeg' });
      }

      return await imageCompression(fileToCompress, options);
    } catch (error) {
      console.error('Compression Error:', error);
      return file; // Fallback to original if compression fails
    }
  },

  /**
   * Uploads a file to Supabase Storage and returns the public URL.
   */
  async uploadProductImage(file: File): Promise<string | null> {
    try {
      // 1. Severe Compression
      const compressed = await this.compressImage(file);

      // 2. Generate Tactical Name
      const fileExt = compressed.name.split('.').pop() || 'webp';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `catalog/${fileName}`;

      // 3. Upload
      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, compressed, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // 4. Get Public URL
      const { data } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error: any) {
      console.error('Upload Error:', error);
      toast.error('Erro ao processar imagem: ' + error.message);
      return null;
    }
  },

  /**
   * Direct Base64 to Compressed File (for Camera captures)
   */
  async processBase64(base64: string, fileName: string = 'capture.jpg'): Promise<string | null> {
    try {
      const response = await fetch(base64);
      const blob = await response.blob();
      const file = new File([blob], fileName, { type: blob.type });
      return await this.uploadProductImage(file);
    } catch (error) {
      console.error('Base64 Process Error:', error);
      return null;
    }
  }
};
