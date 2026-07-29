import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import sayari from "@sayari/eslint-plugin";

const config = [
  ...nextCoreWebVitals,
  {
    plugins: {
      "@sayari": sayari,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      "@sayari/strict-mui-imports": "error",
      "@sayari/no-unwrapped-jsx-text": "error",
      "@sayari/polyfill-resize-observer": "error",
      "@next/next/no-img-element": "off",
    },
  },
];

export default config;
