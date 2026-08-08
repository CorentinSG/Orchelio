import type { Metadata, Viewport } from "next";

import { APP_DESCRIPTION, APP_NAME } from "@/lib/app-config";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  // This build is a demonstration environment; it must never be indexed.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7f9" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1017" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="min-h-dvh">
        <a href="#main" className="skip-link">
          Aller au contenu principal
        </a>
        {children}
      </body>
    </html>
  );
}
