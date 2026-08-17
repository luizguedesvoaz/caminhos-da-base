import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BRAND } from "@/lib/config";

export const metadata: Metadata = {
  title: BRAND.name,
  description: BRAND.tagline,
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: BRAND.shortName, statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#1E2761",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      {/* Fonte do sistema: carrega instantaneamente no celular, sem
          request externo — decisão de performance para rede móvel. */}
      <body>{children}</body>
    </html>
  );
}
