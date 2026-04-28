import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Users as UsersIcon, UserPlus, Search, TrendingUp, Award, Clock, Trash2, X, ShieldCheck, ShieldAlert, Edit3 } from "lucide-react";

import { useStore } from "@/store/useStore";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";

export const UsersView = () => {
  const { profiles, movements, addProfile, removeProfile, updateProfile, currentUser } = useStore();
  const { role: currentUserRole } = useApp();
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newProfile, setNewProfile] = useState<{
    full_name: string;
    email: string;
    role: 'admin' | 'operator';
    pin: string;
  }>({ full_name: '', email: '', role: 'operator', pin: '' });
  const [isAdding, setIsAdding] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(0);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [tempScore, setTempScore] = useState(5.0);
  const [tempShift, setTempShift] = useState('Integral');

  const AVATAR_OPTIONS = (() => {
    const avatars = [];
    const skinWhite = 'ffdbb4';
    const skinPale = 'edb98a';
    const skinTan = 'f8d25c';
    const skinBlack = '614335';
    const skinBrown = 'ae5d29';
    const hairBlack = '2c1b18';

    // Mulheres
    const wTops = ['straight01', 'straight02', 'curvy', 'bigHair', 'longButNotTooLong', 'bob', 'bun', 'miaWallace'];
    for (let i = 0; i < 80; i++) {
      const skin = i % 15 === 0 ? skinBlack : (i % 3 === 0 ? skinTan : skinWhite);
      avatars.push({ id: `w_${i}`, url: `https://api.dicebear.com/7.x/avataaars/svg?seed=w_${i}&top=${wTops[i % wTops.length]}&hairColor=${hairBlack}&skinColor=${skin}&clothing=overall&clothesColor=262e33` });
    }

    // Homens
    const mTops = ['shortFlat', 'shortWaved', 'theCaesar', 'shortCurly', 'shaggy', 'frizzle', 'dreads01'];
    const beards = ['beardLight', 'beardMedium', 'beardMajestic'];
    for (let i = 0; i < 80; i++) {
      const skin = i % 15 === 0 ? skinBlack : (i % 3 === 0 ? skinTan : skinWhite);
      avatars.push({ id: `m_${i}`, url: `https://api.dicebear.com/7.x/avataaars/svg?seed=m_${i}&top=${mTops[i % mTops.length]}&hairColor=${hairBlack}&facialHair=${beards[i % beards.length]}&skinColor=${skin}&clothing=hoodie&clothesColor=262e33` });
    }
    return avatars;
  })();

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newProfile.full_name && newProfile.pin.length === 6) {
      setIsAdding(true);
      try {
        await addProfile({
          full_name: newProfile.full_name,
          email: newProfile.email,
          role: newProfile.role,
          pin: newProfile.pin,
          avatar_url: AVATAR_OPTIONS[selectedAvatar].url,
          status: 'offline',
          phone: null,
          bio: null,
          accent_color: '#3b82f6',
          theme_style: 'dark',
          client_id: null,
        });
        setIsAddOpen(false);
        setNewProfile({ full_name: '', email: '', role: 'operator', pin: '' });
      } finally {
        setIsAdding(false);
      }
    }
  };

  const handleRoleToggle = async (userId: string, currentRole: string) => {
    if (userId === currentUser?.id) {
      toast.error("AUTO-REBAIXAMENTO NEGADO", {
        description: "Você não pode remover seu próprio acesso administrativo."
      });
      return;
    }

    const newRole = currentRole === 'Admin' ? 'operator' : 'admin';
    const action = newRole === 'admin' ? 'PROMOVIDO A ADMIN' : 'REBAIXADO A OPERADOR';
    
    try {
      await updateProfile(userId, { role: newRole });
      toast.success(action, {
        description: `As permissões de acesso foram atualizadas.`
      });
    } catch (err) {
      toast.error("ERRO NA OPERAÇÃO", {
        description: "Não foi possível atualizar a patente."
      });
    }
  };
  
  // To avoid breaking the UI, we map the DB profiles to the format expected by the view.
  // We filter out 'Carol Silva' as requested to keep her hidden from this specific view.
  const users = profiles
    .filter(p => p.full_name !== 'Carol Silva')
    .map(p => ({
      id: p.id,
      name: p.full_name,
      role: p.role === 'admin' ? 'Admin' : 'Operador',
      score: p.score ?? 5.0,
      shift: p.shift ?? 'Integral',
      avatar: p.avatar_url?.startsWith('http') 
        ? p.avatar_url 
        : `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.avatar_url || p.full_name}${p.full_name === "Raul Seixas" ? "&skinColor=9e5622" : ""}`,
      status: p.status === 'online' ? 'ONLINE' : 'OFFLINE',
      raw: p
    }));

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile) return;
    try {
      await updateProfile(editingProfile.id, { 
        score: tempScore, 
        shift: tempShift 
      });
      setIsEditOpen(false);
      toast.success("RECRUTA ATUALIZADO", { description: "Score e Turno sincronizados." });
    } catch (err) {
      toast.error("FALHA NA SINCRONIZAÇÃO");
    }
  };

  return (
    <div className="space-y-6 px-4 pb-24">
      {/* Search & Actions - Integrated Tactical Look */}
      <div className="flex gap-3">
        <div className="bg-black-piano neon-blue-border-thin group flex flex-1 items-center gap-3 rounded-2xl px-5 py-3.5 shadow-xl transition-all focus-within:neon-blue-border">
          <Search className="h-5 w-5 text-primary/40 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="BUSCAR NO SQUAD..."
            className="w-full bg-transparent font-mono-tactical text-xs font-black uppercase tracking-widest text-white placeholder:text-white/10 focus:outline-none"
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (currentUserRole !== 'admin') {
              toast.error("ACESSO RESTRITO", {
                description: "Apenas administradores podem recrutar novos membros."
              });
              return;
            }
            setIsAddOpen(true);
          }}
          className="bg-black-piano neon-blue-border flex h-[58px] w-[58px] items-center justify-center rounded-2xl text-primary shadow-xl hover:shadow-glow-cyan"
        >
          <UserPlus className="h-6 w-6" />
        </motion.button>
      </div>

      {/* KPI Cards - Compact & High-Impact */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-black-piano neon-blue-border flex flex-col items-center justify-center rounded-3xl py-6 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-2 opacity-10">
            <UsersIcon className="h-10 w-10 text-primary" />
          </div>
          <div className="text-3xl font-black text-white tracking-tighter text-glow-cyan">{users.length.toString().padStart(2, '0')}</div>
          <div className="font-mono-tactical mt-1 text-[9px] font-black uppercase tracking-[0.3em] text-white/30">Membros Ativos</div>
        </motion.div>
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-black-piano neon-blue-border flex flex-col items-center justify-center rounded-3xl py-6 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-2 opacity-10">
            <TrendingUp className="h-10 w-10 text-success" />
          </div>
          <div className="text-3xl font-black text-white tracking-tighter text-glow-success">
            {movements.filter(m => {
              const d = new Date(m.timestamp);
              const now = new Date();
              return m.type === 'out' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            }).length.toString().padStart(2, '0')}
          </div>
          <div className="font-mono-tactical mt-1 text-[9px] font-black uppercase tracking-[0.3em] text-white/30">Vendas Mês</div>
        </motion.div>
      </div>

      {/* Team List */}
      <div className="space-y-3">
        <div className="font-mono-tactical flex items-center justify-between px-2 text-[9px] font-black uppercase tracking-[0.4em] text-white/20">
          <span>SQUAD TÁTICO ATIVO</span>
          <span className="flex items-center gap-1"><div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> LIVE</span>
        </div>
        <div className="grid gap-3">
          {users.map((user, idx) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4, scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              transition={{ delay: idx * 0.05 }}
              className="group bg-black-piano neon-blue-border-thin hover:neon-blue-border relative flex flex-col rounded-[1.8rem] shadow-xl transition-all overflow-hidden cursor-pointer"
            >
              {/* Card Header: Name & Role - Tactical Identification Bar */}
              <div className="flex items-center justify-between border-b border-white/5 bg-gradient-to-r from-white/[0.05] to-transparent px-5 py-3">
                <h3 className="truncate text-[11px] font-black uppercase tracking-[0.25em] text-white group-hover:text-primary group-hover:text-glow-cyan transition-all">
                  {user.name}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="font-mono-tactical shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-primary/80 ring-1 ring-primary/20 shadow-glow-cyan/20">
                    {user.role}
                  </span>
                </div>
              </div>

              {/* Card Body: Avatar, Stats & Actions */}
              <div className="flex items-center gap-4 p-4">
                {/* Avatar Section */}
                <div className="relative shrink-0">
                  <div className="h-14 w-14 overflow-hidden rounded-2xl border border-white/10 group-hover:border-primary/50 transition-all shadow-xl">
                    <img src={user.avatar} alt={user.name} className="h-full w-full bg-[#1a1c1e] object-cover" />
                  </div>
                  <div className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-black ${user.status === 'ONLINE' ? 'bg-success shadow-glow-success' : 'bg-danger shadow-glow-danger'}`} />
                </div>

                {/* Stats Section */}
                <div className="flex-1 flex flex-col gap-2.5">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 font-mono-tactical text-[10px] font-black uppercase tracking-widest text-white/50">
                      <Award className="h-3.5 w-3.5 text-success" />
                      <span className="text-white/80">{user.score.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono-tactical text-[10px] font-black uppercase tracking-widest text-white/50">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      <span className="text-white/80">{user.shift.toUpperCase()}</span>
                    </div>
                  </div>

                  {/* Action Buttons: Moved to a dedicated row within the card content area */}
                  {currentUserRole === 'admin' && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setEditingProfile(user.raw);
                          setTempScore(user.score);
                          setTempShift(user.shift);
                          setIsEditOpen(true);
                        }}
                        className="bg-primary/10 text-primary rounded-xl p-2 hover:bg-primary hover:text-black transition-all border border-primary/20"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button 
                        onClick={() => handleRoleToggle(user.id, user.role)}
                        title={user.role === 'Admin' ? "Remover Admin" : "Tornar Admin"}
                        className={`rounded-xl p-2 transition-all border ${user.role === 'Admin' ? 'bg-ai/10 text-ai hover:bg-ai hover:text-black border-ai/20' : 'bg-primary/10 text-primary hover:bg-primary hover:text-black border-primary/20'}`}
                      >
                        {user.role === 'Admin' ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
                      </button>
                      <button 
                        onClick={() => {
                          if (window.confirm(`Remover ${user.name} do squad?`)) {
                            removeProfile(user.id);
                          }
                        }}
                        className="bg-danger/10 text-danger rounded-xl p-2 hover:bg-danger hover:text-black transition-all border border-danger/20"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Add User Modal */}
      <AnimatePresence>
        {isAddOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-8 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-black-piano neon-blue-border w-full max-w-sm overflow-hidden rounded-3xl shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/5 bg-white/5 px-6 py-4">
                <h2 className="font-mono-tactical text-xs font-black uppercase tracking-widest text-white">
                  NOVO RECRUTA
                </h2>
                <button
                  onClick={() => setIsAddOpen(false)}
                  className="rounded-lg p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleAdd} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="space-y-1.5">
                  <label className="font-mono-tactical text-[10px] font-bold uppercase tracking-widest text-primary">SELECIONE O AVATAR</label>
                  <div className="flex gap-3 overflow-x-auto pb-4 pt-2 custom-scrollbar no-scrollbar">
                    {AVATAR_OPTIONS.map((avatar, i) => (
                      <motion.div
                        key={avatar.id}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setSelectedAvatar(i)}
                        className={`h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-2xl border-2 transition-all ${
                          selectedAvatar === i ? 'border-primary shadow-glow-cyan scale-110' : 'border-white/10 opacity-40 grayscale-[0.5]'
                        }`}
                      >
                        <img src={avatar.url} alt={`Avatar ${i}`} className="h-full w-full bg-[#1a1c1e] object-cover" />
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-mono-tactical text-[10px] font-bold uppercase tracking-widest text-primary">NOME COMPLETO</label>
                  <input
                    required
                    type="text"
                    value={newProfile.full_name}
                    onChange={(e) => setNewProfile({ ...newProfile, full_name: e.target.value })}
                    className="w-full rounded-xl bg-white/5 px-4 py-3 text-sm text-white border border-white/10 focus:border-primary focus:outline-none"
                    placeholder="Ex: João Silva"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-mono-tactical text-[10px] font-bold uppercase tracking-widest text-primary">E-MAIL DO COLABORADOR</label>
                  <input
                    required
                    type="email"
                    value={newProfile.email}
                    onChange={(e) => setNewProfile({ ...newProfile, email: e.target.value })}
                    className="w-full rounded-xl bg-white/5 px-4 py-3 text-sm text-white border border-white/10 focus:border-primary focus:outline-none"
                    placeholder="exemplo@victors.com.br"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="font-mono-tactical text-[10px] font-bold uppercase tracking-widest text-primary">PIN DE ACESSO (6 DÍGITOS)</label>
                  <input
                    required
                    type="password"
                    inputMode="numeric"
                    value={newProfile.pin}
                    onChange={(e) => setNewProfile({ ...newProfile, pin: e.target.value.replace(/\D/g, '') })}
                    className="w-full rounded-xl bg-white/5 px-4 py-3 text-sm text-white border border-white/10 focus:border-primary focus:outline-none tracking-widest"
                    placeholder="••••••"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-mono-tactical text-[10px] font-bold uppercase tracking-widest text-primary">NÍVEL DE ACESSO</label>
                  <select
                    value={newProfile.role}
                    onChange={(e) => setNewProfile({ ...newProfile, role: e.target.value as 'admin' | 'operator' })}
                    className="w-full rounded-xl bg-[#1a1c1e] px-4 py-3 text-sm text-white border border-white/10 focus:border-primary focus:outline-none appearance-none"
                  >
                    <option value="operator">OPERADOR TÁTICO</option>
                    <option value="admin">ADMINISTRADOR</option>
                  </select>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isAdding}
                  className="neon-blue-border mt-4 w-full rounded-xl bg-primary/20 py-4 font-mono-tactical text-xs font-black uppercase tracking-[0.2em] text-primary transition-all hover:bg-primary/30 disabled:opacity-50"
                  type="submit"
                >
                  {isAdding ? "PROCESSANDO..." : "CADASTRAR"}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Edit User Modal */}
      <AnimatePresence>
        {isEditOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-black-piano neon-blue-border w-full max-w-sm rounded-3xl shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/5 bg-white/5 px-6 py-4">
                <h2 className="font-mono-tactical text-xs font-black uppercase tracking-widest text-white">
                  EDITAR PERFIL: {editingProfile?.full_name}
                </h2>
                <button
                  onClick={() => setIsEditOpen(false)}
                  className="rounded-lg p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleUpdate} className="p-6 space-y-6">
                <div className="space-y-1.5">
                  <label className="font-mono-tactical text-[10px] font-bold uppercase tracking-widest text-primary">SCORE DE CONFIANÇA (0 - 5.0)</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="5"
                      step="0.1"
                      value={tempScore}
                      onChange={(e) => setTempScore(parseFloat(e.target.value))}
                      className="flex-1 accent-primary h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-xl font-black text-white w-12 text-center">{tempScore.toFixed(1)}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-mono-tactical text-[10px] font-bold uppercase tracking-widest text-primary">TURNO DE TRABALHO</label>
                  <select
                    value={tempShift}
                    onChange={(e) => setTempShift(e.target.value)}
                    className="w-full rounded-xl bg-[#1a1c1e] px-4 py-3 text-sm text-white border border-white/10 focus:border-primary focus:outline-none appearance-none"
                  >
                    <option value="Manhã">MANHÃ</option>
                    <option value="Tarde">TARDE</option>
                    <option value="Noite">NOITE</option>
                    <option value="Integral">INTEGRAL</option>
                    <option value="Flex">FLEXÍVEL</option>
                  </select>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="neon-blue-border w-full rounded-xl bg-primary/20 py-4 font-mono-tactical text-xs font-black uppercase tracking-[0.2em] text-primary hover:bg-primary/30"
                  type="submit"
                >
                  ATUALIZAR RECRUTA
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
