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

createRoot(document.getElementById("root")!).render(<App />);
