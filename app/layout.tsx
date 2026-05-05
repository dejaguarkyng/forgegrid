import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ForgeGrid",
  description:
    "Submit AI workloads in minutes, persist every state change in InsForge, and let Jungle Grid handle the heavy compute.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
