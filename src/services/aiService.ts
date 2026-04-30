import { GoogleGenAI } from "@google/genai";
import { SYSTEM_PROMPTS } from "./prompts";
import { toast } from "sonner";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const PRIMARY_MODEL = "gemini-3.1-flash-lite-preview"; 
const FALLBACK_MODEL = "gemini-3-flash-preview"; // Fast and multimodal stable fallback
const MAX_RETRIES = 2;

class AIService {
  private client: any = null;

  constructor() {
    console.log("🧠 AI Service 3.1 Initializing (New SDK)...");
    if (API_KEY) {
      this.client = new GoogleGenAI({ apiKey: API_KEY });
    } else {
      console.warn("❌ API Key NÃO detectada no import.meta.env.");
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          toast.error("Motor de IA Desativado: VITE_GEMINI_API_KEY não encontrada.", {
            description: "Verifique seu arquivo .env e reinicie o servidor.",
            duration: 10000
          });
        }, 1000);
      }
    }
  }

  /**
   * Limpeza universal de respostas da IA
   */
  private cleanAiResponse(text: string): string {
    if (!text) return "";
    return text
      .replace(/```json/gi, '')
      .replace(/```markdown/gi, '')
      .replace(/```/g, '')
      .trim();
  }

  /**
   * Execução Segura com Fallback Tático e Extração Robusta de Texto
   */
  private async safeGenerateContent(
    contents: any, 
    systemInstruction?: string, 
    signal?: AbortSignal
  ): Promise<{ text: string; modelUsed: string }> {
    if (!this.client) throw new Error("Cérebro Offline: API Key não encontrada.");
    
    // Formatação rigorosa para o novo SDK
    const formattedContents = Array.isArray(contents) 
      ? contents 
      : [{ role: 'user', parts: [{ text: String(contents) }] }];

    const formattedSystem = systemInstruction 
      ? { parts: [{ text: systemInstruction }] }
      : undefined;

    const extractText = (response: any): string => {
      try {
        if (!response) return "";
        // Tentativa 1: Propriedade .text (Interactions SDK padrão)
        if (typeof response.text === 'string' && response.text.length > 0) return response.text;
        // Tentativa 2: Método .text() (Legacy/Standard SDK)
        if (typeof response.text === 'function') {
          const t = response.text();
          if (typeof t === 'string' && t.length > 0) return t;
        }
        // Tentativa 3: Drill down manual no objeto de resposta
        const candidate = response.candidates?.[0];
        if (candidate?.content?.parts?.[0]?.text) {
          return candidate.content.parts[0].text;
        }
        // Tentativa 4: Resposta bruta do Interactions SDK
        if (response.response?.text) return response.response.text;
        
        return "";
      } catch (e) {
        console.warn("⚠️ Falha na extração de texto do objeto de resposta:", e);
        return "";
      }
    };

    let lastError: any;
    
    // Tentativa 1: Primário (Gemini 3.1 Lite)
    try {
      const result = await this.client.models.generateContent({
        model: PRIMARY_MODEL,
        contents: formattedContents,
        systemInstruction: formattedSystem,
        signal
      });
      
      const text = extractText(result.response || result);
      if (text) return { text: String(text), modelUsed: PRIMARY_MODEL };
      throw new Error("Resposta vazia do motor primário.");
    } catch (error: any) {
      if (error.name === 'AbortError') throw error;
      console.warn(`⚠️ Falha no Motor Primário (${PRIMARY_MODEL}):`, error.message || error);
      lastError = error;
      // Pequeno delay tático antes do fallback
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Tentativa 2: Fallback (Gemini 3 Flash)
    try {
      const result = await this.client.models.generateContent({
        model: FALLBACK_MODEL,
        contents: formattedContents,
        systemInstruction: formattedSystem,
        signal
      });
      
      const text = extractText(result.response || result);
      if (!text) throw new Error("Resposta vazia do motor de fallback.");
      
      console.log(`✅ Recuperação concluída via ${FALLBACK_MODEL}.`);
      return { text: String(text), modelUsed: FALLBACK_MODEL };
    } catch (error: any) {
      if (error.name === 'AbortError') throw error;
      console.error("🚨 Falha Crítica: Ambos os motores AI falharam.", error.message || error);
      throw lastError || error;
    }
  }

  async getPredictiveAnalysis(data: any) {
    try {
      if (!API_KEY) return { text: this.getMockAnalysis(), modelUsed: "OFFLINE" };

      const prompt = `DADOS PARA ANÁLISE DE ESTOQUE:\n${JSON.stringify(data, null, 2)}`;

      const { text, modelUsed } = await this.safeGenerateContent(
        prompt,
        SYSTEM_PROMPTS.PREDICTIVE_ANALYSIS
      );
      
      const cleanJson = this.cleanAiResponse(text);
      
      try {
        const parsed = JSON.parse(cleanJson);
        const insights = parsed.insights || [];
        
        if (Array.isArray(insights) && insights.length > 0) {
          return { text: insights.join('\n'), modelUsed };
        }
        
        // Fallback se o JSON for válido mas não tiver o formato esperado
        return { text: text.trim() || "Análise concluída, mas sem insights específicos.", modelUsed };
      } catch {
        // Fallback para texto puro se falhar o parse
        const lines = text.split('\n').filter(l => l.trim().length > 10);
        return { text: lines.length > 0 ? lines.join('\n') : text.trim(), modelUsed };
      }
    } catch (error: any) {
      console.error("AI Predictive Error:", error);
      return { 
        text: `FALHA NO NÚCLEO COGNITIVO: ${error.message || "Erro de conexão"}.\n- Verifique o estoque físico.\n- Reinicie o link neural.`, 
        modelUsed: "ERROR" 
      };
    }
  }

  async getProductInsight(productName: string, history15Days: any[]) {
    try {
      if (!API_KEY) return { text: "Cérebro Offline.", modelUsed: "OFFLINE" };

      const prompt = `
        ${SYSTEM_PROMPTS.PRODUCT_INSIGHT}
        PRODUTO: ${productName}
        HISTÓRICO DOS ÚLTIMOS 15 DIAS:
        ${JSON.stringify(history15Days)}
      `;

      const { text, modelUsed } = await this.safeGenerateContent(prompt);
      return { text: this.cleanAiResponse(text), modelUsed };
    } catch (error) {
      console.error("AI Insight Error:", error);
      return { text: "Falha ao gerar insight.", modelUsed: "ERROR" };
    }
  }

  async auditStock(imageData: string, currentStock: any[]) {
    try {
      const stockContext = currentStock.map(p => `${p.name} (${p.stock} un)`).join(', ');
      const prompt = SYSTEM_PROMPTS.AUDIT_STOCK.replace('[ESTOQUE_ATUAL]', stockContext);

      const contents = [
        { inlineData: { data: imageData.split(',')[1], mimeType: "image/jpeg" } },
        { text: prompt }
      ];

      const { text, modelUsed } = await this.safeGenerateContent(contents, SYSTEM_PROMPTS.AUDIT_STOCK);
      return { text: this.cleanAiResponse(text), modelUsed };
    } catch (error) { 
      console.error(error); 
      return { text: "Falha na auditoria visual. Verifique a conexão.", modelUsed: "ERROR" }; 
    }
  }

  async chat(message: string, history: any[] = [], inventoryData: any = null) {
    const startTime = performance.now();
    const contextInfo = inventoryData 
      ? `\n\nESTADO ATUAL DO INVENTÁRIO (DADOS REAIS):\n${JSON.stringify(inventoryData)}\n\nNÃO INVENTE PRODUTOS QUE NÃO ESTÃO NESSA LISTA.`
      : "";
    
    try {
      if (!API_KEY) return { text: "Cérebro Offline. Por favor, configure a VITE_GEMINI_API_KEY.", time: 0, model: "OFFLINE" };

      const parts = history.map(h => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: String(h.content || h.text || "") }],
      }));
      
      parts.push({
        role: 'user',
        parts: [{ text: `CONTEXTO ATUAL:${contextInfo}\n\nPERGUNTA: ${message}` }]
      });

      const { text, modelUsed } = await this.safeGenerateContent(
        parts,
        SYSTEM_PROMPTS.STRATEGIC_CHAT
      );

      const endTime = performance.now();
      return {
        text: text,
        time: parseFloat(((endTime - startTime) / 1000).toFixed(2)), 
        model: modelUsed
      };
    } catch (error: any) {
      console.error("AI Strategic Error:", error);
      return { 
        text: `🧠 FALHA NEURAL CRÍTICA: ${error.message || "Erro de conexão"}.`, 
        time: parseFloat(((performance.now() - startTime) / 1000).toFixed(2)),
        model: "ERROR"
      };
    }
  }

  async getMarketAnalysis(product: any, mlResults: any[]) {
    try {
      const productInfo = `${product.name} (Custo: R$ ${product.buy_price || 0})`;
      const mlContext = mlResults.map(r => `Preço: R$ ${r.price} | Reputação: ${r.seller_reputation} | Vendas: ${r.sold_quantity}`).join('\n');
      const prompt = SYSTEM_PROMPTS.MARKET_ANALYSIS
        .replace('[PRODUTO_INFO]', productInfo)
        .replace('[ML_RESULTS]', mlContext);

      const { text, modelUsed } = await this.safeGenerateContent(prompt, SYSTEM_PROMPTS.MARKET_ANALYSIS);
      return { text: this.cleanAiResponse(text), modelUsed };
    } catch (error) {
      console.error("Market Analysis AI Error:", error);
      return { text: "Falha ao processar análise de mercado.", modelUsed: "ERROR" };
    }
  }

  async getShoppingListInsight(lowStockItems: any[]) {
    try {
      const itemsContext = lowStockItems.map(i => 
        `${i.name} (Estoque: ${i.stock} | Giro: ${i.velocity?.toFixed(2) || 0}/dia)`
      ).join('\n');
      const prompt = `DADOS DO ESTOQUE (ITENS EM ALERTA):\n${itemsContext}\n\nAnalise o giro e gere a sugestão de reposição.`;

      const { text, modelUsed } = await this.safeGenerateContent(prompt, SYSTEM_PROMPTS.PREDICTIVE_SHOPPING_LIST);
      return { text: this.cleanAiResponse(text), modelUsed };
    } catch (error: any) {
      console.error("Shopping List AI Error:", error);
      const errorMsg = error.message?.includes("quota") ? "Limite de cérebro atingido. Tente novamente em breve." : "Falha ao gerar insights de compra.";
      return { text: errorMsg, modelUsed: "ERROR" };
    }
  }

  async auditMultiModal(video: { data: string, mimeType: string }, contextType: 'stock' | 'invoice', contextData: any, signal?: AbortSignal) {
    try {
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

      const isReceipt = contextType === 'invoice';
      const systemPrompt = isReceipt ? SYSTEM_PROMPTS.RECEIPT_AUDIT : SYSTEM_PROMPTS.AUDIT_STOCK;

      const contents = [
        { inlineData: { data: video.data, mimeType: video.mimeType } },
        { text: isReceipt ? systemPrompt : `${systemPrompt}\n\nMODO: AUDITORIA DE ESTOQUE\n${contextPrompt}\n\nINSTRUÇÕES:\n1. Analise a imagem para identificar todos os produtos.\n2. Retorne um JSON no final da resposta: {"identified": [{"name": "string", "qty": number}]}.` }
      ];

      const { text, modelUsed } = await this.safeGenerateContent(contents, systemPrompt, signal);
      return { text: text, modelUsed }; // Don't clean here, audit might need raw JSON in prose
    } catch (error: any) {
      if (error.name === 'AbortError') throw error;
      console.error("MultiModal Audit Error:", error);
      return { text: "Falha no processamento do vídeo de auditoria.", modelUsed: "ERROR" };
    }
  }

  async extractInvoiceData(imageData: string) {
    try {
      const prompt = `
        Analise esta foto de uma Nota Fiscal ou comprovante de compra e extraia os produtos e quantidades.
        Retorne APENAS um JSON no formato: {"items": [{"name": "string", "qty": number}]}.
      `;
      const contents = [
        { inlineData: { data: imageData.includes(',') ? imageData.split(',')[1] : imageData, mimeType: "image/jpeg" } },
        { text: prompt }
      ];

      const { text, modelUsed } = await this.safeGenerateContent(contents);
      const cleanJson = this.cleanAiResponse(text);
      const jsonMatch = cleanJson.match(/\{.*\}/s);
      const data = jsonMatch ? JSON.parse(jsonMatch[0]) : { items: [] };
      return { ...data, modelUsed };
    } catch (error) {
      console.error("Invoice OCR Error:", error);
      return { items: [], modelUsed: "ERROR" };
    }
  }

  private getMockAnalysis() {
    return "Cérebro em modo Simulação. Configure a API Key para insights reais.";
  }

  async resolveSKUs(skus: string[], signal?: AbortSignal) {
    if (!skus.length) return { identified: [], modelUsed: "NONE" };
    const prompt = `${SYSTEM_PROMPTS.SKU_RESOLUTION}\n\nSKUS PARA IDENTIFICAÇÃO EM LOTE:\n${skus.join('\n')}\n\nRetorne um JSON com o array "identified" contendo { "name", "sku" } para cada item.`;
    
    try {
      const { text, modelUsed } = await this.safeGenerateContent(prompt, SYSTEM_PROMPTS.SKU_RESOLUTION, signal);
      const cleanJson = this.cleanAiResponse(text);
      const jsonMatch = cleanJson.match(/\{.*\}/s);
      const finalJson = jsonMatch ? jsonMatch[0] : cleanJson;
      const parsed = JSON.parse(finalJson);
      return { identified: parsed.identified || [], modelUsed };
    } catch (error: any) {
      if (error.name === 'AbortError') throw error;
      return { identified: [], modelUsed: "ERROR" };
    }
  }

  async resolveProductFromSku(sku: string, signal?: AbortSignal) {
    const results = await this.resolveSKUs([sku], signal);
    return results.identified?.[0] || null;
  }

  async analyzeProductBox(base64Image: string, signal?: AbortSignal) {
    try {
      const prompt = `
        Analise esta etiqueta de logística de smartphone. 
        Sua PRIORIDADE MÁXIMA é identificar o NOME DO PRODUTO (Marca/Modelo), ESPECIFICAÇÕES (Memória/RAM/Cor) e os IMEIs.
        Retorne APENAS um JSON no formato: {"name": "string", "spec": "string", "imei1": "string", "imei2": "string", "brand": "string"}
      `;
      const contents = [
        { inlineData: { data: base64Image.includes(',') ? base64Image.split(',')[1] : base64Image, mimeType: "image/jpeg" } },
        { text: prompt }
      ];

      const { text, modelUsed } = await this.safeGenerateContent(contents, SYSTEM_PROMPTS.VISION_EXTRACTOR, signal);
      const cleanedText = this.cleanAiResponse(text);
      const jsonMatch = cleanedText.match(/\{.*\}/s);
      return JSON.parse(jsonMatch ? jsonMatch[0] : cleanedText);
    } catch (error: any) {
      if (error.name === 'AbortError') return null;
      console.warn("⚠️ AI Multimodal Falhou. Iniciando Simulação Tática (Opção D)...");
      
      // FALLBACK TÁTICO: Simulação baseada em OCR (mais barato e rápido)
      return await this.simulateIdentification(base64Image, signal);
    }
  }

  /**
   * Simulação Tática de IA: Extrai texto via OCR e aplica Regex para identificar padrões conhecidos
   */
  async simulateIdentification(base64Image: string, signal?: AbortSignal) {
    try {
      const { text } = await this.extractTextFromImage(base64Image);
      if (!text) return null;

      const upperText = text.toUpperCase();
      let name = "PRODUTO NÃO IDENTIFICADO";
      let brand = "OUTROS";
      let spec = "Padrão";
      let imei1 = "";
      let imei2 = "";

      // Padrões Táticos (Common Brands)
      if (upperText.includes("IPHONE")) { brand = "APPLE"; name = "IPHONE (SÉRIE)"; }
      else if (upperText.includes("SAMSUNG") || upperText.includes("GALAXY")) { brand = "SAMSUNG"; name = "GALAXY (SÉRIE)"; }
      else if (upperText.includes("MOTOROLA") || upperText.includes("MOTO ")) { brand = "MOTOROLA"; name = "MOTO (SÉRIE)"; }
      else if (upperText.includes("XIAOMI") || upperText.includes("REDMI")) { brand = "XIAOMI"; name = "REDMI/XIAOMI"; }

      // Extração de IMEI via Regex (Padrão 15 dígitos)
      const imeiMatches = text.match(/\b\d{15}\b/g);
      if (imeiMatches && imeiMatches.length > 0) {
        imei1 = imeiMatches[0];
        if (imeiMatches.length > 1) imei2 = imeiMatches[1];
      }

      // Extração de Especificações (Memória)
      const memMatch = upperText.match(/(\d+)\s?(GB|TB)/);
      if (memMatch) spec = memMatch[0];

      // Refinamento de Nome via Palavras-Chave próximas a marcas
      const lines = upperText.split('\n');
      for (const line of lines) {
        if (line.includes(brand) && line.length > brand.length + 2) {
          name = line.trim();
          break;
        }
      }

      return {
        name: name,
        brand: brand,
        spec: spec,
        imei1: imei1,
        imei2: imei2,
        isSimulation: true
      };
    } catch (e) {
      console.error("Erro na Simulação Tática:", e);
      return null;
    }
  }

  async extractTextFromImage(base64Image: string) {
    try {
      const prompt = "Extraia todo o texto visível nesta imagem. Retorne apenas o texto puro.";
      const contents = [
        { inlineData: { data: base64Image.includes(',') ? base64Image.split(',')[1] : base64Image, mimeType: "image/jpeg" } },
        { text: prompt }
      ];
      const { text, modelUsed } = await this.safeGenerateContent(contents);
      return { text: text, modelUsed };
    } catch (error) {
      return { text: "", modelUsed: "ERROR" };
    }
  }

  async simulateMarketData(productName: string, ean?: string) {
    try {
      const prompt = `
        SIMULAÇÃO TÁTICA DE MERCADO (MODO DEMO)
        PRODUTO: ${productName} ${ean ? `(EAN: ${ean})` : ""}
        
        Aja como um analista de mercado do Mercado Livre Brasil.
        Gere 3 resultados fictícios mas realistas de vendedores "Platinum" ou "Gold" para este produto.
        Considere os preços atuais de mercado em Reais (BRL).
        
        Retorne APENAS um JSON no formato: 
        {
          "results": [
            {
              "price": number,
              "permalink": "https://www.mercadolivre.com.br/demo",
              "seller_reputation": "platinum",
              "logistic_type": "full",
              "available_quantity": 10,
              "sold_quantity": 50,
              "isSimulation": true
            }
          ]
        }
      `;

      const { text } = await this.safeGenerateContent(prompt);
      const cleanJson = this.cleanAiResponse(text);
      const jsonMatch = cleanJson.match(/\{.*\}/s);
      const data = JSON.parse(jsonMatch ? jsonMatch[0] : cleanJson);
      return { results: data.results || [], modelUsed: "GEMINI-SIMULATION" };
    } catch (error) {
      console.error("Market Simulation AI Error:", error);
      return { results: [], modelUsed: "ERROR" };
    }
  }
}

export const aiService = new AIService();
