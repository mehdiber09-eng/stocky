import React, { createContext, useContext, useEffect, useState } from 'react'

type Lang = 'fr' | 'ar'

const translations = {
  fr: {
    // Navigation sidebar
    nav_dashboard: 'Tableau de bord',
    nav_predict: 'Prédiction IA',
    nav_analytics: 'Analytics',
    nav_inventory: 'Santé du Stock',
    nav_suppliers: 'Fournisseurs',
    nav_chat: 'Conseiller IA',
    nav_compare: 'Comparer',
    nav_import: 'Import CSV',
    nav_pricing: 'Tarifs',
    nav_profile: 'Profil',
    nav_products: 'Produits',
    nav_sales: 'Ventes',
    nav_scan_qr: 'Scan QR',
    nav_simulate: 'Simulation',

    // Actions communes
    btn_save: 'Sauvegarder',
    btn_cancel: 'Annuler',
    btn_delete: 'Supprimer',
    btn_edit: 'Modifier',
    btn_add: 'Ajouter',
    btn_create: 'Créer',
    btn_search: 'Rechercher...',
    btn_export: 'Exporter',
    btn_loading: 'Chargement...',
    btn_confirm: 'Confirmer',
    btn_close: 'Fermer',
    btn_back: 'Retour',
    btn_next: 'Suivant',
    btn_refresh: 'Actualiser',

    // Dashboard
    dash_title: 'Tableau de bord',
    dash_products: 'Produits',
    dash_predictions: 'Prédictions',
    dash_high_risk: 'Risque élevé',
    dash_avg_risk: 'Risque moyen',
    dash_total_sales: 'Ventes totales',
    dash_recent_sales: 'Ventes 30j',
    dash_search_placeholder: 'Rechercher par nom ou référence (SKU)...',
    dash_no_products: 'Aucun produit',
    dash_no_products_sub: 'Commencez par créer un produit pour suivre votre stock',
    dash_predict_all: 'Prédire tout',
    dash_new_product: 'Nouveau produit',
    dash_onboarding_title: 'Bienvenue sur StockSense !',
    dash_onboarding_subtitle: 'Suivez ces 3 étapes pour commencer',
    dash_create_product_btn: 'Créer un produit',

    // Predict
    pred_title: 'Prédiction IA',
    pred_select_product: 'Sélectionner un produit',
    pred_horizon: 'Horizon de prédiction',
    pred_days: 'jours',
    pred_run: 'Lancer la prédiction',
    pred_probability: 'Probabilité de rupture',
    pred_result_high: 'Risque élevé',
    pred_result_medium: 'Risque modéré',
    pred_result_low: 'Risque faible',
    pred_trials_left: 'essais gratuits restants',

    // Inventory Health
    inv_title: 'Santé du Stock',
    inv_product: 'Produit',
    inv_stock: 'Stock',
    inv_daily_sales: 'Vélocité 30j',
    inv_reorder: 'Pt. Réappro',
    inv_coverage: 'Couverture',
    inv_status: 'Statut',
    inv_actions: 'Actions',
    inv_history: 'Historique',
    inv_edit: 'Éditer',
    inv_critical: 'Critique',
    inv_warning: 'Réappro.',
    inv_ok: 'OK',
    inv_overstock: 'Surstock',
    inv_trend: 'Tendance',
    inv_no_products: 'Aucun produit trouvé',
    inv_no_products_sub: 'Créez des produits et enregistrez des ventes pour voir les données',

    // Suppliers
    sup_title: 'Fournisseurs',
    sup_add: 'Ajouter un fournisseur',
    sup_name: 'Nom du fournisseur',
    sup_email: 'Email',
    sup_phone: 'Téléphone',
    sup_lead_time: 'Délai de livraison (jours)',
    sup_no_suppliers: 'Aucun fournisseur enregistré',
    sup_no_suppliers_sub: 'Ajoutez vos fournisseurs pour les associer à vos produits',
    sup_new: 'Nouveau fournisseur',
    sup_edit: 'Modifier le fournisseur',
    sup_create_btn: 'Créer le fournisseur',
    sup_save_btn: 'Enregistrer',

    // Profile
    prof_title: 'Mon profil',
    prof_change_pwd: 'Changer le mot de passe',
    prof_current_pwd: 'Mot de passe actuel',
    prof_new_pwd: 'Nouveau mot de passe',
    prof_confirm_pwd: 'Confirmer',
    prof_alert_pref: "Préférences d'alertes",
    prof_alert_threshold: "Seuil d'alerte email",
    prof_pro_active: 'Plan Pro actif',
    prof_upgrade: 'Passer Pro',
    prof_logout: 'Se déconnecter',
    prof_update_pwd: 'Mettre à jour',
    prof_danger_zone: 'Zone dangereuse',
    prof_danger_sub: 'Déconnectez-vous de tous les appareils.',

    // Predict page extras
    pred_params: 'Paramètres',
    pred_back: 'Retour au dashboard',
    pred_gauge: 'Jauge de risque',
    pred_chart: 'Évolution du risque',
    pred_days_rupture: 'Jours avant rupture estimée',
    pred_rupture_date: 'Date de rupture estimée',
    pred_confidence: 'Intervalle de confiance',
    pred_analysis: 'Analyse...',

    // Inventory Health extras
    inv_refresh: 'Actualiser',
    inv_filter_all: 'Tout',
    inv_filter_critical: 'Critique',
    inv_filter_warning: 'Réappro.',
    inv_filter_ok: 'Sain',
    inv_filter_overstock: 'Surstock',
    inv_abc: 'Classification ABC',
    inv_score_velocity: 'Score vélocité',
    inv_history_title: 'Historique du stock',
    inv_no_movements: 'Aucun mouvement enregistré',
    inv_add_stock: 'Ajouter du stock',
    inv_delete: 'Supprimer',

    // Suppliers extras
    sup_refresh: 'Actualiser',
    sup_contact_email: 'Email de contact',
    sup_phone_label: 'Téléphone',
    sup_lead_label: 'Délai de livraison',
    sup_optional: '(optionnel)',
    sup_loading: 'Chargement...',

    // Common
    status_subscribed: 'Pro actif',
    status_free: 'Plan gratuit',
    confirm_delete_title: 'Confirmer la suppression',
    confirm_delete_msg: 'Cette action est irréversible.',
    toast_saved: 'Sauvegardé avec succès',
    toast_deleted: 'Supprimé avec succès',
    toast_error: 'Une erreur est survenue',
    theme_light: 'Mode clair',
    theme_dark: 'Mode sombre',
    logout: 'Déconnexion',
  },
  ar: {
    // Navigation sidebar
    nav_dashboard: 'لوحة التحكم',
    nav_predict: 'التنبؤ بالذكاء الاصطناعي',
    nav_analytics: 'الإحصائيات',
    nav_inventory: 'صحة المخزون',
    nav_suppliers: 'الموردون',
    nav_chat: 'المستشار الذكي',
    nav_compare: 'مقارنة',
    nav_import: 'استيراد CSV',
    nav_pricing: 'الأسعار',
    nav_profile: 'الملف الشخصي',
    nav_products: 'المنتجات',
    nav_sales: 'المبيعات',
    nav_scan_qr: 'مسح QR',
    nav_simulate: 'محاكاة السيناريوهات',

    // Actions communes
    btn_save: 'حفظ',
    btn_cancel: 'إلغاء',
    btn_delete: 'حذف',
    btn_edit: 'تعديل',
    btn_add: 'إضافة',
    btn_create: 'إنشاء',
    btn_search: 'بحث...',
    btn_export: 'تصدير',
    btn_loading: 'جار التحميل...',
    btn_confirm: 'تأكيد',
    btn_close: 'إغلاق',
    btn_back: 'رجوع',
    btn_next: 'التالي',
    btn_refresh: 'تحديث',

    // Dashboard
    dash_title: 'لوحة التحكم',
    dash_products: 'المنتجات',
    dash_predictions: 'التنبؤات',
    dash_high_risk: 'خطر مرتفع',
    dash_avg_risk: 'متوسط الخطر',
    dash_total_sales: 'إجمالي المبيعات',
    dash_recent_sales: 'مبيعات 30 يوم',
    dash_search_placeholder: 'البحث بالاسم أو الرمز (SKU)...',
    dash_no_products: 'لا توجد منتجات',
    dash_no_products_sub: 'ابدأ بإنشاء منتج لتتبع مخزونك',
    dash_predict_all: 'تنبؤ شامل',
    dash_new_product: 'منتج جديد',
    dash_onboarding_title: 'مرحباً بك في StockSense!',
    dash_onboarding_subtitle: 'اتبع هذه الخطوات الـ3 للبدء',
    dash_create_product_btn: 'إنشاء منتج',

    // Predict
    pred_title: 'التنبؤ بالذكاء الاصطناعي',
    pred_select_product: 'اختر منتجاً',
    pred_horizon: 'أفق التنبؤ',
    pred_days: 'يوم',
    pred_run: 'تشغيل التنبؤ',
    pred_probability: 'احتمالية نفاد المخزون',
    pred_result_high: 'خطر مرتفع',
    pred_result_medium: 'خطر متوسط',
    pred_result_low: 'خطر منخفض',
    pred_trials_left: 'تجارب مجانية متبقية',

    // Inventory Health
    inv_title: 'صحة المخزون',
    inv_product: 'المنتج',
    inv_stock: 'المخزون',
    inv_daily_sales: 'سرعة 30 يوم',
    inv_reorder: 'نقطة إعادة الطلب',
    inv_coverage: 'التغطية',
    inv_status: 'الحالة',
    inv_actions: 'الإجراءات',
    inv_history: 'السجل',
    inv_edit: 'تعديل',
    inv_critical: 'حرج',
    inv_warning: 'إعادة طلب',
    inv_ok: 'جيد',
    inv_overstock: 'مخزون زائد',
    inv_trend: 'الاتجاه',
    inv_no_products: 'لا توجد منتجات',
    inv_no_products_sub: 'أنشئ منتجات وسجّل مبيعات لعرض البيانات',

    // Suppliers
    sup_title: 'الموردون',
    sup_add: 'إضافة مورد',
    sup_name: 'اسم المورد',
    sup_email: 'البريد الإلكتروني',
    sup_phone: 'الهاتف',
    sup_lead_time: 'مدة التسليم (أيام)',
    sup_no_suppliers: 'لا يوجد موردون مسجلون',
    sup_no_suppliers_sub: 'أضف موردين لربطهم بمنتجاتك',
    sup_new: 'مورد جديد',
    sup_edit: 'تعديل المورد',
    sup_create_btn: 'إنشاء المورد',
    sup_save_btn: 'حفظ',

    // Profile
    prof_title: 'ملفي الشخصي',
    prof_change_pwd: 'تغيير كلمة المرور',
    prof_current_pwd: 'كلمة المرور الحالية',
    prof_new_pwd: 'كلمة المرور الجديدة',
    prof_confirm_pwd: 'تأكيد',
    prof_alert_pref: 'تفضيلات التنبيهات',
    prof_alert_threshold: 'حد تنبيه البريد',
    prof_pro_active: 'الخطة الاحترافية نشطة',
    prof_upgrade: 'الترقية إلى Pro',
    prof_logout: 'تسجيل الخروج',
    prof_update_pwd: 'تحديث',
    prof_danger_zone: 'المنطقة الخطرة',
    prof_danger_sub: 'تسجيل الخروج من جميع الأجهزة.',

    // Predict page extras
    pred_params: 'المعاملات',
    pred_back: 'العودة إلى لوحة التحكم',
    pred_gauge: 'مقياس الخطر',
    pred_chart: 'تطور الخطر',
    pred_days_rupture: 'أيام حتى النفاد المتوقع',
    pred_rupture_date: 'تاريخ النفاد المتوقع',
    pred_confidence: 'فترة الثقة',
    pred_analysis: 'تحليل...',

    // Inventory Health extras
    inv_refresh: 'تحديث',
    inv_filter_all: 'الكل',
    inv_filter_critical: 'حرج',
    inv_filter_warning: 'إعادة طلب',
    inv_filter_ok: 'جيد',
    inv_filter_overstock: 'مخزون زائد',
    inv_abc: 'تصنيف ABC',
    inv_score_velocity: 'سرعة المبيعات',
    inv_history_title: 'سجل المخزون',
    inv_no_movements: 'لا توجد حركات مسجلة',
    inv_add_stock: 'إضافة مخزون',
    inv_delete: 'حذف',

    // Suppliers extras
    sup_refresh: 'تحديث',
    sup_contact_email: 'بريد الاتصال',
    sup_phone_label: 'الهاتف',
    sup_lead_label: 'مدة التسليم',
    sup_optional: '(اختياري)',
    sup_loading: 'جار التحميل...',

    // Common
    status_subscribed: 'Pro نشط',
    status_free: 'الخطة المجانية',
    confirm_delete_title: 'تأكيد الحذف',
    confirm_delete_msg: 'هذا الإجراء لا يمكن التراجع عنه.',
    toast_saved: 'تم الحفظ بنجاح',
    toast_deleted: 'تم الحذف بنجاح',
    toast_error: 'حدث خطأ',
    theme_light: 'الوضع الفاتح',
    theme_dark: 'الوضع الداكن',
    logout: 'تسجيل الخروج',
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

function applyLangToDOM(l: Lang) {
  const isAr = l === 'ar'
  document.documentElement.dir = isAr ? 'rtl' : 'ltr'
  document.documentElement.lang = l
  if (isAr) {
    document.documentElement.classList.add('lang-ar')
  } else {
    document.documentElement.classList.remove('lang-ar')
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem('lang') as Lang) || 'fr')

  // Apply on mount
  useEffect(() => { applyLangToDOM(lang) }, [])

  function setLang(l: Lang) {
    setLangState(l)
    localStorage.setItem('lang', l)
    applyLangToDOM(l)
  }

  const t = (key: TranslationKey): string =>
    (translations[lang] as Record<string, string>)[key] || (translations.fr as Record<string, string>)[key] || key

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, isRTL: lang === 'ar' }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
