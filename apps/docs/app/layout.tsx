import "./global.css";
import { RootProvider } from "fumadocs-ui/provider/next";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "omsimos/pdf-to-images",
    template: "%s | omsimos/pdf-to-images",
  },
  description:
    "Documentation for @omsimos/pdf-to-images, a native PDF to PNG library for backend and document workflows.",
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
