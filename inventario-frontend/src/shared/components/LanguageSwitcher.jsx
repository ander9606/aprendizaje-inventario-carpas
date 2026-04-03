import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'

const LanguageSwitcher = ({ compact = false }) => {
  const { i18n } = useTranslation()

  const toggleLanguage = () => {
    const newLang = i18n.language === 'es' ? 'en' : 'es'
    i18n.changeLanguage(newLang)
  }

  const currentLang = i18n.language?.startsWith('en') ? 'EN' : 'ES'

  // If compact, show just icon + lang code
  // Otherwise show a slightly larger button

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors text-sm font-medium"
      title={currentLang === 'ES' ? 'Switch to English' : 'Cambiar a Español'}
    >
      <Globe className="w-4 h-4" />
      <span>{currentLang}</span>
    </button>
  )
}

export default LanguageSwitcher
