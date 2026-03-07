import type { ReactElement } from "react";

import { ConversionWorkbench } from "./workbench";

export default function Home(): ReactElement {
  return (
    <main className="min-h-screen lg:h-screen lg:overflow-hidden">
      <ConversionWorkbench />
    </main>
  );
}
