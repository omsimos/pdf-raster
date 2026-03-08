export const benchmarkSummary = {
  speedupRange: "4x-8x",
  metrics: [
    {
      label: "Multi-page",
      ours: "1.72 ms",
      napi: "11.96 ms",
      nodeCanvas: "14.37 ms",
    },
    {
      label: "Single-page",
      ours: "1.29 ms",
      napi: "5.81 ms",
      nodeCanvas: "7.25 ms",
    },
  ],
};
