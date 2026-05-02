/**
 * VICTOR'S SMART ESTOQUE - Mercado Livre Integration Service
 * Focus: Real-time price metrics for IA analysis
 */

export interface MLPriceData {
  price: number;
  seller_reputation: string;
  permalink: string;
  sold_quantity: number;
}

class MercadoLivreService {
  private API_URL = "https://api.mercadolibre.com";
  private CLIENT_ID = import.meta.env.VITE_ML_CLIENT_ID;
  private CLIENT_SECRET = import.meta.env.VITE_ML_CLIENT_SECRET;
  private REDIRECT_URI = typeof window !== 'undefined' 
    ? window.location.origin 
    : "https://victor-smart-estoque-v2.netlify.app";

  /**
   * Obtém dados de preço real do mercado para um item com foco em Platinum e Gold
   */
  async getMarketData(query: string, accessToken?: string): Promise<{ 
    bestPrice: number | null; 
    results: MLPriceData[];
    suggestedPrice: number | null;
    isCatalog: boolean;
  } | null> {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      // 1. TENTATIVA 1: Busca Geral com Sort por Preço
      const response = await fetch(`${this.API_URL}/sites/MLB/search?q=${encodeURIComponent(query)}&condition=new&limit=25&sort=price_asc`, { headers });
      const data = await response.json();

      if (!data.results || data.results.length === 0) {
        return null;
      }

      const results: MLPriceData[] = data.results.map((r: any) => ({
        price: r.price,
        seller_reputation: r.seller?.seller_reputation?.power_seller_status || "regular",
        permalink: r.permalink,
        sold_quantity: r.sold_quantity || 0,
        is_catalog: r.catalog_listing || false
      }));

      // Filtramos vendedores de alta relevância (Platinum e Gold)
      const premiumSellers = results.filter(r => 
        r.seller_reputation === "platinum" || r.seller_reputation === "gold"
      );

      // LÓGICA TÁTICA: 
      // Se houver Platinum/Gold, o preço sugerido é o MENOR deles menos R$ 2,00 (Estratégia para ganhar no preço)
      // Se não houver, pegamos a média dos 5 primeiros
      let suggestedPrice = null;
      if (premiumSellers.length > 0) {
        const lowestPremiumPrice = Math.min(...premiumSellers.map(s => s.price));
        suggestedPrice = lowestPremiumPrice - 2.00;
      } else {
        const top5 = results.slice(0, 5);
        const avg = top5.reduce((sum, r) => sum + r.price, 0) / top5.length;
        suggestedPrice = avg - 5.00; // Desconto maior por incerteza de reputação
      }

      return {
        bestPrice: results[0]?.price || null,
        results,
        suggestedPrice: parseFloat(suggestedPrice.toFixed(2)),
        isCatalog: results.some(r => (r as any).is_catalog)
      };
    } catch (error) {
      console.error("ML Market Data Error:", error);
      return null;
    }
  }

  getAuthUrl(): string {
    return `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${this.CLIENT_ID}&redirect_uri=${encodeURIComponent(this.REDIRECT_URI)}`;
  }

  async refreshToken(refreshToken: string): Promise<any> {
    try {
      const response = await fetch(`${this.API_URL}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: this.CLIENT_ID,
          client_secret: this.CLIENT_SECRET,
          refresh_token: refreshToken
        })
      });

      return await response.json();
    } catch (error) {
      console.error("Erro ao renovar token ML:", error);
      return null;
    }
  }

  async exchangeCodeForToken(code: string): Promise<any> {
    try {
      const response = await fetch(`${this.API_URL}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: this.CLIENT_ID,
          client_secret: this.CLIENT_SECRET,
          code: code,
          redirect_uri: this.REDIRECT_URI
        })
      });

      return await response.json();
    } catch (error) {
      console.error("Erro ao trocar token ML:", error);
      return null;
    }
  }

  calculateNetProfit(salePrice: number, costPrice: number) {
    const mlFee = salePrice * 0.12; 
    const fixedFee = salePrice < 79 ? 6 : 0; 
    const profit = salePrice - costPrice - mlFee - fixedFee;
    const margin = (profit / salePrice) * 100;

    return {
      profit: parseFloat(profit.toFixed(2)),
      margin: parseFloat(margin.toFixed(2)),
      mlFee: parseFloat((mlFee + fixedFee).toFixed(2))
    };
  }
}

export const mlService = new MercadoLivreService();
