import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientAuthProvider from "@/context/ClientAuthProvider";
import ClientThemeProvider from "@/context/ClientThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Budget This",
  description: "A budget management application",
};

// This layout purposely does not use the 'use client' directive
// as it needs to run on the server (static metadata)
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ClientAuthProvider>
          <ClientThemeProvider>
            {children}
          </ClientThemeProvider>
        </ClientAuthProvider>
      </body>
    </html>
  );
}
