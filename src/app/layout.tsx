import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://procureiq-olive.vercel.app"),
  title: { default: "ProcureIQ — Strategic Procurement Intelligence", template: "%s · ProcureIQ" },
  description: "Explainable spend analytics, supplier evaluation, should-cost modelling, RFQ comparison and sourcing optimization.",
  applicationName: "ProcureIQ",
  keywords: ["procurement analytics", "sourcing optimization", "should-cost", "supplier analysis", "operations research"],
  openGraph: { title: "ProcureIQ", description: "Turn procurement data into better sourcing decisions.", type: "website" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} ${mono.variable}`} data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
