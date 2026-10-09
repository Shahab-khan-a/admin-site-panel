'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  saveNoticeToFirestore,
  fetchNoticeFromFirestore,
  fetchLinksHistory,
  deleteNoticeFromFirestore,
} from '../../lib/firestoreService';
import { DEFAULT_NOTICE_DATA } from '../../lib/defaultData';
import '../../public/dist/css/admin.css';

export default function AdminPage() {
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({ ...DEFAULT_NOTICE_DATA });
  const [editingToken, setEditingToken] = useState(null); // When editing an existing permit
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingToken, setDeletingToken] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('form'); // 'form' | 'history'
  const [generatedLink, setGeneratedLink] = useState(null);
  const [copiedToken, setCopiedToken] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch initial data & links history directly from Firestore on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [firestoreData, history] = await Promise.all([
          fetchNoticeFromFirestore('current'),
          fetchLinksHistory(),
        ]);

        if (firestoreData) {
          setFormData((prev) => ({ ...prev, ...firestoreData }));
        } else {
          const res = await fetch('/api/notice');
          const json = await res.json();
          if (json.success && json.data) {
            setFormData((prev) => ({ ...prev, ...json.data }));
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

  // 1. Save or Update Notice directly to Firebase Firestore
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);

    try {
      // If editingToken is set, update that specific document in Firestore
      // Otherwise create a new document with unique token
      const targetToken = editingToken || null;
      const firestoreResult = await saveNoticeToFirestore(formData, targetToken);

      if (!firestoreResult.success) {
        throw new Error(firestoreResult.error || 'Failed to save to Firebase');
      }

      const token = firestoreResult.token;
      const baseUrl = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_CUSTOM_DOMAIN && process.env.NEXT_PUBLIC_CUSTOM_DOMAIN.trim())
        ? process.env.NEXT_PUBLIC_CUSTOM_DOMAIN.trim().replace(/\/$/, '')
        : (typeof window !== 'undefined' ? window.location.origin : '');
      const fullUrl = `${baseUrl}/notice-verification/${token}`;
      const mainUrl = `${baseUrl}/`;

      const linkInfo = {
        token,
        url: fullUrl,
        mainUrl,
        noticeNumber: formData.noticeNumber,
        workerName: formData.workerName,
        facilityName: formData.facilityName,
        statusText: formData.statusText,
        isValid: formData.isValid,
        startDate: formData.startDate,
        endDate: formData.endDate,
        createdAt: new Date().toISOString(),
      };

      setGeneratedLink(linkInfo);

      // Update history list in state
      setHistoryList((prev) => {
        const filtered = prev.filter((x) => x.token !== token);
        return [linkInfo, ...filtered];
      });

      // Also save to server API as local backup
      try {
        await fetch('/api/notice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, token }),
        });
      } catch (err) {}

      if (editingToken) {
        showToast(`✓ تم تحديث بيانات التصريح (${formData.noticeNumber}) في Firebase بنجاح!`, 'success');
      } else {
        showToast(`✓ تم حفظ التصريح الجديد في Firebase وتوليد رابط التحقق المخصص!`, 'success');
      }
    } catch (err) {
      showToast('حدث خطأ أثناء الحفظ في Firebase: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // 2. Edit Action: Load existing permit data from Firebase into the form
  const handleEdit = async (item) => {
    try {
      setEditingToken(item.token);

      // First set from item for instant response
      setFormData((prev) => ({
        ...prev,
        ...item,
      }));

      // Switch to form tab
      setActiveTab('form');
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      // Also fetch full doc from Firestore to ensure all fields are up-to-date
      const fullDoc = await fetchNoticeFromFirestore(item.token);
      if (fullDoc) {
        setFormData((prev) => ({
          ...prev,
          ...fullDoc,
        }));
      }

      showToast(`✏️ تم تحميل بيانات التصريح (${item.noticeNumber || item.workerName}) للتعديل. قم بالتعديل ثم اضغط حفظ.`, 'success');
    } catch (err) {
      showToast('فشل تحميل بيانات التصريح للتعديل: ' + err.message, 'error');
    }
  };

  // Cancel edit mode and reset to new permit form
  const handleCancelEdit = () => {
    setEditingToken(null);
    setFormData({ ...DEFAULT_NOTICE_DATA });
    showToast('تم إلغاء التعديل والعودة لوضع إنشاء تصريح جديد.', 'success');
  };

  // 3. Delete Action: Delete directly from Firebase and remove from list
  const handleDelete = async (item) => {
    const permitName = item.noticeNumber || item.workerName || 'هذا التصريح';
    if (!window.confirm(`هل أنت متأكد من حذف ${permitName} نهائياً من قاعدة بيانات Firebase؟`)) {
      return;
    }

    setDeletingToken(item.token);
    try {
      const res = await deleteNoticeFromFirestore(item.token);
      if (!res.success) {
        throw new Error(res.error || 'Failed to delete');
      }

      // Remove from state list
      setHistoryList((prev) => prev.filter((x) => x.token !== item.token));

      // If currently editing this token, cancel edit mode
      if (editingToken === item.token) {
        handleCancelEdit();
      }

      // If current generatedLink was this token, clear it
      if (generatedLink?.token === item.token) {
        setGeneratedLink(null);
      }

      showToast(`✓ تم حذف التصريح (${permitName}) نهائياً من Firebase!`, 'success');
    } catch (err) {
      showToast('حدث خطأ أثناء الحذف من Firebase: ' + err.message, 'error');
    } finally {
      setDeletingToken(null);
    }
  };

  // 4. Copy Link Action: Copy unique verification URL to clipboard
  const handleCopyLink = async (url, token = null) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedToken(token || url);
      showToast('✓ تم نسخ رابط التحقق بنجاح! يمكنك إرساله للعميل الآن.', 'success');
      setTimeout(() => setCopiedToken(null), 3000);
    } catch (err) {
      showToast('فشل نسخ الرابط تلقائياً، يمكنك نسخه يدوياً', 'error');
    }
  };

  // 5. Refresh history list directly from Firebase
  const handleRefreshHistory = async () => {
    setRefreshing(true);
    try {
      const history = await fetchLinksHistory();
      if (Array.isArray(history)) {
        setHistoryList(history);
        showToast(`✓ تم تحديث القائمة من Firebase بنجاح (${history.length} تصريح)!`, 'success');
      }
    } catch (err) {
      showToast('فشل تحديث القائمة: ' + err.message, 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const handleResetToDefault = async () => {
    if (!window.confirm('هل أنت متأكد من استعادة القيم الافتراضية؟')) {
      return;
    }
    setEditingToken(null);
    setFormData({ ...DEFAULT_NOTICE_DATA });
    setGeneratedLink(null);
    showToast('↺ تمت استعادة النموذج إلى البيانات الافتراضية.', 'success');
  };

  // Save only Footer Settings directly to Firebase Firestore
  const handleSaveFooter = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      // 1. Save to current (and editingToken if active)
      const targetToken = editingToken || null;
      const firestoreResult = await saveNoticeToFirestore(formData, targetToken);

      if (!firestoreResult.success) {
        throw new Error(firestoreResult.error || 'Failed to save to Firebase');
      }

      // Also ensure 'current' document has these latest footer values
      if (editingToken) {
        await saveNoticeToFirestore(formData, 'current');
      }

      // Save locally as backup
      try {
        await fetch('/api/notice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } catch (err) {}

      showToast('✓ تم حفظ جميع روابط ونصوص الفوتر في Firebase بنجاح! تظهر الآن فوراً لجميع المستخدمين.', 'success');
    } catch (err) {
      showToast('حدث خطأ أثناء حفظ الفوتر: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Reset only Footer Settings to default values
  const handleResetFooter = () => {
    if (!window.confirm('هل أنت متأكد من استعادة روابط ونصوص الفوتر الافتراضية؟')) {
      return;
    }
    setFormData((prev) => ({
      ...prev,
      footerCol1Title: DEFAULT_NOTICE_DATA.footerCol1Title,
      footerLink1Text: DEFAULT_NOTICE_DATA.footerLink1Text,
      footerLink1Url: DEFAULT_NOTICE_DATA.footerLink1Url,
      footerLink2Text: DEFAULT_NOTICE_DATA.footerLink2Text,
      footerLink2Url: DEFAULT_NOTICE_DATA.footerLink2Url,
      footerCol2Title: DEFAULT_NOTICE_DATA.footerCol2Title,
      footerLink3Text: DEFAULT_NOTICE_DATA.footerLink3Text,
      footerLink3Url: DEFAULT_NOTICE_DATA.footerLink3Url,
      footerLink4Text: DEFAULT_NOTICE_DATA.footerLink4Text,
      footerLink4Url: DEFAULT_NOTICE_DATA.footerLink4Url,
      footerCol3Title: DEFAULT_NOTICE_DATA.footerCol3Title,
      footerLink5Text: DEFAULT_NOTICE_DATA.footerLink5Text,
      footerLink5Url: DEFAULT_NOTICE_DATA.footerLink5Url,
      footerLink6Text: DEFAULT_NOTICE_DATA.footerLink6Text,
      footerLink6Url: DEFAULT_NOTICE_DATA.footerLink6Url,
      footerCol4Title: DEFAULT_NOTICE_DATA.footerCol4Title,
      footerSupportPhone: DEFAULT_NOTICE_DATA.footerSupportPhone,
      footerPhoneUrl: DEFAULT_NOTICE_DATA.footerPhoneUrl,
      footerTelegramUrl: DEFAULT_NOTICE_DATA.footerTelegramUrl,
      footerSupportEmail: DEFAULT_NOTICE_DATA.footerSupportEmail,
      footerTwitterUrl: DEFAULT_NOTICE_DATA.footerTwitterUrl,
    }));
    showToast('↺ تمت استعادة نصوص وروابط الفوتر الافتراضية.', 'success');
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 5000);
  };

  // Filter list by search query
  const filteredHistory = historyList.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (item.noticeNumber && item.noticeNumber.toLowerCase().includes(q)) ||
      (item.workerName && item.workerName.toLowerCase().includes(q)) ||
      (item.facilityName && item.facilityName.toLowerCase().includes(q)) ||
      (item.iqamaNumber && item.iqamaNumber.toLowerCase().includes(q))
    );
  });

  if (!mounted) {
    return (
      <div className="admin-wrapper" style={{ minHeight: '100vh', background: '#f8fafc' }} suppressHydrationWarning />
    );
  }

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
                <span className="admin-brand-badge">سحابي مباشر ● Firebase</span>
              </h1>
              <p>حفظ، تعديل، وحذف التصاريح مباشرة في Firebase مع توليد روابط مخصصة للعملاء</p>
            </div>
          </div>

          <div className="admin-nav-actions">
            <Link href="/" target="_blank" className="admin-btn admin-btn-outline">
              <span>معاينة الصفحة الرئيسية ↗</span>
            </Link>
            <button
              type="button"
              onClick={() => setActiveTab('footer')}
              className={`admin-btn ${activeTab === 'footer' ? 'admin-btn-primary' : 'admin-btn-outline'}`}
            >
              <span>⚙️ تعديل الفوتر والروابط</span>
            </button>
            <button
              type="button"
              onClick={handleResetToDefault}
              disabled={saving || loading}
              className="admin-btn admin-btn-outline"
            >
              <span>نموذج جديد ＋</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading}
              className="admin-btn admin-btn-primary"
            >
              {saving ? (
                <span>جارٍ الحفظ في Firebase...</span>
              ) : editingToken ? (
                <span>تحديث وحفظ في Firebase ⚡</span>
              ) : (
                <span>حفظ وإنشاء رابط جديد ⚡</span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="admin-container">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', fontSize: '18px', color: '#64748b', fontWeight: 600 }}>
            <div style={{ fontSize: '36px', marginBottom: '14px' }}>⏳</div>
            جارٍ الاتصال بقاعدة بيانات Firebase وتحميل التصاريح...
          </div>
        ) : (
          <div>
            {/* Generated Link Prominent Banner */}
            {generatedLink && (
              <div className="admin-generated-box">
                <div className="admin-generated-header">
                  <div className="admin-generated-title">
                    <span style={{ fontSize: '22px' }}>⚡</span>
                    <span>تم حفظ التصريح في Firebase وتوليد الرابط بنجاح!</span>
                    <span className="admin-generated-badge">جاهز للإرسال للعميل</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <a
                      href={generatedLink.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="admin-btn admin-btn-primary"
                      style={{ padding: '6px 14px', fontSize: '13px' }}
                    >
                      معاينة رابط التصريح ↗
                    </a>
                  </div>
                </div>

                {/* Option 1: Direct Permit Verification Link */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#166534', marginBottom: '4px', display: 'block' }}>
                    🔗 رابط التحقق المخصص لهذا التصريح (أرسل هذا الرابط للعميل):
                  </label>
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
                      onClick={() => handleCopyLink(generatedLink.url, 'generated_permit')}
                      className={`admin-btn-copy ${copiedToken === 'generated_permit' ? 'copied' : ''}`}
                    >
                      {copiedToken === 'generated_permit' ? <span>تم النسخ بنجاح ✓</span> : <span>نسخ رابط التصريح 📋</span>}
                    </button>
                  </div>
                </div>

                {/* Option 2: Main Page Link (also updated in Firebase) */}
                {generatedLink.mainUrl && (
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#166534', marginBottom: '4px', display: 'block' }}>
                      🌐 رابط الصفحة الرئيسية (تظهر عليه هذه البيانات المحدثة أيضاً):
                    </label>
                    <div className="admin-link-input-group">
                      <input
                        type="text"
                        readOnly
                        value={generatedLink.mainUrl}
                        className="admin-link-input"
                        onClick={(e) => e.target.select()}
                      />
                      <button
                        type="button"
                        onClick={() => handleCopyLink(generatedLink.mainUrl, 'generated_main')}
                        className={`admin-btn-copy ${copiedToken === 'generated_main' ? 'copied' : ''}`}
                      >
                        {copiedToken === 'generated_main' ? <span>تم النسخ بنجاح ✓</span> : <span>نسخ رابط الرئيسية 📋</span>}
                      </button>
                      <a
                        href={generatedLink.mainUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="admin-btn admin-btn-outline"
                        style={{ padding: '6px 14px', fontSize: '12.5px' }}
                      >
                        فتح ↗
                      </a>
                    </div>
                  </div>
                )}

                <div
                  style={{
                    marginTop: '12px',
                    fontSize: '13px',
                    color: '#166534',
                    display: 'flex',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px',
                    fontWeight: 600,
                  }}
                >
                  <span>
                    رقم التصريح: <strong>{generatedLink.noticeNumber}</strong> | العامل: <strong>{generatedLink.workerName}</strong> | الحالة: <strong>{generatedLink.statusText}</strong>
                  </span>
                  <span>✓ محفوظ في Firebase Firestore ويحمل البيانات مباشرة للعميل</span>
                </div>
              </div>
            )}

            {/* Simple Clean Tabs */}
            <div className="admin-tabs-bar">
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className={`admin-tab-btn ${activeTab === 'form' ? 'active' : ''}`}
              >
                <span>📝</span>
                <span>{editingToken ? 'تعديل التصريح المحدد' : 'إنشاء تصريح جديد'}</span>
                {editingToken && <span className="admin-edit-badge">وضع التعديل</span>}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('footer')}
                className={`admin-tab-btn ${activeTab === 'footer' ? 'active' : ''}`}
              >
                <span>⚙️</span>
                <span>تعديل روابط ومعلومات الفوتر</span>
                <span className="admin-footer-badge">مباشر ⚡</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`admin-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
              >
                <span>📋</span>
                <span>قائمة التصاريح في Firebase</span>
                <span className="admin-tab-count">{historyList.length}</span>
              </button>
            </div>

            {/* TAB 1: Permit Form (Create / Edit) */}
            {activeTab === 'form' && (
              <form onSubmit={handleSave}>
                {/* Active Edit Mode Banner */}
                {editingToken && (
                  <div className="admin-edit-banner">
                    <div className="admin-edit-banner-info">
                      <span>✏️</span>
                      <span>
                        أنت الآن تقوم بتعديل التصريح رقم: <strong>{formData.noticeNumber || '-'}</strong> للعامل:{' '}
                        <strong>{formData.workerName || '-'}</strong>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="admin-btn admin-btn-outline"
                      style={{ padding: '6px 14px', fontSize: '12.5px' }}
                    >
                      إلغاء التعديل والبدء بتصريح جديد ✕
                    </button>
                  </div>
                )}

                {/* Quick Access Callout Banner to Footer Editor */}
                <div className="admin-callout-banner">
                  <div className="admin-callout-text">
                    <span className="icon">⚙️</span>
                    <div>
                      <div>تعديل روابط ومعلومات تذييل الصفحة (Footer Links & Social)</div>
                      <div style={{ fontSize: '12.5px', color: '#047857', fontWeight: 500, marginTop: '2px' }}>
                        تعديل جميع نصوص الفوتر (أجير، الدعم، الشروط، وأيقونات الاتصال/تويتر/تيليجرام) وروابطها وحفظها في Firebase
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('footer')}
                    className="admin-btn admin-btn-outline"
                    style={{ background: '#ffffff', borderColor: '#059669', color: '#059669', fontSize: '13px' }}
                  >
                    <span>فتح محرر الفوتر والروابط ↗</span>
                  </button>
                </div>

                {/* 1. Status Picker Card */}
                <section className="admin-card">
                  <div className="admin-card-header">
                    <h2>
                      <span className="admin-card-header-icon">🛡️</span>
                      حالة صلاحية التصريح
                    </h2>
                  </div>
                  <div className="admin-card-body">
                    <label className="admin-label">
                      <span>حدد حالة التصريح (سوف تظهر للعميل بلونها المعتمد)</span>
                    </label>
                    <div className="admin-status-picker">
                      <div
                        className={`admin-status-option ${formData.isValid ? 'active-valid' : ''}`}
                        onClick={() => handleStatusToggle(true)}
                      >
                        <div className="admin-status-option-content">
                          <span style={{ fontSize: '22px' }}>🟢</span>
                          <span style={{ fontWeight: 800 }}>ساري / فعال (مقبول ومعتمد)</span>
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
                          <span style={{ fontSize: '22px' }}>🔴</span>
                          <span style={{ fontWeight: 800 }}>منتهي / ملغي (غير صالح)</span>
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
                </section>

                {/* 2. Permit Details Card */}
                <section className="admin-card">
                  <div className="admin-card-header">
                    <h2>
                      <span className="admin-card-header-icon">📋</span>
                      بيانات التصريح (Notice Details)
                    </h2>
                  </div>
                  <div className="admin-card-body">
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
                            value={formData.noticeNumber || ''}
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
                            value={formData.noticeType || ''}
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
                            value={formData.startDate || ''}
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
                            value={formData.endDate || ''}
                            onChange={handleChange}
                            className="admin-input"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 3. Worker Details Card */}
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
                            value={formData.workerName || ''}
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
                            value={formData.iqamaNumber || ''}
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
                            value={formData.nationality || ''}
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
                            value={formData.occupation || ''}
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
                            value={formData.gender || ''}
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
                            value={formData.birthDate || ''}
                            onChange={handleChange}
                            className="admin-input"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 4. Facility Details Card */}
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
                            value={formData.facilityNumber || ''}
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
                            value={formData.facilityName || ''}
                            onChange={handleChange}
                            className="admin-input"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Primary Save Button */}
                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '12px' }}>
                  {editingToken && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="admin-btn admin-btn-outline"
                      style={{ padding: '14px 24px', fontSize: '15px', borderRadius: '12px' }}
                    >
                      إلغاء ✕
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={saving || loading}
                    className="admin-btn admin-btn-primary"
                    style={{ minWidth: '320px', padding: '14px 28px', fontSize: '16px', borderRadius: '12px' }}
                  >
                    {saving ? (
                      <span>جارٍ الحفظ في Firebase...</span>
                    ) : editingToken ? (
                      <span>تحديث وحفظ التصريح في Firebase ⚡</span>
                    ) : (
                      <span>حفظ التصريح وإنشاء رابط جديد ⚡</span>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: Footer & Contact Links Editor (مطابق للقطة الشاشة 100%) */}
            {activeTab === 'footer' && (
              <form onSubmit={handleSaveFooter}>
                {/* Header Information Card */}
                <div className="admin-card" style={{ marginBottom: '20px' }}>
                  <div className="admin-card-header">
                    <h2>
                      <span className="admin-card-header-icon">⚙️</span>
                      تعديل روابط ومعلومات الفوتر ووسائل التواصل (Footer Links)
                    </h2>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={handleResetFooter}
                        className="admin-btn admin-btn-outline"
                        style={{ padding: '6px 14px', fontSize: '13px' }}
                      >
                        استعادة الافتراضي ↺
                      </button>
                      <button
                        type="submit"
                        disabled={saving || loading}
                        className="admin-btn admin-btn-primary"
                        style={{ padding: '6px 16px', fontSize: '13px' }}
                      >
                        {saving ? 'جارٍ الحفظ...' : 'حفظ الفوتر في Firebase ⚡'}
                      </button>
                    </div>
                  </div>
                  <div className="admin-card-body">
                    <p style={{ margin: 0, fontSize: '13.5px', color: '#64748b', lineHeight: 1.6 }}>
                      يمكنك هنا تعديل كل كلمة ورابط ظهر في لقطة الشاشة (أجير، الدعم، الشروط، وأيقونات الاتصال والمراسلة وإكس).
                      أي تعديل تقوم بحفظه يتم تخزينه مباشرة في <strong>Firebase Firestore</strong> ويظهر فوراً وبشكل مباشر لأي مستخدم يفتح رابط التصريح أو الصفحة الرئيسية.
                    </p>
                  </div>
                </div>

                {/* 4 Cards Grid - One for each section in the screenshot */}
                <div className="admin-footer-grid">
                  {/* Card 1: أجير (Ajeer) */}
                  <div className="admin-footer-card">
                    <div className="admin-footer-card-header">
                      <h3>
                        <span>🏢</span>
                        <span>القسم الأول: أجير</span>
                      </h3>
                      <span style={{ fontSize: '11.5px', color: '#64748b' }}>العمود 1</span>
                    </div>

                    <div>
                      <label className="admin-label">
                        <span>عنوان القسم</span>
                      </label>
                      <input
                        type="text"
                        name="footerCol1Title"
                        value={formData.footerCol1Title || ''}
                        onChange={handleChange}
                        className="admin-footer-mini-input"
                        placeholder="أجير"
                      />
                    </div>

                    {/* Line 1: عن أجير */}
                    <div className="admin-footer-line-box">
                      <div className="admin-footer-line-label">
                        <span>🔹</span>
                        <span>السطر الأول (عن أجير)</span>
                      </div>
                      <div className="admin-footer-input-row">
                        <div>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>نص الرابط:</span>
                          <input
                            type="text"
                            name="footerLink1Text"
                            value={formData.footerLink1Text || ''}
                            onChange={handleChange}
                            className="admin-footer-mini-input"
                            placeholder="عن أجير"
                          />
                        </div>
                        <div>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>الرابط / URL:</span>
                          <input
                            type="text"
                            name="footerLink1Url"
                            value={formData.footerLink1Url || ''}
                            onChange={handleChange}
                            className="admin-footer-mini-input"
                            placeholder="/about أو رابط مخصص"
                            dir="ltr"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Line 2: خدمات أجير */}
                    <div className="admin-footer-line-box">
                      <div className="admin-footer-line-label">
                        <span>🔹</span>
                        <span>السطر الثاني (خدمات أجير)</span>
                      </div>
                      <div className="admin-footer-input-row">
                        <div>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>نص الرابط:</span>
                          <input
                            type="text"
                            name="footerLink2Text"
                            value={formData.footerLink2Text || ''}
                            onChange={handleChange}
                            className="admin-footer-mini-input"
                            placeholder="خدمات أجير"
                          />
                        </div>
                        <div>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>الرابط / URL:</span>
                          <input
                            type="text"
                            name="footerLink2Url"
                            value={formData.footerLink2Url || ''}
                            onChange={handleChange}
                            className="admin-footer-mini-input"
                            placeholder="/about_notices أو رابط مخصص"
                            dir="ltr"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: الدعم (Support) */}
                  <div className="admin-footer-card">
                    <div className="admin-footer-card-header">
                      <h3>
                        <span>🎧</span>
                        <span>القسم الثاني: الدعم</span>
                      </h3>
                      <span style={{ fontSize: '11.5px', color: '#64748b' }}>العمود 2</span>
                    </div>

                    <div>
                      <label className="admin-label">
                        <span>عنوان القسم</span>
                      </label>
                      <input
                        type="text"
                        name="footerCol2Title"
                        value={formData.footerCol2Title || ''}
                        onChange={handleChange}
                        className="admin-footer-mini-input"
                        placeholder="الدعم"
                      />
                    </div>

                    {/* Line 1: الدعم و المساعدة */}
                    <div className="admin-footer-line-box">
                      <div className="admin-footer-line-label">
                        <span>🔹</span>
                        <span>السطر الأول (الدعم و المساعدة)</span>
                      </div>
                      <div className="admin-footer-input-row">
                        <div>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>نص الرابط:</span>
                          <input
                            type="text"
                            name="footerLink3Text"
                            value={formData.footerLink3Text || ''}
                            onChange={handleChange}
                            className="admin-footer-mini-input"
                            placeholder="الدعم و المساعدة"
                          />
                        </div>
                        <div>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>الرابط / URL:</span>
                          <input
                            type="text"
                            name="footerLink3Url"
                            value={formData.footerLink3Url || ''}
                            onChange={handleChange}
                            className="admin-footer-mini-input"
                            placeholder="/support أو رابط مخصص"
                            dir="ltr"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Line 2: الأسئلة الشائعة */}
                    <div className="admin-footer-line-box">
                      <div className="admin-footer-line-label">
                        <span>🔹</span>
                        <span>السطر الثاني (الأسئلة الشائعة)</span>
                      </div>
                      <div className="admin-footer-input-row">
                        <div>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>نص الرابط:</span>
                          <input
                            type="text"
                            name="footerLink4Text"
                            value={formData.footerLink4Text || ''}
                            onChange={handleChange}
                            className="admin-footer-mini-input"
                            placeholder="الأسئلة الشائعة"
                          />
                        </div>
                        <div>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>الرابط / URL:</span>
                          <input
                            type="text"
                            name="footerLink4Url"
                            value={formData.footerLink4Url || ''}
                            onChange={handleChange}
                            className="admin-footer-mini-input"
                            placeholder="/faq أو رابط مخصص"
                            dir="ltr"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: الشروط و الخصوصية (Terms & Privacy) */}
                  <div className="admin-footer-card">
                    <div className="admin-footer-card-header">
                      <h3>
                        <span>📜</span>
                        <span>القسم الثالث: الشروط والخصوصية</span>
                      </h3>
                      <span style={{ fontSize: '11.5px', color: '#64748b' }}>العمود 3</span>
                    </div>

                    <div>
                      <label className="admin-label">
                        <span>عنوان القسم</span>
                      </label>
                      <input
                        type="text"
                        name="footerCol3Title"
                        value={formData.footerCol3Title || ''}
                        onChange={handleChange}
                        className="admin-footer-mini-input"
                        placeholder="الشروط و الخصوصية"
                      />
                    </div>

                    {/* Line 1: الشروط والأحكام */}
                    <div className="admin-footer-line-box">
                      <div className="admin-footer-line-label">
                        <span>🔹</span>
                        <span>السطر الأول (الشروط والأحكام)</span>
                      </div>
                      <div className="admin-footer-input-row">
                        <div>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>نص الرابط:</span>
                          <input
                            type="text"
                            name="footerLink5Text"
                            value={formData.footerLink5Text || ''}
                            onChange={handleChange}
                            className="admin-footer-mini-input"
                            placeholder="الشروط والأحكام"
                          />
                        </div>
                        <div>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>الرابط / URL:</span>
                          <input
                            type="text"
                            name="footerLink5Url"
                            value={formData.footerLink5Url || ''}
                            onChange={handleChange}
                            className="admin-footer-mini-input"
                            placeholder="/terms أو رابط مخصص"
                            dir="ltr"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Line 2: سياسة الخصوصية */}
                    <div className="admin-footer-line-box">
                      <div className="admin-footer-line-label">
                        <span>🔹</span>
                        <span>السطر الثاني (سياسة الخصوصية)</span>
                      </div>
                      <div className="admin-footer-input-row">
                        <div>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>نص الرابط:</span>
                          <input
                            type="text"
                            name="footerLink6Text"
                            value={formData.footerLink6Text || ''}
                            onChange={handleChange}
                            className="admin-footer-mini-input"
                            placeholder="سياسة الخصوصية"
                          />
                        </div>
                        <div>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>الرابط / URL:</span>
                          <input
                            type="text"
                            name="footerLink6Url"
                            value={formData.footerLink6Url || ''}
                            onChange={handleChange}
                            className="admin-footer-mini-input"
                            placeholder="/privacy_policy أو رابط مخصص"
                            dir="ltr"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 4: تواصل معنا (Contact Us & Social Icons) */}
                  <div className="admin-footer-card">
                    <div className="admin-footer-card-header">
                      <h3>
                        <span>📞</span>
                        <span>القسم الرابع: تواصل معنا</span>
                      </h3>
                      <span style={{ fontSize: '11.5px', color: '#64748b' }}>العمود 4</span>
                    </div>

                    <div>
                      <label className="admin-label">
                        <span>عنوان القسم</span>
                      </label>
                      <input
                        type="text"
                        name="footerCol4Title"
                        value={formData.footerCol4Title || ''}
                        onChange={handleChange}
                        className="admin-footer-mini-input"
                        placeholder="تواصل معنا"
                      />
                    </div>

                    {/* Phone Icon */}
                    <div className="admin-footer-line-box">
                      <div className="admin-footer-line-label">
                        <span>📞</span>
                        <span>أيقونة الاتصال الهاتفي</span>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>رقم الهاتف أو رابط الاتصال المباشر:</span>
                        <input
                          type="text"
                          name="footerPhoneUrl"
                          value={formData.footerPhoneUrl || formData.footerSupportPhone || ''}
                          onChange={handleChange}
                          className="admin-footer-mini-input"
                          placeholder="tel:920011040 أو https://wa.me/..."
                          dir="ltr"
                        />
                      </div>
                    </div>

                    {/* Telegram / Send Icon */}
                    <div className="admin-footer-line-box">
                      <div className="admin-footer-line-label">
                        <span>✈️</span>
                        <span>أيقونة المراسلة / تيليجرام</span>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>رابط تيليجرام أو الإيميل المباشر:</span>
                        <input
                          type="text"
                          name="footerTelegramUrl"
                          value={formData.footerTelegramUrl || formData.footerSupportEmail || ''}
                          onChange={handleChange}
                          className="admin-footer-mini-input"
                          placeholder="https://t.me/... أو mailto:..."
                          dir="ltr"
                        />
                      </div>
                    </div>

                    {/* Twitter / X Icon */}
                    <div className="admin-footer-line-box">
                      <div className="admin-footer-line-label">
                        <span>𝕏</span>
                        <span>أيقونة تويتر / إكس</span>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>رابط حساب تويتر / إكس:</span>
                        <input
                          type="text"
                          name="footerTwitterUrl"
                          value={formData.footerTwitterUrl || ''}
                          onChange={handleChange}
                          className="admin-footer-mini-input"
                          placeholder="https://twitter.com/AjeerSA أو https://x.com/..."
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Interactive Screenshot Preview Replicating the User's Image */}
                <div className="admin-footer-preview-container">
                  <div className="admin-footer-preview-header">
                    <div className="admin-footer-preview-title">
                      <span>👁️</span>
                      <span>معاينة حية ومطابقة 100% للقطة الشاشة (تتحدث فوراً أثناء الكتابة)</span>
                    </div>
                    <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 700 }}>
                      ● معاينة تفاعلية (يمكنك الضغط على الروابط لتجربتها)
                    </span>
                  </div>

                  <div className="admin-screenshot-box" dir="rtl">
                    {/* Section 1 */}
                    <div className="admin-screenshot-col">
                      <div className="admin-screenshot-heading">{formData.footerCol1Title || 'أجير'}</div>
                      <a
                        href={formData.footerLink1Url || '#'}
                        target={formData.footerLink1Url?.startsWith('http') ? '_blank' : undefined}
                        rel="noopener noreferrer"
                        className="admin-screenshot-link"
                      >
                        {formData.footerLink1Text || 'عن أجير'}
                      </a>
                      <a
                        href={formData.footerLink2Url || '#'}
                        target={formData.footerLink2Url?.startsWith('http') ? '_blank' : undefined}
                        rel="noopener noreferrer"
                        className="admin-screenshot-link"
                      >
                        {formData.footerLink2Text || 'خدمات أجير'}
                      </a>
                    </div>

                    {/* Section 2 */}
                    <div className="admin-screenshot-col">
                      <div className="admin-screenshot-heading">{formData.footerCol2Title || 'الدعم'}</div>
                      <a
                        href={formData.footerLink3Url || '#'}
                        target={formData.footerLink3Url?.startsWith('http') ? '_blank' : undefined}
                        rel="noopener noreferrer"
                        className="admin-screenshot-link"
                      >
                        {formData.footerLink3Text || 'الدعم و المساعدة'}
                      </a>
                      <a
                        href={formData.footerLink4Url || '#'}
                        target={formData.footerLink4Url?.startsWith('http') ? '_blank' : undefined}
                        rel="noopener noreferrer"
                        className="admin-screenshot-link"
                      >
                        {formData.footerLink4Text || 'الأسئلة الشائعة'}
                      </a>
                    </div>

                    {/* Section 3 */}
                    <div className="admin-screenshot-col">
                      <div className="admin-screenshot-heading">{formData.footerCol3Title || 'الشروط و الخصوصية'}</div>
                      <a
                        href={formData.footerLink5Url || '#'}
                        target={formData.footerLink5Url?.startsWith('http') ? '_blank' : undefined}
                        rel="noopener noreferrer"
                        className="admin-screenshot-link"
                      >
                        {formData.footerLink5Text || 'الشروط والأحكام'}
                      </a>
                      <a
                        href={formData.footerLink6Url || '#'}
                        target={formData.footerLink6Url?.startsWith('http') ? '_blank' : undefined}
                        rel="noopener noreferrer"
                        className="admin-screenshot-link"
                      >
                        {formData.footerLink6Text || 'سياسة الخصوصية'}
                      </a>
                    </div>

                    {/* Section 4 */}
                    <div className="admin-screenshot-col">
                      <div className="admin-screenshot-heading">{formData.footerCol4Title || 'تواصل معنا'}</div>
                      <div className="admin-screenshot-icons">
                        {/* Phone */}
                        <a
                          href={formData.footerPhoneUrl || (formData.footerSupportPhone ? `tel:${formData.footerSupportPhone}` : '#')}
                          target={formData.footerPhoneUrl?.startsWith('http') ? '_blank' : undefined}
                          rel="noopener noreferrer"
                          className="admin-screenshot-icon-btn"
                          title={`هاتف: ${formData.footerPhoneUrl || formData.footerSupportPhone || ''}`}
                        >
                          <i className="icon-phone footer-phone-icon"></i>
                        </a>

                        {/* Telegram / Send */}
                        <a
                          href={formData.footerTelegramUrl || (formData.footerSupportEmail ? (formData.footerSupportEmail.startsWith('mailto:') ? formData.footerSupportEmail : `mailto:${formData.footerSupportEmail}`) : '#')}
                          target={formData.footerTelegramUrl?.startsWith('http') ? '_blank' : undefined}
                          rel="noopener noreferrer"
                          className="admin-screenshot-icon-btn"
                          title={`مراسلة: ${formData.footerTelegramUrl || formData.footerSupportEmail || ''}`}
                        >
                          <i className="icon-send footer-send-icon"></i>
                        </a>

                        {/* Twitter / X */}
                        <a
                          href={formData.footerTwitterUrl || 'https://twitter.com/AjeerSA'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="admin-screenshot-icon-btn"
                          title={`تويتر: ${formData.footerTwitterUrl || ''}`}
                        >
                          <img src="/dist/img/x-twitter.svg" alt="X" style={{ width: '16px', height: '16px' }} />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Save Button */}
                <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'center', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={handleResetFooter}
                    className="admin-btn admin-btn-outline"
                    style={{ padding: '14px 24px', fontSize: '15px', borderRadius: '12px' }}
                  >
                    استعادة الافتراضي ↺
                  </button>
                  <button
                    type="submit"
                    disabled={saving || loading}
                    className="admin-btn admin-btn-primary"
                    style={{ minWidth: '340px', padding: '14px 28px', fontSize: '16px', borderRadius: '12px' }}
                  >
                    {saving ? <span>جارٍ الحفظ في Firebase...</span> : <span>حفظ جميع تغييرات الفوتر في Firebase ⚡</span>}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 3: List of all Permits Loaded from Firebase */}
            {activeTab === 'history' && (
              <section className="admin-card">
                <div className="admin-card-header">
                  <h2>
                    <span className="admin-card-header-icon">📋</span>
                    قائمة التصاريح المحفوظة في Firebase ({historyList.length})
                  </h2>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={handleRefreshHistory}
                      disabled={refreshing}
                      className="admin-btn admin-btn-outline"
                      style={{ padding: '6px 14px', fontSize: '13px' }}
                    >
                      {refreshing ? 'جارٍ التحديث...' : 'تحديث القائمة من Firebase 🔄'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleCancelEdit();
                        setActiveTab('form');
                      }}
                      className="admin-btn admin-btn-primary"
                      style={{ padding: '6px 14px', fontSize: '13px' }}
                    >
                      إضافة تصريح جديد ＋
                    </button>
                  </div>
                </div>

                <div className="admin-card-body">
                  {/* Search Bar */}
                  {historyList.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                      <input
                        type="text"
                        placeholder="🔍 ابحث برقم التصريح، اسم العامل، رقم الإقامة، أو المنشأة..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="admin-input no-icon"
                        style={{ padding: '10px 16px', fontSize: '14px', borderRadius: '8px' }}
                      />
                    </div>
                  )}

                  {filteredHistory.length === 0 ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '12px' }}>
                      <div style={{ fontSize: '36px', marginBottom: '10px' }}>📭</div>
                      {historyList.length === 0
                        ? 'لا توجد تصاريح محفوظة في Firebase بعد. قم بتعبئة النموذج واضغط "حفظ" لإنشاء أول تصريح.'
                        : 'لا توجد نتائج تطابق بحثك.'}
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table className="admin-history-table">
                        <thead>
                          <tr>
                            <th>رقم التصريح</th>
                            <th>اسم العامل</th>
                            <th>اسم المنشأة</th>
                            <th>الحالة</th>
                            <th>تاريخ الصلاحية</th>
                            <th>الإجراءات (نسخ / تعديل / حذف)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredHistory.map((item, idx) => {
                            const origin = typeof window !== 'undefined' ? window.location.origin : '';
                            const itemUrl = item.url || `${origin}/notice-verification/${item.token}`;
                            const isValid = item.isValid !== false && (!item.statusText || item.statusText.includes('ساري'));
                            const isBeingDeleted = deletingToken === item.token;
                            const isCopied = copiedToken === item.token;

                            return (
                              <tr key={item.token || idx}>
                                <td>
                                  <strong>{item.noticeNumber || '-'}</strong>
                                </td>
                                <td>{item.workerName || '-'}</td>
                                <td>{item.facilityName || '-'}</td>
                                <td>
                                  <span
                                    style={{
                                      display: 'inline-block',
                                      padding: '3px 10px',
                                      borderRadius: '16px',
                                      fontSize: '12px',
                                      fontWeight: 700,
                                      background: isValid ? '#dcfce7' : '#fee2e2',
                                      color: isValid ? '#15803d' : '#b91c1c',
                                    }}
                                  >
                                    {item.statusText || (isValid ? 'ساري / فعال' : 'منتهي / ملغي')}
                                  </span>
                                </td>
                                <td style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                                  {item.startDate && item.endDate
                                    ? `${item.startDate} إلى ${item.endDate}`
                                    : item.createdAt
                                    ? new Date(item.createdAt).toLocaleDateString('ar-SA')
                                    : '-'}
                                </td>
                                <td>
                                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                    {/* 1. Copy Link Icon */}
                                    <button
                                      type="button"
                                      onClick={() => handleCopyLink(itemUrl, item.token)}
                                      className="admin-action-btn admin-action-btn-copy"
                                      title="نسخ رابط التحقق لإرساله للعميل"
                                    >
                                      <span>📋</span>
                                      <span>{isCopied ? 'تم النسخ ✓' : 'نسخ الرابط'}</span>
                                    </button>

                                    {/* 2. Edit Icon */}
                                    <button
                                      type="button"
                                      onClick={() => handleEdit(item)}
                                      className="admin-action-btn admin-action-btn-edit"
                                      title="تعديل هذا التصريح وتحديثه في Firebase"
                                    >
                                      <span>✏️</span>
                                      <span>تعديل</span>
                                    </button>

                                    {/* 3. Delete Icon */}
                                    <button
                                      type="button"
                                      onClick={() => handleDelete(item)}
                                      disabled={isBeingDeleted}
                                      className="admin-action-btn admin-action-btn-delete"
                                      title="حذف هذا التصريح نهائياً من Firebase"
                                    >
                                      <span>🗑️</span>
                                      <span>{isBeingDeleted ? 'جارٍ الحذف...' : 'حذف'}</span>
                                    </button>

                                    {/* 4. Open in new tab Icon */}
                                    <a
                                      href={itemUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="admin-action-btn admin-action-btn-view"
                                      title="فتح ومعاينة صفحة التحقق في نافذة جديدة"
                                    >
                                      <span>↗</span>
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
          </div>
        )}
      </main>
    </div>
  );
}
