import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import React from "react";
import { AuthProvider } from "../providers/Auth";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  preload: true,
  display: "swap",
});

export const metadata: Metadata = {
  title: "CelHive",
  description: "CelHive Agent Chat",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NuqsAdapter>
          <AuthProvider>
            {children}
          </AuthProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
