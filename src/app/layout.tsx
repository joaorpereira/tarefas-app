import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Providers } from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tarefas",
  description: "Gerenciador simples de tarefas",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-stone-100 text-stone-900 antialiased">
        <Providers>
          <main className="mx-auto max-w-2xl px-4 py-10">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
