import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TaskCapture — Task-uri din text natural",
  description: "Scrie ce ai de făcut în limbaj natural. AI-ul extrage automat task-urile, le prioritizează și le organizează în calendarul tău.",
  keywords: ["task management", "AI", "productivitate", "organizare"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50">
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
