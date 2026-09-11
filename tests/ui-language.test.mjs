import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

const career = read("app/career-plan-bridge.tsx");
const page = read("app/page.tsx");
const ao3 = read("app/ao3-library.tsx");
const generic = read("app/generic-library-bridge.tsx");
const strings = read("android/app/src/main/res/values/strings.xml");
const todayWidget = read(
  "android/app/src/main/java/com/aereaary/aerea/AereaTodayWidget.java",
);
const monthWidget = read(
  "android/app/src/main/java/com/aereaary/aerea/AereaMonthWidget.java",
);
const eventNotifications = read(
  "android/app/src/main/java/com/aereaary/aerea/AereaEventNotificationsPlugin.java",
);
const eventReceiver = read(
  "android/app/src/main/java/com/aereaary/aerea/AereaEventNotificationReceiver.java",
);
const storage = read(
  "android/app/src/main/java/com/aereaary/aerea/AereaStoragePlugin.java",
);
const agents = read("AGENTS.md");

function excludes(source, phrases, label) {
  for (const phrase of phrases) {
    assert.equal(
      source.includes(phrase),
      false,
      `${label} still contains Spanish UI copy: ${phrase}`,
    );
  }
}

test("product chrome uses English while original-language content stays intact", () => {
  excludes(career, [
    "Mi carrera",
    "Horario",
    "Agregar profesor",
    "Guardar profesor",
    "Buscar materia o código",
    "Cuatrimestre",
    "Cursando ahora",
    "Tu avance",
    "Profesores",
    "Más o menos",
  ], "My degree");

  excludes(page, [
    "Las notificaciones están bloqueadas",
    "No se pudieron programar los recordatorios",
    "Sin eventos para hoy",
    "Hora por confirmar",
    "Todo el día",
    "Presiona Atrás otra vez",
  ], "main app");

  excludes(ao3, [
    "Buscar título, autor",
    "Tocar para copiar el título",
    "Cualquier estado",
    "Todos los fandoms",
    "No encontré ninguna fichita",
    "Abrir en AO3",
    "También en:",
  ], "AO3 UI");

  excludes(generic, [
    "Tamaño no disponible",
    "Fecha no disponible",
    "Sin autor guardado",
    "Abrir en Drive",
    "Versión anterior",
  ], "generic Library");

  excludes(strings, [
    "Sin eventos para hoy",
    "recordatorios",
    ">HOY<",
  ], "Android strings");

  excludes(todayWidget, [
    "\"Hoy\"",
    "Volver a hoy",
    "día completado",
    "Un día suave",
  ], "today widget");

  excludes(monthWidget, [
    "\"Hoy\"",
    "\"Volver\"",
    "HOY ·",
    "Nada pendiente",
  ], "month widget");

  excludes(eventNotifications, [
    "Prueba de notificación",
    "Tu notificación",
    "Evento de aérea",
    "Tu evento comienza",
  ], "event notifications");

  excludes(eventReceiver, [
    "Recordatorios de eventos",
    "Avisos de eventos",
    "Evento de aérea",
  ], "notification receiver");

  excludes(storage, [
    "No se pudo copiar la imagen",
    "El archivo elegido",
    "El selector no permitió",
    "La imagen supera",
  ], "native storage");

  // Official/user content is intentionally NOT translated.
  assert.match(career, /Ingeniería Mecatrónica/);
  assert.match(agents, /default language for all user-facing product UI is \*\*English\*\*/i);
  assert.match(agents, /Preserve user-authored, imported, official, and provider content/i);
});
