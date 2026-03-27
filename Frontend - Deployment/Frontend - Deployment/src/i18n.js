import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      logOut: "Log-out",
      selectLanguage: "Select Language",
      english: "English",
      spanish: "Spanish",
      french: "French",
      tagalog: "Tagalog",
    },
  },
  tl: {
    translation: {
      logOut: "Mag-Log-out",
      selectLanguage: "Pumili ng Wika",
      english: "Ingles",
      spanish: "Espanyol",
      french: "Pranses",
      tagalog: "Tagalog",
    },
  },
  es: {
    translation: {
      logOut: "Cerrar sesión",
      selectLanguage: "Seleccionar idioma",
      english: "Inglés",
      spanish: "Español",
      french: "Francés",
      tagalog: "Tagalog",
    },
  },
  fr: {
    translation: {
      logOut: "Se déconnecter",
      selectLanguage: "Choisir la langue",
      english: "Anglais",
      spanish: "Espagnol",
      french: "Français",
      tagalog: "Tagalog",
    },
  },
};

i18n
  .use(initReactI18next) // Pass the i18n instance to react-i18next
  .init({
    resources,
    lng: "en", // Default language
    fallbackLng: "en", // Fallback language
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

export default i18n;
