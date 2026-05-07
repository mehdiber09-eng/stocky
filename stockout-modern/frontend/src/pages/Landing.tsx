import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity, TrendingUp, Bell, Shield, Zap, ArrowRight,
  CheckCircle, Brain, BarChart3, AlertTriangle, QrCode,
  FlaskConical, Sparkles, Package, Clock, ChevronRight,
  Star, Globe, Lock,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

/* ── animated counter ── */
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

/* ── floating alert card ── */
function LiveAlert({ delay, isRTL }: { delay: string; isRTL: boolean }) {
  return (
    <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/25 rounded-xl px-3 py-2.5 shadow-lg"
         style={{ animation: `fadeSlideUp 0.6s ease ${delay} both`, direction: isRTL ? 'rtl' : 'ltr' }}>
      <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse shrink-0" />
      <span className="text-xs text-red-300 font-medium">
        {isRTL ? 'نفاد مخزون متوقع خلال ' : 'Rupture prévue dans '}
        <strong>4 {isRTL ? 'أيام' : 'jours'}</strong>
        {' · '}{isRTL ? 'زيت الزيتون' : "Huile d'olive"}
      </span>
      <span className="ms-auto text-[10px] text-red-400/60">87%</span>
    </div>
  )
}

/* ── star rating ── */
function Stars({ n = 5 }: { n?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: n }).map((_, i) => (
        <Star key={i} size={12} className="fill-amber-400 text-amber-400" />
      ))}
    </div>
  )
}

/* ── language switcher button ── */
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

