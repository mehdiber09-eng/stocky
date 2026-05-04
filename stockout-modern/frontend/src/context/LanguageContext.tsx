import React, { createContext, useContext, useState } from 'react'

type Lang = 'fr' | 'ar'

const translations = {
  fr: {
    // Navigation
    dashboard: 'Tableau de bord',
    predict: 'Prédiction IA',
    analytics: 'Analytics',
    inventory: 'Santé du Stock',
    suppliers: 'Fournisseurs',
    chat: 'Conseiller IA',
    import: 'Import CSV',
    pricing: 'Tarifs',
    profile: 'Profil',
    // Actions
    save: 'Sauvegarder',
    cancel: 'Annuler',
    delete: 'Supprimer',
    edit: 'Modifier',
    add: 'Ajouter',
    create: 'Créer',
    search: 'Rechercher',
    export: 'Exporter',
    loading: 'Chargement...',
    // Commun
    product: 'Produit',
    stock: 'Stock',
    sales: 'Ventes',
    supplier: 'Fournisseur',
    // Messages
    success: 'Succès',
    error: 'Erreur',
    confirm_delete: 'Confirmer la suppression',
    are_you_sure: 'Êtes-vous sûr ? Cette action est irréversible.',
  },
  ar: {
    // Navigation
    dashboard: 'لوحة التحكم',
    predict: 'التنبؤ بالذكاء الاصطناعي',
    analytics: 'الإحصائيات',
    inventory: 'صحة المخزون',
    suppliers: 'الموردون',
    chat: 'مستشار ذكي',
    import: 'استيراد CSV',
    pricing: 'الأسعار',
    profile: 'الملف الشخصي',
    // Actions
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    edit: 'تعديل',
    add: 'إضافة',
    create: 'إنشاء',
    search: 'بحث',
    export: 'تصدير',
    loading: 'جار التحميل...',
    // Commun
    product: 'منتج',
    stock: 'المخزون',
    sales: 'المبيعات',
    supplier: 'مورد',
    // Messages
    success: 'نجح',
    error: 'خطأ',
    confirm_delete: 'تأكيد الحذف',
    are_you_sure: 'هل أنت متأكد؟ هذا الإجراء لا يمكن التراجع عنه.',
  },
}

type TranslationKey = keyof typeof translations.fr

interface LanguageContextType {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: TranslationKey) => string
  isRTL: boolean
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'fr',
  setLang: () => {},
  t: (key) => key,
  isRTL: false,
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem('lang') as Lang) || 'fr')

  function setLang(l: Lang) {
    setLangState(l)
    localStorage.setItem('lang', l)
    document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = l
  }

  const t = (key: TranslationKey): string => translations[lang][key] || translations.fr[key]

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, isRTL: lang === 'ar' }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
