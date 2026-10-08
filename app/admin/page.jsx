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

  // Fetch initial data & history on load
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
      const fullUrl = `${window.location.origin}/notice-verification/${token}`;

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

      showToast('✓ تم الحفظ في Firebase Firestore أولاً، وتم إنشاء رابط التحقق الجديد بنجاح!', 'success');
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
        <div className={`admin-toast admin-toast-${toast.type === 'warning' ? 'error' : toast.type}`}>
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
              <h1>لوحة التحكم | إدارة محتوى ونصوص أجير بالكامل</h1>
              <p>تعديل وحفظ جميع البيانات والنصوص الثابتة في Firebase Firestore</p>
            </div>
          </div>

          <div className="admin-nav-actions">
            <Link href="/" target="_blank" className="admin-btn admin-btn-outline">
              <span>معاينة الرابط المباشر ↗</span>
            </Link>
            <button
              type="button"
              onClick={handleReset}
              disabled={saving || loading}
              className="admin-btn admin-btn-danger"
            >
              <span>استعادة النصوص الأصلية ↺</span>
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
          <div style={{ textAlign: 'center', padding: '60px 0', fontSize: '18px', color: '#64748b' }}>
            جارٍ الاتصال بـ Firebase وتحميل جميع النصوص...
          </div>
        ) : (
          <form onSubmit={handleSave}>
            {/* NEW GENERATED LINK BANNER */}
            {generatedLink && (
              <div className="admin-generated-box">
                <div className="admin-generated-header">
                  <div className="admin-generated-title">
                    <span style={{ fontSize: '20px' }}>⚡</span>
                    <span>تم حفظ التعديلات في Firebase Firestore وتوليد رابط جديد للتصريح بنجاح!</span>
                    <span className="admin-generated-badge">جاهز للإرسال للعميل</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <a
                      href={generatedLink.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="admin-btn admin-btn-outline"
                      style={{ padding: '6px 12px', fontSize: '13px' }}
                    >
                      فتح الرابط ومعاينته ↗
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
                    marginTop: '10px',
                    fontSize: '12.5px',
                    color: '#166534',
                    display: 'flex',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  <span>
                    🛡️ هذا الرابط مخصص ومرتبط مباشرة بـ Firebase. أي شخص يفتح هذا الرابط ستظهر له التعديلات الجديدة فوراً دون أي أخطاء.
                  </span>
                  <span>
                    رقم التصريح: <strong>{generatedLink.noticeNumber}</strong> | العامل: <strong>{generatedLink.workerName}</strong>
                  </span>
                </div>
              </div>
            )}

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setActiveTab('permit')}
                className={`admin-btn ${activeTab === 'permit' ? 'admin-btn-primary' : 'admin-btn-outline'}`}
              >
                📋 بيانات التصريح والحالة
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('worker')}
                className={`admin-btn ${activeTab === 'worker' ? 'admin-btn-primary' : 'admin-btn-outline'}`}
              >
                👤 بيانات العامل
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('facility')}
                className={`admin-btn ${activeTab === 'facility' ? 'admin-btn-primary' : 'admin-btn-outline'}`}
              >
                🏢 بيانات المنشأة
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('labels')}
                className={`admin-btn ${activeTab === 'labels' ? 'admin-btn-primary' : 'admin-btn-outline'}`}
              >
                🏷️ عناوين وتسميات الجداول
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('footer')}
                className={`admin-btn ${activeTab === 'footer' ? 'admin-btn-primary' : 'admin-btn-outline'}`}
              >
                📑 نصوص وروابط التذييل
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`admin-btn ${activeTab === 'history' ? 'admin-btn-primary' : 'admin-btn-outline'}`}
              >
                🔗 سجل الروابط المنشأة ({historyList.length})
              </button>
            </div>

            <div className="admin-grid">
              {/* TAB 1: Permit & Status */}
              {activeTab === 'permit' && (
                <>
                  <section className="admin-card">
                    <div className="admin-card-header">
                      <h2>
                        <span className="admin-card-header-icon">🛡️</span>
                        حالة التصريح والعناوين الرئيسية
                      </h2>
                    </div>
                    <div className="admin-card-body">
                      <div className="admin-form-row">
                        <div>
                          <label className="admin-label">عنوان رأس الصفحة (Header Title)</label>
                          <input
                            type="text"
                            name="headerTitle"
                            value={formData.headerTitle}
                            onChange={handleChange}
                            className="admin-input"
                            required
                          />
                        </div>
                        <div>
                          <label className="admin-label">نص شارة الحالة</label>
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

                      <div className="admin-form-row" style={{ marginTop: '16px' }}>
                        <div>
                          <label className="admin-label">نوع لون الشارة</label>
                          <div className="admin-status-picker">
                            <div
                              className={`admin-status-option ${formData.isValid ? 'active-valid' : ''}`}
                              onClick={() => handleStatusToggle(true)}
                            >
                              <input
                                type="radio"
                                name="isValid"
                                checked={formData.isValid === true}
                                onChange={() => handleStatusToggle(true)}
                              />
                              <span style={{ color: '#176747' }}>ساري / فعال (أخضر)</span>
                            </div>
                            <div
                              className={`admin-status-option ${!formData.isValid ? 'active-invalid' : ''}`}
                              onClick={() => handleStatusToggle(false)}
                            >
                              <input
                                type="radio"
                                name="isValid"
                                checked={formData.isValid === false}
                                onChange={() => handleStatusToggle(false)}
                              />
                              <span style={{ color: '#9f2f23' }}>منتهي / ملغي (أحمر)</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="admin-label">رسالة تأكيد التحقق</label>
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
                  </section>

                  <section className="admin-card">
                    <div className="admin-card-header">
                      <h2>
                        <span className="admin-card-header-icon">📋</span>
                        قيم جدول التصريح (Table 1 Values)
                      </h2>
                    </div>
                    <div className="admin-card-body">
                      <div className="admin-form-row">
                        <div>
                          <label className="admin-label">رقم التصريح</label>
                          <input
                            type="text"
                            name="noticeNumber"
                            value={formData.noticeNumber}
                            onChange={handleChange}
                            className="admin-input"
                            required
                          />
                        </div>
                        <div>
                          <label className="admin-label">نوع التصريح</label>
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

                      <div className="admin-form-row">
                        <div>
                          <label className="admin-label">تاريخ بداية التصريح</label>
                          <input
                            type="text"
                            name="startDate"
                            value={formData.startDate}
                            onChange={handleChange}
                            className="admin-input"
                            required
                          />
                        </div>
                        <div>
                          <label className="admin-label">تاريخ نهاية التصريح</label>
                          <input
                            type="text"
                            name="endDate"
                            value={formData.endDate}
                            onChange={handleChange}
                            className="admin-input"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </section>
                </>
              )}

              {/* TAB 2: Worker Details */}
              {activeTab === 'worker' && (
                <section className="admin-card">
                  <div className="admin-card-header">
                    <h2>
                      <span className="admin-card-header-icon">👤</span>
                      بيانات العامل (Table 2 Values)
                    </h2>
                  </div>
                  <div className="admin-card-body">
                    <div className="admin-form-row">
                      <div>
                        <label className="admin-label">اسم العامل</label>
                        <input
                          type="text"
                          name="workerName"
                          value={formData.workerName}
                          onChange={handleChange}
                          className="admin-input"
                          required
                        />
                      </div>
                      <div>
                        <label className="admin-label">رقم الهوية / الإقامة</label>
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

                    <div className="admin-form-row">
                      <div>
                        <label className="admin-label">الجنسية</label>
                        <input
                          type="text"
                          name="nationality"
                          value={formData.nationality}
                          onChange={handleChange}
                          className="admin-input"
                          required
                        />
                      </div>
                      <div>
                        <label className="admin-label">المهنة</label>
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

                    <div className="admin-form-row">
                      <div>
                        <label className="admin-label">الجنس</label>
                        <select
                          name="gender"
                          value={formData.gender}
                          onChange={handleChange}
                          className="admin-select"
                        >
                          <option value="ذكر">ذكر</option>
                          <option value="أنثى">أنثى</option>
                        </select>
                      </div>
                      <div>
                        <label className="admin-label">تاريخ الميلاد</label>
                        <input
                          type="text"
                          name="birthDate"
                          value={formData.birthDate}
                          onChange={handleChange}
                          className="admin-input"
                        />
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
                      بيانات المنشأة (Table 3 Values)
                    </h2>
                  </div>
                  <div className="admin-card-body">
                    <div className="admin-form-row">
                      <div>
                        <label className="admin-label">رقم المنشأة</label>
                        <input
                          type="text"
                          name="facilityNumber"
                          value={formData.facilityNumber}
                          onChange={handleChange}
                          className="admin-input"
                          required
                        />
                      </div>
                      <div>
                        <label className="admin-label">اسم المنشأة</label>
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
                </section>
              )}

              {/* TAB 4: Labels & Table Headings */}
              {activeTab === 'labels' && (
                <section className="admin-card">
                  <div className="admin-card-header">
                    <h2>
                      <span className="admin-card-header-icon">🏷️</span>
                      تعديل نصوص وتسميات الجداول الثابتة
                    </h2>
                  </div>
                  <div className="admin-card-body">
                    <h3 style={{ fontSize: '15px', color: '#1f6f55', marginBottom: '12px' }}>
                      عناوين جدول التصريح:
                    </h3>
                    <div className="admin-form-row">
                      <div>
                        <label className="admin-label">عنوان القسم الأول</label>
                        <input
                          type="text"
                          name="section1Title"
                          value={formData.section1Title}
                          onChange={handleChange}
                          className="admin-input"
                        />
                      </div>
                      <div>
                        <label className="admin-label">تسمية "رقم التصريح"</label>
                        <input
                          type="text"
                          name="noticeNumberLabel"
                          value={formData.noticeNumberLabel}
                          onChange={handleChange}
                          className="admin-input"
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
                          className="admin-input"
                        />
                      </div>
                      <div>
                        <label className="admin-label">تسمية "تاريخ بداية التصريح"</label>
                        <input
                          type="text"
                          name="startDateLabel"
                          value={formData.startDateLabel}
                          onChange={handleChange}
                          className="admin-input"
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
                          className="admin-input"
                        />
                      </div>
                    </div>

                    <hr style={{ margin: '20px 0', borderColor: '#e2e8f0' }} />

                    <h3 style={{ fontSize: '15px', color: '#1f6f55', marginBottom: '12px' }}>
                      عناوين جدول العامل:
                    </h3>
                    <div className="admin-form-row">
                      <div>
                        <label className="admin-label">عنوان القسم الثاني</label>
                        <input
                          type="text"
                          name="section2Title"
                          value={formData.section2Title}
                          onChange={handleChange}
                          className="admin-input"
                        />
                      </div>
                      <div>
                        <label className="admin-label">تسمية "اسم العامل"</label>
                        <input
                          type="text"
                          name="workerNameLabel"
                          value={formData.workerNameLabel}
                          onChange={handleChange}
                          className="admin-input"
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
                          className="admin-input"
                        />
                      </div>
                      <div>
                        <label className="admin-label">تسمية "الجنسية"</label>
                        <input
                          type="text"
                          name="nationalityLabel"
                          value={formData.nationalityLabel}
                          onChange={handleChange}
                          className="admin-input"
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
                          className="admin-input"
                        />
                      </div>
                      <div>
                        <label className="admin-label">تسمية "الجنس"</label>
                        <input
                          type="text"
                          name="genderLabel"
                          value={formData.genderLabel}
                          onChange={handleChange}
                          className="admin-input"
                        />
                      </div>
                    </div>
                    <div className="admin-form-row">
                      <div>
                        <label className="admin-label">تسمية "تاريخ الميلاد"</label>
                        <input
                          type="text"
                          name="birthDateLabel"
                          value={formData.birthDateLabel}
                          onChange={handleChange}
                          className="admin-input"
                        />
                      </div>
                    </div>

                    <hr style={{ margin: '20px 0', borderColor: '#e2e8f0' }} />

                    <h3 style={{ fontSize: '15px', color: '#1f6f55', marginBottom: '12px' }}>
                      عناوين جدول المنشأة:
                    </h3>
                    <div className="admin-form-row">
                      <div>
                        <label className="admin-label">عنوان القسم الثالث</label>
                        <input
                          type="text"
                          name="section3Title"
                          value={formData.section3Title}
                          onChange={handleChange}
                          className="admin-input"
                        />
                      </div>
                      <div>
                        <label className="admin-label">تسمية "رقم المنشأة"</label>
                        <input
                          type="text"
                          name="facilityNumberLabel"
                          value={formData.facilityNumberLabel}
                          onChange={handleChange}
                          className="admin-input"
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
                          className="admin-input"
                        />
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* TAB 5: Footer Text & Links */}
              {activeTab === 'footer' && (
                <section className="admin-card">
                  <div className="admin-card-header">
                    <h2>
                      <span className="admin-card-header-icon">📑</span>
                      تعديل نصوص ومعلومات تذييل الصفحة (Footer)
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
                          className="admin-input"
                        />
                      </div>
                      <div>
                        <label className="admin-label">رقم هاتف الدعم</label>
                        <input
                          type="text"
                          name="footerSupportPhone"
                          value={formData.footerSupportPhone}
                          onChange={handleChange}
                          className="admin-input"
                        />
                      </div>
                    </div>

                    <div className="admin-form-row">
                      <div className="admin-form-col-full">
                        <label className="admin-label">رابط منصة X (تويتر سابقاً)</label>
                        <input
                          type="text"
                          name="footerTwitterUrl"
                          value={formData.footerTwitterUrl}
                          onChange={handleChange}
                          className="admin-input"
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
                          className="admin-input"
                        />
                      </div>
                      <div>
                        <label className="admin-label">عنوان العمود 2</label>
                        <input
                          type="text"
                          name="footerCol2Title"
                          value={formData.footerCol2Title}
                          onChange={handleChange}
                          className="admin-input"
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
                          className="admin-input"
                        />
                      </div>
                      <div>
                        <label className="admin-label">عنوان العمود 4</label>
                        <input
                          type="text"
                          name="footerCol4Title"
                          value={formData.footerCol4Title}
                          onChange={handleChange}
                          className="admin-input"
                        />
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
                      سجل الروابط المنشأة في Firebase ({historyList.length})
                    </h2>
                  </div>
                  <div className="admin-card-body">
                    <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '14px' }}>
                      كل تعديل تقوم بحفظه يتم تخزينه في Firebase Firestore ويتم إنشاء رابط تحقق مخصص وفريد له. يمكنك نسخ أي رابط أو معاينته مباشرة:
                    </p>
                    {historyList.length === 0 ? (
                      <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '8px' }}>
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
                              <th>الإجراءات</th>
                            </tr>
                          </thead>
                          <tbody>
                            {historyList.map((item, idx) => {
                              const itemUrl = item.url || (typeof window !== 'undefined' ? `${window.location.origin}/notice-verification/${item.token}` : '');
                              return (
                                <tr key={item.token || idx}>
                                  <td><strong>{item.noticeNumber || '-'}</strong></td>
                                  <td>{item.workerName || '-'}</td>
                                  <td>{item.facilityName || '-'}</td>
                                  <td style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                                    {item.createdAt ? new Date(item.createdAt).toLocaleString('ar-SA') : '-'}
                                  </td>
                                  <td>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                      <button
                                        type="button"
                                        onClick={() => handleCopyLink(itemUrl)}
                                        className="admin-btn admin-btn-outline"
                                        style={{ padding: '5px 10px', fontSize: '12px' }}
                                      >
                                        نسخ الرابط 📋
                                      </button>
                                      <a
                                        href={itemUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="admin-btn admin-btn-outline"
                                        style={{ padding: '5px 10px', fontSize: '12px' }}
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
                    style={{ padding: '5px 12px', fontSize: '13px' }}
                  >
                    {showPreview ? 'إخفاء المعاينة' : 'عرض المعاينة'}
                  </button>
                </div>
                {showPreview && (
                  <div className="admin-card-body" style={{ background: '#f7f8f7', padding: '20px' }}>
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
                        </tbody>
                      </table>

                      <div className="verification-copy">
                        <p>{formData.verificationMessage}</p>
                      </div>

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
                    يتم الحفظ في Firebase أولاً ثم توليد الرابط المخصص للعميل فوراً دون أي أخطاء.
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
                      {copied ? <span>تم النسخ ✓</span> : <span>نسخ الرابط الجديد 📋</span>}
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
