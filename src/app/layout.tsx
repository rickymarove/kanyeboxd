import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "@fontsource/google-sans-flex";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "kanyeboxd",
  description: "A minimalist music rating journal and personal vault.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-canvas text-text-primary antialiased font-sans selection:bg-surface-raised selection:text-text-primary">
        {children}
      </body>
    </html>
  );
}
