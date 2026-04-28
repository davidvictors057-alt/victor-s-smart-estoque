# 🧠 PRD: Inteligência Artificial - Fase 2 (Oráculo Operacional)

Este documento detalha exaustivamente as implementações de IA realizadas na Fase 2 do projeto **Victor's Smart Estoque**. O objetivo é servir como base de conhecimento técnica para refatoração e otimização por modelos de alta performance (Gemini 1.5 Pro / Opus).

---

## 1. Visão Geral da Arquitetura de IA
O sistema utiliza estritamente a API do **Google Gemini 3.1** (Modelo: `gemini-3.1-flash-lite-preview`). 

> [!IMPORTANT]
> **Restrição de Infraestrutura:** As chaves de API do ambiente (Ciclo Março/Abril 2026) são exclusivas para a **Família 3** do Gemini. Motores da família 1.5 ou anteriores não são suportados e resultam em erro de autenticação. O modelo `3.1-flash-lite-preview` é utilizado por ser o estado da arte com requisições gratuitas de alto desempenho.

A orquestração é feita centralizadamente em `src/services/aiService.ts` com personas configuradas em `src/services/prompts.ts`.

---

## 2. Módulos Implementados

### 2.1. Market Radar (Radar de Mercado)
**Objetivo:** Prover inteligência competitiva e análise de arbitragem em tempo real.
- **Componente:** `src/components/views/MarketRadarView.tsx`
- **Lógica de Dados:** 
    - Busca via EAN na API do Mercado Livre.
    - Filtra por vendedores Gold/Platinum e produtos "New".
    - **Calculadora de Lucro Líquido:** Subtrai automaticamente a comissão estimada do ML (11.5% a 16.5% + taxa fixa) e o custo do produto para exibir o lucro real.
- **Lógica de IA (`analyzeMarket`):**
    - Envia os dados dos 5 principais concorrentes para a IA.
    - Gera insights sobre precificação, Buy Box e competitividade.
- **Dúvidas/Issue:** A API do ML às vezes retorna produtos sem EAN no título, o que pode poluir a análise se a busca não for exata.

### 2.2. AIVision Audit v2.0 (Auditoria Logística Multimodal)
**Objetivo:** Validar a integridade física do estoque e o recebimento de mercadorias via vídeo e OCR de NF.
- **Componentes:** `src/components/views/AIVisionAuditView.tsx`, `AuditVideoScanner.tsx`, `AuditHub.tsx`.
- **Mecanismo de Scanner (`auditMultiModal`):**
    - **Vídeo de 10s:** Captura 10 frames (1 por segundo) via `MediaDevices API`.
    - **Contexto Híbrido:** A IA recebe os 10 frames + a lista de "Esperado" (Estoque atual ou dados de NF).
    - **Análise Multimodal:** O motor `3.1-flash-lite-preview` identifica visualmente os SKUs nos frames e gera um JSON de conformidade.
- **Mecanismo de Recebimento (`extractInvoiceData`):**
    - **OCR Tático:** Extração de itens e quantidades de fotos de Notas Fiscais para servir de base de comparação automática ("Digital Twin" da NF).
- **Audit Hub:** Interface de conciliação onde o usuário revisa divergências, edita quantidades finais e exporta o relatório para WhatsApp ou sincroniza com o banco de dados.

### 2.3. Predictive Shopping List (Lista Preditiva)
**Objetivo:** Prever rupturas de estoque e sugerir reposição inteligente.
- **Status:** Integrado ao Store Global para persistência de estado e visualização em tempo real no Admin Cockpit.

---

## 3. Logs de Estabilização e Correções Críticas

### 3.1. Dashboard Admin (Cockpit)
- **Correção de ReferenceErrors:** Ícones como `TrendingUp`, `TrendingDown` e `Eye` foram consolidados no bloco de imports do `lucide-react`. 
- **Tipagem de Movimentações:** O acesso ao nome do operador foi corrigido de `m.operator_name` para `m.operator?.full_name`, garantindo compatibilidade com o schema de relacionamentos do Supabase.
- **Gerenciamento de Estado:** O estado `shoppingListOpen` foi movido para o `useStore.ts`, permitindo que o cockpit abra a lista preditiva de forma síncrona.

---

## 4. Configuração de Prompts (Persona System)
Todos os prompts em `src/services/prompts.ts` seguem a diretriz:
- **Estilo:** C-Level Executive, direto, sem redundâncias.
- **Formato de Resposta:** Sempre JSON para módulos de auditoria (`auditMultiModal`) e Markdown para insights de texto.

---

## 5. Pontos para Refatoração (Sugestões para o Próximo Modelo)
1. **Consolidação de Tipos:** Eliminar `any` no `aiService.ts` e usar interfaces rigorosas para os retornos da IA.
2. **Histórico de Auditorias:** Criar tabela no Supabase para persistir os resultados do `AuditHub`.
3. **Prompt Hardening:** Refinar o prompt da Auditoria v2 para lidar melhor com ambientes de baixa luminosidade ou pilhas de caixas muito densas.
4. **Vulnerabilidade de Quota:** Manter a amostragem de 10 frames como limite para garantir que a requisição não exceda o timeout da API gratuita do Gemini.

---
## 6. Infraestrutura PWA & Túnel HTTPS (Acesso Móvel)
Para viabilizar o uso do sistema em smartphones com suporte total à câmera e instalação nativa, implementamos:

1.  **Túnel Seguro (Cloudflare)**:
    *   Execução do `cloudflared tunnel` apontando para a porta `8080`.
    *   Isso gera um endpoint HTTPS que permite ao navegador mobile liberar as APIs de hardware (Câmera) que são bloqueadas em conexões HTTP comuns.
2.  **Service Worker (`sw.js`)**:
    *   Configuração de um worker para gerenciar o cache de ativos e permitir o funcionamento offline parcial.
    *   Essencial para o "Add to Home Screen" (Instalação do App).
3.  **Manifesto de App**:
    *   Definição de ícones, cores de tema (Black Piano) e modo de exibição `standalone`, transformando o site em um aplicativo fluido.

---
**Documentação atualizada em 28/04/2026 - Victor's Smart Audit System v3.5.4.**
*Status: Quase 95%*
