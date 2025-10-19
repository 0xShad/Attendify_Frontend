import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    rules: {
      // Disable unused variables warnings
      "@typescript-eslint/no-unused-vars": "off",
      "no-unused-vars": "off",

      // Allow any type usage
      "@typescript-eslint/no-explicit-any": "off",

      // Allow empty functions
      "@typescript-eslint/no-empty-function": "off",

      // Allow non-null assertions
      "@typescript-eslint/no-non-null-assertion": "off",

      // Disable exhaustive deps for useEffect
      "react-hooks/exhaustive-deps": "warn",

      // Allow console statements
      "no-console": "off",

      // Allow unused expressions
      "no-unused-expressions": "off",
      "@typescript-eslint/no-unused-expressions": "off",

      // Allow empty interfaces
      "@typescript-eslint/no-empty-interface": "off",

      // Allow require statements
      "@typescript-eslint/no-var-requires": "off",

      // Allow any function type
      "@typescript-eslint/ban-types": "off",

      // Allow prefer const warnings only
      "prefer-const": "warn",

      // Disable no-undef (handled by TypeScript)
      "no-undef": "off",
    },
  },
];

export default eslintConfig;
