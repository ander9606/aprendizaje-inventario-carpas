import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import commonEs from './locales/es/common.json'
import authEs from './locales/es/auth.json'
import inventoryEs from './locales/es/inventory.json'
import productsEs from './locales/es/products.json'
import rentalsEs from './locales/es/rentals.json'
import clientsEs from './locales/es/clients.json'
import operationsEs from './locales/es/operations.json'
import calendarEs from './locales/es/calendar.json'
import configEs from './locales/es/config.json'

import commonEn from './locales/en/common.json'
import authEn from './locales/en/auth.json'
import inventoryEn from './locales/en/inventory.json'
import productsEn from './locales/en/products.json'
import rentalsEn from './locales/en/rentals.json'
import clientsEn from './locales/en/clients.json'
import operationsEn from './locales/en/operations.json'
import calendarEn from './locales/en/calendar.json'
import configEn from './locales/en/config.json'

const mergeTranslations = (...modules) =>
  modules.reduce((acc, mod) => ({ ...acc, ...mod }), {})

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: {
        translation: mergeTranslations(
          commonEs, authEs, inventoryEs, productsEs,
          rentalsEs, clientsEs, operationsEs, calendarEs, configEs
        )
      },
      en: {
        translation: mergeTranslations(
          commonEn, authEn, inventoryEn, productsEn,
          rentalsEn, clientsEn, operationsEn, calendarEn, configEn
        )
      }
    },
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage']
    }
  })

export default i18n
