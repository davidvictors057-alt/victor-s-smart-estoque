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
  last_updated: string;
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
  fetchProductHistoricalPrices: (sku: string) => Promise<{ cost: number; sale: number } | null>;
  bulkAddProducts: (products: any[]) => Promise<void>;
  purgeSystem: () => Promise<void>;
  getChartData: () => { name: string; in: number; out: number }[];
  lastOnlineSync: Date | null;
  lastAiAnalysis: string | null;
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
          const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
          if (error) throw error;
          if (data) set({ products: data });
        } catch (error) { console.error(error); }
      },

      fetchCatalog: async () => {
        try {
          const currentUser = get().currentUser;
          const clientId = currentUser?.client_id || '777c9731-88d5-487d-969f-4c26228c34d6';
          const { data, error } = await supabase.from('product_catalog').select('*').eq('client_id', clientId);
          if (error) {
            console.warn("Tabela product_catalog não encontrada no Supabase. Usando apenas cache local.");
            return;
          }
          if (data) set({ catalog: data });
        } catch (error) { console.error("Erro ao buscar catálogo:", error); }
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


      fetchProfiles: async () => {
        try {
          const { data, error } = await supabase.from('profiles').select('*');
          if (error) throw error;
          if (data) set({ profiles: data });
        } catch (error) { console.error(error); }
      },

      fetchMovements: async () => {
        try {
          const { data, error } = await supabase.from('movements').select('*, product:products(*), operator:profiles(*)').order('timestamp', { ascending: false });
          if (error) throw error;
          if (data) set({ movements: data });
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
          
          // Flatten products based on quantity
          const allProductsToInsert: any[] = [];
          productsList.forEach(item => {
            const qty = Number(item.quantity) || 1;
            
            // FILTRAGEM RIGOROSA: Extrair apenas campos que existem na tabela 'products'
            const cleanProduct = {
              sku: item.sku?.trim() || null,
              name: item.name,
              spec: item.spec || null,
              brand: item.brand || null,
              category: item.category || null,
              cost: Number(item.cost) || 0,
              sale: Number(item.sale) || 0,
              status: item.status || 'in_stock',
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
                if (!cleanProduct.spec) cleanProduct.spec = catalogItem.spec || null;
              }
            }

            for (let i = 0; i < qty; i++) {
              allProductsToInsert.push({
                ...cleanProduct,
                imei: i === 0 ? (item.imei?.trim() || null) : null,
                imei2: i === 0 ? (item.imei2?.trim() || null) : null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
            }
          });

          const { data, error } = await supabase.from('products').insert(allProductsToInsert).select();
          if (error) throw error;

          if (data) {
            const movementPromises = data.map((p) => 
              get().addMovement({
                product_id: p.id,
                operator_id: currentUser?.id || null,
                type: 'in',
                notes: `Entrada em Lote: ${p.name}`
              })
            );
            await Promise.all(movementPromises);

            // --- SINCRONIZAÇÃO EM LOTE COM CATÁLOGO ---
            const catalogPromises = productsList
              .filter(p => p.sku)
              .map(p => get().addToCatalog({
                sku: p.sku!,
                name: p.name,
                spec: p.spec,
                image_url: p.image_url,
                cost: p.cost,
                sale: p.sale
              }));
            await Promise.all(catalogPromises);

            toast.success(`${data.length} itens registrados com sucesso!`);
          }
          await get().fetchAll();
        } catch (error: any) {
          console.error("Erro no bulkAddProducts:", error);
          toast.error(`Erro no lote: ${error.message}`);
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
        if (!onlineBrainMode) return;
        set({ isAiLoading: true });
        try {
          const inStock = products.filter(p => p.status === 'in_stock');
          const data = {
            inventorySummary: inStock.reduce((acc: any, p) => {
              if (!acc[p.name]) acc[p.name] = { qtd: 0, costo: p.cost };
              acc[p.name].qtd += 1;
              return acc;
            }, {}),
            movements: movements.slice(0, 10).map(m => ({ type: m.type, item: m.product?.name }))
          };
          const { aiService } = await import('@/services/aiService');
          const analysis = await aiService.getPredictiveAnalysis(data);
          set({ lastAiAnalysis: analysis });
        } catch (error) { console.error(error); } finally { set({ isAiLoading: false }); }
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
        set({ chatHistory: [...chatHistory, { role: 'user', content: msg }], isAiLoading: true });
        try {
          const { aiService } = await import('@/services/aiService');
          const context = get().getStrategicContext();
          const response = await aiService.chat(msg, chatHistory.slice(-10), context);
          set((state) => ({ 
            chatHistory: [...state.chatHistory, { 
              role: 'model', content: response.text, meta: { model: response.model, time: response.time } 
            }] 
          }));
        } catch (error) { console.error(error); } finally { set({ isAiLoading: false }); }
      }
    }),
    {
      name: 'victors-smart-storage',
      partialize: (state) => ({
        currentUser: state.currentUser,
        catalog: state.catalog,
        appSettings: state.appSettings,
        onlineBrainMode: state.onlineBrainMode,
        chatHistory: state.chatHistory,
        lastAiAnalysis: state.lastAiAnalysis,
      }),
    }
  )
);
