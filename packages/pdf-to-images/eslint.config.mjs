import { config } from "@repo/eslint-config/base";

export default [
  ...config,
  {
    ignores: ["dist/**", "target/**", "index.js", "index.d.ts", "*.node"],
  },
];
