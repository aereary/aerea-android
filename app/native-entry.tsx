import React, { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import Aerea from "./page";
import "@fontsource/gaegu/700.css";
import "./globals.css";
import "./timetable-agenda.css";
import "./styles/experimental-theme-lab.css";

const CareerPlanBridge = lazy(() => import("./career-plan-bridge"));
const TimetableAgendaBridge = lazy(() => import("./timetable-agenda-bridge"));

// Native geometry must be active before React's first paint. Setting this in
// an effect makes the entire phone canvas resize one frame after it appears.
document.documentElement.dataset.native = "true";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <>
      <Aerea />
      <Suspense fallback={null}>
        <TimetableAgendaBridge />
        <CareerPlanBridge />
      </Suspense>
    </>
  </React.StrictMode>,
);
