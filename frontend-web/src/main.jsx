import React from "react";
import ReactDOM from "react-dom/client";
import AppRouter from "./AppRouter";
import { ToastProvider } from "./components/Toast";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ToastProvider>
      <AppRouter />
    </ToastProvider>
  </React.StrictMode>,
);
