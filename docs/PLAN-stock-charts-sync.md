# PLAN-stock-charts-sync.md - Gestão Estratégica & Sync Autônomo

## Objetivo
Transformar o Admin Cockpit em uma ferramenta de inteligência visual e educativa, garantindo que os dados estejam sempre sincronizados sem intervenção manual.

---

## 1. Módulos de Interface (Frontend)

### [NEW] Tactical Intelligence Charts
- **Local**: `AdminCockpit.tsx`
- **Componente**: `MovementsChart` (Gráfico de barras Recharts)
- **Dados**: Agregação dos últimos 7 dias de movimentações (Entradas vs Saídas).
- **Estética**: Neon Blue (Entradas) vs Neon Red (Saídas) sobre fundo Black Piano.

### [NEW] Mentor Tooltips
- **Local**: Dashboards de métricas (Ticket Médio, Margem Bruta, Giro).
- **Componente**: `MetricInfo` (Ícone de info que abre tooltip/modal).
- **Conteúdo**: Explicação simples e tática do que a métrica significa para o negócio.

---

## 2. Lógica de Sincronia (Backend/Store)

### [MODIFY] Automated Background Sync
- **Local**: `useStore.ts`
- **Lógica**:
  - Listener para o evento `online` do navegador.
  - Intervalo de 5 minutos para tentativa de sync se houver `lastSync` antigo.
  - Feedback visual sutil (apenas no status de sincronia no SideMenu).

---

## 3. Experiência do Proprietário (UX)

- **Foco**: "WOW effect" ao abrir o painel.
- **Narrativa**: O sistema não apenas guarda dados, ele ensina a gerir.

---

## 🛠️ Atribuição de Agentes
- **Frontend Specialist**: Implementação dos gráficos e tooltips.
- **Backend Specialist**: Lógica de agregação cronológica e listener de rede.
- **Documentation Writer**: Textos educativos ("Dicionário do Gestor").

---

## ✅ Checklist de Verificação
- [ ] Gráficos renderizam corretamente com dados reais.
- [ ] Tooltips são acessíveis via touch (mobile).
- [ ] O app sincroniza automaticamente ao recuperar conexão.
- [ ] O visual "Branco Gelo" e Neon se mantém consistente.
