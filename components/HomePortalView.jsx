'use client';

import React, { useState, useEffect } from 'react';
import '../public/dist/css/home-portal.css';

export default function HomePortalView() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('token');
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const faqs = [
    {
      q: 'ما هي منظومة وثّق للتحقق الرقمي المعتمد؟',
      a: 'منظومة سحابية متقدمة ومستقلة تتيح للمنشآت والمؤسسات التحقق الفوري من صحة ومطابقة السجلات المهنية والتراخيص والشهادات الرقمية في بيئة آمنة ومشفرة.',
    },
    {
      q: 'كيف يمكنني فحص وتدقيق صحة وثيقة معتمدة؟',
      a: 'ببساطة قم بإدخال رمز التحقق (Token ID) أو مسح رمز الاستجابة السريعة (QR Code) الموجود على المستند لتظهر لك فوراً بيانات المطابقة الرسمية وحالة الصلاحية.',
    },
    {
      q: 'ماذا تعني حالة الوثيقة "ساري / فعال"؟',
      a: 'تعني أن الوثيقة تم التحقق من سلامتها وتوقيعها الرقمي ومطابقتها التامة مع السجلات المعتمدة، وهي صالحة للاستخدام حتى تاريخ نهاية الصلاحية المحدد.',
    },
    {
      q: 'هل النظام محمي ضد التلاعب أو التعديل غير المصرح به؟',
      a: 'نعم، تعتمد المنظومة على تقنيات التشفير السحابي المتقدم ومفاتيح التوقيع الرقمي اللحظية، مما يجعل السجلات غير قابلة للتعديل أو التزوير بعد اعتمادها.',
    },
  ];

  if (!mounted) {
    return <div className="watheeq-root" style={{ minHeight: '100vh', background: '#f8fafc' }} />;
  }

  return (
    <div className="watheeq-root">
      {/* Ambient background glows */}
      <div className="watheeq-ambient-glow" />
      <div className="watheeq-ambient-glow-2" />

      {/* 1. Modern Header */}
      <header className="watheeq-header">
        <div className="watheeq-header-inner">
          <div className="watheeq-brand">
            <div className="watheeq-brand-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <div className="watheeq-brand-text">
              <span className="watheeq-brand-name">وَثِّــق</span>
              <span className="watheeq-brand-sub">WATHIQ VERIFY</span>
            </div>
          </div>

          <ul className="watheeq-nav">
            <li><a href="#hero" className="watheeq-nav-link active">الرئيسية</a></li>
            <li><a href="#verify" className="watheeq-nav-link">التحقق السريع</a></li>
            <li><a href="#features" className="watheeq-nav-link">المميزات والحلول</a></li>
            <li><a href="#steps" className="watheeq-nav-link">آلية العمل</a></li>
            <li><a href="#faq" className="watheeq-nav-link">الأسئلة الشائعة</a></li>
          </ul>

          <div className="watheeq-actions">
            <button
              type="button"
              className="watheeq-btn-outline"
              onClick={(e) => e.preventDefault()}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span>فحص وثيقة</span>
            </button>
            <button
              type="button"
              className="watheeq-btn-solid"
              onClick={(e) => e.preventDefault()}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M9 3v18" />
                <path d="m14 9 3 3-3 3" />
              </svg>
              <span>تسجيل الدخول</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="watheeq-hero" id="hero">
        <div className="watheeq-hero-container">
          {/* Left Content */}
          <div className="watheeq-hero-left">
            <div className="watheeq-pill">
              <span className="watheeq-pill-dot" />
              <span>المنظومة السحابية المتقدمة لتدقيق وتوثيق السجلات</span>
            </div>

            <h1 className="watheeq-hero-title">
              التحقق الذكي والآمن من <span className="watheeq-gradient-text">الوثائق والتراخيص</span> في لحظات
            </h1>

            <p className="watheeq-hero-desc">
              بيئة عمل رقمية تُمكّن المنشآت والجهات المختصة من التحقق الفوري من صحة وصلاحية الشهادات والسجلات الرسمية ومطابقتها مباشرة عبر خوادم التوثيق المشفرة.
            </p>

            {/* Static & Purely Visual Search Card (No Functional Action / Empty) */}
            <div className="watheeq-search-card" id="verify">
              <div className="watheeq-tabs">
                <button
                  type="button"
                  className={`watheeq-tab ${activeTab === 'token' ? 'active' : ''}`}
                  onClick={() => setActiveTab('token')}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
                    <line x1="12" y1="18" x2="12.01" y2="18" />
                  </svg>
                  <span>التحقق بالرمز المرجعي (Token)</span>
                </button>
                <button
                  type="button"
                  className={`watheeq-tab ${activeTab === 'permit' ? 'active' : ''}`}
                  onClick={() => setActiveTab('permit')}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                  </svg>
                  <span>البحث برقم الوثيقة</span>
                </button>
              </div>

              <form onSubmit={(e) => e.preventDefault()} className="watheeq-search-form">
                <div className="watheeq-input-wrap">
                  <span className="watheeq-input-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    className="watheeq-input"
                    defaultValue=""
                    placeholder={
                      activeTab === 'token'
                        ? 'أدخل رمز التحقق المشفر (Token ID)...'
                        : 'أدخل رقم الوثيقة أو التصريح (مثال: TQ6257866)...'
                    }
                  />
                </div>
                <button
                  type="button"
                  className="watheeq-btn-search"
                  onClick={(e) => e.preventDefault()}
                >
                  <span>فحص الوثيقة</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </form>

              <div className="watheeq-search-footer">
                <span className="watheeq-live-status">
                  <span className="watheeq-pill-dot" />
                  <span>الخوادم متصلة والتحقق اللحظي نشط (99.9% Uptime)</span>
                </span>
                <span>تشفير آمن 256-bit SSL</span>
              </div>
            </div>
          </div>

          {/* Right Holographic Credential Mockup */}
          <div className="watheeq-hero-graphic">
            <div className="watheeq-card-mockup">
              <div className="watheeq-mockup-header">
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
                    بطاقة التحقق الرقمي المعتمدة
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                    معيار التوثيق السحابي المشفر
                  </div>
                </div>
                <div className="watheeq-mockup-badge">
                  <span>●</span> ساري ومطابق
                </div>
              </div>

              <div className="watheeq-mockup-body">
                <div className="watheeq-mockup-row">
                  <span className="watheeq-mockup-label">بروتوكول التحقق:</span>
                  <span className="watheeq-mockup-val" style={{ color: '#0f766e' }}>AES-256 / SHA-256</span>
                </div>
                <div className="watheeq-mockup-row">
                  <span className="watheeq-mockup-label">حالة الوثيقة:</span>
                  <span className="watheeq-mockup-val" style={{ color: '#16a34a' }}>معتمدة إلكترونياً ✓</span>
                </div>
                <div className="watheeq-mockup-row">
                  <span className="watheeq-mockup-label">سرعة الاستجابة:</span>
                  <span className="watheeq-mockup-val">0.18 ثانية</span>
                </div>
                <div className="watheeq-mockup-row">
                  <span className="watheeq-mockup-label">رمز المطابقة:</span>
                  <span className="watheeq-mockup-val" style={{ fontSize: '12px' }}>VERIFIED-SECURE-HASH</span>
                </div>
              </div>

              <div className="watheeq-mockup-footer">
                <div className="watheeq-shield-seal">
                  <div className="watheeq-seal-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </div>
                  <div>
                    <div className="watheeq-seal-title">ختم التوثيق الرقمي</div>
                    <div className="watheeq-seal-sub">مطابقة تلقائية 100%</div>
                  </div>
                </div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f766e' }}>
                  WATHIQ CLOUD
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Platform Statistics Bar */}
      <section className="watheeq-stats-bar">
        <div className="watheeq-stats-grid">
          <div className="watheeq-stat-box">
            <div className="watheeq-stat-num">+1,500,000</div>
            <div className="watheeq-stat-lbl">وثيقة وسجل تم التحقق منه</div>
          </div>
          <div className="watheeq-stat-box">
            <div className="watheeq-stat-num">99.98%</div>
            <div className="watheeq-stat-lbl">دقة المطابقة والتحقق الفوري</div>
          </div>
          <div className="watheeq-stat-box">
            <div className="watheeq-stat-num">&lt; 0.2s</div>
            <div className="watheeq-stat-lbl">سرعة الاستعلام اللحظي</div>
          </div>
          <div className="watheeq-stat-box">
            <div className="watheeq-stat-num">+50,000</div>
            <div className="watheeq-stat-lbl">منشأة ومؤسسة معتمدة</div>
          </div>
        </div>
      </section>

      {/* 4. Core Features & Solutions */}
      <section className="watheeq-features" id="features">
        <div className="watheeq-section-head">
          <div className="watheeq-subhead">حلولنا ومنظومتنا</div>
          <h2 className="watheeq-title">أحدث التقنيات لتوثيق وتدقيق السجلات</h2>
          <p className="watheeq-desc">
            حلول متكاملة تضمن حماية البيانات ومطابقة الوثائق الرسمية ومنع أي محاولات للتعديل غير المعتمد.
          </p>
        </div>

        <div className="watheeq-grid">
          <div className="watheeq-card">
            <div className="watheeq-card-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <h3 className="watheeq-card-title">التوثيق السحابي المشفر</h3>
            <p className="watheeq-card-text">
              تخزين ومطابقة السجلات عبر خوادم مشفرة بتقنية التجزئة الآمنة لضمان بقاء البيانات أصلية وغير قابلة للعبث.
            </p>
            <span className="watheeq-card-badge">حماية متقدمة</span>
          </div>

          <div className="watheeq-card">
            <div className="watheeq-card-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="5" height="5" x="3" y="3" rx="1" />
                <rect width="5" height="5" x="16" y="3" rx="1" />
                <rect width="5" height="5" x="3" y="16" rx="1" />
                <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
                <path d="M21 21v.01" />
                <path d="M12 7v3a2 2 0 0 1-2 2H7" />
                <path d="M3 12h.01" />
                <path d="M12 3h.01" />
                <path d="M12 16v.01" />
                <path d="M16 12h1" />
                <path d="M21 12v.01" />
                <path d="M12 21v-1" />
              </svg>
            </div>
            <h3 className="watheeq-card-title">رمز الاستجابة السريع الذكي</h3>
            <p className="watheeq-card-text">
              إنشاء روابط مشفرة ورموز QR تتيح للمفتشين والجهات المعنية مسح الوثيقة واستعراضها مباشرة من الهواتف الذكية.
            </p>
            <span className="watheeq-card-badge">مسح فوري</span>
          </div>

          <div className="watheeq-card">
            <div className="watheeq-card-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M3 9h18" />
                <path d="M9 21V9" />
              </svg>
            </div>
            <h3 className="watheeq-card-title">بوابة إدارة السجلات</h3>
            <p className="watheeq-card-text">
              لوحة تحكم مركزية متقدمة تُمكّن مسؤولي المنشأة من إصدار السجلات ومتابعة تواريخ الصلاحية وتحديث الحالات بلحظة.
            </p>
            <span className="watheeq-card-badge">إدارة مرنة</span>
          </div>

          <div className="watheeq-card">
            <div className="watheeq-card-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 14 14" />
              </svg>
            </div>
            <h3 className="watheeq-card-title">استعلام فوري وتتبع حي</h3>
            <p className="watheeq-card-text">
              نظام استعلام فائق السرعة يعمل على مدار الساعة لتقديم تقارير الصلاحية المطابقة لحالة السجل في الوقت الفعلي.
            </p>
            <span className="watheeq-card-badge">24/7 نشط</span>
          </div>
        </div>
      </section>

      {/* 5. How It Works (Workflow Steps) */}
      <section className="watheeq-steps-section" id="steps">
        <div className="watheeq-steps-container">
          <div className="watheeq-section-head">
            <div className="watheeq-subhead">خطوات التحقق السريع</div>
            <h2 className="watheeq-title">كيف يتم فحص وتأكيد الوثيقة؟</h2>
            <p className="watheeq-desc">
              ثلاث خطوات مؤتمتة تمكّنك من التأكد من مصداقية أي مستند وسريان مفعوله.
            </p>
          </div>

          <div className="watheeq-steps-grid">
            <div className="watheeq-step-box">
              <div className="watheeq-step-circle">1</div>
              <h4 className="watheeq-step-name">إدخال رمز الوثيقة</h4>
              <p className="watheeq-step-desc">
                قم بلصق الرمز المرجعي أو مسح رمز الاستجابة السريعة (QR Code) المدون على المستند المعتمد.
              </p>
            </div>

            <div className="watheeq-step-box">
              <div className="watheeq-step-circle">2</div>
              <h4 className="watheeq-step-name">معالجة التوقيع الرقمي</h4>
              <p className="watheeq-step-desc">
                يقوم النظام بالتحقق الآني ومطابقة البصمة الإلكترونية للوثيقة مع قاعدة البيانات المعتمدة.
              </p>
            </div>

            <div className="watheeq-step-box">
              <div className="watheeq-step-circle">3</div>
              <h4 className="watheeq-step-name">استعراض الشهادة</h4>
              <p className="watheeq-step-desc">
                تظهر لك صفحة الوثيقة الموثقة ببياناتها الرسمية الكاملة مع شارة الصلاحية المعتمدة (ساري / فعال).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ Accordion */}
      <section className="watheeq-faq-section" id="faq">
        <div className="watheeq-section-head">
          <div className="watheeq-subhead">المساعدة والاستفسارات</div>
          <h2 className="watheeq-title">الأسئلة الشائعة</h2>
          <p className="watheeq-desc">
            إجابات شاملة حول التحقق الرقمي، التشفير، وصلاحية المستندات المعتمدة.
          </p>
        </div>

        <div className="watheeq-faq-list">
          {faqs.map((faq, idx) => (
            <div key={idx} className={`watheeq-faq-item ${openFaq === idx ? 'open' : ''}`}>
              <button
                type="button"
                className="watheeq-faq-btn"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
              >
                <span>{faq.q}</span>
                <span className="watheeq-faq-icon">{openFaq === idx ? '▲' : '▼'}</span>
              </button>
              {openFaq === idx && (
                <div className="watheeq-faq-content">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 7. Enterprise CTA Banner (Visual Only) */}
      <section className="watheeq-cta">
        <div className="watheeq-cta-box">
          <div>
            <h3 className="watheeq-cta-title">هل ترغب في إدارة وتدقيق وثائق منشأتك؟</h3>
            <p className="watheeq-cta-sub">
              منظومة إلكترونية موثوقة لإدارة وتتبع السجلات والتراخيص المهنية بكفاءة وأمان كامل.
            </p>
          </div>
          <button
            type="button"
            className="watheeq-btn-solid"
            style={{ padding: '14px 28px', fontSize: '15px' }}
            onClick={(e) => e.preventDefault()}
          >
            <span>بدء الاستخدام الآن</span>
            <span>←</span>
          </button>
        </div>
      </section>

      {/* 8. Modern SaaS Clean Footer */}
      <footer className="watheeq-footer">
        <div className="watheeq-footer-inner">
          <div className="watheeq-footer-brand">
            <div className="watheeq-brand-icon" style={{ width: '36px', height: '36px', borderRadius: '10px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: '800', fontSize: '16px', color: '#0f172a' }}>منظومة وثّق للتحقق الرقمي</div>
              <div className="watheeq-footer-copy">جميع الحقوق محفوظة © {new Date().getFullYear()} WATHIQ System</div>
            </div>
          </div>

          <div className="watheeq-footer-badges">
            <div className="watheeq-badge-item">
              <span>🔒</span>
              <span>تشفير 256-bit SSL</span>
            </div>
            <div className="watheeq-badge-item">
              <span>🛡️</span>
              <span>ISO 27001 Ready</span>
            </div>
            <div className="watheeq-badge-item">
              <span>⚡</span>
              <span>سحابة عالية التوافر 99.9%</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
