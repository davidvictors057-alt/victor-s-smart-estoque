import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface Product {
  id: string;
  sku: string | null;
  name: string;
  spec: string | null;
  imei: string;
  brand: string | null;
  category: string | null;
  cost: number;
  sale: number;
  status: 'in_stock' | 'sold' | 'reserved' | 'repair';
  image_url: string | null;
  created_at: string;
  updated_at: string;
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
  deleteProduct: (id: string) => Promise<void>;
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
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      products: [],
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
          
          const productsToInsert = Array.from({ length: quantity }).map((_, i) => ({
            ...productData,
            status: 'in_stock',
            client_id: clientId,
            imei: i === 0 ? (productData.imei?.trim() || null) : null,
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
          set((state) => ({ products: state.products.map((p) => (p.id === id ? { ...p, ...updates } : p)) }));
        } catch (error) { console.error(error); throw error; }
      },

      deleteProduct: async (id) => {
        try {
          const { error } = await supabase.from('products').delete().eq('id', id);
          if (error) throw error;
          set((state) => ({ products: state.products.filter(p => p.id !== id) }));
        } catch (error) { console.error(error); throw error; }
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
        appSettings: state.appSettings,
        onlineBrainMode: state.onlineBrainMode,
        chatHistory: state.chatHistory,
        lastAiAnalysis: state.lastAiAnalysis,
      }),
    }
  )
);
