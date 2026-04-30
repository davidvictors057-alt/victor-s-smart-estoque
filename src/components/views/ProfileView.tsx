import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Award, Clock, TrendingUp, LogOut, Settings, Mail, Phone, 
  Shield, ChevronRight, X, Palette, Camera, Check, Edit3, 
  MapPin, User, Layout, Save, Info, Hash
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";
import { useStore, Profile } from "@/store/useStore";
import { supabase } from "@/lib/supabase";

const generateTacticalAvatars = () => {
  const avatars = [];
  const skinWhite = 'ffdbb4';
  const skinPale = 'edb98a';
  const skinTan = 'f8d25c';
  const skinBlack = '614335';
  const skinBrown = 'ae5d29';
  const hairBlack = '2c1b18';

  // 1. MULHERES - Cabelo Preto Longo (80 opções)
  const womenTops = ['straight01', 'straight02', 'curvy', 'bigHair', 'longButNotTooLong', 'bob', 'bun', 'miaWallace'];
  const womenSkins = [skinWhite, skinPale, skinWhite, skinTan, skinWhite, skinPale, skinBrown]; // Mostly white/pale
  
  for (let i = 0; i < 80; i++) {
    const top = womenTops[i % womenTops.length];
    const skin = womenSkins[i % womenSkins.length];
    // Add some black skin variants (approx 1 in 15)
    const finalSkin = i % 15 === 0 ? skinBlack : skin;
    avatars.push(`https://api.dicebear.com/7.x/avataaars/svg?seed=w_${i}&top=${top}&hairColor=${hairBlack}&skinColor=${finalSkin}&clothing=overall&clothesColor=262e33`);
  }

  // 2. HOMENS - Cabelo Curto e Barba (80 opções)
  const menTops = ['shortFlat', 'shortWaved', 'theCaesar', 'shortCurly', 'shaggy', 'frizzle', 'dreads01'];
  const beards = ['beardLight', 'beardMedium', 'beardMajestic'];
  const menSkins = [skinWhite, skinPale, skinTan, skinWhite, skinPale, skinWhite, skinBrown];
  
  for (let i = 0; i < 80; i++) {
    const top = menTops[i % menTops.length];
    const beard = beards[i % beards.length];
    const skin = menSkins[i % menSkins.length];
    const finalSkin = i % 15 === 0 ? skinBlack : skin;
    avatars.push(`https://api.dicebear.com/7.x/avataaars/svg?seed=m_${i}&top=${top}&hairColor=${hairBlack}&facialHair=${beard}&skinColor=${finalSkin}&clothing=hoodie&clothesColor=262e33`);
  }

  return avatars;
};

const avatarOptions = generateTacticalAvatars();

const tacticalColors = [
  { name: "Ciano", value: "cyan", hex: "#00ffff", hsl: "180 100% 50%" },
  { name: "Esmeralda", value: "emerald", hex: "#10b981", hsl: "158 64% 52%" },
  { name: "Rubi", value: "ruby", hex: "#ef4444", hsl: "0 84% 60%" },
  { name: "Safira", value: "sapphire", hex: "#3b82f6", hsl: "217 91% 60%" },
  { name: "Âmbar", value: "amber", hex: "#f59e0b", hsl: "38 92% 50%" },
  { name: "Ametista", value: "amethyst", hex: "#a855f7", hsl: "270 91% 65%" },
];

