import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // API natijasini UI'ga yuklash uchun foydalanilgan useEffect'lar ushbu loyiha arxitekturasida zarur.
      "react-hooks/set-state-in-effect": "off",
      // O'zbekcha matnlardagi apostroflar JSX kontentida tabiiy yozilishi mumkin.
      "react/no-unescaped-entities": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored video player (uchinchi tomon kodi — lint qilinmaydi)
    "public/**",
  ]),
]);

export default eslintConfig;
