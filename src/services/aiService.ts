import { GoogleGenerativeAI } from "@google/generative-ai";
import { SYSTEM_PROMPTS } from "./prompts";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const PRIMARY_MODEL = "gemini-3.1-flash-lite-preview"; 

class AIService {
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    if (API_KEY) {
      this.genAI = new GoogleGenerativeAI(API_KEY);
    }
  }

  private async getModel() {
    if (!this.genAI) throw new Error("Cérebro Offline: API Key não configurada.");
    return this.genAI.getGenerativeModel({ 
      model: PRIMARY_MODEL,
      systemInstruction: SYSTEM_PROMPTS.STRATEGIC_CHAT 
    });
  }

  async getPredictiveAnalysis(data: any) {
    try {
      if (!API_KEY) return this.getMockAnalysis();

      const model = await this.getModel();
      
      const prompt = `
        ${SYSTEM_PROMPTS.PREDICTIVE_ANALYSIS}
        
        DADOS ATUAIS:
        ${JSON.stringify(data)}
      `;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      // Sanitização de segurança contra markdown
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (error) {
      console.error("AI Error:", error);
      return "Erro na conexão com o Cérebro Online. Usando lógica local.";
    }
  }

  async getProductInsight(productName: string, history15Days: any[]) {
    try {
      if (!API_KEY) return { text: "Cérebro Offline." };

      const model = await this.getModel();
      const prompt = `
        ${SYSTEM_PROMPTS.PRODUCT_INSIGHT}
        
        PRODUTO: ${productName}
        HISTÓRICO DOS ÚLTIMOS 15 DIAS:
        ${JSON.stringify(history15Days)}
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return { text: response.text() };
    } catch (error) {
      console.error("AI Insight Error:", error);
      return { text: "Falha ao gerar insight." };
    }
  }

  async auditStock(imageData: string, currentStock: any[]) {
    try {
      const model = await this.getModel();
      const stockContext = currentStock.map(p => `${p.name} (${p.stock} un)`).join(', ');
      
      const prompt = SYSTEM_PROMPTS.AUDIT_STOCK.replace('[ESTOQUE_ATUAL]', stockContext);

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: imageData.split(',')[1],
            mimeType: "image/jpeg"
          }
        }
      ]);

      const response = await result.response;
      return { text: response.text() };
    } catch (error) { 
      console.error(error); 
      return { text: "Falha na auditoria visual. Verifique a conexão." }; 
    }
  }

  async chat(message: string, history: any[] = [], inventoryData: any = null) {
    const startTime = performance.now();
    let usedModel = PRIMARY_MODEL;
    
    const contextInfo = inventoryData 
      ? `\n\nESTADO ATUAL DO INVENTÁRIO (DADOS REAIS):\n${JSON.stringify(inventoryData)}\n\nNÃO INVENTE PRODUTOS QUE NÃO ESTÃO NESSA LISTA.`
      : "";
    
    try {
      if (!API_KEY) return { text: "Cérebro Offline. Por favor, configure a VITE_GEMINI_API_KEY.", time: 0, model: "OFFLINE" };

      const model = await this.getModel();

      const chat = model.startChat({
        history: history.map(h => ({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: String(h.content || h.text || "") }],
        })),
        generationConfig: {
          maxOutputTokens: 2000,
          temperature: 0,
        },
      });

      const result = await chat.sendMessage(`CONTEXTO ATUAL:${contextInfo}\n\nPERGUNTA: ${message}`);
      const response = await result.response;
      const endTime = performance.now();
      
      return {
        text: response.text(),
        time: parseFloat(((endTime - startTime) / 1000).toFixed(2)), 
        model: usedModel
      };
    } catch (error: any) {
      console.error("AI Strategic Error:", error);
      return { 
        text: `🧠 FALHA NEURAL: ${error.message || "Erro desconhecido na conexão 3.1"}. Verifique se a API Key suporta este modelo Preview.`, 
        time: parseFloat(((performance.now() - startTime) / 1000).toFixed(2)),
        model: "ERROR"
      };
    }
  }

  async getMarketAnalysis(product: any, mlResults: any[]) {
    try {
      const model = await this.getModel();
      const productInfo = `${product.name} (Custo: R$ ${product.buy_price || 0})`;
      const mlContext = mlResults.map(r => `Preço: R$ ${r.price} | Reputação: ${r.seller_reputation} | Vendas: ${r.sold_quantity}`).join('\n');
      
      const prompt = SYSTEM_PROMPTS.MARKET_ANALYSIS
        .replace('[PRODUTO_INFO]', productInfo)
        .replace('[ML_RESULTS]', mlContext);

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return { text: response.text() };
    } catch (error) {
      console.error("Market Analysis AI Error:", error);
      return { text: "Falha ao processar análise de mercado." };
    }
  }

  async getShoppingListInsight(lowStockItems: any[]) {
    try {
      const model = await this.getModel();
      const itemsContext = lowStockItems.map(i => 
        `${i.name} (Estoque: ${i.stock} | Giro: ${i.velocity?.toFixed(2) || 0}/dia)`
      ).join('\n');
      
      const prompt = SYSTEM_PROMPTS.PREDICTIVE_SHOPPING_LIST.replace('[ESTOQUE_ALERTA]', itemsContext);

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return { text: response.text() };
    } catch (error) {
      console.error("Shopping List AI Error:", error);
      return { text: "Falha ao gerar insights de compra." };
    }
  }

  async auditMultiModal(video: { data: string, mimeType: string }, contextType: 'stock' | 'invoice', contextData: any) {
    try {
      const model = await this.getModel();
      
      let contextPrompt = "";
      if (contextType === 'stock') {
        const stockList = contextData.map((p: any) => `- ${p.name}: ${p.stock} unidades`).join('\n');
        contextPrompt = `ESTOQUE ATUAL REGISTRADO:\n${stockList}\n\nSua tarefa é comparar este estoque com o que você vê no vídeo e apontar divergências.`;
      } else {
        const expectedList = Array.isArray(contextData) ? contextData : [];
        const invoiceContext = expectedList.map((p: any) => `- ${p.name}: ${p.qty} unidades`).join('\n');
        contextPrompt = expectedList.length > 0 
          ? `DADOS DA NOTA FISCAL (PARA CONFERÊNCIA):\n${invoiceContext}\n\nVerifique se os itens acima estão no vídeo.`
          : "IDENTIFICAÇÃO LIVRE: Não há lista de referência. Identifique e conte absolutamente tudo o que encontrar no vídeo.";
      }

      const prompt = `
        ${SYSTEM_PROMPTS.AUDIT_STOCK}
        
        MODO: ${contextType === 'stock' ? 'AUDITORIA DE ESTOQUE' : 'CONFERÊNCIA DE RECEBIMENTO'}
        ${contextPrompt}
        
        INSTRUÇÕES DE VÍDEO:
        1. Analise o vídeo de 10 segundos para identificar todos os produtos.
        2. Use a visão temporal para evitar contar o mesmo item duas vezes se a câmera se mover.
        3. Retorne um JSON no final da resposta: {"identified": [{"name": "string", "qty": number}]}.
      `;

      const result = await model.generateContent([
        { text: prompt },
        {
          inlineData: {
            data: video.data,
            mimeType: video.mimeType
          }
        }
      ]);

      const response = await result.response;
      return { text: response.text() };
    } catch (error) {
      console.error("MultiModal Audit Error:", error);
      return { text: "Falha no processamento do vídeo de auditoria." };
    }
  }

  async extractInvoiceData(imageData: string) {
    try {
      const model = await this.getModel();
      const prompt = `
        Analise esta foto de uma Nota Fiscal ou comprovante de compra e extraia os produtos e quantidades.
        Retorne APENAS um JSON no formato: {"items": [{"name": "string", "qty": number}]}.
        Seja preciso com nomes de modelos de celulares e acessórios.
      `;

      const result = await model.generateContent([
        { text: prompt },
        {
          inlineData: {
            data: imageData.includes(',') ? imageData.split(',')[1] : imageData,
            mimeType: "image/jpeg"
          }
        }
      ]);

      const response = await result.response;
      const text = response.text();
      const jsonMatch = text.match(/\{.*\}/s);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : { items: [] };
    } catch (error) {
      console.error("Invoice OCR Error:", error);
      return { items: [] };
    }
  }

  private getMockAnalysis() {
    return "Cérebro em modo Simulação. Configure a API Key para insights reais.";
  }

  async analyzeProductBox(base64Image: string) {
    try {
      if (!this.genAI) throw new Error("Cérebro Offline.");
      const model = this.genAI.getGenerativeModel({ model: PRIMARY_MODEL });
      
      const prompt = `
        Aja como um scanner tático de logística para a Victor's Smart Estoque.
        Analise esta imagem de uma caixa de smartphone e extraia:
        1. Nome exato do modelo (Ex: iPhone 15 Pro Max 256GB Black).
        2. SKU ou Código de Referência.
        3. IMEI 1.
        4. IMEI 2.

        Retorne APENAS o JSON puro, sem markdown, no formato:
        {
          "name": "string",
          "sku": "string",
          "imei1": "string",
          "imei2": "string"
        }
      `;

      const result = await model.generateContent([
        { text: prompt },
        {
          inlineData: {
            data: base64Image.includes(',') ? base64Image.split(',')[1] : base64Image,
            mimeType: "image/jpeg"
          }
        }
      ]);

      const text = result.response.text();
      const cleanedText = text.replace(/```json|```/g, "").trim();
      return JSON.parse(cleanedText);
    } catch (error) {
      console.error("AI Analysis Failed:", error);
      return null;
    }
  }
}

export const aiService = new AIService();
