import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

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
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3' as any,
    resources,
    lng: Localization.getLocales()[0]?.languageCode || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
