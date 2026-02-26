import { createRoot } from "react-dom/client";
import { App as CapApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import App from "./App.tsx";
import "./index.css";

// Handle Android hardware back button
if (Capacitor.isNativePlatform()) {
  CapApp.addListener("backButton", ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
    } else {
      CapApp.minimizeApp();
    }
  });
}

// Show splash screen briefly, then render app
const root = document.getElementById("root")!;

// Render splash first
root.innerHTML = `
  <div id="app-splash" style="
    position: fixed; inset: 0; z-index: 9999;
    display: flex; align-items: center; justify-content: center; flex-direction: column;
    background: linear-gradient(135deg, hsl(239 84% 67%), hsl(270 70% 60%));
  ">
    <img src="/app-icon.png" alt="Discount Panel" style="width: 120px; height: 120px; border-radius: 28px; animation: splashPulse 1.5s ease-in-out infinite;" />
    <p style="color: white; font-size: 18px; font-weight: 600; margin-top: 20px; opacity: 0.9;">Discount Panel</p>
  </div>
  <style>
    @keyframes splashPulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.05); opacity: 0.85; }
    }
  </style>
`;

// After a short delay, render the actual app
setTimeout(() => {
  createRoot(root).render(<App />);
}, 1500);
