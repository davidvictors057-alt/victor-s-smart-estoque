/**
 * VICTOR'S SMART ESTOQUE - Mercado Livre Integration Service
 * Focus: High-reputation seller price research (Platinum/Gold)
 */

interface MLSearchResult {
  price: number;
  permalink: string;
  seller_reputation: string;
  logistic_type: string;
  available_quantity: number;
  sold_quantity: number;
}

class MercadoLivreService {
  private API_URL = "https://api.mercadolibre.com";

  /**
   * Busca um produto pelo EAN e retorna os dados dos melhores vendedores
   */
  async searchByEAN(ean: string): Promise<MLSearchResult[]> {
    try {
      // 1. Busca produtos pelo EAN
      const response = await fetch(`${this.API_URL}/sites/MLB/search?q=${ean}`);
      const data = await response.json();

      if (!data.results || data.results.length === 0) {
        return [];
      }

      // 2. Filtra e mapeia os resultados (Foco em Platinum/Gold e Condição Novo)
      const filtered = data.results
        .filter((item: any) => 
          item.condition === "new" && 
          (item.seller.seller_reputation?.power_seller_status === "platinum" || 
           item.seller.seller_reputation?.power_seller_status === "gold")
        )
        .map((item: any) => ({
          price: item.price,
          permalink: item.permalink,
          seller_reputation: item.seller.seller_reputation?.power_seller_status,
          logistic_type: item.shipping?.logistic_type,
          available_quantity: item.available_quantity,
          sold_quantity: item.sold_quantity || 0
        }));

      // Ordena por menor preço
      return filtered.sort((a: any, b: any) => a.price - b.price);
    } catch (error) {
      console.error("ML API Error:", error);
      return [];
    }
  }

  /**
   * Calcula o lucro líquido aproximado (taxa clássica 11.5% - 14%)
   * @param salePrice Preço de venda sugerido
   * @param costPrice Preço de custo do produto
   */
  calculateNetProfit(salePrice: number, costPrice: number) {
    const mlFee = salePrice * 0.12; // Média estimada de 12%
    const fixedFee = salePrice < 79 ? 6 : 0; // Taxa fixa ML para itens < 79
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
