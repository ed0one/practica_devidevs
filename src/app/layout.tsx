import type { Metadata } from "next";
import { Inter, Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});
const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "TaskCapture — Task-uri din text natural",
  description: "Scrie ce ai de făcut în limbaj natural. AI-ul extrage automat task-urile, le prioritizează și le organizează în calendarul tău.",
  keywords: ["task management", "AI", "productivitate", "organizare"],
};

// Tema e exclusiv întunecată (Obsidian & Amber, vezi DESIGN.md); clasa `dark`
// stă permanent pe <html> ca variantele `dark:` rămase să se aplice mereu.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro" className={`dark ${inter.variable} ${bricolage.variable} ${jetbrains.variable} font-sans h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#0e1117] text-[#f8fafc]">
        {children}
        <Toaster
          position="bottom-center"
          toastOptions={{
            classNames: {
              toast: "rounded-xl border border-white/10 bg-[#161922] text-[#f8fafc] shadow-2xl font-medium",
              success: "bg-[#10b981]/15 border-[#10b981]/30 text-[#34d399]",
              error: "bg-[#ef4444]/15 border-[#ef4444]/30 text-[#f87171]",
            },
          }}
        />
      </body>
    </html>
  );
}
