import "./global.css";
import { RootProvider } from "fumadocs-ui/provider/next";
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://pdf-raster.omsimos.com"),
  title: {
    default: "joshxfi/pdf-raster",
    template: "%s | joshxfi/pdf-raster",
  },
  description:
    "Documentation for pdf-raster, a native PDF to images library for backend and document workflows.",
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
