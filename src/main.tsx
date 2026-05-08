import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// --- PWA AUTO-UPDATE LOGIC ---
// Garante que o app recarregue sozinho quando uma nova versão for detectada e ativada
let refreshing = false;
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}

createRoot(document.getElementById("root")!).render(<App />);
