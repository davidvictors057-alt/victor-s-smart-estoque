import { GoogleGenerativeAI } from "@google/generative-ai";
import { SYSTEM_PROMPTS } from "./prompts";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const PRIMARY_MODEL = "gemini-3.1-flash-lite-preview"; 
const SECONDARY_MODEL = "gemini-1.5-flash-latest";       
const FALLBACK_MODEL = "gemini-2.0-flash-exp"; 

class AIService {
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    if (API_KEY) {
      this.genAI = new GoogleGenerativeAI(API_KEY);
    }
  }

  private async getModel(preferSecondary = false) {
    if (!this.genAI) throw new Error("Cérebro Offline: API Key não configurada.");
    const modelName = preferSecondary ? SECONDARY_MODEL : PRIMARY_MODEL;
    return this.genAI.getGenerativeModel({ 
      model: modelName,
      systemInstruction: SYSTEM_PROMPTS.STRATEGIC_CHAT 
    });
  }

  async getPredictiveAnalysis(data: any) {
    try {
      if (!API_KEY) return this.getMockAnalysis();

      let model;
      try {
        model = await this.getModel(false); // Try Lite first
      } catch {
        model = await this.getModel(true);  // Fallback to latest
      }
      
      const prompt = `
        ${SYSTEM_PROMPTS.PREDICTIVE_ANALYSIS}
        
        DADOS ATUAIS:
        ${JSON.stringify(data)}
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("AI Error:", error);
      return "Erro na conexão com o Cérebro Online. Usando lógica local.";
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

      let model;
      try {
        model = await this.getModel(false);
      } catch {
        model = await this.getModel(true);
        usedModel = SECONDARY_MODEL;
      }

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
    } catch (error) {
      return { 
        text: "Falha na comunicação neural. Tente novamente em instantes.", 
        time: parseFloat(((performance.now() - startTime) / 1000).toFixed(2)),
        model: usedModel
      };
    }
  }

  private getMockAnalysis() {
    return "Cérebro em modo Simulação. Configure a API Key para insights reais.";
  }
}

export const aiService = new AIService();
