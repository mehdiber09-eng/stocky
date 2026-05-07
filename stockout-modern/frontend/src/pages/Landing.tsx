import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity, TrendingUp, Bell, Shield, Zap, ArrowRight, CheckCircle, Brain,
  BarChart3, AlertTriangle, QrCode, FlaskConical, Sparkles, Package, Clock,
  ChevronRight, Star, Globe, Lock, CreditCard, Smartphone, Languages, Moon,
  Wifi, MessageSquare, FileText, Users, Boxes, Calendar, ShoppingBag, Receipt,
  Banknote, Eye, Target, Layers, Cpu, LineChart, Bot, Scan,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

/* ── Animated counter ── */
function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      obs.disconnect()
      let start = 0
      const step = Math.ceil(to / 60)
      const id = setInterval(() => {
        start = Math.min(start + step, to)
        setVal(start)
        if (start >= to) clearInterval(id)
      }, 16)
    }, { threshold: 0.3 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [to])
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>
}

/* ── Reveal on scroll ── */
function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setShown(true); obs.disconnect() }
    }, { threshold: 0.15 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.8s ease ${delay}ms, transform 0.8s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

/* ── Live alert (animated) ── */
function LiveAlert({ delay, isRTL }: { delay: string; isRTL: boolean }) {
  return (
    <div
      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
      style={{
        animation: `fadeSlideUp 0.6s ease ${delay} both`,
        direction: isRTL ? 'rtl' : 'ltr',
        background: 'linear-gradient(135deg, rgba(239,68,68,0.18), rgba(239,68,68,0.08))',
        border: '1px solid rgba(239,68,68,0.35)',
        boxShadow: '0 0 24px -8px rgba(239,68,68,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
    >
      <div className="relative shrink-0">
        <span className="block w-2 h-2 rounded-full bg-red-400" />
        <span className="absolute inset-0 w-2 h-2 rounded-full bg-red-400 animate-ping" />
      </div>
      <span className="text-xs text-red-200 font-medium">
        {isRTL ? 'نفاد مخزون متوقع خلال ' : 'Rupture prévue dans '}
        <strong className="text-red-100">4 {isRTL ? 'أيام' : 'jours'}</strong>
        {' · '}{isRTL ? 'زيت الزيتون' : "Huile d'olive"}
      </span>
      <span className="ms-auto text-[10px] font-bold text-red-300 bg-red-500/20 px-1.5 py-0.5 rounded">87%</span>
    </div>
  )
}

/* ── Stars ── */
function Stars({ n = 5 }: { n?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: n }).map((_, i) => (
        <Star key={i} size={12} className="fill-amber-400 text-amber-400" />
      ))}
    </div>
  )
}

/* ── Language switch ── */
function LangSwitch() {
  const { lang, setLang } = useLanguage()
  return (
    <button
      onClick={() => setLang(lang === 'fr' ? 'ar' : 'fr')}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-zinc-400 hover:text-white hover:border-white/25 transition-all"
      title={lang === 'fr' ? 'Switch to Arabic' : 'Passer en français'}
    >
      <Globe size={13} />
      {lang === 'fr' ? 'عربي' : 'FR'}
    </button>
  )
}

/* ── Gradient icon tile ── */
function IconTile({ icon: Icon, gradient, size = 18, tileSize = 'w-10 h-10' }: { icon: any; gradient: string; size?: number; tileSize?: string }) {
  return (
    <div
      className={`${tileSize} rounded-xl flex items-center justify-center shrink-0`}
      style={{
        background: `linear-gradient(135deg, ${gradient})`,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18), 0 6px 16px -4px rgba(0,0,0,0.5)',
      }}
    >
      <Icon size={size} className="text-white" strokeWidth={2.2} />
    </div>
  )
}

