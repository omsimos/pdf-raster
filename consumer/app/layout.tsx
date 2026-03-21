import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "pdf-raster npm consumer",
  description:
    "Minimal Next.js app that validates the published pdf-raster package.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
