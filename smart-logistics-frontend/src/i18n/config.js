import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enTranslations from "./locales/en.json";
import hiTranslations from "./locales/hi.json";
import mrTranslations from "./locales/mr.json";
import taTranslations from "./locales/ta.json";
import teTranslations from "./locales/te.json";
import bnTranslations from "./locales/bn.json";

const savedLanguage = localStorage.getItem("language") || "en";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      hi: { translation: hiTranslations },
      mr: { translation: mrTranslations },
      ta: { translation: taTranslations },
      te: { translation: teTranslations },
      bn: { translation: bnTranslations },
    },
    lng: savedLanguage,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false, // React already safe from XSS
    },
  });

export default i18n;