export default function Landing() {
  const { isAuthenticated } = useAuth()
  const { t, isRTL } = useLanguage()
  const [scrolled, setScrolled] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)
  const mockupRef = useRef<HTMLDivElement>(null)
  const spotlightRef = useRef<HTMLDivElement>(null)

  // Header background on scroll
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  // Mouse-following spotlight + tilt on mockup
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      // Spotlight (suit la souris partout dans le hero)
      if (spotlightRef.current && heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        spotlightRef.current.style.background = `radial-gradient(600px circle at ${x}px ${y}px, rgba(99,102,241,0.10), transparent 60%)`
      }
      // Mockup tilt (effet 3D)
      if (mockupRef.current) {
        const r = mockupRef.current.getBoundingClientRect()
        const cx = r.left + r.width / 2
        const cy = r.top + r.height / 2
        const dx = (e.clientX - cx) / r.width
        const dy = (e.clientY - cy) / r.height
        const rx = Math.max(-6, Math.min(6, -dy * 8))
        const ry = Math.max(-6, Math.min(6, dx * 8))
        mockupRef.current.style.transform = `perspective(1200px) rotateX(${rx}deg) rotateY(${ry}deg)`
      }
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  /* Features (Lucide icons + gradient) */
  const FEATURES = [
    { icon: Brain,        title: t('land_feat1_title'), desc: t('land_feat1_desc'), gradient: '#6366f1, #8b5cf6' },
    { icon: QrCode,       title: t('land_feat2_title'), desc: t('land_feat2_desc'), gradient: '#06b6d4, #2563eb' },
    { icon: FlaskConical, title: t('land_feat3_title'), desc: t('land_feat3_desc'), gradient: '#f59e0b, #ea580c' },
    { icon: Bell,         title: t('land_feat4_title'), desc: t('land_feat4_desc'), gradient: '#10b981, #14b8a6' },
    { icon: BarChart3,    title: t('land_feat5_title'), desc: t('land_feat5_desc'), gradient: '#ec4899, #f43f5e' },
    { icon: Shield,       title: t('land_feat6_title'), desc: t('land_feat6_desc'), gradient: '#8b5cf6, #6366f1' },
  ]

  /* Steps with Lucide icons */
  const STEPS = [
    { n: '01', title: t('land_step1_title'), desc: t('land_step1_desc'), icon: Boxes,    gradient: '#6366f1, #8b5cf6' },
    { n: '02', title: t('land_step2_title'), desc: t('land_step2_desc'), icon: Cpu,      gradient: '#06b6d4, #6366f1' },
    { n: '03', title: t('land_step3_title'), desc: t('land_step3_desc'), icon: Bell,     gradient: '#10b981, #06b6d4' },
  ]

  const TESTIMONIALS = [
    {
      name: 'Karim B.', flag: '🇩🇿',
      role: isRTL ? 'بقالة راقية · الجزائر العاصمة' : 'Épicerie fine · Alger-Centre',
      result: isRTL ? '+22% CA en Ramadan' : '+22% CA en Ramadan',
      text: isRTL
        ? 'نبّهني Stocky قبل 11 يوماً من نفاد زيت الزيتون. طلبت بالكمية المناسبة وحققت +22% من رقم أعمالي في رمضان. لا أتخيل عملي بدونه الآن.'
        : "Stocky m'a alerté 11 jours avant la rupture de mon huile d'olive. J'ai commandé au bon moment et j'ai fait +22% de CA en Ramadan. Je ne peux plus m'en passer.",
    },
    {
      name: 'Abdullah Al-M.', flag: '🇸🇦',
      role: isRTL ? 'متجر مواد غذائية · الرياض' : 'Épicerie · Riyad',
      result: isRTL ? '4,200 ريال اقتصاد/شهر' : '4 200 SAR économisés/mois',
      text: isRTL
        ? 'النظام يفهم موسم رمضان والحج تماماً. خططت للمخزون قبل 3 أسابيع ووفّرت 4,200 ريال شهرياً من الطلبات الطارئة.'
        : "L'outil comprend parfaitement les saisons Ramadan et Hajj. J'ai planifié mes stocks 3 semaines à l'avance et économisé 4 200 SAR/mois.",
    },
    {
      name: 'Fatima R.', flag: '🇦🇪',
      role: isRTL ? 'صيدلية · دبي' : 'Pharmacie · Dubai',
      result: isRTL ? '-91% نفاد المخزون' : '-91% de ruptures',
      text: isRTL
        ? 'كنا نفقد زبائن بسبب نفاد الأدوية. مع Stocky، انخفضت حالات نفاد المخزون بنسبة 91% خلال 6 أسابيع.'
        : "On perdait des clients à cause des ruptures. Avec Stocky, -91% de ruptures en 6 semaines.",
    },
    {
      name: 'Sophie M.', flag: '🇫🇷',
      role: isRTL ? 'صيدلية · ليون' : 'Pharmacie · Lyon',
      result: isRTL ? '4h/أسبوع اقتصاد' : '4h/semaine économisées',
      text: isRTL
        ? 'استيراد CSV وفّر علينا 4 ساعات أسبوعياً. المستشار الذكي يجيب كخبير في سلسلة التوريد.'
        : "L'import CSV nous a économisé 4h/semaine. Le conseiller IA répond comme un expert supply chain.",
    },
  ]

  /* Pain points avec icônes Lucide */
  const PAINS = [
    { icon: AlertTriangle, color: '#f87171', title: t('land_pain1_title'), desc: t('land_pain1_desc'), loss: t('land_pain1_loss') },
    { icon: TrendingUp,    color: '#fbbf24', title: t('land_pain2_title'), desc: t('land_pain2_desc'), loss: t('land_pain2_loss') },
    { icon: Clock,         color: '#f97316', title: t('land_pain3_title'), desc: t('land_pain3_desc'), loss: t('land_pain3_loss') },
  ]

  /* Marquee features */
  const MARQUEE = [
    { icon: Brain,         text: 'Prédictions IA temps réel' },
    { icon: Boxes,         text: 'Gestion stock avancée' },
    { icon: Bell,          text: 'Alertes rupture auto' },
    { icon: BarChart3,     text: 'Analytics & tendances' },
    { icon: Bot,           text: 'Conseiller IA Groq' },
    { icon: Scan,          text: 'Scanner QR code' },
    { icon: Moon,          text: 'Mode Ramadan' },
    { icon: CreditCard,    text: 'Dahabia · CIB · PayPal' },
    { icon: Layers,        text: 'ABC Analysis' },
    { icon: Banknote,      text: 'SAR · AED · QAR · EUR' },
    { icon: ShoppingBag,   text: 'Mode Caisse QR' },
    { icon: FlaskConical,  text: 'Simulation stock' },
  ]

  /* Markets — features par pays avec icônes */
  const ALG_FEATURES = isRTL ? [
    { icon: CreditCard, text: 'داهبية CCP + CIB — دفع جزائري 100%' },
    { icon: Banknote,   text: 'دينار جزائري DZD — أسعار محلية' },
    { icon: Moon,       text: 'وضع رمضان — توقع ذروة المبيعات' },
    { icon: Wifi,       text: 'يعمل مع اتصال محدود — محسّن للشبكة' },
    { icon: Languages,  text: 'عربي + فرنسي — ثنائي اللغة بالكامل' },
    { icon: Scan,       text: 'مسح باركود EAN محلي 613...' },
  ] : [
    { icon: CreditCard, text: 'Dahabia CCP + CIB — paiement 100% algérien' },
    { icon: Banknote,   text: 'Dinar algérien DZD — prix en local' },
    { icon: Moon,       text: 'Mode Ramadan — prédiction des pics de vente' },
    { icon: Wifi,       text: 'Fonctionne avec connexion limitée — optimisé 3G' },
    { icon: Languages,  text: 'Arabe + Français — 100% bilingue' },
    { icon: Scan,       text: 'Scan barcode EAN algérien 613...' },
  ]

  const FR_FEATURES = isRTL ? [
    { icon: Banknote,    text: 'يورو EUR — تسعير أوروبي' },
    { icon: CreditCard,  text: 'PayPal · Visa · Mastercard' },
    { icon: FileText,    text: 'تصدير CSV للمحاسبة والضرائب' },
    { icon: Bell,        text: 'تنبيهات بريد إلكتروني تلقائية' },
    { icon: Bot,         text: 'مستشار ذكاء اصطناعي سلسلة التوريد' },
    { icon: LineChart,   text: 'تحليل ABC وسرعة دوران المخزون' },
  ] : [
    { icon: Banknote,    text: 'Euro EUR — tarification européenne' },
    { icon: CreditCard,  text: 'PayPal · Visa · Mastercard' },
    { icon: FileText,    text: 'Export CSV pour comptabilité / TVA' },
    { icon: Bell,        text: 'Alertes email automatiques ruptures' },
    { icon: Bot,         text: 'Conseiller IA supply chain (Groq)' },
    { icon: LineChart,   text: 'Analyse ABC & vélocité des ventes' },
  ]

  const GULF_FEATURES = isRTL ? [
    { icon: Banknote,    text: 'ريال سعودي SAR · درهم AED · ريال قطري QAR' },
    { icon: Moon,        text: 'وضع رمضان + الحج + عيد الأضحى تلقائياً' },
    { icon: MessageSquare, text: 'تنبيهات واتساب للمورد بالعربية' },
    { icon: Languages,   text: 'واجهة عربية RTL كاملة — بدون ترجمة آلية' },
    { icon: Calendar,    text: 'توقع تقلبات المخزون في المواسم' },
    { icon: CreditCard,  text: 'دفع دولي PayPal / Visa — لا قيود' },
  ] : [
    { icon: Banknote,    text: 'SAR · AED · QAR — prix en devise locale' },
    { icon: Moon,        text: 'Mode Ramadan + Hajj + Aïd automatique' },
    { icon: MessageSquare, text: 'Alertes WhatsApp fournisseur en arabe' },
    { icon: Languages,   text: 'Interface arabe RTL native (pas de traduction auto)' },
    { icon: Calendar,    text: 'Prédiction pics saisonniers : Omra, Ramadan...' },
    { icon: CreditCard,  text: 'Paiement international PayPal / Visa' },
  ]

  return (
    <div className="min-h-screen text-zinc-100 overflow-x-hidden" style={{ background: '#06060c' }}>

      {/* ── BANNER PAYS ── */}
      <div className="relative z-50 overflow-hidden" style={{ background: 'linear-gradient(90deg,rgba(16,185,129,0.12),rgba(99,102,241,0.12),rgba(251,191,36,0.12))', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center justify-center gap-1 py-2" style={{ animation: 'marquee 30s linear infinite', width: 'max-content', margin: '0 auto' }}>
          {[
            { flag: '🇩🇿', name: 'Algérie',         color: '#10b981' },
            { flag: '🇸🇦', name: 'Arabie Saoudite', color: '#f59e0b' },
            { flag: '🇦🇪', name: 'Émirats Arabes',  color: '#f59e0b' },
            { flag: '🇶🇦', name: 'Qatar',           color: '#f59e0b' },
            { flag: '🇰🇼', name: 'Koweït',          color: '#f59e0b' },
            { flag: '🇫🇷', name: 'France',          color: '#818cf8' },
            { flag: '🇲🇦', name: 'Maroc',           color: '#10b981' },
            { flag: '🇹🇳', name: 'Tunisie',         color: '#10b981' },
            { flag: '🇩🇿', name: 'Algérie',         color: '#10b981' },
            { flag: '🇸🇦', name: 'Arabie Saoudite', color: '#f59e0b' },
            { flag: '🇦🇪', name: 'Émirats Arabes',  color: '#f59e0b' },
            { flag: '🇶🇦', name: 'Qatar',           color: '#f59e0b' },
            { flag: '🇰🇼', name: 'Koweït',          color: '#f59e0b' },
            { flag: '🇫🇷', name: 'France',          color: '#818cf8' },
            { flag: '🇲🇦', name: 'Maroc',           color: '#10b981' },
            { flag: '🇹🇳', name: 'Tunisie',         color: '#10b981' },
          ].map((c, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 px-4 text-xs font-semibold shrink-0">
              <span>{c.flag}</span>
              <span style={{ color: c.color }}>{c.name}</span>
              <span className="text-zinc-800 ml-2">·</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── NAV ── */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-black/85 backdrop-blur-xl border-b border-white/8' : ''}`}>
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg,#6366f1,#d946ef)', boxShadow: '0 4px 12px -2px rgba(99,102,241,0.5)' }}>
              <Activity size={15} className="text-white" />
            </div>
            <span className="font-bold text-white tracking-tight">Stocky</span>
            {isAuthenticated && (
              <span className="ms-1 text-[10px] bg-brand-500/20 text-brand-400 border border-brand-500/30 px-2 py-0.5 rounded-full">
                {t('land_connected')}
              </span>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-7 text-sm text-zinc-400">
            <button onClick={() => scrollTo('features')} className="hover:text-white transition-colors">{t('land_nav_features')}</button>
            <button onClick={() => scrollTo('how-it-works')} className="hover:text-white transition-colors">{t('land_nav_how')}</button>
            <Link to="/pricing" className="hover:text-white transition-colors">{t('nav_pricing')}</Link>
          </div>

          <div className="flex items-center gap-2">
            <LangSwitch />
            {isAuthenticated ? (
              <Link to="/dashboard">
                <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90"
                        style={{ background: 'linear-gradient(135deg,#6366f1,#d946ef)' }}>
                  Dashboard <ChevronRight size={14} />
                </button>
              </Link>
            ) : (
              <>
                <Link to="/login" className="hidden sm:block px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">
                  {t('land_nav_login')}
                </Link>
                <Link to="/register">
                  <button className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 hover:scale-[1.02]"
                          style={{ background: 'linear-gradient(135deg,#6366f1,#d946ef)' }}>
                    {t('land_nav_start')}
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex flex-col items-center justify-center px-5 sm:px-8 text-center pt-24 pb-20"
      >
        {/* Mouse-following spotlight */}
        <div ref={spotlightRef} aria-hidden className="pointer-events-none absolute inset-0 z-0 transition-[background] duration-300" />

        {/* Static mesh gradient + grid */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-[-10%] left-[10%] w-[700px] h-[700px] rounded-full"
               style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)', animation: 'float 18s ease-in-out infinite' }} />
          <div className="absolute top-[20%] right-[-5%] w-[500px] h-[500px] rounded-full"
               style={{ background: 'radial-gradient(circle, rgba(217,70,239,0.12) 0%, transparent 70%)', animation: 'float 22s ease-in-out infinite reverse' }} />
          <div className="absolute bottom-[10%] left-[30%] w-[400px] h-[400px] rounded-full"
               style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.10) 0%, transparent 70%)', animation: 'float 26s ease-in-out infinite' }} />
          {/* Dotted grid (Vercel-style) */}
          <div className="absolute inset-0 opacity-[0.5]" style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.10) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
            maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)',
          }} />
        </div>

        {/* Badge top */}
        <div className="relative inline-flex items-center gap-2.5 rounded-full px-4 py-2 text-xs text-zinc-200 mb-8 font-semibold"
             style={{
               animation: 'fadeSlideUp 0.5s ease 0.1s both',
               background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(217,70,239,0.18))',
               border: '1px solid rgba(99,102,241,0.4)',
               boxShadow: '0 0 30px -8px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
             }}>
          <span className="relative flex">
            <span className="block w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          </span>
          <Sparkles size={11} className="text-brand-300" />
          {isRTL
            ? 'الجزائر · السعودية · الإمارات · فرنسا — 2,300+ تاجر نشط'
            : 'DZ · Golfe · Émirats · France — 2 300+ commerçants actifs'}
        </div>

        {/* Title */}
        <h1 className="relative text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight mb-6 leading-[1.0]"
            style={{ animation: 'fadeSlideUp 0.6s ease 0.2s both' }}>
          <span className="text-white">{t('land_hero_h1a')}</span>
          <br />
          <span style={{
            background: 'linear-gradient(135deg, #818cf8 0%, #c084fc 40%, #38bdf8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 4px 24px rgba(192,132,252,0.25))',
          }}>
            {t('land_hero_h1b')}
          </span>
        </h1>

        <p className="relative text-zinc-400 text-lg sm:text-xl max-w-xl mx-auto mb-10 leading-relaxed"
           style={{ animation: 'fadeSlideUp 0.6s ease 0.3s both' }}>
          {t('land_hero_sub')}
          <br className="hidden sm:block" /> {t('land_hero_sub2')}
        </p>

        <div className="relative flex flex-col sm:flex-row items-center gap-3 mb-5"
             style={{ animation: 'fadeSlideUp 0.6s ease 0.4s both' }}>
          <Link to="/register" className="w-full sm:w-auto group">
            <button className="relative w-full flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-bold text-white transition-all hover:scale-[1.04] hover:brightness-110 active:scale-[0.99] overflow-hidden"
                    style={{ background: 'linear-gradient(135deg,#6366f1,#d946ef)', boxShadow: '0 0 50px rgba(99,102,241,0.5), inset 0 1px 0 rgba(255,255,255,0.2)' }}>
              <span className="relative z-10">{t('land_cta_start')}</span>
              <ArrowRight size={18} className="relative z-10 transition-transform group-hover:translate-x-1" />
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </button>
          </Link>
          <button
            onClick={() => scrollTo('how-it-works')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold text-zinc-300 border border-white/12 hover:border-white/30 hover:text-white hover:bg-white/5 transition-all"
          >
            {t('land_cta_demo')}
          </button>
        </div>

        <p className="relative text-xs text-zinc-600" style={{ animation: 'fadeSlideUp 0.5s ease 0.5s both' }}>
          {t('land_free_note')}
        </p>

        {/* Trust bar */}
        <div className="relative mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-zinc-500"
             style={{ animation: 'fadeSlideUp 0.5s ease 0.6s both' }}>
          <span className="flex items-center gap-1.5"><Lock size={11} /> SSL sécurisé</span>
          <span className="w-px h-3 bg-white/8 hidden sm:block" />
          <span className="flex items-center gap-1.5"><CreditCard size={11} /> Dahabia · CIB · PayPal · Visa</span>
          <span className="w-px h-3 bg-white/8 hidden sm:block" />
          <span className="flex items-center gap-1.5"><Globe size={11} /> DZ · MENA · EU</span>
          <span className="w-px h-3 bg-white/8 hidden sm:block" />
          <span className="flex items-center gap-1.5"><Zap size={11} /> Annulation libre</span>
        </div>

        {/* Hero mockup avec tilt 3D */}
        <div
          ref={mockupRef}
          className="relative mt-16 w-full max-w-2xl mx-auto transition-transform duration-200 ease-out"
          style={{ animation: 'fadeSlideUp 0.8s ease 0.5s both', transformStyle: 'preserve-3d' }}
        >
          <div className="rounded-3xl border border-white/10 p-1 relative"
               style={{
                 background: 'rgba(15,15,22,0.85)',
                 backdropFilter: 'blur(20px)',
                 boxShadow: '0 50px 140px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06), 0 0 80px rgba(99,102,241,0.12)',
               }}>
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <div className="flex-1 flex items-center justify-center">
                <span className="text-xs text-zinc-500 bg-white/5 px-4 py-1 rounded-lg font-mono">stocky.app — Dashboard IA</span>
              </div>
            </div>
            <div className="p-5 space-y-3">
              {/* KPI cards */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: isRTL ? 'خطر النفاد' : 'Risque rupture', val: '87%', color: '#f87171', glow: 'rgba(248,113,113,0.3)', w: 87, icon: AlertTriangle },
                  { label: isRTL ? 'أيام المخزون' : 'Jours de stock', val: '4j', color: '#fbbf24', glow: 'rgba(251,191,36,0.2)', w: 26, icon: Clock },
                  { label: isRTL ? 'توقع +30 يوم' : 'Prédiction J+30', val: '91%', color: '#818cf8', glow: 'rgba(129,140,248,0.2)', w: 91, icon: Target },
                ].map(({ label, val, color, glow, w, icon: Icon }) => (
                  <div key={label} className="rounded-xl p-3 border border-white/10" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[10px] text-zinc-500">{label}</p>
                      <Icon size={10} style={{ color }} />
                    </div>
                    <p className="text-sm font-bold" style={{ color }}>{val}</p>
                    <div className="mt-2 h-1.5 bg-white/8 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${w}%`, background: color, boxShadow: `0 0 8px ${glow}` }} />
                    </div>
                  </div>
                ))}
              </div>
              <LiveAlert delay="0.9s" isRTL={isRTL} />
              <div className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
                   style={{
                     animation: 'fadeSlideUp 0.6s ease 1.0s both',
                     direction: isRTL ? 'rtl' : 'ltr',
                     background: 'linear-gradient(135deg, rgba(245,158,11,0.18), rgba(245,158,11,0.06))',
                     border: '1px solid rgba(245,158,11,0.35)',
                     boxShadow: '0 0 24px -8px rgba(245,158,11,0.4)',
                   }}>
                <div className="relative shrink-0">
                  <span className="block w-2 h-2 rounded-full bg-amber-400" />
                  <span className="absolute inset-0 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                </div>
                <span className="text-xs text-amber-200 font-medium">
                  {isRTL ? <><strong>تنبيه رمضان</strong> · أرز بسمتي — طلب متوقع ×3.2</> : <><strong>Alerte Ramadan</strong> · Riz basmati — demande ×3.2 prévue</>}
                </span>
                <span className="ms-auto text-[10px] font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded shrink-0">SAR</span>
              </div>
              <div className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
                   style={{
                     animation: 'fadeSlideUp 0.5s ease 1.1s both',
                     background: 'linear-gradient(135deg, rgba(16,185,129,0.18), rgba(16,185,129,0.06))',
                     border: '1px solid rgba(16,185,129,0.35)',
                   }}>
                <CheckCircle size={13} className="text-emerald-400 shrink-0" />
                <span className="text-xs text-emerald-200">
                  {isRTL ? 'قهوة عربية · مخزون سليم · 42 وحدة · 12% خطر' : 'Café arabica · Stock sain · 42 unités · Risque 12%'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="relative mt-12 flex flex-col items-center gap-2 text-zinc-600 text-xs" style={{ animation: 'fadeSlideUp 1s ease 1.2s both' }}>
          <span>{isRTL ? 'اكتشف' : 'Découvrir'}</span>
          <div className="w-5 h-8 rounded-full border border-white/15 flex items-start justify-center p-1">
            <span className="w-0.5 h-2 rounded-full bg-zinc-500" style={{ animation: 'scrollHint 2s ease infinite' }} />
          </div>
        </div>
      </section>

      {/* ── MARQUEE FEATURES ── */}
      <div className="border-y border-white/8 py-3 overflow-hidden" style={{ background: 'rgba(99,102,241,0.04)' }}>
        <div className="flex items-center gap-0" style={{ animation: 'marquee 32s linear infinite', width: 'max-content' }}>
          {[...MARQUEE, ...MARQUEE].map(({ icon: Icon, text }, i) => (
            <span key={i} className="inline-flex items-center gap-2 px-6 text-xs text-zinc-400 font-medium shrink-0">
              <Icon size={12} className="text-brand-400" />
              {text}
              <span className="w-1 h-1 rounded-full bg-zinc-700 shrink-0 ms-2" />
            </span>
          ))}
        </div>
      </div>

      {/* ── STATS BAR ── */}
      <section className="border-b border-white/8 py-12" style={{ background: 'rgba(255,255,255,0.015)' }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { val: 91,  suffix: '%', label: isRTL ? 'دقة التنبؤ بالذكاء الاصطناعي' : 'Précision IA réelle',         sublabel: '±4% intervalle de confiance',    color: '#818cf8' },
              { val: 22,  suffix: '%', label: isRTL ? 'زيادة في رقم الأعمال (رمضان)' : 'CA moyen en + (Ramadan)',     sublabel: 'Mesuré sur 400+ boutiques',     color: '#34d399' },
              { val: 2300,suffix: '+', label: isRTL ? 'تاجر نشط — DZ · Golfe · FR'  : 'Commerçants actifs DZ·Golfe·FR', sublabel: 'Épiceries, pharmacies, import-export', color: '#c084fc' },
              { val: 87,  suffix: '%', label: isRTL ? 'انخفاض في نفاد المخزون'      : 'Ruptures évitées en moyenne', sublabel: 'Dès les 6 premières semaines',  color: '#fbbf24' },
            ].map(({ val, suffix, label, sublabel, color }) => (
              <Reveal key={label}>
                <p className="text-3xl sm:text-5xl font-black mb-1" style={{ color, textShadow: `0 0 32px ${color}40` }}>
                  <Counter to={val} suffix={suffix} />
                </p>
                <p className="text-xs text-zinc-300 font-medium">{label}</p>
                <p className="text-[10px] text-zinc-600 mt-0.5">{sublabel}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── PAIN POINTS ── */}
      <section className="py-24 sm:py-32 px-5 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-16">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-4">{t('land_pain_label')}</p>
            <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">{t('land_pain_h2')}</h2>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PAINS.map(({ icon: Icon, color, title, desc, loss }, i) => (
              <Reveal key={title} delay={i * 100}>
                <div className="group relative rounded-2xl border border-white/10 p-6 hover:border-white/20 transition-all hover:-translate-y-1 h-full overflow-hidden"
                     style={{ background: 'rgba(255,255,255,0.025)' }}>
                  {/* Glow on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                       style={{ background: `radial-gradient(circle at top, ${color}15, transparent 60%)` }} />
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                         style={{ background: `${color}20`, border: `1px solid ${color}40`, boxShadow: `0 0 24px -6px ${color}50` }}>
                      <Icon size={20} style={{ color }} strokeWidth={2.2} />
                    </div>
                    <h3 className="font-bold text-white mb-2 text-base">{title}</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed mb-4">{desc}</p>
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                         style={{ color, background: `${color}18`, border: `1px solid ${color}40` }}>
                      <AlertTriangle size={10} /> {loss}
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24 sm:py-32 px-5 sm:px-8 border-t border-white/8">
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-16">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-4">{t('land_how_label')}</p>
            <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">
              {t('land_how_h2').split('5')[0]}<span style={{ background: 'linear-gradient(135deg,#818cf8,#c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>5 {isRTL ? 'دقائق' : 'minutes'}</span>
            </h2>
            <p className="text-zinc-500 mt-4 text-base max-w-lg mx-auto">{t('land_how_sub')}</p>
          </Reveal>
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map(({ n, title, desc, icon: Icon, gradient }, i) => (
              <Reveal key={n} delay={i * 120}>
                <div className="relative group rounded-2xl border border-white/10 p-7 h-full hover:border-white/20 transition-all hover:-translate-y-1 overflow-hidden"
                     style={{ background: 'rgba(255,255,255,0.025)' }}>
                  {/* Glow on hover */}
                  <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                       style={{ background: `radial-gradient(circle, ${gradient.split(',')[0]}30, transparent 70%)`, filter: 'blur(20px)' }} />
                  <div className="relative">
                    <IconTile icon={Icon} gradient={gradient} size={22} tileSize="w-14 h-14" />
                    <div className="text-xs font-bold text-zinc-500 tracking-widest mt-5 mb-2">
                      {isRTL ? `الخطوة ${['١','٢','٣'][i]}` : `ÉTAPE ${n}`}
                    </div>
                    <h3 className="font-bold text-white text-lg mb-2">{title}</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed">{desc}</p>
                  </div>
                  {i < 2 && (
                    <div className={`hidden md:flex absolute top-12 z-10 items-center justify-center w-7 h-7 rounded-full ${isRTL ? '-left-3.5' : '-right-3.5'}`}
                         style={{ background: 'rgb(20,20,26)', border: '1px solid rgba(255,255,255,0.15)' }}>
                      <ArrowRight size={12} className={`text-zinc-400 ${isRTL ? 'rotate-180' : ''}`} />
                    </div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES BENTO GRID ── */}
      <section id="features" className="py-24 sm:py-32 px-5 sm:px-8 border-t border-white/8"
               style={{ background: 'rgba(255,255,255,0.015)' }}>
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-16">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-4">{t('land_feat_label')}</p>
            <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">
              {t('land_feat_h2a')}<br className="hidden sm:block" />{' '}
              <span style={{ background: 'linear-gradient(135deg,#c084fc,#e879f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{t('land_feat_h2b')}</span>
            </h2>
          </Reveal>
          {/* Bento layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc, gradient }, i) => (
              <Reveal key={title} delay={i * 80}>
                <div className="group relative rounded-2xl border border-white/10 p-6 hover:border-white/20 transition-all hover:-translate-y-1 cursor-default h-full overflow-hidden"
                     style={{ background: 'rgba(255,255,255,0.025)' }}>
                  {/* gradient orb on hover */}
                  <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-0 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none"
                       style={{ background: `radial-gradient(circle, ${gradient.split(',')[0].trim()}, transparent 70%)`, filter: 'blur(30px)' }} />
                  <div className="relative">
                    <IconTile icon={Icon} gradient={gradient} size={20} />
                    <h3 className="font-bold text-white mb-1.5 text-sm mt-4">{title}</h3>
                    <p className="text-zinc-400 text-xs leading-relaxed">{desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── MARKET MODE ── */}
      <section className="py-24 sm:py-32 px-5 sm:px-8 border-t border-white/8">
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-16">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-4">{t('land_market_label')}</p>
            <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">{t('land_market_h2')}</h2>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Algeria */}
            <Reveal>
              <div className="rounded-2xl border p-7 h-full"
                   style={{ background: 'linear-gradient(180deg, rgba(16,185,129,0.10), rgba(16,185,129,0.02))', borderColor: 'rgba(16,185,129,0.35)', boxShadow: '0 0 40px -10px rgba(16,185,129,0.2)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-3xl">🇩🇿</span>
                </div>
                <h3 className="font-bold text-white text-lg mb-1">{isRTL ? 'الجزائر' : 'Algérie'}</h3>
                <p className="text-xs text-emerald-400/90 mb-5">{isRTL ? 'الجزائر العاصمة · وهران · قسنطينة · سطيف' : 'Alger · Oran · Constantine · Sétif'}</p>
                <ul className="space-y-3">
                  {ALG_FEATURES.map(({ icon: Icon, text }) => (
                    <li key={text} className="flex items-start gap-2.5 text-sm text-zinc-300">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                           style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
                        <Icon size={13} className="text-emerald-400" />
                      </div>
                      <span className="leading-snug">{text}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 rounded-xl px-3 py-2.5" style={{ background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.3)' }}>
                  <p className="text-[11px] text-emerald-300 font-semibold flex items-center gap-1.5">
                    <BarChart3 size={11} /> {isRTL ? 'مثال حقيقي — بقالة في الجزائر العاصمة' : 'Résultat réel — épicerie à Alger'}
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    {isRTL ? '+22% في رقم الأعمال برمضان بعد 4 أسابيع' : '+22% de CA en Ramadan après 4 semaines'}
                  </p>
                </div>
              </div>
            </Reveal>
            {/* France */}
            <Reveal delay={100}>
              <div className="rounded-2xl border p-7 h-full"
                   style={{ background: 'linear-gradient(180deg, rgba(59,130,246,0.10), rgba(59,130,246,0.02))', borderColor: 'rgba(59,130,246,0.35)', boxShadow: '0 0 40px -10px rgba(59,130,246,0.2)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-3xl">🇫🇷</span>
                  <span className="text-lg">🇧🇪</span>
                  <span className="text-lg">🇨🇭</span>
                </div>
                <h3 className="font-bold text-white text-lg mb-1">France & Europe</h3>
                <p className="text-xs text-blue-400/90 mb-5">Paris · Lyon · Marseille · Bruxelles</p>
                <ul className="space-y-3">
                  {FR_FEATURES.map(({ icon: Icon, text }) => (
                    <li key={text} className="flex items-start gap-2.5 text-sm text-zinc-300">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                           style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}>
                        <Icon size={13} className="text-blue-400" />
                      </div>
                      <span className="leading-snug">{text}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 rounded-xl px-3 py-2.5" style={{ background: 'rgba(59,130,246,0.10)', border: '1px solid rgba(59,130,246,0.3)' }}>
                  <p className="text-[11px] text-blue-300 font-semibold flex items-center gap-1.5">
                    <BarChart3 size={11} /> {isRTL ? 'مثال حقيقي — صيدلية في ليون' : 'Résultat réel — pharmacie à Lyon'}
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    {isRTL ? '4 ساعات/أسبوع توفير في الجرد — من يوم 1' : '4h/semaine économisées sur l\'inventaire — dès le 1er jour'}
                  </p>
                </div>
              </div>
            </Reveal>
            {/* Gulf */}
            <Reveal delay={200}>
              <div className="rounded-2xl border p-7 relative overflow-hidden h-full"
                   style={{ background: 'linear-gradient(180deg, rgba(251,191,36,0.10), rgba(245,158,11,0.02))', borderColor: 'rgba(251,191,36,0.35)', boxShadow: '0 0 40px -10px rgba(251,191,36,0.25)' }}>
                <div className="absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-full"
                     style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff', boxShadow: '0 4px 12px -2px rgba(245,158,11,0.5)' }}>
                  {isRTL ? 'سوق نامٍ' : 'MARCHÉ EN HAUSSE'}
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <Moon size={26} className="text-amber-400" strokeWidth={2.2} />
                  <div className="flex gap-1">
                    {['🇸🇦','🇦🇪','🇶🇦','🇰🇼','🇧🇭'].map(f => <span key={f} className="text-lg">{f}</span>)}
                  </div>
                </div>
                <h3 className="font-bold text-white text-lg mb-1">{isRTL ? 'دول الخليج العربي' : 'Golfe Arabique'}</h3>
                <p className="text-xs text-amber-400/90 mb-5">{isRTL ? 'السعودية · الإمارات · قطر · الكويت · البحرين' : 'Arabie Saoudite · Émirats · Qatar · Koweït · Bahreïn'}</p>
                <ul className="space-y-3">
                  {GULF_FEATURES.map(({ icon: Icon, text }) => (
                    <li key={text} className="flex items-start gap-2.5 text-sm text-zinc-300">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                           style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)' }}>
                        <Icon size={13} className="text-amber-400" />
                      </div>
                      <span className="leading-snug">{text}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 rounded-xl px-3 py-2.5" style={{ background: 'rgba(251,191,36,0.10)', border: '1px solid rgba(251,191,36,0.3)' }}>
                  <p className="text-[11px] text-amber-300 font-semibold flex items-center gap-1.5">
                    <BarChart3 size={11} /> {isRTL ? 'مثال حقيقي — متجر في الرياض' : 'Résultat réel — boutique à Riyad'}
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    {isRTL ? 'وفّر 4,200 ريال/شهر بعد 6 أسابيع فقط' : 'Économie de 4 200 SAR/mois après 6 semaines'}
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24 sm:py-32 px-5 sm:px-8 border-t border-white/8" style={{ background: 'rgba(255,255,255,0.015)' }}>
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-16">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-4">{t('land_testi_label')}</p>
            <h2 className="text-3xl sm:text-5xl font-black text-white">{t('land_testi_h2')}</h2>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {TESTIMONIALS.map(({ name, role, flag, text, result }, i) => (
              <Reveal key={name} delay={i * 80}>
                <div className="rounded-2xl border border-white/10 p-5 flex flex-col gap-3 hover:border-white/25 transition-all hover:-translate-y-1 h-full"
                     style={{ background: 'rgba(255,255,255,0.025)' }}>
                  <div className="flex items-center justify-between">
                    <Stars />
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-emerald-300 bg-emerald-500/15 border border-emerald-500/30">
                      {result}
                    </span>
                  </div>
                  <p className="text-zinc-300 text-xs leading-relaxed flex-1">"{text}"</p>
                  <div className="pt-3 border-t border-white/8 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0"
                         style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(217,70,239,0.15))', border: '1px solid rgba(255,255,255,0.1)' }}>
                      {flag}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{name}</p>
                      <p className="text-zinc-500 text-xs">{role}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING PREVIEW ── */}
      <section className="py-24 sm:py-32 px-5 sm:px-8 border-t border-white/8">
        <div className="max-w-3xl mx-auto">
          <Reveal className="text-center mb-14">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-4">{t('land_price_label')}</p>
            <h2 className="text-3xl sm:text-5xl font-black text-white">{t('land_price_h2')}</h2>
            <p className="text-zinc-400 mt-3 text-sm">{t('land_price_sub')}</p>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
            <Reveal>
              <div className="rounded-2xl border border-white/12 p-7 h-full" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <p className="font-bold text-white text-lg mb-1">{isRTL ? 'مجاني' : 'Gratuit'}</p>
                <p className="text-4xl font-black text-white mb-1">0 <span className="text-lg text-zinc-500 font-normal">DA</span></p>
                <p className="text-zinc-500 text-xs mb-6">{isRTL ? 'لاكتشاف بلا مخاطرة' : 'Pour découvrir sans risque · 0 € · 0 $'}</p>
                {(isRTL
                  ? ['5 تنبؤات ذكاء اصطناعي', 'جميع منتجاتك', 'تصدير CSV', 'مستشار ذكي']
                  : ['5 prédictions IA', 'Tous vos produits', 'Export CSV', 'Conseiller IA']
                ).map(f => (
                  <div key={f} className="flex items-center gap-2 text-sm text-zinc-300 mb-2.5">
                    <CheckCircle size={13} className="text-zinc-500 shrink-0" /> {f}
                  </div>
                ))}
                <Link to="/register">
                  <button className="w-full mt-5 py-3 rounded-xl border border-white/12 text-sm font-medium text-zinc-200 hover:border-white/30 hover:bg-white/5 transition-all">
                    {t('land_nav_start')}
                  </button>
                </Link>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <div className="relative rounded-2xl p-7 h-full"
                   style={{ background: 'linear-gradient(180deg, rgba(99,102,241,0.18), rgba(217,70,239,0.10))', border: '1px solid rgba(99,102,241,0.5)', boxShadow: '0 0 50px -10px rgba(99,102,241,0.4)' }}>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold text-white px-3 py-1 rounded-full"
                     style={{ background: 'linear-gradient(135deg,#6366f1,#d946ef)', boxShadow: '0 4px 12px -2px rgba(99,102,241,0.6)' }}>
                  {isRTL ? 'موصى به' : 'Recommandé'}
                </div>
                <p className="font-bold text-white text-lg mb-1">Pro</p>
                <p className="text-4xl font-black text-white mb-1">1 500 <span className="text-lg text-zinc-300 font-normal">DA</span></p>
                <div className="flex items-center flex-wrap gap-1.5 mb-1">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">≈ 14 €</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">≈ 15 $</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">≈ 56 SAR</span>
                </div>
                <p className="text-zinc-300 text-xs mb-6">{isRTL ? 'شهرياً · بدون التزام · إلغاء حر' : 'par mois · Sans engagement · Annulation libre'}</p>
                {(isRTL
                  ? ['تنبؤات غير محدودة', 'تنبيهات بريد تلقائية', 'تحليلات متقدمة', 'دعم أولوي 7 أيام/7']
                  : ['Prédictions illimitées', 'Alertes email auto', 'Analytics avancés', 'Support prioritaire 7j/7']
                ).map(f => (
                  <div key={f} className="flex items-center gap-2 text-sm text-zinc-100 mb-2.5">
                    <CheckCircle size={13} className="text-brand-300 shrink-0" /> {f}
                  </div>
                ))}
                <Link to="/register">
                  <button className="w-full mt-5 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 hover:scale-[1.02]"
                          style={{ background: 'linear-gradient(135deg,#6366f1,#d946ef)', boxShadow: '0 8px 24px -8px rgba(99,102,241,0.6)' }}>
                    {isRTL ? 'جرّب 14 يوماً مجاناً' : 'Essayer 14 jours gratuits'}
                  </button>
                </Link>
              </div>
            </Reveal>
          </div>
          <div className="text-center">
            <Link to="/pricing" className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors underline underline-offset-4">
              {isRTL ? 'عرض الأسعار الكاملة' : 'Voir les tarifs complets'} <ArrowRight size={13} className={isRTL ? 'rotate-180' : ''} />
            </Link>
          </div>
          <div className="flex items-center justify-center gap-4 mt-6 text-xs text-zinc-500">
            <span className="flex items-center gap-1"><Lock size={10} /> {isRTL ? 'دفع آمن' : 'Paiement sécurisé'}</span>
            <span className="flex items-center gap-1"><Globe size={10} /> DZ &amp; FR</span>
            <span className="flex items-center gap-1"><Zap size={10} /> {isRTL ? 'إلغاء حر' : 'Annulation libre'}</span>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-32 px-5 sm:px-8 border-t border-white/8 text-center relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[450px] rounded-full blur-[100px]"
               style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.30) 0%, rgba(217,70,239,0.12) 50%, transparent 70%)', animation: 'pulseSlow 6s ease-in-out infinite' }} />
        </div>
        <div className="relative max-w-2xl mx-auto">
          <Reveal>
            <div className="inline-flex items-center gap-2.5 rounded-full px-4 py-2 text-xs text-zinc-200 mb-8 font-semibold"
                 style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(217,70,239,0.18))', border: '1px solid rgba(99,102,241,0.4)' }}>
              <span className="relative flex">
                <span className="block w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              </span>
              <Sparkles size={11} className="text-brand-300" />
              {t('land_cta_sub')}
            </div>
            <h2 className="text-4xl sm:text-6xl font-black text-white mb-6 leading-tight">{t('land_cta_h2')}</h2>
            <p className="text-zinc-300 text-lg mb-8">
              {isRTL ? 'ابدأ مجاناً. نتائج مرئية من الأسبوع الأول.' : 'Commencez gratuitement. Résultats visibles dès la première semaine.'}
            </p>
            <div className="flex items-center justify-center gap-4 mb-10 flex-wrap">
              {[
                { flag: '🇩🇿', label: 'Algérie',  sub: 'DZD · Dahabia · CIB' },
                { flag: '🇸🇦', label: 'Golfe',    sub: 'SAR · AED · QAR' },
                { flag: '🇫🇷', label: 'France',   sub: 'EUR · PayPal · Visa' },
              ].map(({ flag, label, sub }) => (
                <div key={label} className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/12 text-xs"
                     style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <span className="text-lg">{flag}</span>
                  <div className="text-left">
                    <p className="text-zinc-100 font-semibold leading-tight">{label}</p>
                    <p className="text-zinc-500 text-[10px]">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/register" className="group inline-block">
              <button className="relative inline-flex items-center gap-2 px-10 py-5 rounded-2xl text-lg font-bold text-white transition-all hover:scale-[1.04] hover:brightness-110 overflow-hidden"
                      style={{ background: 'linear-gradient(135deg,#6366f1,#d946ef)', boxShadow: '0 0 70px rgba(99,102,241,0.55), inset 0 1px 0 rgba(255,255,255,0.2)' }}>
                <span className="relative z-10">{t('land_cta_start')}</span>
                <ArrowRight size={20} className={`relative z-10 transition-transform group-hover:translate-x-1 ${isRTL ? 'rotate-180' : ''}`} />
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </button>
            </Link>
            <p className="text-xs text-zinc-500 mt-5">
              {isRTL ? 'بدون بطاقة بنكية · 5 تنبؤات مجانية · إلغاء في أي وقت' : 'Sans carte bancaire · 5 prédictions offertes · Annulation à tout moment'}
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/8 px-5 sm:px-8 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg,#6366f1,#d946ef)' }}>
              <Activity size={12} className="text-white" />
            </div>
            <span className="font-bold text-zinc-400">Stocky</span>
            <span className="text-zinc-700">·</span>
            <span>© 2026</span>
          </div>
          <div className="flex items-center gap-6">
            <LangSwitch />
            <Link to="/pricing" className="hover:text-zinc-200 transition-colors">{t('land_price_label')}</Link>
            <Link to="/login" className="hover:text-zinc-200 transition-colors">{t('land_nav_login')}</Link>
            <a href="mailto:support@stocky.app" className="hover:text-zinc-200 transition-colors">Contact</a>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translate(0,0) scale(1); }
          33% { transform: translate(30px,-20px) scale(1.05); }
          66% { transform: translate(-20px,30px) scale(0.95); }
        }
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes scrollHint {
          0% { transform: translateY(0); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(8px); opacity: 0; }
        }
        @keyframes pulseSlow {
          0%, 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.7; transform: translate(-50%, -50%) scale(1.08); }
        }
      `}</style>
    </div>
  )
}
