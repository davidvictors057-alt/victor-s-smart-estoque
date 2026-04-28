import { createContext, useContext, useState, ReactNode } from "react";

export type Role = "employee" | "admin";
export type Screen = "splash" | "app";

interface AppContextValue {
  role: Role;
  setRole: (r: Role) => void;
  screen: Screen;
  setScreen: (s: Screen) => void;
  toggleRole: () => void;
  adminTab: string;
  setAdminTab: (t: string) => void;
  employeeTab: string;
  setEmployeeTab: (t: string) => void;
  profileTab: "general" | "appearance";
  setProfileTab: (t: "general" | "appearance") => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<Role>("employee");
  const [screen, setScreen] = useState<Screen>("splash");
  const [adminTab, setAdminTab] = useState("stock");
  const [employeeTab, setEmployeeTab] = useState("scan");
  const [profileTab, setProfileTab] = useState<"general" | "appearance">("general");

  const toggleRole = () => setRole((r) => (r === "employee" ? "admin" : "employee"));

  return (
    <AppContext.Provider value={{ 
      role, setRole, screen, setScreen, toggleRole,
      adminTab, setAdminTab, employeeTab, setEmployeeTab,
      profileTab, setProfileTab
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
};