export default function Landing() {
  const { isAuthenticated } = useAuth()
  const { t, isRTL } = useLanguage()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  const FEATURES = [
    { icon: Brain,        title: t('land_feat1_title'), desc: t('land_feat1_desc'), gradient: 'from-indigo-500 to-purple-600' },
    { icon: QrCode,       title: t('land_feat2_title'), desc: t('land_feat2_desc'), gradient: 'from-cyan-500 to-blue-600' },
    { icon: FlaskConical, title: t('land_feat3_title'), desc: t('land_feat3_desc'), gradient: 'from-amber-500 to-orange-600' },
    { icon: Bell,         title: t('land_feat4_title'), desc: t('land_feat4_desc'), gradient: 'from-emerald-500 to-teal-600' },
    { icon: BarChart3,    title: t('land_feat5_title'), desc: t('land_feat5_desc'), gradient: 'from-pink-500 to-rose-600' },
    { icon: Shield,       title: t('land_feat6_title'), desc: t('land_feat6_desc'), gradient: 'from-violet-500 to-purple-600' },
  ]

  const STEPS = [
    { n: '01', title: t('land_step1_title'), desc: t('land_step1_desc'), icon: '📊' },
    { n: '02', title: t('land_step2_title'), desc: t('land_step2_desc'), icon: '🤖' },
    { n: '03', title: t('land_step3_title'), desc: t('land_step3_desc'), icon: '📬' },
  ]

  const TESTIMONIALS = [
    { name: 'Karim B.',  role: isRTL ? 'بقالة راقية · الجزائر' : 'Épicerie fine · Alger',  flag: '🇩🇿',
      text: isRTL ? 'نبّهني Stocky قبل 12 يوماً من نفاد زيت الزيتون. +18% من المبيعات في الشهر الأول.' : "StockSense m'a alerté 12 jours avant la rupture de mon huile d'olive. +18% de ventes dès le premier mois." },
    { name: 'Sophie M.', role: isRTL ? 'صيدلية · ليون' : 'Pharmacie · Lyon',                flag: '🇫🇷',
      text: isRTL ? 'أداة دقيقة بشكل لافت. استيراد CSV وفّر علينا 4 ساعات أسبوعياً. المستشار الذكي يجيب كخبير سلسلة توريد.' : "Outil incroyablement précis. L'import CSV nous a économisé 4h/semaine. Le conseiller IA répond comme un expert supply chain." },
    { name: 'Youcef A.', role: isRTL ? 'كهرومنزلي · وهران' : 'Électroménager · Oran',      flag: '🇩🇿',
      text: isRTL ? 'الأداة الوحيدة المتكيفة مع الواقع الجزائري: دفع CIB/Edahabia، وضع رمضان، تنبؤات مذهلة.' : 'Le seul outil adapté à la réalité algérienne : paiement CIB/Edahabia, mode Ramadan, prédictions bluffantes.' },
  ]

  return (
    <div className="min-h-screen text-zinc-100 overflow-x-hidden" style={{ background: '#06060c', backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.03\'/%3E%3C/svg%3E")' }}>

      {/* ── NAV ── */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-black/80 backdrop-blur-xl border-b border-white/6' : ''}`}>
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg,#6366f1,#d946ef)' }}>
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
      <section className="relative min-h-screen flex flex-col items-center justify-center px-5 sm:px-8 text-center pt-24 pb-20">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-[-10%] left-[10%] w-[700px] h-[700px] rounded-full"
               style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)' }} />
          <div className="absolute top-[20%] right-[-5%] w-[500px] h-[500px] rounded-full"
               style={{ background: 'radial-gradient(circle, rgba(217,70,239,0.1) 0%, transparent 70%)' }} />
          <div className="absolute bottom-[10%] left-[30%] w-[400px] h-[400px] rounded-full"
               style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.08) 0%, transparent 70%)' }} />
          <div className="absolute inset-0 opacity-[0.04]"
               style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>

        <div className="inline-flex items-center gap-2.5 rounded-full px-4 py-2 text-xs text-zinc-300 mb-8 font-semibold"
             style={{ animation: 'fadeSlideUp 0.5s ease 0.1s both', background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(217,70,239,0.1))', border: '1px solid rgba(99,102,241,0.3)', boxShadow: '0 0 20px rgba(99,102,241,0.1)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <Sparkles size={11} className="text-brand-400" />
          {t('land_badge')}
        </div>

        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight mb-6 leading-[1.0]"
            style={{ animation: 'fadeSlideUp 0.6s ease 0.2s both' }}>
          <span className="text-white">{t('land_hero_h1a')}</span>
          <br />
          <span style={{
            background: 'linear-gradient(135deg, #818cf8 0%, #c084fc 40%, #38bdf8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            {t('land_hero_h1b')}
          </span>
        </h1>

        <p className="text-zinc-400 text-lg sm:text-xl max-w-xl mx-auto mb-10 leading-relaxed"
           style={{ animation: 'fadeSlideUp 0.6s ease 0.3s both' }}>
          {t('land_hero_sub')} <strong className="text-zinc-200">{/* inline */}</strong>
          <br className="hidden sm:block" /> {t('land_hero_sub2')}
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 mb-5"
             style={{ animation: 'fadeSlideUp 0.6s ease 0.4s both' }}>
          <Link to="/register" className="w-full sm:w-auto">
            <button className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-bold text-white shadow-2xl transition-all hover:scale-[1.03] hover:brightness-110 active:scale-[0.99]"
                    style={{ background: 'linear-gradient(135deg,#6366f1,#d946ef)', boxShadow: '0 0 40px rgba(99,102,241,0.4)' }}>
              {t('land_cta_start')} <ArrowRight size={18} />
            </button>
          </Link>
          <button
            onClick={() => scrollTo('how-it-works')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold text-zinc-300 border border-white/10 hover:border-white/25 hover:text-white hover:bg-white/5 transition-all"
          >
            {t('land_cta_demo')}
          </button>
        </div>

        <p className="text-xs text-zinc-600" style={{ animation: 'fadeSlideUp 0.5s ease 0.5s both' }}>
          {t('land_free_note')}
        </p>

        {/* Trust bar */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-zinc-600"
             style={{ animation: 'fadeSlideUp 0.5s ease 0.6s both' }}>
          <span className="flex items-center gap-1.5"><Lock size={10} className="text-zinc-600" /> SSL sécurisé</span>
          <span className="w-px h-3 bg-white/8 hidden sm:block" />
          <span className="flex items-center gap-1.5">💳 Dahabia · CIB · PayPal · Visa</span>
          <span className="w-px h-3 bg-white/8 hidden sm:block" />
          <span className="flex items-center gap-1.5">🇩🇿 <span>Algérie</span> · 🇫🇷 <span>France</span></span>
          <span className="w-px h-3 bg-white/8 hidden sm:block" />
          <span className="flex items-center gap-1.5"><Zap size={10} className="text-zinc-600" /> Annulation libre</span>
        </div>

        {/* Hero mockup */}
        <div className="mt-16 w-full max-w-2xl mx-auto" style={{ animation: 'fadeSlideUp 0.8s ease 0.5s both' }}>
          <div className="rounded-3xl border border-white/8 p-1 relative"
               style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', boxShadow: '0 40px 120px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05), 0 0 60px rgba(99,102,241,0.08)' }}>
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/6">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-amber-500/70" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
              </div>
              <div className="flex-1 flex items-center justify-center">
                <span className="text-xs text-zinc-600 bg-white/5 px-4 py-1 rounded-lg">stocky.app — Dashboard IA</span>
              </div>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: isRTL ? 'خطر النفاد' : 'Risque rupture', val: '87%', color: '#f87171', glow: 'rgba(248,113,113,0.3)', w: 87 },
                  { label: isRTL ? 'المخزون المتبقي' : 'Stock restant', val: '13', color: '#fbbf24', glow: 'rgba(251,191,36,0.2)', w: 26 },
                  { label: isRTL ? 'توقع +30 يوم' : 'Prédiction J+30', val: '2', color: '#818cf8', glow: 'rgba(129,140,248,0.2)', w: 10 },
                ].map(({ label, val, color, glow, w }) => (
                  <div key={label} className="rounded-xl p-3 border border-white/6" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <p className="text-[10px] text-zinc-500 mb-1.5">{label}</p>
                    <p className="text-sm font-bold" style={{ color }}>{val}</p>
                    <div className="mt-2 h-1.5 bg-white/8 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${w}%`, background: color, boxShadow: `0 0 8px ${glow}` }} />
                    </div>
                  </div>
                ))}
              </div>
              <LiveAlert delay="0.9s" isRTL={isRTL} />
              <div className="flex items-center gap-2 bg-emerald-500/8 border border-emerald-500/20 rounded-xl px-3 py-2.5"
                   style={{ animation: 'fadeSlideUp 0.5s ease 1.1s both' }}>
                <Package size={12} className="text-emerald-400 shrink-0" />
                <span className="text-xs text-emerald-300">
                  {isRTL ? 'قهوة عربية · مخزون سليم · 42 وحدة · خطر منخفض 12%' : 'Café arabica · Stock sain · 42 unités · Risque faible 12%'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MARQUEE FEATURES ── */}
      <div className="border-y border-white/6 py-3 overflow-hidden" style={{ background: 'rgba(99,102,241,0.04)' }}>
        <div className="flex items-center gap-0" style={{ animation: 'marquee 28s linear infinite', width: 'max-content' }}>
          {[
            '⚡ Prédictions IA temps réel',
            '📦 Gestion stock avancée',
            '🔔 Alertes rupture automatiques',
            '📊 Analytics & tendances',
            '🤖 Conseiller IA Groq',
            '📲 Scanner QR code',
            '🇩🇿 Mode Ramadan',
            '💳 Dahabia · CIB · PayPal',
            '📈 ABC Analysis',
            '🌙 Golfe · SAR · AED · QAR',
            '🛒 Mode Caisse QR',
            '🧪 Simulation stock',
            '⚡ Prédictions IA temps réel',
            '📦 Gestion stock avancée',
            '🔔 Alertes rupture automatiques',
            '📊 Analytics & tendances',
            '🤖 Conseiller IA Groq',
            '📲 Scanner QR code',
            '🇩🇿 Mode Ramadan',
            '💳 Dahabia · CIB · PayPal',
            '📈 ABC Analysis',
            '🌙 Golfe · SAR · AED · QAR',
            '🛒 Mode Caisse QR',
            '🧪 Simulation stock',
          ].map((item, i) => (
            <span key={i} className="inline-flex items-center gap-2 px-6 text-xs text-zinc-500 font-medium shrink-0">
              {item}
              <span className="w-1 h-1 rounded-full bg-zinc-700 shrink-0" />
            </span>
          ))}
        </div>
      </div>

      {/* ── STATS BAR ── */}
      <section className="border-b border-white/6 py-10" style={{ background: 'rgba(255,255,255,0.015)' }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { val: 95, suffix: '%', label: t('land_stats_accuracy'), color: '#818cf8' },
              { val: 2,  suffix: 's', label: t('land_stats_speed'),    color: '#fbbf24' },
              { val: 18, suffix: '%', label: t('land_stats_sales'),     color: '#34d399' },
              { val: 500,suffix: '+', label: t('land_stats_merchants'), color: '#c084fc' },
            ].map(({ val, suffix, label, color }) => (
              <div key={label}>
                <p className="text-3xl sm:text-4xl font-black mb-1" style={{ color }}>
                  <Counter to={val} suffix={suffix} />
                </p>
                <p className="text-xs text-zinc-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PAIN POINTS ── */}
      <section className="py-24 sm:py-32 px-5 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-4">{t('land_pain_label')}</p>
            <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">{t('land_pain_h2')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { emoji: '😰', title: t('land_pain1_title'), color: '#f87171', desc: t('land_pain1_desc'), loss: t('land_pain1_loss') },
              { emoji: '📉', title: t('land_pain2_title'), color: '#fbbf24', desc: t('land_pain2_desc'), loss: t('land_pain2_loss') },
              { emoji: '⏰', title: t('land_pain3_title'), color: '#f97316', desc: t('land_pain3_desc'), loss: t('land_pain3_loss') },
            ].map(({ emoji, title, color, desc, loss }) => (
              <div key={title} className="group rounded-2xl border border-white/8 p-6 hover:border-white/15 transition-all hover:-translate-y-1"
                   style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="text-4xl mb-4">{emoji}</div>
                <h3 className="font-bold text-white mb-2 text-base">{title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed mb-4">{desc}</p>
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                     style={{ color, background: `${color}18`, border: `1px solid ${color}30` }}>
                  <AlertTriangle size={10} /> {loss}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24 sm:py-32 px-5 sm:px-8 border-t border-white/6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-4">{t('land_how_label')}</p>
            <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">
              {t('land_how_h2').split('5')[0]}<span style={{ color: '#818cf8' }}>5 {isRTL ? 'دقائق' : 'minutes'}</span>
            </h2>
            <p className="text-zinc-500 mt-4 text-base max-w-lg mx-auto">{t('land_how_sub')}</p>
          </div>
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map(({ n, title, desc, icon }, i) => (
              <div key={n} className="relative">
                <div className="rounded-2xl border border-white/8 p-7 h-full hover:border-white/16 transition-all"
                     style={{ background: 'rgba(255,255,255,0.025)' }}>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-5 border border-white/8"
                       style={{ background: 'rgba(99,102,241,0.1)' }}>
                    {icon}
                  </div>
                  <div className="text-xs font-bold text-zinc-600 tracking-widest mb-2">
                    {isRTL ? `الخطوة ${['١','٢','٣'][i]}` : `ÉTAPE ${n}`}
                  </div>
                  <h3 className="font-bold text-white text-lg mb-2">{title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">{desc}</p>
                </div>
                {i < 2 && (
                  <div className={`hidden md:flex absolute top-12 z-10 items-center justify-center w-6 h-6 rounded-full bg-zinc-900 border border-white/10 ${isRTL ? '-left-3' : '-right-3'}`}>
                    <ArrowRight size={12} className={`text-zinc-600 ${isRTL ? 'rotate-180' : ''}`} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section id="features" className="py-24 sm:py-32 px-5 sm:px-8 border-t border-white/6"
               style={{ background: 'rgba(255,255,255,0.01)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-4">{t('land_feat_label')}</p>
            <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">
              {t('land_feat_h2a')}<br className="hidden sm:block" />{' '}
              <span style={{ color: '#c084fc' }}>{t('land_feat_h2b')}</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc, gradient }) => (
              <div key={title} className="group rounded-2xl border border-white/8 p-6 hover:border-white/15 transition-all hover:-translate-y-0.5 cursor-default"
                   style={{ background: 'rgba(255,255,255,0.025)' }}>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 shadow-lg`}>
                  <Icon size={18} className="text-white" />
                </div>
                <h3 className="font-bold text-white mb-1.5 text-sm">{title}</h3>
                <p className="text-zinc-500 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MARKET MODE ── */}
      <section className="py-24 sm:py-32 px-5 sm:px-8 border-t border-white/6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-4">{t('land_market_label')}</p>
            <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">{t('land_market_h2')}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Algeria */}
            <div className="rounded-2xl border border-emerald-500/20 p-7" style={{ background: 'rgba(16,185,129,0.04)' }}>
              <div className="text-3xl mb-4">🇩🇿</div>
              <h3 className="font-bold text-white text-lg mb-4">{isRTL ? 'الجزائر' : 'Algérie'}</h3>
              <ul className="space-y-3">
                {[t('land_market_dz_f1'), t('land_market_dz_f2'), t('land_market_dz_f3'), t('land_market_dz_f4'), t('land_market_dz_f5')].map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-zinc-300">
                    <CheckCircle size={14} className="text-emerald-400 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </div>
            {/* France */}
            <div className="rounded-2xl border border-blue-500/20 p-7" style={{ background: 'rgba(59,130,246,0.04)' }}>
              <div className="text-3xl mb-4">🇫🇷</div>
              <h3 className="font-bold text-white text-lg mb-4">France</h3>
              <ul className="space-y-3">
                {[t('land_market_fr_f1'), t('land_market_fr_f2'), t('land_market_fr_f3'), t('land_market_fr_f4'), t('land_market_fr_f5')].map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-zinc-300">
                    <CheckCircle size={14} className="text-blue-400 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </div>
            {/* Gulf */}
            <div className="rounded-2xl border p-7 relative overflow-hidden"
                 style={{ background: 'rgba(251,191,36,0.04)', borderColor: 'rgba(251,191,36,0.25)' }}>
              <div className="absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-full"
                   style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff' }}>
                NOUVEAU
              </div>
              <div className="text-3xl mb-4">🌙 خليج</div>
              <h3 className="font-bold text-white text-lg mb-4">{isRTL ? 'الخليج العربي' : 'Golfe Arabique'}</h3>
              <ul className="space-y-3">
                {(isRTL ? [
                  'دعم SAR · AED · QAR',
                  'واجهة عربية كاملة RTL',
                  'وضع رمضان + موسم الحج',
                  'تنبيهات واتساب للمورد',
                  'دفع دولي PayPal / Visa',
                ] : [
                  'Devises SAR · AED · QAR',
                  'Interface arabe RTL native',
                  'Mode Ramadan + Hajj',
                  'Alertes WhatsApp fournisseur',
                  'Paiement PayPal / Visa',
                ]).map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-zinc-300">
                    <CheckCircle size={14} className="shrink-0" style={{ color: '#f59e0b' }} /> {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24 sm:py-32 px-5 sm:px-8 border-t border-white/6"
               style={{ background: 'rgba(255,255,255,0.01)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-4">{t('land_testi_label')}</p>
            <h2 className="text-3xl sm:text-5xl font-black text-white">{t('land_testi_h2')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map(({ name, role, flag, text }) => (
              <div key={name} className="rounded-2xl border border-white/8 p-6 flex flex-col gap-4 hover:border-white/15 transition-all"
                   style={{ background: 'rgba(255,255,255,0.025)' }}>
                <Stars />
                <p className="text-zinc-400 text-sm leading-relaxed flex-1">"{text}"</p>
                <div className="pt-4 border-t border-white/6 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/8 text-base shrink-0">{flag}</div>
                  <div>
                    <p className="text-white font-semibold text-sm">{name}</p>
                    <p className="text-zinc-600 text-xs">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING PREVIEW ── */}
      <section className="py-24 sm:py-32 px-5 sm:px-8 border-t border-white/6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-4">{t('land_price_label')}</p>
            <h2 className="text-3xl sm:text-5xl font-black text-white">{t('land_price_h2')}</h2>
            <p className="text-zinc-500 mt-3 text-sm">{t('land_price_sub')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
            <div className="rounded-2xl border border-white/8 p-7" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <p className="font-bold text-white text-lg mb-1">{isRTL ? 'مجاني' : 'Gratuit'}</p>
              <p className="text-4xl font-black text-white mb-1">0 <span className="text-lg text-zinc-500 font-normal">DA</span></p>
              <p className="text-zinc-600 text-xs mb-6">{isRTL ? 'لاكتشاف بلا مخاطرة' : 'Pour découvrir sans risque · 0 € · 0 $'}</p>
              {(isRTL
                ? ['5 تنبؤات ذكاء اصطناعي', 'جميع منتجاتك', 'تصدير CSV', 'مستشار ذكي']
                : ['5 prédictions IA', 'Tous vos produits', 'Export CSV', 'Conseiller IA']
              ).map(f => (
                <div key={f} className="flex items-center gap-2 text-sm text-zinc-400 mb-2.5">
                  <CheckCircle size={13} className="text-zinc-600 shrink-0" /> {f}
                </div>
              ))}
              <Link to="/register">
                <button className="w-full mt-5 py-3 rounded-xl border border-white/10 text-sm font-medium text-zinc-300 hover:border-white/25 hover:bg-white/5 transition-all">
                  {t('land_nav_start')}
                </button>
              </Link>
            </div>
            <div className="relative rounded-2xl p-7" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(217,70,239,0.08))', border: '1px solid rgba(99,102,241,0.4)' }}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold text-white px-3 py-1 rounded-full"
                   style={{ background: 'linear-gradient(135deg,#6366f1,#d946ef)' }}>
                {isRTL ? 'موصى به' : 'Recommandé'}
              </div>
              <p className="font-bold text-white text-lg mb-1">Pro</p>
              <p className="text-4xl font-black text-white mb-1">1 500 <span className="text-lg text-zinc-400 font-normal">DA</span></p>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">≈ 14 €</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">≈ 15 $</span>
              </div>
              <p className="text-zinc-500 text-xs mb-6">{isRTL ? 'شهرياً · إلغاء حر' : 'par mois · Annulation libre'}</p>
              {(isRTL
                ? ['تنبؤات غير محدودة', 'تنبيهات بريد تلقائية', 'تحليلات متقدمة', 'دعم أولوي 7 أيام/7']
                : ['Prédictions illimitées', 'Alertes email auto', 'Analytics avancés', 'Support prioritaire 7j/7']
              ).map(f => (
                <div key={f} className="flex items-center gap-2 text-sm text-zinc-200 mb-2.5">
                  <CheckCircle size={13} className="text-brand-400 shrink-0" /> {f}
                </div>
              ))}
              <Link to="/register">
                <button className="w-full mt-5 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 hover:scale-[1.02]"
                        style={{ background: 'linear-gradient(135deg,#6366f1,#d946ef)' }}>
                  {isRTL ? 'جرّب 14 يوماً مجاناً' : 'Essayer 14 jours gratuits'}
                </button>
              </Link>
            </div>
          </div>
          <div className="text-center">
            <Link to="/pricing" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors underline underline-offset-4">
              {isRTL ? 'عرض الأسعار الكاملة' : 'Voir les tarifs complets'} <ArrowRight size={13} className={isRTL ? 'rotate-180' : ''} />
            </Link>
          </div>
          <div className="flex items-center justify-center gap-4 mt-6 text-xs text-zinc-600">
            <span className="flex items-center gap-1"><Lock size={10} /> {isRTL ? 'دفع آمن' : 'Paiement sécurisé'}</span>
            <span className="flex items-center gap-1"><Globe size={10} /> DZ &amp; FR</span>
            <span className="flex items-center gap-1"><Zap size={10} /> {isRTL ? 'إلغاء حر' : 'Annulation libre'}</span>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-32 px-5 sm:px-8 border-t border-white/6 text-center relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full blur-[100px]"
               style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, rgba(217,70,239,0.1) 50%, transparent 70%)' }} />
        </div>
        <div className="relative max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2.5 rounded-full px-4 py-2 text-xs text-zinc-300 mb-8 font-semibold"
               style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(217,70,239,0.1))', border: '1px solid rgba(99,102,241,0.3)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <Sparkles size={11} className="text-brand-400" />
            {t('land_cta_sub')}
          </div>
          <h2 className="text-4xl sm:text-6xl font-black text-white mb-6 leading-tight">
            {t('land_cta_h2')}
          </h2>
          <p className="text-zinc-400 text-lg mb-10">
            {isRTL ? 'ابدأ مجاناً. نتائج مرئية من الأسبوع الأول.' : 'Commencez gratuitement. Résultats visibles dès la première semaine.'}
          </p>
          <Link to="/register">
            <button className="inline-flex items-center gap-2 px-10 py-5 rounded-2xl text-lg font-bold text-white transition-all hover:scale-[1.04] hover:brightness-110"
                    style={{ background: 'linear-gradient(135deg,#6366f1,#d946ef)', boxShadow: '0 0 60px rgba(99,102,241,0.5)' }}>
              {t('land_cta_start')} <ArrowRight size={20} className={isRTL ? 'rotate-180' : ''} />
            </button>
          </Link>
          <p className="text-xs text-zinc-600 mt-5">
            {isRTL ? 'بدون بطاقة بنكية · 5 تنبؤات مجانية · إلغاء في أي وقت' : 'Sans carte bancaire · 5 prédictions offertes · Annulation à tout moment'}
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/6 px-5 sm:px-8 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-600">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg,#6366f1,#d946ef)' }}>
              <Activity size={12} className="text-white" />
            </div>
            <span className="font-bold text-zinc-500">Stocky</span>
            <span className="text-zinc-800">·</span>
            <span>© 2026</span>
          </div>
          <div className="flex items-center gap-6">
            <LangSwitch />
            <Link to="/pricing" className="hover:text-zinc-300 transition-colors">{t('land_price_label')}</Link>
            <Link to="/login" className="hover:text-zinc-300 transition-colors">{t('land_nav_login')}</Link>
            <a href="mailto:support@stocky.app" className="hover:text-zinc-300 transition-colors">Contact</a>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes aurora {
          0%, 100% { transform: translate(0,0) scale(1); }
          33% { transform: translate(30px,-20px) scale(1.05); }
          66% { transform: translate(-20px,30px) scale(0.95); }
        }
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}
