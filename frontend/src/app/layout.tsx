import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "./globals.css";

export const metadata: Metadata = {
  title: "STRATUM — AI Strength, Nutrition & Recomposition",
  description:
    "Get stronger, build muscle, and improve body composition with an AI coach that explains every recommendation — and cites the research.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
