export const benchmarkSummary = {
  speedupRange: "4x-7x",
  metrics: [
    {
      label: "Multi-page",
      ours: "1.90 ms",
      napi: "11.73 ms",
      nodeCanvas: "14.19 ms",
    },
    {
      label: "Single-page",
      ours: "1.35 ms",
      napi: "5.78 ms",
      nodeCanvas: "7.15 ms",
    },
  ],
};
