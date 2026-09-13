import React from "react";
import { createRoot } from "react-dom/client";
import Aerea from "./page";
import CareerPlanBridge from "./career-plan-bridge";
import TimetableAgendaBridge from "./timetable-agenda-bridge";
import "@fontsource/patrick-hand/400.css";
import "./globals.css";
import "./timetable-agenda.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <>
      <Aerea />
      <TimetableAgendaBridge />
      <CareerPlanBridge />
    </>
  </React.StrictMode>,
);
