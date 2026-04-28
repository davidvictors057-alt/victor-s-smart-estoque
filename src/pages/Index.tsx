import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { SplashScreen } from "@/components/SplashScreen";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { EmployeeHUD } from "@/components/EmployeeHUD";
import { AdminCockpit } from "@/components/AdminCockpit";
import { MovementsView } from "@/components/views/MovementsView";
import { RegisterView } from "@/components/views/RegisterView";
import { ProfileView } from "@/components/views/ProfileView";
import { StockView } from "@/components/views/StockView";
import { UsersView } from "@/components/views/UsersView";
import { AIView } from "@/components/views/AIView";
import { ConfigView } from "@/components/views/ConfigView";
import { SupportTicketsView } from "@/components/views/SupportTicketsView";
import { SupportModal } from "@/components/SupportModal";
import { NotificationsPanel } from "@/components/NotificationsPanel";
import { ChangePinModal } from "@/components/ChangePinModal";
import { ManualModal } from "@/components/ManualModal";
import { useStore } from "@/store/useStore";
import { PWAUpdater } from "@/components/PWAUpdater";
import { NetworkMonitor } from "@/components/NetworkMonitor";

const tacticalColors: Record<string, string> = {
  cyan: "180 100% 50%",
  emerald: "158 64% 52%",
  ruby: "0 84% 60%",
  sapphire: "217 91% 60%",
  amber: "38 92% 50%",
  amethyst: "270 91% 65%",
};

const Index = () => {
  const { 
    screen, 
    role, 
    adminTab, 
    setAdminTab, 
    employeeTab, 
    setEmployeeTab,
    setScreen,
    setProfileTab
  } = useApp();
  
  const { 
    fetchAll, 
    initRealtimeSubscriptions, 
    currentUser, 
    supportOpen, 
    setSupportOpen, 
    notifOpen, 
    setNotifOpen, 
    changePinOpen, 
    setChangePinOpen,
    manualOpen,
    setManualOpen
  } = useStore();

  useEffect(() => {
    (window as any).appNavigation = { setScreen, setAdminTab, setProfileTab };
    fetchAll();
    const cleanup = initRealtimeSubscriptions();
    return cleanup;
  }, [fetchAll, initRealtimeSubscriptions, setScreen, setAdminTab, setProfileTab]);

  // Global Tactical Theme Sync
  useEffect(() => {
    const accent = currentUser?.accent_color || "cyan";
    const hsl = tacticalColors[accent] || tacticalColors.cyan;
    
    document.documentElement.style.setProperty("--primary", hsl);
    document.documentElement.style.setProperty("--accent", hsl);
    document.documentElement.style.setProperty("--ring", hsl);
    
    // Smooth transition for theme change
    document.body.style.transition = "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)";

    // Apply Solid Theme Class
    if (currentUser?.theme_style === "solid") {
      document.documentElement.classList.add("theme-solid");
    } else {
      document.documentElement.classList.remove("theme-solid");
    }
  }, [currentUser?.accent_color, currentUser?.theme_style]);

  const activeTab = role === "admin" ? adminTab : employeeTab;
  const setTab = role === "admin" ? setAdminTab : setEmployeeTab;

  const renderContent = () => {
    if (role === "employee") {
      switch (employeeTab) {
        case "scan": return <EmployeeHUD />;
        case "moves": return <MovementsView />;
        case "users": return <UsersView />;
        case "register": return <RegisterView />;
        case "profile": return <ProfileView />;
        default: return <EmployeeHUD />;
      }
    }
    switch (adminTab) {
      case "dashboard": return <AdminCockpit onNavigate={setAdminTab} />;
      case "ai": return <AIView />;
      case "stock": return <StockView />;
      case "moves": return <MovementsView />;
      case "users": return <UsersView />;
      case "config": return <ConfigView />;
      case "profile": return <ProfileView />;
      case "support": return <SupportTicketsView />;
      default: return <AdminCockpit />;
    }
  };

  return (
    <main className={`relative w-full bg-background text-foreground ${screen === "splash" ? "h-[100dvh] overflow-y-auto" : "h-[100dvh] overflow-hidden"}`}>
      <AnimatePresence mode="wait">
        {screen === "splash" ? (
          <SplashScreen key="splash" />
        ) : (
          <div className="flex flex-col h-full w-full">
             {/* Header - Fixed Height Area */}
             <div className="flex-none pt-3 px-3">
                <TopBar />
             </div>

             {/* Main Scrollable Content Area */}
             <div className="flex-1 overflow-y-auto custom-scrollbar pt-4 px-4 pb-36">
                <div className={`mx-auto transition-all duration-700 ease-in-out ${(role === "admin" && (adminTab === "ai" || adminTab === "dashboard")) || (role === "employee" && employeeTab === "chat") ? "max-w-5xl" : "max-w-2xl"}`}>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${role}-${activeTab}`}
                      initial={{ opacity: 0, scale: 0.98, y: 15 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 1.02, y: -10 }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    >
                      {renderContent()}
                    </motion.div>
                  </AnimatePresence>
                </div>
             </div>

             {/* Footer - Fixed Height Area */}
             <div className="flex-none pb-3 px-3">
                <BottomNav active={activeTab} onChange={setTab} />
             </div>
          </div>
        )}
      </AnimatePresence>
      <SupportModal open={supportOpen} onClose={() => setSupportOpen(false)} />
      <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
      <ChangePinModal open={changePinOpen} onClose={() => setChangePinOpen(false)} />
      <ManualModal open={manualOpen} onClose={() => setManualOpen(false)} />
      <PWAUpdater />
      <NetworkMonitor />
    </main>
  );
};

export default Index;
