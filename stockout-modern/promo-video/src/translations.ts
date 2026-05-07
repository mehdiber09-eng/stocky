import type { Lang } from './theme'

type Strings = {
  // Hook
  hook_pretitle: string
  hook_a: string
  hook_b: string
  // Problem
  problem_title: string
  problem_stat: string
  problem_stat_label: string
  problem_sub: string
  // Solution
  solution_title: string
  solution_alert_title: string
  solution_alert_msg: string
  solution_kpi_risk: string
  solution_kpi_days: string
  solution_kpi_pred: string
  // Stats
  stats_title: string
  stats_1: string
  stats_1_label: string
  stats_2: string
  stats_2_label: string
  stats_3: string
  stats_3_label: string
  // CTA
  cta_title_a: string
  cta_title_b: string
  cta_pricing: string
  cta_button: string
  cta_url: string
  cta_note: string
}

const fr: Strings = {
  hook_pretitle: 'IA · DZ · MENA · EU',
  hook_a: 'Anticipe',
  hook_b: 'tes ruptures',
  problem_title: 'Une rupture de stock',
  problem_stat: '−30%',
  problem_stat_label: 'de clients perdus',
  problem_sub: 'Et 22% de CA en moins en saison',
  solution_title: "L'IA qui prédit ton stock",
  solution_alert_title: 'Rupture prévue dans 4 jours',
  solution_alert_msg: "Huile d'olive · 87%",
  solution_kpi_risk: 'Risque rupture',
  solution_kpi_days: 'Jours de stock',
  solution_kpi_pred: 'Prédiction J+30',
  stats_title: 'Résultats prouvés',
  stats_1: '91%',
  stats_1_label: 'précision IA',
  stats_2: '+22%',
  stats_2_label: 'CA en Ramadan',
  stats_3: '−87%',
  stats_3_label: 'ruptures évitées',
  cta_title_a: 'Stocky',
  cta_title_b: 'gratuit pendant 14 jours',
  cta_pricing: '1 500 DZD · 14€ · 15$ / mois',
  cta_button: 'Commence maintenant',
  cta_url: 'stocky.app',
  cta_note: 'Sans carte bancaire · Annulation libre',
}

const ar: Strings = {
  hook_pretitle: 'ذكاء اصطناعي · الجزائر · الخليج · أوروبا',
  hook_a: 'توقّع',
  hook_b: 'نفاد مخزونك',
  problem_title: 'نفاد المخزون يعني',
  problem_stat: '٣٠٪−',
  problem_stat_label: 'من الزبائن مفقودون',
  problem_sub: 'و٢٢٪ من رقم الأعمال في المواسم',
  solution_title: 'ذكاء اصطناعي يتوقّع مخزونك',
  solution_alert_title: 'نفاد متوقّع خلال ٤ أيام',
  solution_alert_msg: 'زيت الزيتون · ٨٧٪',
  solution_kpi_risk: 'خطر النفاد',
  solution_kpi_days: 'أيام المخزون',
  solution_kpi_pred: 'توقّع +٣٠ يوم',
  stats_title: 'نتائج مثبتة',
  stats_1: '٩١٪',
  stats_1_label: 'دقّة الذكاء الاصطناعي',
  stats_2: '+٢٢٪',
  stats_2_label: 'في رقم الأعمال برمضان',
  stats_3: '−٨٧٪',
  stats_3_label: 'انخفاض في النفاد',
  cta_title_a: 'Stocky',
  cta_title_b: 'مجاناً لمدّة ١٤ يوماً',
  cta_pricing: '١٥٠٠ دج · ١٤€ · ١٥$ / شهر',
  cta_button: 'ابدأ الآن',
  cta_url: 'stocky.app',
  cta_note: 'بدون بطاقة بنكيّة · إلغاء حرّ',
}

const en: Strings = {
  hook_pretitle: 'AI · DZ · MENA · EU',
  hook_a: 'Predict',
  hook_b: 'your stockouts',
  problem_title: 'A stockout means',
  problem_stat: '−30%',
  problem_stat_label: 'customers lost',
  problem_sub: 'And 22% lower revenue in season',
  solution_title: 'AI that predicts your stock',
  solution_alert_title: 'Stockout in 4 days',
  solution_alert_msg: 'Olive oil · 87%',
  solution_kpi_risk: 'Stockout risk',
  solution_kpi_days: 'Days of stock',
  solution_kpi_pred: 'Forecast D+30',
  stats_title: 'Proven results',
  stats_1: '91%',
  stats_1_label: 'AI accuracy',
  stats_2: '+22%',
  stats_2_label: 'revenue in Ramadan',
  stats_3: '−87%',
  stats_3_label: 'stockouts avoided',
  cta_title_a: 'Stocky',
  cta_title_b: 'free for 14 days',
  cta_pricing: '1,500 DZD · €14 · $15 / month',
  cta_button: 'Start now',
  cta_url: 'stocky.app',
  cta_note: 'No credit card · Cancel anytime',
}

export const translations: Record<Lang, Strings> = { fr, ar, en }
