import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PwaBootstrap } from "@/components/pwa/PwaBootstrap";
import { ToastProvider } from "@/components/ui/toast";
import { AppChrome } from "@/components/nav/AppChrome";
import { PageTransition } from "@/components/nav/PageTransition";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HoopMind · Become Unstoppable",
  description:
    "Ecosistema de rendimiento con IA: baloncesto, gimnasio, pliometría, nutrición, recuperación y tu coach personal.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "HoopMind",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  // Mobile-first, one-handed on-court use; keep theme dark in the browser chrome.
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#070709",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="bg-bg text-fg min-h-full flex flex-col">
        <PwaBootstrap />
        <ToastProvider>
          <PageTransition>{children}</PageTransition>
          <AppChrome />
          <InstallPrompt />
        </ToastProvider>
      </body>
    </html>
  );
}
