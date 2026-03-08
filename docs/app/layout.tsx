import "./global.css";
import { RootProvider } from "fumadocs-ui/provider/next";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "omsimos/pdf-raster",
    template: "%s | omsimos/pdf-raster",
  },
  description:
    "Documentation for @omsimos/pdf-raster, a native PDF to images library for backend and document workflows.",
};

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
