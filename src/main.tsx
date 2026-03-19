import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";
import { ErrorBoundary } from "./shared/components/ErrorBoundary";
import "./index.css";

function Root() {
  useEffect(() => {
    // Disable default browser context menu except on text inputs
    const handler = (e: MouseEvent) => {
      if (!(e.target instanceof HTMLElement)) return;
      const target = e.target;
      const tagName = target.tagName.toLowerCase();
      if (tagName === "input" || tagName === "textarea" || target.isContentEditable) {
        return;
      }
      e.preventDefault();
    };
    document.addEventListener("contextmenu", handler);
    return () => document.removeEventListener("contextmenu", handler);
  }, []);

  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
