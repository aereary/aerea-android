import React, { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import Aerea from "./page";
import "@fontsource/gaegu/700.css";
import "./globals.css";
import "./timetable-agenda.css";

const CareerPlanBridge = lazy(() => import("./career-plan-bridge"));
const TimetableAgendaBridge = lazy(() => import("./timetable-agenda-bridge"));

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
