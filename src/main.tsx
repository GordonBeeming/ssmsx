import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Disable default browser context menu except on text inputs
document.addEventListener("contextmenu", (e) => {
  const target = e.target as HTMLElement;
  const tagName = target.tagName.toLowerCase();
  if (tagName === "input" || tagName === "textarea" || target.isContentEditable) {
    return;
  }
  e.preventDefault();
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
