import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Toast from "@/components/Toast";

export const metadata: Metadata = {
  title: "Friends of Education - ID Card Portal",
  description:
    "Production ID Card Generation & Admin Portal for Friends of Education Charitable Trust",
};

import { SettingsProvider } from "@/context/SettingsContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
        />
      </head>
      <body className="min-h-screen bg-neutral-50/70 antialiased selection:bg-orange-500 selection:text-white">
        <SettingsProvider>
          <Navbar />
          <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </main>
          <Toast />
        </SettingsProvider>
      </body>
    </html>
  );
}
