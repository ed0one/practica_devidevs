import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "TaskCapture",
  description: "Transformă intențiile în task-uri acționabile",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ro" className={inter.variable}>
      <body className="bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 text-gray-900 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
