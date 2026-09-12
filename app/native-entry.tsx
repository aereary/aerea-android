import React from "react";
import { createRoot } from "react-dom/client";
import Aerea from "./page";
import CareerPlanBridge from "./career-plan-bridge";
import "@fontsource/patrick-hand/400.css";
import "./globals.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <>
      <Aerea />
      <CareerPlanBridge />
    </>
  </React.StrictMode>,
);
