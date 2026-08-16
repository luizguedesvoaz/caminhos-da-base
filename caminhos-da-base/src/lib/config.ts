/**
 * Configuração central da marca.
 * Trocar o nome do produto aqui muda toda a interface — decisão registrada
 * na especificação para tornar barata uma eventual mudança de marca.
 */
export const BRAND = {
  name: "Caminhos da Base",
  shortName: "Caminhos",
  tagline: "A carreira do seu atleta, degrau por degrau.",
  supportEmail: "contato@caminhosdabase.com.br",
  consultantContactUrl: "https://wa.me/",
} as const;

/** Paleta da identidade visual. */
export const COLORS = {
  navy: "#1E2761",
  white: "#FFFFFF",
  gold: "#FFC72C",
} as const;

/** Versão vigente dos termos — gravada em `consents` a cada aceite (LGPD). */
export const CONSENT_VERSION = "1.0.0";
