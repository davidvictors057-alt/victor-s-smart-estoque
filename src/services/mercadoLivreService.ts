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
  private REDIRECT_URI = "https://victor-smart-estoque-v2.netlify.app";

  /**
   * Obtém dados de preço real do mercado para um item com foco em Platinum e Gold
   */
  async getMarketData(query: string, accessToken?: string): Promise<{ 
    bestPrice: number | null; 
    results: MLPriceData[];
    suggestedPrice: number | null;
  } | null> {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      // Buscamos os primeiros 20 resultados para ter uma boa amostragem
      const response = await fetch(`${this.API_URL}/sites/MLB/search?q=${encodeURIComponent(query)}&condition=new&limit=20`, { headers });
      const data = await response.json();

      if (!data.results || data.results.length === 0) {
        return null;
      }

      const results: MLPriceData[] = data.results.map((r: any) => ({
        price: r.price,
        seller_reputation: r.seller?.seller_reputation?.power_seller_status || "regular",
        permalink: r.permalink,
        sold_quantity: r.sold_quantity || 0
      }));

      // Filtramos apenas Platinum e Gold para sugerir o preço
      const premiumSellers = results.filter(r => 
        r.seller_reputation === "platinum" || r.seller_reputation === "gold"
      );

      // Se houver vendedores premium, o "melhor preço" (mais competitivo) é o menor deles
      // Caso contrário, usamos a média ou o primeiro resultado geral
      let suggestedPrice = null;
      if (premiumSellers.length > 0) {
        suggestedPrice = Math.min(...premiumSellers.map(s => s.price));
      } else if (results.length > 0) {
        suggestedPrice = results[0].price;
      }

      return {
        bestPrice: results[0]?.price || null,
        results,
        suggestedPrice
      };
    } catch (error) {
      console.error("ML Market Data Error:", error);
      return null;
    }
  }

  getAuthUrl(): string {
    return `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${this.CLIENT_ID}&redirect_uri=${encodeURIComponent(this.REDIRECT_URI)}`;
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
