import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import CareerPlanBridge from "./career-plan-bridge";
import TimetableAgendaBridge from "./timetable-agenda-bridge";
import "@fontsource/gaegu/700.css";
import { APP_APPEARANCE, APP_IDENTITY, UI_DEFAULTS } from "./config/app-config";
import "./globals.css";
import "./timetable-agenda.css";
import "./styles/experimental-theme-lab.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: APP_IDENTITY.pageTitle,
  description: APP_IDENTITY.pageDescription,
  applicationName: APP_IDENTITY.name,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_IDENTITY.name,
  },
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: APP_APPEARANCE.browserThemeColor,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={UI_DEFAULTS.language}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <TimetableAgendaBridge />
        <CareerPlanBridge />
      </body>
    </html>
  );
}
