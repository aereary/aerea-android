import React from "react";
import { createRoot } from "react-dom/client";
import Aerea from "./page";
import "./globals.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Aerea />
  </React.StrictMode>,
);
