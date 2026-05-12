import { GoogleGenAI } from "@google/genai";
import { SYSTEM_PROMPTS } from "./prompts";
import { toast } from "sonner";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const AI_MODELS = [
  "gemini-3.1-flash-lite-preview",
  "gemma-4-31b-it",
  "gemma-4-26b-a4b-it"
];
const MAX_RETRIES_PER_MODEL = 1;

class AIService {
  private client: any = null;

  constructor() {
    if (API_KEY) {
      this.client = new GoogleGenAI({ apiKey: API_KEY });
    } else {
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
   * Limpeza universal de respostas da IA (Protocolo Black Piano)
   */
  private cleanAiResponse(text: string): string {
    if (!text) return "";
    let sanitized = text
      // Remove deep code block markers
      .replace(/```[a-z]*\n?/gi, '')
      .replace(/```/g, '')
      // Remove any internal thought patterns if they leak
      .replace(/<thought>[\s\S]*?<\/thought>/gi, '')
      // PROTEÇÃO CRÍTICA: Remove negritos/itálicos que envolvem tags (causa de "código no nome")
      .replace(/\*\*<(\w+)>(.*?)<\/\1>\*\*/g, '<$1>$2</$1>')
      .replace(/\*<(\w+)>(.*?)<\/\1>\*/g, '<$1>$2</$1>')
      .replace(/__<(\w+)>(.*?)<\/\1>__/g, '<$1>$2</$1>')
      .replace(/_<(\w+)>(.*?)<\/\1>_/g, '<$1>$2</$1>')
      // Colapsar quebras excessivas preservando a estrutura
      .replace(/\n{3,}/g, '\n\n')
      // Remove excessive control characters
      .replace(/[\u0000-\u0009\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "")
      .trim();

    return sanitized;
  }

  /**
   * Tenta extrair e parsear JSON de uma string de forma robusta
   */
  private safeParseJson(text: string): any {
    try {
      const cleaned = this.cleanAiResponse(text);
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1) {
        const jsonPart = cleaned.substring(firstBrace, lastBrace + 1);
        return JSON.parse(jsonPart);
      }
      
      return JSON.parse(cleaned);
    } catch (e) {
      return null;
    }
  }

  /**
   * Execução Segura com Fallback Tático e Grounding Opcional
   */
  private async safeGenerateContent(
    contents: any, 
    systemInstruction?: string, 
    useSearch: boolean = false,
    signal?: AbortSignal
  ): Promise<{ text: string; modelUsed: string }> {
    if (!this.client) throw new Error("Cérebro Offline: API Key não encontrada.");
    
    const formattedContents = Array.isArray(contents) 
      ? contents 
      : [{ role: 'user', parts: [{ text: String(contents) }] }];

    const formattedSystem = systemInstruction 
      ? { parts: [{ text: systemInstruction }] }
      : undefined;

    const extractText = (response: any): string => {
      try {
        if (!response) return "";
        if (typeof response.text === 'string' && response.text.length > 0) return response.text;
        if (typeof response.text === 'function') {
          const t = response.text();
          if (typeof t === 'string' && t.length > 0) return t;
        }
        const candidate = response.candidates?.[0];
        if (candidate?.content?.parts?.[0]?.text) {
          return candidate.content.parts[0].text;
        }
        if (response.response?.text) return response.response.text;
        return "";
      } catch (e) {
        return "";
      }
    };

    let lastError: any = null;

    // Loop de Triple Fallback (Protocolo Black Piano)
    for (let i = 0; i < AI_MODELS.length; i++) {
      const currentModel = AI_MODELS[i];
      
      try {
        if (i > 0) {
          console.warn(`⚠️ [AIService] Fallback Ativado (${i}): Tentando ${currentModel}`);
        }

        const config: any = {
          model: currentModel,
          contents: formattedContents,
          systemInstruction: formattedSystem,
          signal
        };

        // Ativa Google Search apenas no Gemini se solicitado
        if (useSearch && currentModel.includes("gemini")) {
          config.tools = [{ googleSearch: {} }];
        }

        const result = await this.client.models.generateContent(config);
        const text = extractText(result.response || result);

        if (!text || text.length < 5) {
          throw new Error(`Resposta curta ou inválida do modelo ${currentModel}`);
        }

        return { text: String(text), modelUsed: currentModel };

      } catch (error: any) {
        lastError = error;
        
        // Se o usuário cancelou a requisição, para tudo imediatamente
        if (error.name === 'AbortError' || signal?.aborted) {
          throw error;
        }

        const status = error?.status || error?.error?.status;
        console.error(`❌ [AIService] Falha no modelo ${currentModel} (Status: ${status}):`, error.message);

        // Se for o último modelo, sai do loop
        if (i === AI_MODELS.length - 1) break;
        
        // Espera um delay tático antes do próximo fallback (se for erro de rede/quota)
        if (status === 503 || status === 429) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }

    throw lastError;
  }

  async getPredictiveAnalysis(data: any) {
    try {
      if (!API_KEY) return { text: this.getMockAnalysis(), modelUsed: "OFFLINE" };

      const prompt = `DADOS PARA ANÁLISE DE ESTOQUE:\n${JSON.stringify(data, null, 2)}`;

      const { text, modelUsed } = await this.safeGenerateContent(
        prompt,
        SYSTEM_PROMPTS.PREDICTIVE_ANALYSIS
      );
      
      const parsed = this.safeParseJson(text);
      if (parsed) {
        const report = parsed.report || parsed.insights?.join('\n') || null;
        if (report) {
          return { text: report, modelUsed };
        }
      }
      
      // Fallback para texto puro
      return { text: text.trim() || "Análise concluída.", modelUsed };
    } catch (error: any) {
      // console.error("AI Predictive Error:", error);
      return { 
        text: `FALHA NO NÚCLEO COGNITIVO: ${error.message || "Erro de conexão"}.\n- Verifique o estoque físico.\n- Reinicie o link neural.`, 
        modelUsed: "ERROR" 
      };
    }
  }

  async getProductInsight(product: any, history15Days: any[], userProfile?: any) {
    try {
      if (!API_KEY) return { text: "Cérebro Offline.", modelUsed: "OFFLINE" };

      const userName = userProfile?.full_name || 'Operador';
      
      const price = product.price || product.sale || 'NÃO DEFINIDO';
      
      const prompt = SYSTEM_PROMPTS.PRODUCT_INSIGHT
        .replace(/\[USER_NAME\]/g, userName)
        .replace(/\[STOCK\]/g, String(product.stock || 0))
        .replace(/\[PRICE\]/g, String(price))
        .replace(/\[DADOS_CONTEXTO\]/g, `
          PRODUTO: ${product.name}
          SKU: ${product.sku || 'N/A'}
          ESTOQUE ATUAL: ${product.stock || 0}
          PREÇO ATUAL: R$ ${price}
          HISTÓRICO 15 DIAS (MOVIMENTAÇÕES): ${history15Days.length > 0 ? JSON.stringify(history15Days) : 'Nenhuma movimentação registrada nos últimos 15 dias.'}
        `);

      const { text, modelUsed } = await this.safeGenerateContent(prompt);
      return { text: this.cleanAiResponse(text), modelUsed };
    } catch (error: any) {
      console.error("AI Insight Error:", error);
      const isOverloaded = error.status === 503 || error.message?.includes('503') || error.message?.includes('demand');
      return { 
        text: isOverloaded 
          ? "O Oráculo está com alta demanda no momento (Google em manutenção). Tente novamente em alguns segundos." 
          : "Falha ao gerar insight. Verifique sua conexão.", 
        modelUsed: "ERROR" 
      };
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

      return {
        text: this.cleanAiResponse(text),
        time: parseFloat(((performance.now() - startTime) / 1000).toFixed(2)), 
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

  async getMarketPrice(productName: string): Promise<{ price: number; link: string; modelUsed: string }> {
    try {
      if (!API_KEY) return { price: 0, link: "", modelUsed: "OFFLINE" };

      const prompt = `
        Pesquise o preço atual de mercado para o produto: "${productName}".
        FOCO: Use o nome comercial do modelo. IGNORE códigos de SKU internos ou seriais.
        Considere lojas confiáveis no Brasil (Google Shopping, Amazon, Mercado Livre).
        Retorne APENAS um JSON no formato: {"price": number, "link": "string"}.
        Certifique-se de que o preço seja o valor à vista em Reais (R$).
      `;

      const { text, modelUsed } = await this.safeGenerateContent(
        prompt, 
        "Você é um assistente de precificação em tempo real. Use a busca do Google para encontrar o melhor preço atual.",
        true // Ativa o Google Search Grounding
      );

      const parsed = this.safeParseJson(text);
      return { 
        price: parsed?.price || 0, 
        link: parsed?.link || "", 
        modelUsed 
      };
    } catch (error) {
      console.error("Market Price Grounding Error:", error);
      return { price: 0, link: "", modelUsed: "ERROR" };
    }
  }

  async getMarketAnalysis(product: any, marketPrice: number, userName: string = "Operador") {
    try {
      const dataContext = `
        PRODUTO: ${product.name}
        CUSTO OPERACIONAL: R$ ${product.buy_price || product.cost || 0}
        VALOR DE REFERÊNCIA (MERCADO): R$ ${marketPrice}
      `;

      const prompt = SYSTEM_PROMPTS.MARKET_ANALYSIS
        .replace(/\[USER_NAME\]/g, userName)
        .replace(/\[DADOS_CONTEXTO\]/g, dataContext);

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

      const { text, modelUsed } = await this.safeGenerateContent(contents, systemPrompt, false, signal);
      
      // Tentativa de extração tática de JSON se o componente esperar estrutura
      const parsed = this.safeParseJson(text);
      return { 
        text: text, 
        identified: parsed?.identified || [],
        modelUsed 
      };
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
      const parsed = this.safeParseJson(text);
      return { items: parsed?.items || [], modelUsed };
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
      const { text, modelUsed } = await this.safeGenerateContent(prompt, SYSTEM_PROMPTS.SKU_RESOLUTION, false, signal);
      const parsed = this.safeParseJson(text);
      return { identified: parsed?.identified || [], modelUsed };
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

      const { text, modelUsed } = await this.safeGenerateContent(contents, SYSTEM_PROMPTS.VISION_EXTRACTOR, false, signal);
      const parsed = this.safeParseJson(text);
      return parsed || null;
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

}

export const aiService = new AIService();