export const ProfileView = () => {
  const { setScreen, role, profileTab: activeTab, setProfileTab: setActiveTab } = useApp();
  const { currentUser, updateProfile } = useStore();
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  
  // Local editable states
  const [editMode, setEditMode] = useState(false);
  const [tempBio, setTempBio] = useState(currentUser?.bio || "");
  const [tempPhone, setTempPhone] = useState(currentUser?.phone || "");

  const isAdmin = role === "admin";
  const currentAvatar = currentUser?.avatar_url || (isAdmin ? avatarOptions[40] : avatarOptions[0]);

  const { movements } = useStore();

  const itemsToday = movements.filter(m => {
    const isToday = new Date(m.timestamp).toLocaleDateString() === new Date().toLocaleDateString();
    return isToday && m.operator_id === currentUser?.id && m.type === 'in';
  }).length;

  const stats = [
    { icon: TrendingUp, label: "ITENS HOJE", value: itemsToday.toString() },
    { icon: Award, label: "SCORE", value: (currentUser?.score ?? 5.0).toFixed(1) },
    { icon: Hash, label: "TURNO", value: (currentUser?.shift ?? "INTEGRAL").toUpperCase() },
  ];

  const handleSaveInfo = async () => {
    if (!currentUser) return;
    try {
      await updateProfile(currentUser.id, { 
        bio: tempBio, 
        phone: tempPhone 
      });
      setEditMode(false);
      toast.success("Perfil sincronizado!");
    } catch (err) {
      toast.error("Falha ao salvar info.");
    }
  };

  const handleColorChange = async (color: string) => {
    if (!currentUser) return;
    try {
      await updateProfile(currentUser.id, { accent_color: color });
      toast.success(`Cor tática alterada para ${color}!`);
    } catch (err) {
      toast.error("Erro ao mudar cor.");
    }
  };

  const currentThemeClass = "bg-black-piano neon-blue-border shadow-[0_20px_50px_rgba(0,0,0,0.8)]";
  const cardClass = "bg-black-piano neon-blue-border-thin shadow-[0_10px_30px_rgba(0,0,0,0.4)]";

  return (
    <div className="space-y-6 px-4 pb-32">
      {/* Tactical Header */}
      <motion.section
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden rounded-[3rem] p-8 ${currentThemeClass}`}
      >
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/5 blur-[100px]" />
        
        <div className="relative flex flex-col items-center">
          {/* Avatar Area */}
          <div className="relative">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setAvatarPickerOpen(true)}
              className="relative h-24 w-24 rounded-full border-2 border-primary/30 p-1 shadow-glow-cyan-sm"
            >
              <img 
                src={currentAvatar.startsWith('http') 
                  ? currentAvatar 
                  : `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentAvatar}${currentAvatar === "Raul" ? "&skinColor=9e5622" : ""}`
                } 
                alt="Avatar" 
                className="h-full w-full rounded-full bg-black/40" 
              />
              <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary shadow-glow-cyan">
                <Camera className="h-4 w-4 text-black" />
              </div>
            </motion.button>
          </div>

          <div className="mt-5 text-center">
            <h2 className="text-2xl font-black text-white tracking-tight">
              {currentUser?.full_name || "RECRUTA"}
            </h2>
            <div className="font-mono-tactical mt-1 text-[10px] font-black uppercase tracking-[0.4em] text-primary">
              {isAdmin ? "NÍVEL: ADM MASTER" : "NÍVEL: OPERADOR TÁTICO"}
            </div>
            
            <p className="mt-4 max-w-[250px] text-xs font-medium leading-relaxed text-white">
              {currentUser?.bio || "Nenhuma biografia tática definida ainda."}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="mt-8 flex w-full max-w-[280px] rounded-2xl bg-white/5 p-1 ring-1 ring-white/10">
            <button
              onClick={() => setActiveTab("general")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === "general" ? "bg-primary text-black shadow-glow-cyan" : "text-white hover:text-white"
              }`}
            >
              <User className="h-3.5 w-3.5" />
              Geral
            </button>
            <button
              onClick={() => setActiveTab("appearance")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === "appearance" ? "bg-primary text-black shadow-glow-cyan" : "text-white hover:text-white"
              }`}
            >
              <Palette className="h-3.5 w-3.5" />
              Aparência
            </button>
          </div>
        </div>
      </motion.section>

      <AnimatePresence mode="wait">
        {activeTab === "general" ? (
          <motion.div
            key="general"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {stats.map((s) => (
                <div key={s.label} className={`rounded-2xl p-2.5 sm:p-4 text-center ${cardClass}`}>
                  <s.icon className="mx-auto h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary opacity-60" />
                  <div className="mt-1 font-mono-tactical text-xs sm:text-lg font-black text-white truncate">
                    {s.value}
                  </div>
                  <div className="mt-0.5 text-[6px] sm:text-[8px] font-black uppercase tracking-tighter sm:tracking-widest text-white whitespace-nowrap">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Editable Info Section */}
            <div className={`rounded-3xl p-6 ${cardClass}`}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-white">
                  <Info className="h-3.5 w-3.5 text-primary" />
                  Informações de Perfil
                </h3>
                <button 
                  onClick={() => editMode ? handleSaveInfo() : setEditMode(true)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-black uppercase transition-all ${
                    editMode ? "bg-success text-black shadow-glow-success" : "bg-white/5 text-primary hover:bg-white/10"
                  }`}
                >
                  {editMode ? <><Save className="h-3 w-3" /> SALVAR</> : <><Edit3 className="h-3 w-3" /> EDITAR</>}
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="mb-2 block text-[9px] font-black uppercase tracking-widest text-white">Slogan Tático (Bio)</label>
                  {editMode ? (
                    <textarea 
                      value={tempBio}
                      onChange={(e) => setTempBio(e.target.value)}
                      className="w-full rounded-xl bg-white/5 border-2 border-white/10 p-4 text-sm text-white focus:border-primary/50 focus:outline-none transition-all"
                      placeholder="Descreva sua missão..."
                      rows={3}
                    />
                  ) : (
                    <div className="rounded-xl bg-white/5 p-4 text-sm font-medium text-white border border-white/5">
                      {currentUser?.bio || "Sem biografia."}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="mb-2 block text-[9px] font-black uppercase tracking-widest text-white">Contato Direto</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white" />
                      <input 
                        disabled={!editMode}
                        type="text" 
                        value={tempPhone}
                        onChange={(e) => setTempPhone(e.target.value)}
                        className="w-full rounded-xl bg-white/5 border border-white/10 p-4 pl-12 text-sm text-white focus:border-primary/50 focus:outline-none transition-all disabled:opacity-50"
                        placeholder="(11) 9 0000-0000"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-[9px] font-black uppercase tracking-widest text-white">Email Corporativo</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white" />
                      <input 
                        disabled
                        type="text" 
                        value={currentUser?.email || "operador@victors.app"}
                        className="w-full rounded-xl bg-white/5 border border-white/10 p-4 pl-12 text-sm text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="appearance"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {/* Color Accent Selection */}
            <div className={`rounded-3xl p-6 ${cardClass}`}>
              <div className="mb-6">
                <h3 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-white">
                  <Palette className="h-3.5 w-3.5 text-primary" />
                  Cor do Acento Tático
                </h3>
                <p className="mt-1 text-[10px] text-white">Selecione o tom dos neons e botões da sua interface.</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {tacticalColors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => handleColorChange(color.value)}
                    className={`group relative flex flex-col items-center gap-3 rounded-2xl border-2 p-4 transition-all ${
                      currentUser?.accent_color === color.value 
                        ? "border-white/20 bg-white/5 shadow-inner" 
                        : "border-transparent bg-white/[0.02] hover:bg-white/5"
                    }`}
                  >
                    <div 
                      className={`h-10 w-10 rounded-full shadow-lg transition-transform group-hover:scale-110`}
                      style={{ 
                        backgroundColor: color.hex,
                        boxShadow: `0 0 20px ${color.hex}44`
                      }}
                    />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white group-hover:text-white transition-colors">
                      {color.name}
                    </span>
                    {currentUser?.accent_color === color.value && (
                      <div className="absolute -right-2 -top-2 rounded-full bg-primary p-1 shadow-glow-cyan">
                        <Check className="h-3 w-3 text-black" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Interface Style Selection */}
            <div className={`rounded-3xl p-6 ${cardClass}`}>
              <div className="mb-6">
                <h3 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-white">
                  <Layout className="h-3.5 w-3.5 text-primary" />
                  Estilo da Interface
                </h3>
                <p className="mt-1 text-[10px] text-white">Escolha como os painéis e o fundo se comportam.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => updateProfile(currentUser!.id, { theme_style: "neon" })}
                  className={`relative flex h-24 flex-col items-center justify-center gap-2 rounded-2xl border-2 transition-all ${
                    (currentUser?.theme_style || "neon") === "neon" 
                      ? "border-primary bg-primary/10 shadow-glow-cyan-sm" 
                      : "border-white/5 bg-white/5 opacity-40 hover:opacity-100"
                  }`}
                >
                  <div className="flex gap-1">
                    <div className="h-3 w-3 rounded-full bg-primary/40 animate-pulse" />
                    <div className="h-3 w-3 rounded-full bg-primary/20" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">NEON GLASS</span>
                </button>
                <button
                  onClick={() => updateProfile(currentUser!.id, { theme_style: "solid" })}
                  className={`relative flex h-24 flex-col items-center justify-center gap-2 rounded-2xl border-2 transition-all ${
                    currentUser?.theme_style === "solid" 
                      ? "border-white bg-white/10" 
                      : "border-white/5 bg-white/5 opacity-40 hover:opacity-100"
                  }`}
                >
                  <div className="flex gap-1">
                    <div className="h-3 w-3 rounded-sm bg-white/20" />
                    <div className="h-3 w-3 rounded-sm bg-white/10" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">SOLID DARK</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logout / Hard reset for testing */}
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={() => {
          supabase.auth.signOut();
          setScreen("splash");
        }}
        className="flex w-full items-center justify-center gap-3 rounded-2xl bg-danger/10 border-2 border-danger/40 py-5 text-[11px] font-black text-danger transition-all hover:bg-danger hover:text-white"
      >
        <LogOut className="h-4 w-4" />
        ENCERRAR EXPEDIENTE TÁTICO
      </motion.button>

      {/* Avatar Picker Modal - Reused from before but with currentSeed logic */}
      <AnimatePresence>
        {avatarPickerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={`w-full max-w-lg rounded-[2.5rem] p-8 flex flex-col max-h-[85vh] ${currentThemeClass}`}
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <div className="font-mono-tactical text-[10px] font-black uppercase tracking-[0.4em] text-primary">RECRUTAMENTO VISUAL</div>
                  <div className="text-xl font-black text-white">Identidade de Avatar</div>
                </div>
                <button onClick={() => setAvatarPickerOpen(false)} className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-white"><X /></button>
              </div>
              <div className="grid grid-cols-4 gap-4 overflow-y-auto pr-2 custom-scrollbar no-scrollbar">
                {avatarOptions.map((url, i) => (
                  <button
                    key={i}
                    onClick={async () => {
                      if (currentUser) {
                        await updateProfile(currentUser.id, { avatar_url: url });
                        setAvatarPickerOpen(false);
                      }
                    }}
                    className={`aspect-square rounded-2xl border-2 p-1 transition-all hover:scale-105 active:scale-95 ${
                      currentAvatar === url ? "border-primary bg-primary/10 shadow-glow-cyan-sm" : "border-white/5 bg-white/5"
                    }`}
                  >
                    <img src={url} className="h-full w-full rounded-xl" alt={`Opção ${i}`} />
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
