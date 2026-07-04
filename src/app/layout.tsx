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

// Setează clasa `.dark` înainte de primul paint ca să evităm flash-ul de temă
// (FOUC). Rulează sincron din <head>, citind preferința salvată sau setarea
// sistemului.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro" className={`${inter.variable} ${bricolage.variable} ${jetbrains.variable} font-sans h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 dark:bg-[#0a0a0f]">
        {children}
        <Toaster
          position="bottom-center"
          toastOptions={{
            classNames: {
              toast: "rounded-xl border border-gray-200 shadow-lg font-medium",
              success: "bg-emerald-50 border-emerald-200 text-emerald-800",
              error: "bg-red-50 border-red-200 text-red-800",
            },
          }}
        />
      </body>
    </html>
  );
}
