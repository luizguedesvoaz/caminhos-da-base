import type { Metadata, Viewport } from "next";

/* Fontes self-hosted via @fontsource: os arquivos woff2 são servidos pelo
   próprio domínio, então não há request a fonts.googleapis.com em runtime —
   é o que o handoff pede e o que segura o tempo de primeira pintura em 4G. */
import "@fontsource/bricolage-grotesque/800.css";
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/700.css";

import "./globals.css";
import { BRAND } from "@/lib/config";
import { lerTema } from "@/lib/tema-server";

export const metadata: Metadata = {
  title: BRAND.name,
  description: BRAND.tagline,
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: BRAND.shortName, statusBarStyle: "default" },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/icone.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  /* Igual ao theme_color e ao background_color do manifest, para a tela de
     abertura da PWA não piscar. O claro é o padrão nos dois casos. */
  themeColor: "#FDFDF8",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // O tema vem do cookie NO SERVIDOR: sem useEffect, sem flash na carga.
  const tema = await lerTema();

  return (
    <html lang="pt-BR" data-tema={tema}>
      <body>{children}</body>
    </html>
  );
}
