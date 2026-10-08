'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { saveNoticeToFirestore, fetchNoticeFromFirestore, fetchLinksHistory } from '../../lib/firestoreService';
import { DEFAULT_NOTICE_DATA } from '../../lib/defaultData';
import { generateNoticeToken } from '../../lib/tokenGenerator';
import '../../public/dist/css/admin.css';

export default function AdminPage() {
  const [formData, setFormData] = useState({ ...DEFAULT_NOTICE_DATA });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [showPreview, setShowPreview] = useState(true);
  const [activeTab, setActiveTab] = useState('permit'); // 'permit' | 'worker' | 'facility' | 'labels' | 'footer' | 'history'
  const [generatedLink, setGeneratedLink] = useState(null);
  const [copied, setCopied] = useState(false);
  const [historyList, setHistoryList] = useState([]);

  // Fetch initial data & links history from Firestore on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [firestoreData, history] = await Promise.all([
          fetchNoticeFromFirestore(),
          fetchLinksHistory()
        ]);

        if (firestoreData) {
          setFormData({ ...DEFAULT_NOTICE_DATA, ...firestoreData });
        } else {
          const res = await fetch('/api/notice');
          const json = await res.json();
          if (json.success && json.data) {
            setFormData({ ...DEFAULT_NOTICE_DATA, ...json.data });
          }
        }

        if (Array.isArray(history) && history.length > 0) {
          setHistoryList(history);
        } else {
          const histRes = await fetch('/api/notice?history=true');
          const histJson = await histRes.json();
          if (histJson.success && Array.isArray(histJson.history)) {
            setHistoryList(histJson.history);
          }
        }
      } catch (err) {
        console.error('Failed to load initial notice data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleStatusToggle = (isValidStatus) => {
    setFormData((prev) => ({
      ...prev,
      isValid: isValidStatus,
      statusText: isValidStatus ? 'ساري / فعال' : 'منتهي / ملغي',
    }));
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setCopied(false);

    try {
      // 1. Generate unique token & save to Firebase Firestore
      const firestoreResult = await saveNoticeToFirestore(formData);

      if (!firestoreResult.success) {
        throw new Error(firestoreResult.error || 'Failed to save to Firebase');
      }

      const token = firestoreResult.token;
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const fullUrl = `${origin}/notice-verification/${token}`;

      const linkInfo = {
        token,
        url: fullUrl,
        noticeNumber: formData.noticeNumber,
        workerName: formData.workerName,
        facilityName: formData.facilityName,
        statusText: formData.statusText,
        createdAt: new Date().toISOString(),
      };

      setGeneratedLink(linkInfo);
      setHistoryList((prev) => [linkInfo, ...prev.filter((x) => x.token !== token)].slice(0, 50));

      // 2. Also save to server API as local backup
      try {
        await fetch('/api/notice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, token }),
        });
      } catch (err) {}

      showToast('✓ تم الحفظ في Firebase Firestore بنجاح، وتم إنشاء رابط التحقق المخصص الجديد!', 'success');
    } catch (err) {
      showToast('حدث خطأ أثناء الحفظ في Firebase: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      showToast('✓ تم نسخ رابط التحقق بنجاح! يمكنك إرساله للعميل الآن.', 'success');
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      showToast('فشل نسخ الرابط تلقائياً، يمكنك نسخه يدوياً', 'error');
    }
  };

  const handleReset = async () => {
    if (!window.confirm('هل أنت متأكد من استعادة جميع النصوص والبيانات الأصلية؟')) {
      return;
    }
    setSaving(true);
    try {
      setFormData({ ...DEFAULT_NOTICE_DATA });
      await saveNoticeToFirestore(DEFAULT_NOTICE_DATA);
      await fetch('/api/notice', { method: 'DELETE' });
      setGeneratedLink(null);
      showToast('↺ تمت استعادة جميع النصوص الأصلية وحفظها في Firebase بنجاح!', 'success');
    } catch (err) {
      showToast('حدث خطأ أثناء الاستعادة', 'error');
    } finally {
      setSaving(false);
    }
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 6000);
  };

  return (
    <div className="admin-wrapper" dir="rtl">
      {/* Toast Alert */}
      {toast && (
        <div className={`admin-toast admin-toast-${toast.type === 'error' ? 'error' : 'success'}`}>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Admin Navbar */}
      <header className="admin-navbar">
        <div className="admin-navbar-inner">
          <div className="admin-brand">
            <img src="/dist/img/ajeer-logo.png" alt="Ajeer" />
            <div className="admin-brand-divider" />
            <div className="admin-brand-info">
              <h1>
                <span>لوحة التحكم | إدارة تصاريح أجير</span>
                <span className="admin-brand-badge">سحابي مباشر</span>
              </h1>
              <p>تعديل فوري وسلس لجميع نصوص وبيانات التصريح مع حفظ سحابي في Firebase</p>
            </div>
          </div>

          <div className="admin-nav-actions">
            <Link href="/" target="_blank" className="admin-btn admin-btn-outline">
              <span>معاينة الصفحة الرئيسية ↗</span>
            </Link>
            <button
              type="button"
              onClick={handleReset}
              disabled={saving || loading}
              className="admin-btn admin-btn-danger"
            >
              <span>استعادة الأصل ↺</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading}
              className="admin-btn admin-btn-primary"
            >
              {saving ? <span>جارٍ الحفظ في Firebase...</span> : <span>حفظ وإنشاء رابط جديد ⚡</span>}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Form */}
      <main className="admin-container">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', fontSize: '18px', color: '#64748b', fontWeight: 600 }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
            جارٍ الاتصال بقاعدة بيانات Firebase وتحميل البيانات...
          </div>
        ) : (
          <form onSubmit={handleSave}>
            {/* Top Stats Overview Cards */}
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <div className="admin-stat-icon green">📋</div>
                <div className="admin-stat-details">
                  <div className="admin-stat-label">رقم التصريح</div>
                  <div className="admin-stat-value">{formData.noticeNumber || '-'}</div>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-icon blue">👤</div>
                <div className="admin-stat-details">
                  <div className="admin-stat-label">اسم العامل</div>
                  <div className="admin-stat-value">{formData.workerName || '-'}</div>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-icon purple">🛡️</div>
                <div className="admin-stat-details">
                  <div className="admin-stat-label">حالة التصريح</div>
                  <div className="admin-stat-value" style={{ color: formData.isValid ? '#16a34a' : '#dc2626' }}>
                    {formData.statusText || '-'}
                  </div>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-icon amber">🔗</div>
                <div className="admin-stat-details">
                  <div className="admin-stat-label">الروابط المنشأة</div>
                  <div className="admin-stat-value">{historyList.length} روابط سحابية</div>
                </div>
              </div>
            </div>

            {/* Generated Link Prominent Banner */}
            {generatedLink && (
              <div className="admin-generated-box">
                <div className="admin-generated-header">
                  <div className="admin-generated-title">
                    <span style={{ fontSize: '22px' }}>⚡</span>
                    <span>تم حفظ التعديلات في Firebase بنجاح وتوليد رابط جديد للتصريح!</span>
                    <span className="admin-generated-badge">جاهز للإرسال للعميل</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <a
                      href={generatedLink.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="admin-btn admin-btn-outline"
                      style={{ padding: '6px 14px', fontSize: '13px' }}
                    >
                      فتح ومعاينة الرابط ↗
                    </a>
                  </div>
                </div>

                <div className="admin-link-input-group">
                  <input
                    type="text"
                    readOnly
                    value={generatedLink.url}
                    className="admin-link-input"
                    onClick={(e) => e.target.select()}
                  />
                  <button
                    type="button"
                    onClick={() => handleCopyLink(generatedLink.url)}
                    className={`admin-btn-copy ${copied ? 'copied' : ''}`}
                  >
                    {copied ? <span>تم النسخ بنجاح ✓</span> : <span>نسخ الرابط 📋</span>}
                  </button>
                </div>

                <div
                  style={{
                    marginTop: '12px',
                    fontSize: '12.5px',
                    color: '#166534',
                    display: 'flex',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px',
                    fontWeight: 600,
                  }}
                >
                  <span>
                    🛡️ هذا الرابط مخصص ومرتبط مباشرة بـ Firebase. عندما يفتحه أي شخص ستظهر له التعديلات الجديدة فوراً دون أي أخطاء.
                  </span>
                  <span>
                    رقم التصريح: <strong>{generatedLink.noticeNumber}</strong> | العامل: <strong>{generatedLink.workerName}</strong>
                  </span>
                </div>
              </div>
            )}

            {/* Navigation Tabs (Pill Bar) */}
            <div className="admin-tabs-bar">
              <button
                type="button"
                onClick={() => setActiveTab('permit')}
                className={`admin-tab-btn ${activeTab === 'permit' ? 'active' : ''}`}
              >
                <span>📋</span>
                <span>بيانات التصريح والحالة</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('worker')}
                className={`admin-tab-btn ${activeTab === 'worker' ? 'active' : ''}`}
              >
                <span>👤</span>
                <span>بيانات العامل</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('facility')}
                className={`admin-tab-btn ${activeTab === 'facility' ? 'active' : ''}`}
              >
                <span>🏢</span>
                <span>بيانات المنشأة</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('labels')}
                className={`admin-tab-btn ${activeTab === 'labels' ? 'active' : ''}`}
              >
                <span>🏷️</span>
                <span>عناوين وتسميات الجداول</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('footer')}
                className={`admin-tab-btn ${activeTab === 'footer' ? 'active' : ''}`}
              >
                <span>📑</span>
                <span>نصوص وروابط التذييل</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`admin-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
              >
                <span>🔗</span>
                <span>سجل الروابط المنشأة</span>
                <span className="admin-tab-count">{historyList.length}</span>
              </button>
            </div>

            {/* Content Sections */}
            <div>
              {/* TAB 1: Permit & Status */}
              {activeTab === 'permit' && (
                <section className="admin-card">
                  <div className="admin-card-header">
                    <h2>
                      <span className="admin-card-header-icon">🛡️</span>
                      حالة التصريح والبيانات الأساسية
                    </h2>
                  </div>
                  <div className="admin-card-body">
                    {/* Status Picker */}
                    <div style={{ marginBottom: '24px' }}>
                      <label className="admin-label">
                        <span>حالة صلاحية التصريح ولون الشارة</span>
                        <span className="admin-label-hint">تنعكس في التقرير أعلى الصفحة</span>
                      </label>
                      <div className="admin-status-picker">
                        <div
                          className={`admin-status-option ${formData.isValid ? 'active-valid' : ''}`}
                          onClick={() => handleStatusToggle(true)}
                        >
                          <div className="admin-status-option-content">
                            <span style={{ fontSize: '20px' }}>🟢</span>
                            <span>ساري / فعال (صالح ومقبول)</span>
                          </div>
                          <input
                            type="radio"
                            name="isValid"
                            checked={formData.isValid === true}
                            onChange={() => handleStatusToggle(true)}
                          />
                        </div>

                        <div
                          className={`admin-status-option ${!formData.isValid ? 'active-invalid' : ''}`}
                          onClick={() => handleStatusToggle(false)}
                        >
                          <div className="admin-status-option-content">
                            <span style={{ fontSize: '20px' }}>🔴</span>
                            <span>منتهي / ملغي (غير صالح)</span>
                          </div>
                          <input
                            type="radio"
                            name="isValid"
                            checked={formData.isValid === false}
                            onChange={() => handleStatusToggle(false)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="admin-form-row">
                      <div>
                        <label className="admin-label">
                          <span>عنوان تبويب المتصفح (Browser Tab Title)</span>
                          <span className="admin-label-hint">يظهر في شريط المتصفح</span>
                        </label>
                        <div className="admin-input-wrap">
                          <span className="admin-input-icon">🌐</span>
                          <input
                            type="text"
                            name="pageTitle"
                            value={formData.pageTitle || ''}
                            onChange={handleChange}
                            className="admin-input"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="admin-label">
                          <span>عنوان رأس الصفحة (Header Title)</span>
                        </label>
                        <div className="admin-input-wrap">
                          <span className="admin-input-icon">📑</span>
                          <input
                            type="text"
                            name="headerTitle"
                            value={formData.headerTitle}
                            onChange={handleChange}
                            className="admin-input"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="admin-form-row">
                      <div className="admin-form-col-full">
                        <label className="admin-label">
                          <span>نص شارة الحالة (Status Text)</span>
                        </label>
                        <div className="admin-input-wrap">
                          <span className="admin-input-icon">🏷️</span>
                          <input
                            type="text"
                            name="statusText"
                            value={formData.statusText}
                            onChange={handleChange}
                            className="admin-input"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="admin-form-row">
                      <div className="admin-form-col-full">
                        <label className="admin-label">
                          <span>رسالة التحقق الخضراء</span>
                          <span className="admin-label-hint">السطر التوضيحي أسفل عنوان الصفحة</span>
                        </label>
                        <div className="admin-input-wrap">
                          <span className="admin-input-icon">✓</span>
                          <input
                            type="text"
                            name="verificationMessage"
                            value={formData.verificationMessage}
                            onChange={handleChange}
                            className="admin-input"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="admin-form-row">
                      <div>
                        <label className="admin-label">
                          <span>رقم التصريح</span>
                          <span className="admin-label-hint">مثال: TW0586633</span>
                        </label>
                        <div className="admin-input-wrap">
                          <span className="admin-input-icon">#</span>
                          <input
                            type="text"
                            name="noticeNumber"
                            value={formData.noticeNumber}
                            onChange={handleChange}
                            className="admin-input"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="admin-label">
                          <span>نوع التصريح</span>
                          <span className="admin-label-hint">مثال: تصريح إعارة أجير</span>
                        </label>
                        <div className="admin-input-wrap">
                          <span className="admin-input-icon">📜</span>
                          <input
                            type="text"
                            name="noticeType"
                            value={formData.noticeType}
                            onChange={handleChange}
                            className="admin-input"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="admin-form-row">
                      <div>
                        <label className="admin-label">
                          <span>تاريخ بداية التصريح</span>
                        </label>
                        <div className="admin-input-wrap">
                          <span className="admin-input-icon">📅</span>
                          <input
                            type="date"
                            name="startDate"
                            value={formData.startDate}
                            onChange={handleChange}
                            className="admin-input"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="admin-label">
                          <span>تاريخ نهاية التصريح</span>
                        </label>
                        <div className="admin-input-wrap">
                          <span className="admin-input-icon">📅</span>
                          <input
                            type="date"
                            name="endDate"
                            value={formData.endDate}
                            onChange={handleChange}
                            className="admin-input"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* TAB 2: Worker Details */}
              {activeTab === 'worker' && (
                <section className="admin-card">
                  <div className="admin-card-header">
                    <h2>
                      <span className="admin-card-header-icon">👤</span>
                      بيانات العامل (Worker Details)
                    </h2>
                  </div>
                  <div className="admin-card-body">
                    <div className="admin-form-row">
                      <div className="admin-form-col-full">
                        <label className="admin-label">
                          <span>اسم العامل بالكامل</span>
                          <span className="admin-label-hint">كما هو مسجل في الإقامة أو الجواز</span>
                        </label>
                        <div className="admin-input-wrap">
                          <span className="admin-input-icon">👤</span>
                          <input
                            type="text"
                            name="workerName"
                            value={formData.workerName}
                            onChange={handleChange}
                            className="admin-input"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="admin-form-row">
                      <div>
                        <label className="admin-label">
                          <span>رقم الهوية / الإقامة</span>
                          <span className="admin-label-hint">10 أرقام</span>
                        </label>
                        <div className="admin-input-wrap">
                          <span className="admin-input-icon">🪪</span>
                          <input
                            type="text"
                            name="iqamaNumber"
                            value={formData.iqamaNumber}
                            onChange={handleChange}
                            className="admin-input"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="admin-label">
                          <span>الجنسية</span>
                        </label>
                        <div className="admin-input-wrap">
                          <span className="admin-input-icon">🌍</span>
                          <input
                            type="text"
                            name="nationality"
                            value={formData.nationality}
                            onChange={handleChange}
                            className="admin-input"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="admin-form-row">
                      <div>
                        <label className="admin-label">
                          <span>المهنة</span>
                        </label>
                        <div className="admin-input-wrap">
                          <span className="admin-input-icon">💼</span>
                          <input
                            type="text"
                            name="occupation"
                            value={formData.occupation}
                            onChange={handleChange}
                            className="admin-input"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="admin-label">
                          <span>الجنس</span>
                        </label>
                        <div className="admin-input-wrap">
                          <span className="admin-input-icon">⚥</span>
                          <input
                            type="text"
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            className="admin-input"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="admin-form-row">
                      <div>
                        <label className="admin-label">
                          <span>تاريخ الميلاد</span>
                        </label>
                        <div className="admin-input-wrap">
                          <span className="admin-input-icon">🎂</span>
                          <input
                            type="text"
                            name="birthDate"
                            value={formData.birthDate}
                            onChange={handleChange}
                            className="admin-input"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* TAB 3: Facility Details */}
              {activeTab === 'facility' && (
                <section className="admin-card">
                  <div className="admin-card-header">
                    <h2>
                      <span className="admin-card-header-icon">🏢</span>
                      بيانات المنشأة (Facility Details)
                    </h2>
                  </div>
                  <div className="admin-card-body">
                    <div className="admin-form-row">
                      <div>
                        <label className="admin-label">
                          <span>رقم المنشأة</span>
                          <span className="admin-label-hint">مثال: 14-4016821</span>
                        </label>
                        <div className="admin-input-wrap">
                          <span className="admin-input-icon">🏢</span>
                          <input
                            type="text"
                            name="facilityNumber"
                            value={formData.facilityNumber}
                            onChange={handleChange}
                            className="admin-input"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="admin-label">
                          <span>اسم المنشأة</span>
                        </label>
                        <div className="admin-input-wrap">
                          <span className="admin-input-icon">🏷️</span>
                          <input
                            type="text"
                            name="facilityName"
                            value={formData.facilityName}
                            onChange={handleChange}
                            className="admin-input"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* TAB 4: Labels & Section Titles */}
              {activeTab === 'labels' && (
                <section className="admin-card">
                  <div className="admin-card-header">
                    <h2>
                      <span className="admin-card-header-icon">🏷️</span>
                      تعديل عناوين وتسميات الجداول الثابتة
                    </h2>
                  </div>
                  <div className="admin-card-body">
                    <div style={{ marginBottom: '20px' }}>
                      <h3 style={{ fontSize: '15px', color: '#1f6f55', fontWeight: 800, marginBottom: '14px' }}>
                        1. عناوين وتسميات جدول التصريح
                      </h3>
                      <div className="admin-form-row">
                        <div>
                          <label className="admin-label">عنوان القسم الأول</label>
                          <input
                            type="text"
                            name="section1Title"
                            value={formData.section1Title}
                            onChange={handleChange}
                            className="admin-input no-icon"
                          />
                        </div>
                        <div>
                          <label className="admin-label">تسمية "رقم التصريح"</label>
                          <input
                            type="text"
                            name="noticeNumberLabel"
                            value={formData.noticeNumberLabel}
                            onChange={handleChange}
                            className="admin-input no-icon"
                          />
                        </div>
                      </div>
                      <div className="admin-form-row">
                        <div>
                          <label className="admin-label">تسمية "نوع التصريح"</label>
                          <input
                            type="text"
                            name="noticeTypeLabel"
                            value={formData.noticeTypeLabel}
                            onChange={handleChange}
                            className="admin-input no-icon"
                          />
                        </div>
                        <div>
                          <label className="admin-label">تسمية "تاريخ بداية التصريح"</label>
                          <input
                            type="text"
                            name="startDateLabel"
                            value={formData.startDateLabel}
                            onChange={handleChange}
                            className="admin-input no-icon"
                          />
                        </div>
                      </div>
                      <div className="admin-form-row">
                        <div>
                          <label className="admin-label">تسمية "تاريخ نهاية التصريح"</label>
                          <input
                            type="text"
                            name="endDateLabel"
                            value={formData.endDateLabel}
                            onChange={handleChange}
                            className="admin-input no-icon"
                          />
                        </div>
                      </div>
                    </div>

                    <div style={{ marginBottom: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                      <h3 style={{ fontSize: '15px', color: '#1f6f55', fontWeight: 800, marginBottom: '14px' }}>
                        2. عناوين وتسميات جدول العامل
                      </h3>
                      <div className="admin-form-row">
                        <div>
                          <label className="admin-label">عنوان القسم الثاني</label>
                          <input
                            type="text"
                            name="section2Title"
                            value={formData.section2Title}
                            onChange={handleChange}
                            className="admin-input no-icon"
                          />
                        </div>
                        <div>
                          <label className="admin-label">تسمية "اسم العامل"</label>
                          <input
                            type="text"
                            name="workerNameLabel"
                            value={formData.workerNameLabel}
                            onChange={handleChange}
                            className="admin-input no-icon"
                          />
                        </div>
                      </div>
                      <div className="admin-form-row">
                        <div>
                          <label className="admin-label">تسمية "رقم الهوية / الإقامة"</label>
                          <input
                            type="text"
                            name="iqamaNumberLabel"
                            value={formData.iqamaNumberLabel}
                            onChange={handleChange}
                            className="admin-input no-icon"
                          />
                        </div>
                        <div>
                          <label className="admin-label">تسمية "الجنسية"</label>
                          <input
                            type="text"
                            name="nationalityLabel"
                            value={formData.nationalityLabel}
                            onChange={handleChange}
                            className="admin-input no-icon"
                          />
                        </div>
                      </div>
                      <div className="admin-form-row">
                        <div>
                          <label className="admin-label">تسمية "المهنة"</label>
                          <input
                            type="text"
                            name="occupationLabel"
                            value={formData.occupationLabel}
                            onChange={handleChange}
                            className="admin-input no-icon"
                          />
                        </div>
                        <div>
                          <label className="admin-label">تسمية "الجنس"</label>
                          <input
                            type="text"
                            name="genderLabel"
                            value={formData.genderLabel}
                            onChange={handleChange}
                            className="admin-input no-icon"
                          />
                        </div>
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                      <h3 style={{ fontSize: '15px', color: '#1f6f55', fontWeight: 800, marginBottom: '14px' }}>
                        3. عناوين جدول المنشأة
                      </h3>
                      <div className="admin-form-row">
                        <div>
                          <label className="admin-label">عنوان القسم الثالث</label>
                          <input
                            type="text"
                            name="section3Title"
                            value={formData.section3Title}
                            onChange={handleChange}
                            className="admin-input no-icon"
                          />
                        </div>
                        <div>
                          <label className="admin-label">تسمية "رقم المنشأة"</label>
                          <input
                            type="text"
                            name="facilityNumberLabel"
                            value={formData.facilityNumberLabel}
                            onChange={handleChange}
                            className="admin-input no-icon"
                          />
                        </div>
                      </div>
                      <div className="admin-form-row">
                        <div>
                          <label className="admin-label">تسمية "اسم المنشأة"</label>
                          <input
                            type="text"
                            name="facilityNameLabel"
                            value={formData.facilityNameLabel}
                            onChange={handleChange}
                            className="admin-input no-icon"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* TAB 5: Footer & Links */}
              {activeTab === 'footer' && (
                <section className="admin-card">
                  <div className="admin-card-header">
                    <h2>
                      <span className="admin-card-header-icon">📑</span>
                      نصوص وروابط تذييل الصفحة (Footer)
                    </h2>
                  </div>
                  <div className="admin-card-body">
                    <div className="admin-form-row">
                      <div>
                        <label className="admin-label">بريد الدعم والمساعدة</label>
                        <input
                          type="text"
                          name="footerSupportEmail"
                          value={formData.footerSupportEmail}
                          onChange={handleChange}
                          className="admin-input no-icon"
                        />
                      </div>
                      <div>
                        <label className="admin-label">رقم هاتف الدعم</label>
                        <input
                          type="text"
                          name="footerSupportPhone"
                          value={formData.footerSupportPhone}
                          onChange={handleChange}
                          className="admin-input no-icon"
                        />
                      </div>
                    </div>

                    <div className="admin-form-row">
                      <div className="admin-form-col-full">
                        <label className="admin-label">رابط منصة X (تويتر)</label>
                        <input
                          type="text"
                          name="footerTwitterUrl"
                          value={formData.footerTwitterUrl}
                          onChange={handleChange}
                          className="admin-input no-icon"
                        />
                      </div>
                    </div>

                    <div className="admin-form-row">
                      <div>
                        <label className="admin-label">عنوان العمود 1</label>
                        <input
                          type="text"
                          name="footerCol1Title"
                          value={formData.footerCol1Title}
                          onChange={handleChange}
                          className="admin-input no-icon"
                        />
                      </div>
                      <div>
                        <label className="admin-label">عنوان العمود 2</label>
                        <input
                          type="text"
                          name="footerCol2Title"
                          value={formData.footerCol2Title}
                          onChange={handleChange}
                          className="admin-input no-icon"
                        />
                      </div>
                    </div>

                    <div className="admin-form-row">
                      <div>
                        <label className="admin-label">عنوان العمود 3</label>
                        <input
                          type="text"
                          name="footerCol3Title"
                          value={formData.footerCol3Title}
                          onChange={handleChange}
                          className="admin-input no-icon"
                        />
                      </div>
                      <div>
                        <label className="admin-label">عنوان العمود 4</label>
                        <input
                          type="text"
                          name="footerCol4Title"
                          value={formData.footerCol4Title}
                          onChange={handleChange}
                          className="admin-input no-icon"
                        />
                      </div>
                    </div>

                    <div style={{ marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                      <h3 style={{ fontSize: '15px', color: '#1f6f55', fontWeight: 800, marginBottom: '14px' }}>
                        روابط الجهات الرسمية في الفوتر (Government Partner Links)
                      </h3>
                      <div className="admin-form-row">
                        <div>
                          <label className="admin-label">رابط وزارة الموارد البشرية</label>
                          <input
                            type="text"
                            name="footerMlsdUrl"
                            value={formData.footerMlsdUrl || ''}
                            onChange={handleChange}
                            className="admin-input no-icon"
                          />
                        </div>
                        <div>
                          <label className="admin-label">رابط شركة تكامل القابضة</label>
                          <input
                            type="text"
                            name="footerTakamolUrl"
                            value={formData.footerTakamolUrl || ''}
                            onChange={handleChange}
                            className="admin-input no-icon"
                          />
                        </div>
                      </div>
                      <div className="admin-form-row">
                        <div>
                          <label className="admin-label">رابط تمكين للتقنيات</label>
                          <input
                            type="text"
                            name="footerTamkeenUrl"
                            value={formData.footerTamkeenUrl || ''}
                            onChange={handleChange}
                            className="admin-input no-icon"
                          />
                        </div>
                        <div>
                          <label className="admin-label">رابط ختم هيئة الحكومة الرقمية</label>
                          <input
                            type="text"
                            name="footerDigitalStampUrl"
                            value={formData.footerDigitalStampUrl || ''}
                            onChange={handleChange}
                            className="admin-input no-icon"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* TAB 6: History of Generated Links */}
              {activeTab === 'history' && (
                <section className="admin-card">
                  <div className="admin-card-header">
                    <h2>
                      <span className="admin-card-header-icon">🔗</span>
                      سجل الروابط المنشأة سحابياً في Firebase ({historyList.length})
                    </h2>
                  </div>
                  <div className="admin-card-body">
                    <p style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '16px', fontWeight: 500 }}>
                      كل تعديل تقوم بحفظه يتم تخزينه في Firebase Firestore ويتم توليد رابط تحقق مخصص ومحمي له. يمكنك نسخ أي رابط أو معاينته مباشرة:
                    </p>
                    {historyList.length === 0 ? (
                      <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '12px' }}>
                        <div style={{ fontSize: '28px', marginBottom: '8px' }}>📭</div>
                        لم يتم إنشاء روابط بعد. قم بتعديل أي بيانات واضغط "حفظ وإنشاء رابط جديد ⚡" لإنشاء أول رابط مخصص.
                      </div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table className="admin-history-table">
                          <thead>
                            <tr>
                              <th>رقم التصريح</th>
                              <th>اسم العامل</th>
                              <th>اسم المنشأة</th>
                              <th>وقت الإنشاء</th>
                              <th>الإجراءات السريعة</th>
                            </tr>
                          </thead>
                          <tbody>
                            {historyList.map((item, idx) => {
                              const origin = typeof window !== 'undefined' ? window.location.origin : '';
                              const itemUrl = item.url || `${origin}/notice-verification/${item.token}`;
                              return (
                                <tr key={item.token || idx}>
                                  <td><strong>{item.noticeNumber || '-'}</strong></td>
                                  <td>{item.workerName || '-'}</td>
                                  <td>{item.facilityName || '-'}</td>
                                  <td style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                                    {item.createdAt ? new Date(item.createdAt).toLocaleString('ar-SA') : '-'}
                                  </td>
                                  <td>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                      <button
                                        type="button"
                                        onClick={() => handleCopyLink(itemUrl)}
                                        className="admin-btn admin-btn-outline"
                                        style={{ padding: '6px 12px', fontSize: '12px' }}
                                      >
                                        نسخ الرابط 📋
                                      </button>
                                      <a
                                        href={itemUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="admin-btn admin-btn-outline"
                                        style={{ padding: '6px 12px', fontSize: '12px' }}
                                      >
                                        معاينة ↗
                                      </a>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Real-time Live Preview Section */}
              <section className="admin-card">
                <div className="admin-card-header">
                  <h2>
                    <span className="admin-card-header-icon">👁️</span>
                    المعاينة الحية الفورية (Live Preview)
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="admin-btn admin-btn-outline"
                    style={{ padding: '6px 14px', fontSize: '13px' }}
                  >
                    {showPreview ? 'إخفاء المعاينة ✕' : 'عرض المعاينة 👁️'}
                  </button>
                </div>
                {showPreview && (
                  <div className="admin-card-body" style={{ background: '#f7f8f7', padding: '24px' }}>
                    <div className="verification-document" id="verification-content" style={{ margin: '0 auto' }}>
                      <table className="verification-header" dir="rtl">
                        <tbody>
                          <tr>
                            <td className="verification-header__logos">
                              <img
                                className="verification-logo verification-logo--ajeer"
                                src="/dist/img/ajeer-logo.png"
                                alt="أجير"
                              />
                              <img
                                className="verification-logo verification-logo--hrsd"
                                src="/dist/img/mlsd-logo.png"
                                alt="وزارة الموارد البشرية والتنمية الاجتماعية"
                              />
                            </td>
                            <td className="verification-header__title">
                              <h1 className="verification-title">{formData.headerTitle}</h1>
                            </td>
                            <td className="verification-header__result">
                              <strong
                                className={`verification-result ${
                                  formData.isValid ? 'verification-result--valid' : 'verification-result--invalid'
                                }`}
                              >
                                {formData.statusText}
                              </strong>
                            </td>
                          </tr>
                          <tr className="verification-header__message">
                            <td colSpan="3">
                              <p className="verification-notice">{formData.verificationMessage}</p>
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Preview Table 1 */}
                      <table className="verification-table" dir="rtl">
                        <tbody>
                          <tr className="verification-table__section">
                            <th colSpan="4">{formData.section1Title}</th>
                          </tr>
                          <tr>
                            <th className="verification-table__label">{formData.noticeNumberLabel}</th>
                            <td className="verification-table__value">{formData.noticeNumber}</td>
                            <th className="verification-table__label">{formData.noticeTypeLabel}</th>
                            <td className="verification-table__value">{formData.noticeType}</td>
                          </tr>
                          <tr>
                            <th className="verification-table__label">{formData.startDateLabel}</th>
                            <td className="verification-table__value">{formData.startDate}</td>
                            <th className="verification-table__label">{formData.endDateLabel}</th>
                            <td className="verification-table__value">{formData.endDate}</td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Preview Table 2 */}
                      <table className="verification-table" dir="rtl">
                        <tbody>
                          <tr className="verification-table__section">
                            <th colSpan="4">{formData.section2Title}</th>
                          </tr>
                          <tr>
                            <th className="verification-table__label">{formData.workerNameLabel}</th>
                            <td className="verification-table__value">{formData.workerName}</td>
                            <th className="verification-table__label">{formData.iqamaNumberLabel}</th>
                            <td className="verification-table__value">{formData.iqamaNumber}</td>
                          </tr>
                          <tr>
                            <th className="verification-table__label">{formData.nationalityLabel}</th>
                            <td className="verification-table__value">{formData.nationality}</td>
                            <th className="verification-table__label">{formData.occupationLabel}</th>
                            <td className="verification-table__value">{formData.occupation}</td>
                          </tr>
                          <tr>
                            <th className="verification-table__label">{formData.genderLabel}</th>
                            <td className="verification-table__value">{formData.gender}</td>
                            <th className="verification-table__label">{formData.birthDateLabel}</th>
                            <td className="verification-table__value">{formData.birthDate}</td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Preview Table 3 */}
                      <table className="verification-table" dir="rtl">
                        <tbody>
                          <tr className="verification-table__section">
                            <th colSpan="4">{formData.section3Title}</th>
                          </tr>
                          <tr>
                            <th className="verification-table__label">{formData.facilityNumberLabel}</th>
                            <td className="verification-table__value">{formData.facilityNumber}</td>
                            <th className="verification-table__label">{formData.facilityNameLabel}</th>
                            <td className="verification-table__value">{formData.facilityName}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </section>
            </div>

            {/* Sticky Action Bar */}
            <div className="admin-sticky-bar">
              <div className="admin-sticky-bar-inner">
                <div className="admin-sticky-status">
                  <div className="admin-status-indicator" />
                  <span>
                    متصل سحابياً بـ Firebase Firestore | يتم توليد الرابط المخصص للعميل فوراً دون أي أخطاء.
                  </span>
                </div>
                <div className="admin-nav-actions">
                  {generatedLink && (
                    <button
                      type="button"
                      onClick={() => handleCopyLink(generatedLink.url)}
                      className={`admin-btn ${copied ? 'admin-btn-primary' : 'admin-btn-outline'}`}
                      style={{ borderColor: '#22c55e' }}
                    >
                      {copied ? <span>تم النسخ ✓</span> : <span>نسخ الرابط الأخير 📋</span>}
                    </button>
                  )}
                  <Link href="/" target="_blank" className="admin-btn admin-btn-outline">
                    <span>فتح الصفحة الرئيسية ↗</span>
                  </Link>
                  <button
                    type="submit"
                    disabled={saving || loading}
                    className="admin-btn admin-btn-primary"
                    style={{ minWidth: '240px' }}
                  >
                    {saving ? <span>جارٍ الحفظ في Firebase...</span> : <span>حفظ وإنشاء رابط جديد ⚡</span>}
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
