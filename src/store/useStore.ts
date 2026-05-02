import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface Product {
  id: string;
  sku?: string | null;
  name: string;
  spec?: string | null;
  imei?: string | null;
  imei2?: string | null;
  brand?: string | null;
  category?: string | null;
  cost: number;
  sale: number;
  status: 'in_stock' | 'sold' | 'reserved' | 'repair';
  image_url?: string | null;
  internal_code?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CatalogItem {
  sku: string;
  name: string;
  spec?: string | null;
  image_url?: string | null;
  cost?: number;
  sale?: number;
  client_id?: string;
  internal_code?: string | null;
  last_updated: string;
  productId?: string;
}

export interface Profile {
  id: string;
  full_name: string;
  role: 'admin' | 'operator';
  avatar_url: string | null;
  status: 'online' | 'offline' | 'busy';
  last_active: string;
  created_at: string;
  pin: string;
  email: string | null;
  phone: string | null;
  bio: string | null;
  accent_color: string | null;
  theme_style: string | null;
  client_id: string | null;
  score: number;
  shift: string;
}

export interface Movement {
  id: string;
  product_id: string;
  operator_id: string;
  type: 'in' | 'out';
  notes: string | null;
  timestamp: string;
  product?: Product;
  operator?: Profile;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  tone: 'danger' | 'ai' | 'success' | 'primary';
  read: boolean;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  client_id?: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'emergency';
  context: Record<string, unknown> | null;
  ai_response: string | null;
  created_at: string;
  updated_at: string;
  user?: Profile;
}

interface AppState {
  products: Product[];
  catalog: CatalogItem[];
  profiles: Profile[];
  movements: Movement[];
  notifications: AppNotification[];
  appSettings: Record<string, string>;
  lastSync: Date | null;
  lastSyncUser: string | null;
  notifOpen: boolean;
  setNotifOpen: (open: boolean) => void;
  supportOpen: boolean;
  setSupportOpen: (open: boolean) => void;
  changePinOpen: boolean;
  setChangePinOpen: (open: boolean) => void;
  manualOpen: boolean;
  setManualOpen: (open: boolean) => void;
  devOpen: boolean;
  setDevOpen: (open: boolean) => void;
  isLoading: boolean;
  fetchAppSettings: () => Promise<void>;
  updateAppSetting: (key: string, value: string) => Promise<void>;
  initRealtimeSubscriptions: () => () => void;
  fetchProducts: () => Promise<void>;
  fetchProfiles: () => Promise<void>;
  fetchMovements: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  fetchTickets: () => Promise<void>;
  fetchCatalog: () => Promise<void>;
  addToCatalog: (item: Omit<CatalogItem, 'last_updated'>) => Promise<void>;
  updateCatalogItem: (sku: string, updates: Partial<CatalogItem>) => Promise<void>;
  remapCatalogItem: (oldSku: string, newSku: string) => Promise<void>;
  fetchAll: () => Promise<void>;
  updateProfile: (id: string, updates: Partial<Profile>) => Promise<void>;
  clearCache: () => void;
  addProduct: (product: Omit<Product, 'id' | 'created_at' | 'updated_at'> & { quantity?: number }) => Promise<void>;
  addMovement: (movement: Omit<Movement, 'id' | 'timestamp' | 'product' | 'operator'>) => Promise<void>;
  addProfile: (profile: Omit<Profile, 'id' | 'created_at' | 'last_active'>) => Promise<void>;
  removeProfile: (id: string) => Promise<void>;
  addNotification: (notif: Omit<AppNotification, 'id' | 'created_at' | 'read'>) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  clearNotifications: () => Promise<void>;
  addTicket: (ticket: Omit<SupportTicket, 'id' | 'created_at' | 'updated_at' | 'status' | 'ai_response'>) => Promise<void>;
  updateTicket: (id: string, updates: Partial<SupportTicket>) => Promise<void>;
  tickets: SupportTicket[];
  currentUser: Profile | null;
  setCurrentUser: (user: Profile | null) => void;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  updateProductsBulk: (ids: string[], updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  deleteProductsBulk: (ids: string[]) => Promise<void>;
  fetchProductImage: (id: string) => Promise<string | null>;
  fetchCatalogImage: (sku: string) => Promise<string | null>;
  fetchProductHistoricalPrices: (sku: string) => Promise<{ cost: number; sale: number } | null>;
  bulkAddProducts: (products: any[]) => Promise<void>;
  bulkAddMovements: (movements: any[], isBulk?: boolean) => Promise<void>;
  purgeSystem: () => Promise<void>;
  getChartData: () => { name: string; in: number; out: number }[];
  lastOnlineSync: Date | null;
  lastAiAnalysis: string | null;
  lastAiAnalysisModel: string | null;
  isAiLoading: boolean;
  onlineBrainMode: boolean;
  chatHistory: { role: 'user' | 'model'; content: string; meta?: { model: string; time: number } }[];
  setOnlineBrainMode: (mode: boolean) => void;
  runPredictiveAnalysis: () => Promise<void>;
  sendChatMessage: (msg: string) => Promise<void>;
  getStrategicContext: () => any;
  clearChat: () => void;
  shoppingListOpen: boolean;
  setShoppingListOpen: (open: boolean) => void;
  reconcileStockAudit: (auditItems: any[]) => Promise<void>;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      products: [],
      catalog: [],
      profiles: [],
      movements: [],
      notifications: [],
      appSettings: {},
      lastSync: null,
      lastOnlineSync: null,
      lastSyncUser: null,
      lastAiAnalysis: null,
      lastAiAnalysisModel: null,
      isAiLoading: false,
      onlineBrainMode: true,
      chatHistory: [],
      setOnlineBrainMode: (mode) => set({ onlineBrainMode: mode }),
      clearChat: () => set({ chatHistory: [] }),
      shoppingListOpen: false,
      setShoppingListOpen: (open) => set({ shoppingListOpen: open }),
      notifOpen: false,
      setNotifOpen: (open) => set({ notifOpen: open }),
      supportOpen: false,
      setSupportOpen: (open) => set({ supportOpen: open }),
      changePinOpen: false,
      setChangePinOpen: (open) => set({ changePinOpen: open }),
      manualOpen: false,
      setManualOpen: (open) => set({ manualOpen: open }),
      devOpen: false,
      setDevOpen: (open) => set({ devOpen: open }),
      tickets: [],
      isLoading: false,
      currentUser: null,
      setCurrentUser: (user) => set({ currentUser: user }),

      fetchAll: async () => {
        const { isLoading } = get();
        if (isLoading) return;
        set({ isLoading: true });
        try {
          await Promise.all([
            get().fetchProducts(),
            get().fetchCatalog(),
            get().fetchProfiles(),
            get().fetchMovements(),
            get().fetchNotifications(),
            get().fetchTickets(),
            get().fetchAppSettings()
          ]);
          set({ lastSync: new Date(), lastOnlineSync: new Date() });
        } catch (error) {
          console.error("Erro na sincronização:", error);
        } finally {
          set({ isLoading: false });
        }
      },

      fetchProducts: async () => {
        try {
          const columns = 'id, sku, name, spec, imei, imei2, brand, category, cost, sale, status, image_url, internal_code, created_at, updated_at';
          const { data, error } = await supabase.from('products').select(columns).order('created_at', { ascending: false }).limit(1000);
          if (error) throw error;
          if (data) set({ products: data as Product[] });
        } catch (error) { console.error(error); }
      },

      fetchProductImage: async (id: string) => {
        try {
          const { data, error } = await supabase.from('products').select('image_url').eq('id', id).single();
          if (error) throw error;
          return data?.image_url || null;
        } catch (error) {
          console.error("Erro ao buscar imagem do produto:", error);
          return null;
        }
      },

      fetchCatalog: async () => {
        try {
          const currentUser = get().currentUser;
          const clientId = currentUser?.client_id || '777c9731-88d5-487d-969f-4c26228c34d6';
          const columns = 'sku, name, spec, image_url, cost, sale, client_id, internal_code, last_updated';
          const { data, error } = await supabase
            .from('product_catalog')
            .select(columns)
            .eq('client_id', clientId);
          if (error) throw error;
          if (data) set({ catalog: data as CatalogItem[] });
        } catch (error) { 
          console.error("❌ [Store] Erro ao buscar catálogo:", error);
        }
      },

      fetchCatalogImage: async (sku: string) => {
        try {
          const { data, error } = await supabase.from('product_catalog').select('image_url').eq('sku', sku).single();
          if (error) throw error;
          return data?.image_url || null;
        } catch (error) {
          console.error("Erro ao buscar imagem do catálogo:", error);
          return null;
        }
      },

      addToCatalog: async (newItem) => {
        const { catalog } = get();
        const currentUser = get().currentUser;
        const clientId = currentUser?.client_id || '777c9731-88d5-487d-969f-4c26228c34d6';
        const updatedItem = { ...newItem, client_id: clientId, last_updated: new Date().toISOString() };
        
        const exists = catalog.find(c => c.sku === newItem.sku);
        if (exists && exists.name === newItem.name) return;

        set((state) => ({
          catalog: exists 
            ? state.catalog.map(c => c.sku === newItem.sku ? updatedItem : c)
            : [...state.catalog, updatedItem as CatalogItem]
        }));

        try {
          await supabase.from('product_catalog').upsert(updatedItem);
        } catch (error) {
          console.warn("Erro ao sincronizar catálogo com Supabase (offline?):", error);
        }
      },

      updateCatalogItem: async (sku, updates) => {
        try {
          const currentUser = get().currentUser;
          const clientId = currentUser?.client_id || '777c9731-88d5-487d-969f-4c26228c34d6';
          const updatedItem = { sku, ...updates, client_id: clientId, last_updated: new Date().toISOString() };
          
          // 1. Atualizar o Catálogo Inteligente
          const { error } = await supabase
            .from('product_catalog')
            .upsert(updatedItem);
          
          if (error) throw error;

          // 2. PROPAGAÇÃO: Sobrepor informações em todos os produtos do estoque com este SKU
          // Filtramos apenas os campos que existem na tabela 'products'
          const productUpdates: any = { updated_at: new Date().toISOString() };
          if (updates.name) productUpdates.name = updates.name;
          if (updates.image_url !== undefined) productUpdates.image_url = updates.image_url;
          if (updates.cost !== undefined) productUpdates.cost = updates.cost;
          if (updates.sale !== undefined) productUpdates.sale = updates.sale;
          if (updates.spec !== undefined) productUpdates.spec = updates.spec;
          if (updates.internal_code !== undefined) productUpdates.internal_code = updates.internal_code;

          const { error: pError } = await supabase
            .from('products')
            .update(productUpdates)
            .eq('sku', sku)
            .eq('status', 'in_stock');
          
          if (pError) console.warn("Aviso: Falha parcial na propagação para o estoque:", pError);
          
          set((state) => {
            const exists = state.catalog.find(c => c.sku === sku);
            const newCatalog = exists 
                ? state.catalog.map(c => c.sku === sku ? { ...c, ...updates, last_updated: new Date().toISOString() } : c)
                : [...state.catalog, updatedItem as CatalogItem];
            
            // Atualizar estado local dos produtos para refletir a sobreposição imediatamente
            const newProducts = state.products.map(p => 
              (p.sku === sku && p.status === 'in_stock') 
                ? { ...p, ...productUpdates } 
                : p
            );

            return {
              catalog: newCatalog,
              products: newProducts
            };
          });
          
          toast.success("CATÁLOGO E ESTOQUE SINCRONIZADOS");
        } catch (error) {
          console.error("Erro ao atualizar catálogo:", error);
          toast.error("FALHA NA SINCRONIZAÇÃO");
          throw error;
        }
      },

      remapCatalogItem: async (oldSku, newSku) => {
        try {
          const { catalog, currentUser } = get();
          const cleanOld = oldSku.trim();
          const cleanNew = newSku.trim();
          
          if (cleanOld === cleanNew) return;

          const oldItem = catalog.find(c => c.sku === cleanOld);
          if (!oldItem) throw new Error("Item de origem não encontrado");

          const clientId = currentUser?.client_id || '777c9731-88d5-487d-969f-4c26228c34d6';
          
          // 1. Criar novo item no catálogo com o novo SKU
          const newItem = { ...oldItem, sku: cleanNew, last_updated: new Date().toISOString() };
          const { error: insError } = await supabase.from('product_catalog').upsert(newItem);
          if (insError) throw insError;

          // 2. Atualizar todos os produtos vinculados ao SKU antigo
          const { error: pError } = await supabase
            .from('products')
            .update({ sku: cleanNew, updated_at: new Date().toISOString() })
            .eq('sku', cleanOld);
          
          if (pError) console.warn("Erro parcial na atualização de produtos:", pError);

          // 3. Deletar SKU antigo do catálogo
          const { error: delError } = await supabase
            .from('product_catalog')
            .delete()
            .eq('sku', cleanOld)
            .eq('client_id', clientId);
          
          if (delError) console.warn("Erro ao deletar SKU antigo:", delError);

          // 4. Atualizar estado local
          set((state) => ({
            catalog: state.catalog
              .filter(c => c.sku !== cleanOld)
              .concat(newItem as CatalogItem),
            products: state.products.map(p => p.sku === cleanOld ? { ...p, sku: cleanNew } : p)
          }));

          toast.success("SKU REMAPEADO COM SUCESSO");
        } catch (error) {
          console.error("Erro ao remapear SKU:", error);
          toast.error("FALHA AO REMAPEAR SKU");
          throw error;
        }
      },


      fetchProfiles: async () => {
        try {
          console.log("🌐 [Store] Buscando perfis...");
          const { data, error } = await supabase.from('profiles').select('*');
          if (error) {
            console.error("❌ [Store] Erro ao buscar perfis:", {
              code: error.code,
              message: error.message,
              details: error.details
            });
            throw error;
          }
          if (data) {
            console.log(`✅ [Store] ${data.length} perfis carregados.`);
            set({ profiles: data });
          }
        } catch (error) { 
          console.error("🚨 [Store] Erro crítico ao buscar perfis:", error); 
        }
      },

      fetchMovements: async () => {
        try {
          // Otimização: Limitamos os campos do produto para evitar carregar base64 pesada
          const { data, error } = await supabase
            .from('movements')
            .select('*, product:products(id, name, sku, image_url), operator:profiles(*)')
            .order('timestamp', { ascending: false })
            .limit(100);
          if (error) throw error;
          if (data) set({ movements: data as Movement[] });
        } catch (error) { console.error(error); }
      },

      fetchNotifications: async () => {
        try {
          const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
          if (error) throw error;
          if (data) set({ notifications: data });
        } catch (error) { console.error(error); }
      },

      fetchTickets: async () => {
        try {
          const { data, error } = await supabase.from('support_tickets').select('*, user:profiles(*)').order('created_at', { ascending: false });
          if (error) throw error;
          if (data) set({ tickets: data });
        } catch (error) { console.error(error); }
      },

      fetchAppSettings: async () => {
        try {
          const { data, error } = await supabase.from('app_settings').select('key, value');
          if (error) throw error;
          if (data) {
            const settings = data.reduce((acc, item) => ({ ...acc, [item.key]: item.value }), {});
            set({ appSettings: settings });
          }
        } catch (error) { console.error(error); }
      },

      updateAppSetting: async (key, value) => {
        try {
          const { error } = await supabase.from('app_settings').upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
          if (error) throw error;
          set((state) => ({ appSettings: { ...state.appSettings, [key]: value } }));
        } catch (error) { console.error(error); throw error; }
      },

      addProduct: async (newProduct) => {
        try {
          const { quantity: rawQty, ...productData } = newProduct;
          const quantity = Number(rawQty) || 1;
          const currentUser = get().currentUser;
          const clientId = currentUser?.client_id || '777c9731-88d5-487d-969f-4c26228c34d6';
          
          // INTELLIGENCE FALLBACK: Se o SKU existe no catálogo, puxar dados faltantes
          if (productData.sku) {
            const cleanSku = productData.sku.trim();
            const catalogItem = get().catalog.find(c => c.sku.trim() === cleanSku);
            if (catalogItem) {
              if (!productData.name || productData.name === 'IDENTIFICANDO...') productData.name = catalogItem.name;
              if (!productData.image_url) productData.image_url = catalogItem.image_url;
              if (!productData.cost || productData.cost === 0) productData.cost = catalogItem.cost || 0;
              if (!productData.sale || productData.sale === 0) productData.sale = catalogItem.sale || 0;
              if (!productData.spec) productData.spec = catalogItem.spec;
            }
          }
          
          const productsToInsert = Array.from({ length: quantity }).map((_, i) => ({
            ...productData,
            status: 'in_stock',
            client_id: clientId,
            imei: i === 0 ? (productData.imei?.trim() || null) : null,
            imei2: i === 0 ? (productData.imei2?.trim() || null) : null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));

          console.log(`📦 [Store] Inserindo ${quantity} produtos...`, productsToInsert[0]);
          const { data, error } = await supabase.from('products').insert(productsToInsert).select();
          
          if (error) {
            console.error("❌ [Store] Erro ao inserir produtos:", error);
            throw error;
          }

          if (data) {
            console.log(`✅ [Store] ${data.length} produtos inseridos. Criando movimentações...`);
            const movementPromises = data.map((p) => 
              get().addMovement({
                product_id: p.id,
                operator_id: currentUser?.id || null,
                type: 'in',
                notes: `Entrada: ${p.name}`
              })
            );
            await Promise.all(movementPromises);
            
            if (productData.sku) {
              await get().addToCatalog({
                sku: productData.sku,
                name: productData.name,
                spec: productData.spec,
                image_url: productData.image_url,
                cost: productData.cost,
                sale: productData.sale
              });
            }

            set((state) => ({ products: [...data, ...state.products] }));
            toast.success("Estoque atualizado.");
          }
          await get().fetchAll();
        } catch (error: any) { 
          console.error("🚨 [Store] Falha fatal no addProduct:", error);
          toast.error(`Erro ao adicionar: ${error.message || "Verifique o console"}`); 
        }
      },

      addMovement: async (newMovement) => {
        try {
          const clientId = get().currentUser?.client_id || '777c9731-88d5-487d-969f-4c26228c34d6';
          const { data, error } = await supabase.from('movements').insert([{ ...newMovement, client_id: clientId }]).select('*, product:products(*), operator:profiles(*)').single();
          if (error) {
            console.error("❌ [Store] Erro ao adicionar movimentação:", error);
            throw error;
          }
          if (data) {
            set((state) => ({ movements: [data, ...state.movements] }));
            get().addNotification({
              title: newMovement.type === 'in' ? "Entrada" : "Saída",
              body: `Movimentação registrada.`,
              tone: newMovement.type === 'in' ? "success" : "danger"
            });
          }
        } catch (error) { console.error("🚨 [Store] Erro no addMovement:", error); }
      },

      bulkAddMovements: async (movements, isBulk = false) => {
        try {
          const clientId = get().currentUser?.client_id || '777c9731-88d5-487d-969f-4c26228c34d6';
          const movementsWithClient = movements.map(m => ({ ...m, client_id: clientId }));
          
          // Otimização: Se for em lote, não fazemos select pesado com joins
          const query = supabase.from('movements').insert(movementsWithClient);
          
          if (isBulk) {
            const { error } = await query;
            if (error) throw error;
          } else {
            const { data, error } = await query.select('*, product:products(*), operator:profiles(*)');
            if (error) throw error;
            if (data) {
              set((state) => ({ movements: [...data, ...state.movements] }));
            }
          }
        } catch (error) {
          console.error("🚨 [Store] Erro no bulkAddMovements:", error);
          throw error;
        }
      },

      updateProduct: async (id, updates) => {
        try {
          const { error } = await supabase.from('products').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
          if (error) throw error;
          
          const currentProduct = get().products.find(p => p.id === id);
          const finalSku = updates.sku || currentProduct?.sku;

          // Se houver alteração em metadados vitais, sincronizar com o catálogo (que por sua vez propaga para o resto do estoque)
          if (finalSku && (updates.name || updates.cost !== undefined || updates.sale !== undefined || updates.image_url !== undefined)) {
            await get().updateCatalogItem(finalSku, {
              name: updates.name || currentProduct?.name,
              cost: updates.cost !== undefined ? updates.cost : currentProduct?.cost,
              sale: updates.sale !== undefined ? updates.sale : currentProduct?.sale,
              image_url: updates.image_url !== undefined ? updates.image_url : currentProduct?.image_url,
              spec: updates.spec !== undefined ? updates.spec : currentProduct?.spec,
            });
          }

          set((state) => ({ products: state.products.map((p) => (p.id === id ? { ...p, ...updates } : p)) }));
        } catch (error) { console.error(error); throw error; }
      },

      updateProductsBulk: async (ids, updates) => {
        try {
          const { error } = await supabase
            .from('products')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .in('id', ids);
          
          if (error) throw error;

          // Se for uma atualização em lote de metadados, sincronizar o primeiro SKU encontrado (assumindo que o lote é do mesmo produto)
          const firstProd = get().products.find(p => ids.includes(p.id));
          const finalSku = updates.sku || firstProd?.sku;
          
          if (finalSku && (updates.name || updates.cost !== undefined || updates.sale !== undefined || updates.image_url !== undefined)) {
            await get().updateCatalogItem(finalSku, {
              name: updates.name || firstProd?.name,
              cost: updates.cost !== undefined ? updates.cost : firstProd?.cost,
              sale: updates.sale !== undefined ? updates.sale : firstProd?.sale,
              image_url: updates.image_url !== undefined ? updates.image_url : firstProd?.image_url,
              spec: updates.spec !== undefined ? updates.spec : firstProd?.spec,
            });
          }
          
          set((state) => ({ 
            products: state.products.map((p) => ids.includes(p.id) ? { ...p, ...updates } : p) 
          }));
        } catch (error) { console.error(error); throw error; }
      },

      deleteProduct: async (id) => {
        try {
          const { error } = await supabase.from('products').delete().eq('id', id);
          if (error) throw error;
          set((state) => ({ products: state.products.filter(p => p.id !== id) }));
        } catch (error) { console.error(error); throw error; }
      },

      deleteProductsBulk: async (ids) => {
        try {
          const { error } = await supabase.from('products').delete().in('id', ids);
          if (error) throw error;
          set((state) => ({ 
            products: state.products.filter(p => !ids.includes(p.id)) 
          }));
        } catch (error) { console.error(error); throw error; }
      },

      fetchProductHistoricalPrices: async (sku) => {
        try {
          const { data, error } = await supabase
            .from('products')
            .select('cost, sale')
            .eq('sku', sku)
            .order('created_at', { ascending: false })
            .limit(1);
          
          if (error) throw error;
          return data && data.length > 0 ? { cost: data[0].cost, sale: data[0].sale } : null;
        } catch (error) {
          console.error("Erro ao buscar preços históricos:", error);
          return null;
        }
      },

      bulkAddProducts: async (productsList) => {
        set({ isLoading: true });
        try {
          const currentUser = get().currentUser;
          const clientId = currentUser?.client_id || '777c9731-88d5-487d-969f-4c26228c34d6';
          
          const allProductsToInsert: any[] = [];
          const catalogToUpsert: Map<string, any> = new Map();

          productsList.forEach(item => {
            const qty = Number(item.quantity) || 1;
            
            const cleanProduct = {
              sku: item.sku?.trim() || null,
              name: item.name || 'Produto Sem Nome',
              spec: item.spec || 'Padrão',
              brand: item.brand || null,
              category: item.category || null,
              cost: Number(item.cost) || 0,
              sale: Number(item.sale) || 0,
              status: 'in_stock', // Forçar entrada como 'em estoque' para visibilidade imediata no dashboard
              image_url: item.image_url || null,
              client_id: clientId
            };
            
            // INTELLIGENCE FALLBACK: Se o SKU existe no catálogo, puxar dados faltantes
            if (cleanProduct.sku) {
              const catalogItem = get().catalog.find(c => c.sku.trim() === cleanProduct.sku);
              if (catalogItem) {
                if (!cleanProduct.name || cleanProduct.name === 'IDENTIFICANDO...') cleanProduct.name = catalogItem.name;
                if (!cleanProduct.image_url) cleanProduct.image_url = catalogItem.image_url;
                if (!cleanProduct.cost || cleanProduct.cost === 0) cleanProduct.cost = catalogItem.cost || 0;
                if (!cleanProduct.sale || cleanProduct.sale === 0) cleanProduct.sale = catalogItem.sale || 0;
              }
              
              catalogToUpsert.set(cleanProduct.sku, {
                sku: cleanProduct.sku,
                name: cleanProduct.name,
                spec: cleanProduct.spec,
                image_url: cleanProduct.image_url,
                cost: cleanProduct.cost,
                sale: cleanProduct.sale,
                client_id: clientId
              });
            }

            for (let i = 0; i < qty; i++) {
              allProductsToInsert.push({
                ...cleanProduct,
                imei: i === 0 ? (item.imei?.trim() || null) : null,
                imei2: i === 0 ? (item.imei2?.trim() || null) : null,
                // Removido criacao manual de timestamp para evitar conflitos/timeouts
              });
            }
          });

          // ESTRATÉGIA DE CHUNKING (Fracionamento)
          const CHUNK_SIZE = 20;
          const insertedProducts: any[] = [];

          for (let i = 0; i < allProductsToInsert.length; i += CHUNK_SIZE) {
            const chunk = allProductsToInsert.slice(i, i + CHUNK_SIZE);
            const { data, error } = await supabase.from('products').insert(chunk).select();
            if (error) {
              console.error(`Erro ao inserir chunk de produtos (${i}-${i+CHUNK_SIZE}):`, error);
              throw error;
            }
            if (data) insertedProducts.push(...data);
          }

          if (insertedProducts.length > 0) {
            // 2. Movimentações em Lote Fracionadas
            const movements = insertedProducts.map(p => ({
              product_id: p.id,
              operator_id: currentUser?.id || null,
              type: 'in',
              notes: `Entrada em Lote: ${p.name}`
            }));

            for (let i = 0; i < movements.length; i += CHUNK_SIZE) {
              const chunk = movements.slice(i, i + CHUNK_SIZE);
              await get().bulkAddMovements(chunk, true); // true = isBulk
            }

            // 3. Catálogo em Lote (Upsert)
            const catalogItems = Array.from(catalogToUpsert.values());
            if (catalogItems.length > 0) {
              const { error: catError } = await supabase
                .from('product_catalog')
                .upsert(catalogItems, { onConflict: 'sku,client_id' });
              if (catError) console.warn("Aviso: Falha ao atualizar catálogo em lote:", catError);
            }

            // 4. Notificações
            await supabase.from('notifications').insert([{
              title: "Registro em Lote",
              body: `${insertedProducts.length} itens registrados via Tactical Hub.`,
              tone: "success",
              client_id: clientId
            }]);

            toast.success(`${insertedProducts.length} itens registrados com sucesso!`);
          }
          
          await get().fetchAll();
        } catch (error: any) {
          console.error("Erro no bulkAddProducts:", error);
          toast.error(`Erro no lote: ${error.message}`);
          throw error; // Re-throw para o RegisterView capturar
        } finally {
          set({ isLoading: false });
        }
      },

      updateProfile: async (id, updates) => {
        try {
          const { error } = await supabase.from("profiles").update(updates).eq("id", id);
          if (error) throw error;
          set((state) => ({
            profiles: state.profiles.map((p) => (p.id === id ? { ...p, ...updates } : p)),
            currentUser: state.currentUser?.id === id ? { ...state.currentUser, ...updates } : state.currentUser
          }));
        } catch (error) { console.error(error); throw error; }
      },

      addProfile: async (newProfile) => {
        try {
          const { data, error } = await supabase.functions.invoke('manage-team', {
            body: { action: 'create', userData: { ...newProfile, client_id: get().currentUser?.client_id } }
          });
          if (error || data?.error) throw error || new Error(data.error);
          toast.success("Membro adicionado.");
          await get().fetchProfiles();
        } catch (error) { toast.error("Erro ao adicionar perfil."); }
      },

      removeProfile: async (id) => {
        try {
          const { error } = await supabase.from('profiles').delete().eq('id', id);
          if (error) throw error;
          set((state) => ({ profiles: state.profiles.filter(p => p.id !== id) }));
        } catch (error) { console.error(error); }
      },

      addNotification: async (notif) => {
        try {
          const { data, error } = await supabase.from('notifications').insert([{ ...notif, read: false }]).select().single();
          if (error) throw error;
          if (data) set((state) => ({ notifications: [data, ...state.notifications] }));
        } catch (error) { console.error(error); }
      },

      markAllNotificationsRead: async () => {
        try {
          await supabase.from('notifications').update({ read: true }).eq('read', false);
          set((state) => ({ notifications: state.notifications.map(n => ({ ...n, read: true })) }));
        } catch (error) { console.error(error); }
      },

      clearNotifications: async () => {
        try {
          await supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          set({ notifications: [] });
        } catch (error) { console.error(error); }
      },

      addTicket: async (newTicket) => {
        try {
          const { data, error } = await supabase.from('support_tickets').insert([{ ...newTicket, status: 'open' }]).select('*, user:profiles(*)').single();
          if (error) throw error;
          if (data) set((state) => ({ tickets: [data, ...state.tickets] }));
        } catch (error) { console.error(error); }
      },

      updateTicket: async (id, updates) => {
        try {
          const { data, error } = await supabase.from('support_tickets').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select('*, user:profiles(*)').single();
          if (error) throw error;
          if (data) set((state) => ({ tickets: state.tickets.map(t => t.id === id ? data : t) }));
        } catch (error) { console.error(error); }
      },

      clearCache: () => {
        localStorage.removeItem('victors-smart-storage');
        window.location.reload();
      },

      purgeSystem: async () => {
        const { currentUser } = get();
        if (!currentUser?.client_id) {
          throw new Error("Identificador do cliente não encontrado.");
        }

        try {
          // 1. Delete dependencies first (Movements depend on Products)
          const { error: mError } = await supabase
            .from('movements')
            .delete()
            .eq('client_id', currentUser.client_id);
          
          if (mError) throw mError;

          // 2. Delete products and notifications
          const results = await Promise.all([
            supabase.from('products').delete().eq('client_id', currentUser.client_id),
            supabase.from('notifications').delete().eq('client_id', currentUser.client_id),
            supabase.from('support_tickets').delete().eq('client_id', currentUser.client_id)
          ]);

          const errors = results.filter(r => r.error);
          if (errors.length > 0) throw errors[0].error;

          localStorage.removeItem('victors-smart-storage');
          window.location.reload();
        } catch (error) { 
          console.error("Purge Error:", error);
          throw error; // Re-throw to allow UI to catch it
        }
      },

      purgeCatalog: async () => {
        const currentUser = get().currentUser;
        if (!currentUser) return;
        try {
          const { error } = await supabase
            .from('product_catalog')
            .delete()
            .neq('sku', 'ROOT_SKU_FORCE_DELETE'); // Hack to delete all rows in Supabase without full filter
          
          if (error) throw error;
          set({ catalog: [] });
          toast.success("CATÁLOGO EXPURGADO");
        } catch (error) {
          console.error("Catalog Purge Error:", error);
          throw error;
        }
      },

      reconcileStockAudit: async (auditItems: any[]) => {
        set({ isLoading: true });
        try {
          const currentUser = get().currentUser;
          const clientId = currentUser?.client_id || '777c9731-88d5-487d-969f-4c26228c34d6';
          const currentProducts = get().products.filter(p => p.status === 'in_stock');

          const toAdd: any[] = [];
          const toDeleteIds: string[] = [];

          console.log("🚀 Iniciando Reconciliação Tática em Lote...");

          for (const item of auditItems) {
            // Só reconcilia se o item foi auditado ou tem identificação
            if (!item.isAudited && item.identified === 0 && item.final === item.expected) continue;

            const sku = item.sku;
            const finalQty = item.final;
            
            const existingWithSku = currentProducts.filter(p => p.sku === sku);
            const currentQty = existingWithSku.length;

            if (finalQty > currentQty) {
              const diff = finalQty - currentQty;
              toAdd.push({
                ...item,
                quantity: diff,
                category: existingWithSku[0]?.category || 'Celulares',
                brand: existingWithSku[0]?.brand || null,
              });
            } else if (finalQty < currentQty) {
              const diff = currentQty - finalQty;
              const ids = existingWithSku.slice(0, diff).map(p => p.id);
              toDeleteIds.push(...ids);
            }
          }

          // Executa as operações em lote
          if (toAdd.length > 0) {
            console.log(`➕ Adicionando ${toAdd.length} SKUs em lote...`);
            await get().bulkAddProducts(toAdd);
          }
          
          if (toDeleteIds.length > 0) {
            console.log(`➖ Removendo ${toDeleteIds.length} itens em lote...`);
            await get().deleteProductsBulk(toDeleteIds);
          }
          
          toast.success("ESTOQUE SINCRONIZADO");
          await get().fetchAll();
        } catch (error: any) {
          console.error("Erro na reconciliação:", error);
          toast.error("FALHA NA RECONCILIÇÃO");
        } finally {
          set({ isLoading: false });
        }
      },

      getChartData: () => {
        const { movements } = get();
        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        return Array.from({ length: 15 }).map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (14 - i));
          const dateStr = d.toLocaleDateString();
          const dayMovements = movements.filter(m => new Date(m.timestamp).toLocaleDateString() === dateStr);
          return {
            name: `${d.getDate()}/${d.getMonth() + 1}`,
            in: dayMovements.filter(m => m.type === 'in').length,
            out: dayMovements.filter(m => m.type === 'out').length,
          };
        });
      },

      initRealtimeSubscriptions: () => {
        const channel = supabase.channel('app-changes')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => get().fetchNotifications())
          .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => get().fetchProducts())
          .on('postgres_changes', { event: '*', schema: 'public', table: 'movements' }, () => get().fetchMovements())
          .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, () => get().fetchAppSettings())
          .subscribe();
        return () => { supabase.removeChannel(channel); };
      },

      runPredictiveAnalysis: async () => {
        const { products, movements, onlineBrainMode } = get();
        if (!onlineBrainMode) {
          toast.error("LINK NEURAL OFFLINE", { description: "Ative o modo Online Brain para processar." });
          return;
        }
        
        set({ isAiLoading: true });
        console.log("🧠 Iniciando análise preditiva...");
        
        try {
          const inStock = products.filter(p => p.status === 'in_stock');
          const data = {
            inventorySummary: inStock.reduce((acc: any, p) => {
              const name = p.name || 'Produto Sem Nome';
              if (!acc[name]) acc[name] = { qtd: 0, costo: p.cost };
              acc[name].qtd += 1;
              return acc;
            }, {}),
            movements: movements.slice(0, 15).map(m => ({ 
              type: m.type, 
              item: m.product?.name || 'Item Desconhecido',
              time: m.timestamp 
            })),
            totalValue: inStock.reduce((sum, p) => sum + (p.cost || 0), 0)
          };
          
          const { aiService } = await import('@/services/aiService');
          const analysis = await aiService.getPredictiveAnalysis(data);
          
          if (!analysis || !analysis.text) {
            throw new Error("O Cérebro retornou uma resposta vazia.");
          }

          set({ 
            lastAiAnalysis: analysis.text,
            lastAiAnalysisModel: analysis.modelUsed || 'AI-CORE-3.1'
          });
          
          console.log("✅ Análise concluída:", analysis.modelUsed);
        } catch (error: any) { 
          console.error("❌ Erro no runPredictiveAnalysis:", error); 
          toast.error("FALHA NA CONEXÃO NEURAL", { description: error.message || "Erro desconhecido" });
          // Não resetamos o lastAiAnalysis para manter o que estava antes se houver erro
        } finally { 
          set({ isAiLoading: false }); 
        }
      },

      getStrategicContext: () => {
        const { products, movements, profiles, currentUser, appSettings } = get();
        const inStock = products.filter(p => p.status === 'in_stock');
        return {
          user_atual: { nome: currentUser?.full_name, role: currentUser?.role, bio: currentUser?.bio },
          equipe: profiles.map(p => ({ nome: p.full_name, role: p.role, bio: p.bio })),
          estoque: inStock.map(p => ({ nome: p.name, imei: p.imei, cost: p.cost })),
          movimentacoes_recentes: movements.slice(0, 10).map(m => ({ tipo: m.type, item: m.product?.name, quem: m.operator?.full_name })),
          configuracoes: appSettings
        };
      },

      sendChatMessage: async (msg) => {
        const { chatHistory } = get();
        if (!msg.trim()) return;
        set({ chatHistory: [...chatHistory, { role: 'user' as const, content: msg }], isAiLoading: true });
        try {
          const { aiService } = await import('@/services/aiService');
          const context = get().getStrategicContext();
          const response = await aiService.chat(msg, chatHistory.slice(-10), context);
          set((state) => ({ 
            chatHistory: [...state.chatHistory, { 
              role: 'model' as const, content: response.text, meta: { model: response.model, time: response.time } 
            }].slice(-20) // Keep only last 20 messages
          }));
        } catch (error) { console.error(error); } finally { set({ isAiLoading: false }); }
      }
    }),
    {
      name: 'victors-smart-storage',
      partialize: (state) => ({
        currentUser: state.currentUser,
        // Strip heavy image_url from catalog for persistence to stay under 5MB limit
        catalog: state.catalog?.map(({ image_url, ...rest }) => rest) || [],
        products: state.products || [],
        profiles: state.profiles || [],
        movements: state.movements || [],
        appSettings: state.appSettings,
        onlineBrainMode: state.onlineBrainMode,
        chatHistory: state.chatHistory?.slice(-20) || [], // Truncate chat history
        lastAiAnalysis: state.lastAiAnalysis,
        lastAiAnalysisModel: state.lastAiAnalysisModel,
      }),
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          try {
            return JSON.parse(str);
          } catch {
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, JSON.stringify(value));
          } catch (error) {
            if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
              console.error("🚨 [Storage] Quota exceeded. Pruning cache...");
              // Emergency Pruning
              const state = value.state;
              if (state) {
                state.chatHistory = []; // Clear chat
                state.lastAiAnalysis = null; // Clear heavy AI analysis
                // Clear catalog if still failing (will be refetched from Supabase)
                try {
                  localStorage.setItem(name, JSON.stringify({ ...value, state }));
                  window.location.reload(); // Reload to start fresh with pruned state
                } catch (retryError) {
                  console.error("🚨 [Storage] Fatal: Could not prune enough space.");
                  localStorage.removeItem(name);
                }
              }
            }
          }
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
