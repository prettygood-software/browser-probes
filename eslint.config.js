import { createConfig } from "@prettygood-software/ts-config/eslint";

export default createConfig({
  tsconfigRootDir: import.meta.dirname,
  // `vendor/creepjs/` is the CreepJS clone the probe pulls in at runtime
  // — third-party code, gitignored, not ours to lint.
  ignores: ["vendor/**", "dist/**"],
});
