import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Velos Wallet",
  description: "Seu dinheiro na direção certa.",
};

export const viewport: Viewport = {
  // Cores da identidade: a barra do browser acompanha o tema da app.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F4F7F2" },
    { media: "(prefers-color-scheme: dark)", color: "#0A2E24" },
  ],
};

/**
 * Aplica o tema antes do primeiro paint, para nao haver flash de tema errado.
 * Sem biblioteca: le a escolha guardada e, na ausencia dela, a preferencia do
 * sistema. O ThemeToggle escreve no mesmo sitio.
 */
const themeScript = `
try {
  var stored = localStorage.getItem("theme");
  var dark = stored
    ? stored === "dark"
    : window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.classList.toggle("dark", dark);
} catch (e) {}
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
