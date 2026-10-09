'use client';

import React, { useState, useEffect } from 'react';
import { subscribeToNotice } from '../lib/firestoreService';
import { DEFAULT_NOTICE_DATA } from '../lib/defaultData';

export default function AjeerNoticeView({ tokenData, tokenId }) {
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState('en'); // Default 'en' matching reference
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const [data, setData] = useState({
    ...DEFAULT_NOTICE_DATA,
    ...tokenData,
  });

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlLang = params.get('lang');
      if (urlLang === 'ar' || urlLang === 'en') {
        setLang(urlLang);
      }
    }
  }, []);

  // Sync document title and html lang/dir
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = lang === 'ar' ? 'أجير حلول الموارد البشرية' : 'Ajeer HRS permit';
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    }
  }, [lang]);

  // Real-time synchronization directly with Firebase Firestore
  useEffect(() => {
    const targetDocId = tokenId || 'current';
    const unsubscribe = subscribeToNotice((firestoreData) => {
      if (firestoreData) {
        setData((prev) => ({
          ...prev,
          ...firestoreData,
        }));
      }
    }, targetDocId);

    return () => {
      if (typeof unsubscribe === 'function') {
        try {
          unsubscribe();
        } catch (e) {}
      }
    };
  }, [tokenId]);

  // Copy link handler
  const handleCopyLink = async () => {
    try {
      if (typeof window !== 'undefined') {
        await navigator.clipboard.writeText(window.location.href);
      }
      setToastMessage(lang === 'ar' ? 'تم نسخ الرابط' : 'Link copied to clipboard');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (e) {
      setToastMessage(lang === 'ar' ? 'تم نسخ الرابط' : 'Link copied to clipboard');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'ar' ? 'en' : 'ar'));
  };

  const isRtl = lang === 'ar';

  // Determine status (active / expired / canceled)
  const isCanceled = !!(data.canceledAt || data.canceled_at);
  const isExplicitlyExpired =
    data.isValid === false ||
    (typeof data.statusText === 'string' && (data.statusText.includes('منتهي') || data.statusText.toLowerCase().includes('expired')));
  const isValid = !isCanceled && !isExplicitlyExpired && (data.isValid !== false);
  const isExpired = !isCanceled && !isValid;

  // Format dates
  const formatDate = (val) => {
    if (!val) return '-';
    if (typeof val === 'string' && val.includes('T')) {
      return val.split('T')[0];
    }
    return val;
  };

  const laborerName =
    data.laborer_name ||
    data.laborerName ||
    data.workerName ||
    'HEMANT KUMAR MANDAL';
  const startDateStr = formatDate(data.start_date || data.startDate || '2025-07-28');
  const endDateStr = formatDate(data.expiration_date || data.endDate || '2026-07-17');
  const canceledDateStr = formatDate(data.canceled_at || data.canceledAt || '-');

  const beneficiaryName =
    data.beneficiary_company?.name ||
    data.beneficiaryCompanyName ||
    data.facilityName ||
    'شركة كويا اند كومباني كونستركشن السعودية للمقاولات';
  const beneficiaryIdentity =
    data.beneficiary_company?.identity ||
    data.beneficiaryCompanyNumber ||
    data.facilityNumber ||
    '15-1953810';

  const istiqdamName =
    data.istiqdam_company?.name ||
    data.istiqdamCompanyName ||
    'شركة مصادر لخدمات الموارد البشرية';
  const istiqdamIdentity =
    data.istiqdam_company?.identity ||
    data.istiqdamCompanyNumber ||
    '15-1590999';

  const pageTitle = isRtl
    ? (data.newNoticePageTitle || 'تصريح أجير لحلول الموارد البشرية')
    : 'Ajeer HRS permit';

  return (
    <div
      className="ajeer-page-root"
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: '#edf2f7',
        fontFamily: "'FrutigerLTArabic-45Light', 'Frutiger LT Arabic', Frutiger, sans-serif",
        color: '#475569',
        position: 'relative',
      }}
      suppressHydrationWarning
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#152e83',
            color: '#ffffff',
            padding: '12px 24px',
            borderRadius: '6px',
            boxShadow: '0 8px 24px rgba(21, 46, 131, 0.25)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
            fontWeight: 400,
            fontFamily: "'FrutigerLTArabic-45Light', sans-serif",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00c186" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. TOP NAVBAR */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e7ecf3',
          height: '60px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <a href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
              <img
                src="/assets/ajeer-logo-B9aR3SS_.svg"
                alt="Ajeer"
                style={{ height: '34px', width: 'auto', display: 'block' }}
              />
            </a>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="ajeer-desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button
              type="button"
              onClick={toggleLanguage}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#64748b',
                fontSize: '14px',
                fontWeight: 400,
                padding: '6px 12px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: "'FrutigerLTArabic-45Light', sans-serif",
              }}
            >
              🌐 {isRtl ? 'English' : 'العربية'}
            </button>
            <a
              href="https://knowledge.qiwa.sa/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#64748b', fontSize: '14px', textDecoration: 'none', fontWeight: 400, fontFamily: "'FrutigerLTArabic-45Light', sans-serif" }}
            >
              {isRtl ? 'مركز المعرفة' : 'Knowledge center'}
            </a>
            <a
              href="https://bab-ajeer.qiwa.sa/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#152e83',
                fontSize: '14px',
                textDecoration: 'none',
                fontWeight: 500,
                border: '1px solid #152e83',
                padding: '7px 16px',
                borderRadius: '4px',
                fontFamily: "'FrutigerLTArabic-45Light', sans-serif",
              }}
            >
              {isRtl ? 'شركات الاستقدام المرخصة' : 'Licensed recruitment companies'}
            </a>
            <a
              href="https://auth.qiwa.sa/sign-in"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#64748b', fontSize: '14px', textDecoration: 'none', fontWeight: 400, fontFamily: "'FrutigerLTArabic-45Light', sans-serif" }}
            >
              {isRtl ? 'تسجيل الدخول' : 'Sign in'}
            </a>
            <a
              href="https://auth.qiwa.sa/sign-up"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                backgroundColor: '#152e83',
                color: '#ffffff',
                fontSize: '14px',
                textDecoration: 'none',
                fontWeight: 500,
                padding: '8px 20px',
                borderRadius: '4px',
                fontFamily: "'FrutigerLTArabic-45Light', sans-serif",
              }}
            >
              {isRtl ? 'تسجيل جديد' : 'Register'}
            </a>
          </nav>

          {/* Mobile Hamburger Button */}
          <div className="ajeer-mobile-hamburger" style={{ display: 'none' }}>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#152e83',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Toggle menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#152e83" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                {mobileMenuOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </>
                ) : (
                  <>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div
            style={{
              position: 'fixed',
              top: '60px',
              left: 0,
              right: 0,
              backgroundColor: '#ffffff',
              boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              zIndex: 99,
              borderTop: '1px solid #e7ecf3',
              fontFamily: "'FrutigerLTArabic-45Light', sans-serif",
            }}
          >
            <button
              type="button"
              onClick={() => {
                toggleLanguage();
                setMobileMenuOpen(false);
              }}
              style={{
                background: '#f1f4f9',
                border: '1px solid #e2e8f0',
                padding: '10px 16px',
                borderRadius: '6px',
                textAlign: isRtl ? 'right' : 'left',
                fontSize: '15px',
                fontWeight: 500,
                color: '#152e83',
                fontFamily: "'FrutigerLTArabic-45Light', sans-serif",
                cursor: 'pointer',
              }}
            >
              🌐 {isRtl ? 'English' : 'العربية'}
            </button>
            <a
              href="https://knowledge.qiwa.sa/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#475569', textDecoration: 'none', fontSize: '15px', fontWeight: 400, padding: '8px 0', fontFamily: "'FrutigerLTArabic-45Light', sans-serif" }}
            >
              {isRtl ? 'مركز المعرفة' : 'Knowledge center'}
            </a>
            <a
              href="https://bab-ajeer.qiwa.sa/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#475569', textDecoration: 'none', fontSize: '15px', fontWeight: 400, padding: '8px 0', fontFamily: "'FrutigerLTArabic-45Light', sans-serif" }}
            >
              {isRtl ? 'شركات الاستقدام المرخصة' : 'Licensed recruitment companies'}
            </a>
            <a
              href="https://auth.qiwa.sa/sign-in"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#475569', textDecoration: 'none', fontSize: '15px', fontWeight: 400, padding: '8px 0', fontFamily: "'FrutigerLTArabic-45Light', sans-serif" }}
            >
              {isRtl ? 'تسجيل الدخول' : 'Sign in'}
            </a>
            <a
              href="https://auth.qiwa.sa/sign-up"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                backgroundColor: '#152e83',
                color: '#ffffff',
                textDecoration: 'none',
                textAlign: 'center',
                padding: '12px',
                borderRadius: '6px',
                fontWeight: 500,
                fontFamily: "'FrutigerLTArabic-45Light', sans-serif",
              }}
            >
              {isRtl ? 'تسجيل جديد' : 'Register'}
            </a>
          </div>
        )}
      </header>

      {/* 2. MAIN CONTENT AREA */}
      <main
        style={{
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '24px 20px 48px 20px',
          boxSizing: 'border-box',
          flex: '1 0 auto',
        }}
      >
        {/* Main Heading */}
        <h1
          style={{
            fontSize: '26px',
            fontWeight: 500,
            color: '#152e83',
            margin: '0 0 20px 0',
            textAlign: isRtl ? 'right' : 'left',
            fontFamily: "'FrutigerLTArabic-45Light', sans-serif",
            letterSpacing: '0px',
          }}
        >
          {pageTitle}
        </h1>

        {/* 3 Notice Cards Layout */}
        <div className="ajeer-cards-wrapper">
          {/* CARD 1: PERMIT INFORMATION */}
          <div className="ajeer-card ajeer-card-permit">
            <div className="ajeer-card-header">
              {isRtl ? 'معلومات التصريح' : 'PERMIT INFORMATION'}
            </div>
            <div className="ajeer-card-body">
              {/* Field 1: Laborer Name */}
              <div className="ajeer-field-group">
                <div className="ajeer-field-label">
                  {isRtl ? 'اسم الموظف:' : "Laborer's name:"}
                </div>
                <div className="ajeer-field-value ajeer-field-name">
                  {laborerName}
                </div>
              </div>

              {/* Field 2: Permit Status */}
              <div className="ajeer-field-group">
                <div className="ajeer-field-label">
                  {isRtl ? 'حالة التصريح:' : 'Permit status:'}
                </div>
                <div>
                  <span className="ajeer-badge">
                    {isValid ? (isRtl ? 'ساري' : 'ACTIVE') : isCanceled ? (isRtl ? 'ملغي' : 'CANCELED') : (isRtl ? 'منتهي' : 'EXPIRED')}
                  </span>
                </div>
              </div>

              {/* Field 3: Start Date */}
              <div className="ajeer-field-group">
                <div className="ajeer-field-label">
                  {isRtl ? 'تاريخ بداية التصريح:' : 'Permit start date:'}
                </div>
                <div className="ajeer-field-value">
                  {startDateStr}
                </div>
              </div>

              {/* Field 4: Expiration Date OR Cancelation Date */}
              {!isCanceled ? (
                <div className="ajeer-field-group">
                  <div className="ajeer-field-label">
                    {isRtl ? 'تاريخ إنتهاء التصريح' : 'Permit expiration date'}
                  </div>
                  <div className="ajeer-field-value">
                    {endDateStr}
                  </div>
                </div>
              ) : (
                <div className="ajeer-field-group">
                  <div className="ajeer-field-label">
                    {isRtl ? 'تاريخ إلغاء التصريح' : 'Permit cancelation date'}
                  </div>
                  <div className="ajeer-field-value">
                    {canceledDateStr}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CARD 2: BENEFICIARY COMPANY */}
          <div className="ajeer-card ajeer-card-company">
            <div className="ajeer-card-header">
              {isRtl ? 'المنشأة المستفيدة' : 'BENEFICIARY COMPANY'}
            </div>
            <div className="ajeer-card-body">
              <div className="ajeer-field-group">
                <div className="ajeer-field-label">
                  {isRtl ? 'اسم المنشأة:' : 'Establishment name:'}
                </div>
                <div className="ajeer-field-value ajeer-field-arabic">
                  {beneficiaryName}
                </div>
              </div>

              <div className="ajeer-field-group">
                <div className="ajeer-field-label">
                  {isRtl ? 'رقم المنشأة:' : 'Establishment number:'}
                </div>
                <div className="ajeer-field-value" style={{ direction: 'ltr', textAlign: isRtl ? 'right' : 'left' }}>
                  {beneficiaryIdentity}
                </div>
              </div>
            </div>
          </div>

          {/* CARD 3: ISTIQDAM COMPANY */}
          <div className="ajeer-card ajeer-card-company">
            <div className="ajeer-card-header">
              {isRtl ? 'شركة الإستقدام' : 'ISTIQDAM COMPANY'}
            </div>
            <div className="ajeer-card-body">
              <div className="ajeer-field-group">
                <div className="ajeer-field-label">
                  {isRtl ? 'اسم المنشأة:' : 'Establishment name:'}
                </div>
                <div className="ajeer-field-value ajeer-field-arabic">
                  {istiqdamName}
                </div>
              </div>

              <div className="ajeer-field-group">
                <div className="ajeer-field-label">
                  {isRtl ? 'رقم المنشأة:' : 'Establishment number:'}
                </div>
                <div className="ajeer-field-value" style={{ direction: 'ltr', textAlign: isRtl ? 'right' : 'left' }}>
                  {istiqdamIdentity}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Copy Link Action Button */}
        <div className="ajeer-action-wrapper">
          <button
            type="button"
            onClick={handleCopyLink}
            className="ajeer-action-btn"
          >
            <span>{isRtl ? 'نسخ رابط الصفحة' : 'Copy link to this page'}</span>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
          </button>
        </div>
      </main>

      {/* 3. FOOTER */}
      <footer className="ajeer-footer">
        <div className="ajeer-footer-content">
          {/* Centered Ajeer Logo */}
          <div className="ajeer-footer-logo-wrap">
            <a href="/" style={{ display: 'inline-block' }}>
              <img
                src="/assets/ajeer-logo-B9aR3SS_.svg"
                alt="Ajeer"
                style={{ height: '36px', width: 'auto', display: 'block' }}
              />
            </a>
          </div>

          {/* Privacy Policy Link */}
          <div className="ajeer-footer-link-wrap">
            <a
              href="https://ajeer.qiwa.sa/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="ajeer-footer-link"
            >
              {isRtl ? 'سياسة الخصوصية' : 'Privacy Policy'}
            </a>
          </div>

          {/* Terms & Conditions Link */}
          <div className="ajeer-footer-link-wrap">
            <a
              href="https://ajeer.qiwa.sa/terms-and-conditions"
              target="_blank"
              rel="noopener noreferrer"
              className="ajeer-footer-link"
            >
              {isRtl ? 'الشروط والأحكام' : 'Terms & Conditions'}
            </a>
          </div>

          {/* Copyright */}
          <div className="ajeer-footer-copyright">
            {isRtl ? '2026 / © أجير لحلول الموارد البشرية' : '2026 / © Ajeer HRS'}
          </div>

          {/* Globe Language Switcher */}
          <div className="ajeer-footer-lang-wrap">
            <button
              type="button"
              onClick={toggleLanguage}
              className="ajeer-footer-lang-btn"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
              <span>{isRtl ? 'English' : 'العربية'}</span>
            </button>
          </div>

          {/* Partner Brands Row */}
          <div className="ajeer-footer-partners">
            <a href="https://takamolholding.com/" target="_blank" rel="noopener noreferrer">
              <img
                src="/assets/takamol-holding-fmbmXX_N.svg"
                alt="Takamol"
                style={{ height: '28px', width: 'auto', display: 'block' }}
              />
            </a>
            <a href="https://hrsd.gov.sa/" target="_blank" rel="noopener noreferrer">
              <img
                src={isRtl ? '/assets/mhrsd-color-ar-BJSmF7Mo.svg' : '/assets/mhrsd-color-en-Dbj2SeaU.svg'}
                alt="Human Resources and Social Development"
                style={{ height: '32px', width: 'auto', display: 'block' }}
              />
            </a>
          </div>
        </div>
      </footer>

      {/* Global Font Face declarations for Frutiger LT Arabic (all weights) and overlay suppression */}
      <style jsx global>{`
        @font-face {
          font-family: 'FrutigerLTArabic-45Light';
          src: url('/assets/FrutigerLTArabic-45Light-SlJtknaV.woff') format('woff'),
               url('/assets/FrutigerLTArabic-45Light-DYShZyg5.ttf') format('truetype');
          font-weight: 300;
          font-style: normal;
          font-display: swap;
        }
        @font-face {
          font-family: 'FrutigerLTArabic-45Light';
          src: url('/assets/FrutigerLTArabic-45Light-SlJtknaV.woff') format('woff'),
               url('/assets/FrutigerLTArabic-45Light-DYShZyg5.ttf') format('truetype');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }
        @font-face {
          font-family: 'FrutigerLTArabic-45Light';
          src: url('/assets/FrutigerLTArabic-55Roman-MWBpO6AF.woff') format('woff'),
               url('/assets/FrutigerLTArabic-55Roman-DcatSmBs.ttf') format('truetype');
          font-weight: 500;
          font-style: normal;
          font-display: swap;
        }
        @font-face {
          font-family: 'FrutigerLTArabic-45Light';
          src: url('/assets/FrutigerLTArabic-65Bold-JBA9amnD.woff') format('woff'),
               url('/assets/FrutigerLTArabic-65Bold-DZRczdd_.ttf') format('truetype');
          font-weight: 600;
          font-style: normal;
          font-display: swap;
        }
        @font-face {
          font-family: 'FrutigerLTArabic-45Light';
          src: url('/assets/FrutigerLTArabic-65Bold-JBA9amnD.woff') format('woff'),
               url('/assets/FrutigerLTArabic-65Bold-DZRczdd_.ttf') format('truetype');
          font-weight: 700;
          font-style: normal;
          font-display: swap;
        }

        .ajeer-page-root,
        .ajeer-page-root * {
          font-family: 'FrutigerLTArabic-45Light', 'FrutigerLTArabic-55Roman', 'Frutiger LT Arabic', Frutiger, sans-serif !important;
        }

        /* Suppress Next.js dev overlay circle icon ("N") completely */
        nextjs-portal,
        #nextjs-dev-overlay,
        div[data-nextjs-dev-indicator],
        div[data-nextjs-toast],
        div[data-nextjs-dialog] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
      `}</style>

      {/* Scoped CSS Styles for Soft Gray, Non-Bold Aesthetic */}
      <style jsx>{`
        .ajeer-cards-wrapper {
          display: flex;
          gap: 16px;
          align-items: stretch;
          width: 100%;
          box-sizing: border-box;
        }

        .ajeer-card {
          background-color: #ffffff;
          border-radius: 8px;
          border: 1px solid #eef2fb;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-sizing: border-box;
        }

        .ajeer-card-permit {
          flex: 0 0 300px;
          max-width: 300px;
          width: 300px;
        }

        .ajeer-card-company {
          flex: 1 1 0;
          min-width: 0;
        }

        .ajeer-card-header {
          padding: 16px 20px;
          border-bottom: 1px solid #f1f4f8;
          font-size: 15px;
          font-weight: 500;
          color: #152e83;
          text-transform: uppercase;
          background-color: #ffffff;
          letter-spacing: 0.3px;
          font-family: 'FrutigerLTArabic-45Light', sans-serif !important;
        }

        .ajeer-card-body {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          flex: 1;
          background-color: #ffffff;
        }

        .ajeer-field-group {
          display: flex;
          flex-direction: column;
        }

        .ajeer-field-label {
          font-size: 13px;
          color: #64748b;
          margin-bottom: 4px;
          font-weight: 300;
          line-height: 1.4;
          font-family: 'FrutigerLTArabic-45Light', sans-serif !important;
        }

        .ajeer-field-value {
          font-size: 15px;
          font-weight: 400;
          color: #475569;
          word-break: break-word;
          line-height: 1.5;
          font-family: 'FrutigerLTArabic-45Light', sans-serif !important;
        }

        .ajeer-field-name {
          text-transform: uppercase;
          letter-spacing: 0.3px;
          font-weight: 400;
          color: #475569;
        }

        .ajeer-field-arabic {
          font-family: 'FrutigerLTArabic-45Light', sans-serif !important;
          font-weight: 400;
          color: #475569;
          line-height: 1.6;
        }

        .ajeer-badge {
          display: inline-block;
          font-size: 13px;
          font-weight: 500;
          padding: 4px 14px;
          border-radius: 4px;
          text-transform: uppercase;
          width: fit-content;
          background-color: #eef2fb;
          color: #152e83;
          letter-spacing: 0.3px;
          font-family: 'FrutigerLTArabic-45Light', sans-serif !important;
        }

        .ajeer-action-wrapper {
          display: flex;
          justify-content: flex-end;
          margin-top: 20px;
          width: 100%;
        }

        .ajeer-action-btn {
          background-color: #152e83;
          color: #ffffff;
          border: none;
          border-radius: 6px;
          padding: 12px 24px;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-family: 'FrutigerLTArabic-45Light', sans-serif !important;
          height: 48px;
          box-shadow: 0 2px 4px rgba(21, 46, 131, 0.2);
          transition: background-color 0.2s ease;
        }

        .ajeer-action-btn:hover {
          background-color: #102366;
        }

        .ajeer-footer {
          border-top: 1px solid #e7ecf3;
          background-color: #ffffff;
          padding: 36px 20px 28px 20px;
          width: 100%;
          box-sizing: border-box;
          font-family: 'FrutigerLTArabic-45Light', sans-serif !important;
        }

        .ajeer-footer-content {
          max-width: 480px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .ajeer-footer-logo-wrap {
          margin-bottom: 20px;
        }

        .ajeer-footer-link-wrap {
          margin-bottom: 12px;
        }

        .ajeer-footer-link {
          color: #64748b;
          font-size: 14px;
          font-weight: 300;
          text-decoration: none;
          transition: color 0.2s;
          font-family: 'FrutigerLTArabic-45Light', sans-serif !important;
        }

        .ajeer-footer-link:hover {
          color: #152e83;
        }

        .ajeer-footer-copyright {
          color: #64748b;
          font-size: 14px;
          font-weight: 300;
          margin-bottom: 16px;
          font-family: 'FrutigerLTArabic-45Light', sans-serif !important;
        }

        .ajeer-footer-lang-wrap {
          margin-bottom: 28px;
        }

        .ajeer-footer-lang-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #64748b;
          font-size: 15px;
          font-weight: 400;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: 'FrutigerLTArabic-45Light', sans-serif !important;
          padding: 6px 12px;
        }

        .ajeer-footer-partners {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          max-width: 320px;
        }

        /* Mobile Responsive Breakpoints (< 960px) */
        @media screen and (max-width: 959px) {
          .ajeer-cards-wrapper {
            flex-direction: column;
            gap: 16px;
          }

          .ajeer-card-permit,
          .ajeer-card-company {
            flex: 1 1 auto;
            max-width: 100%;
            width: 100%;
          }

          .ajeer-desktop-nav {
            display: none !important;
          }

          .ajeer-mobile-hamburger {
            display: flex !important;
          }

          .ajeer-action-wrapper {
            margin-top: 20px;
          }

          .ajeer-action-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
