'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { saveNoticeToFirestore, fetchNoticeFromFirestore, fetchLinksHistory } from '../../lib/firestoreService';
import { DEFAULT_NOTICE_DATA } from '../../lib/defaultData';
import '../../public/dist/css/admin.css';

export default function AdminPage() {
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({ ...DEFAULT_NOTICE_DATA });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('form'); // 'form' | 'history'
  const [generatedLink, setGeneratedLink] = useState(null);
  const [copied, setCopied] = useState(false);
  const [historyList, setHistoryList] = useState([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch initial data & links history from Firestore on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [firestoreData, history] = await Promise.all([
          fetchNoticeFromFirestore(),
          fetchLinksHistory()
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
        isValid: formData.isValid,
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

      showToast('✓ تم حفظ التصريح بنجاح وتوليد الرابط المخصص الجديد!', 'success');
    } catch (err) {
      showToast('حدث خطأ أثناء الحفظ: ' + err.message, 'error');
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
    if (!window.confirm('هل أنت متأكد من استعادة البيانات الأصلية للتصريح؟')) {
      return;
    }
    setSaving(true);
    try {
      setFormData({ ...DEFAULT_NOTICE_DATA });
      await saveNoticeToFirestore(DEFAULT_NOTICE_DATA);
      await fetch('/api/notice', { method: 'DELETE' });
      setGeneratedLink(null);
      showToast('↺ تمت استعادة البيانات الأصلية بنجاح!', 'success');
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
    }, 5000);
  };

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
              <p>تعديل فوري وسريع لبيانات التصريح مع توليد روابط تحقق رسمية ومحمية</p>
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
              {saving ? <span>جارٍ الحفظ...</span> : <span>حفظ وتوليد الرابط ⚡</span>}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="admin-container">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', fontSize: '18px', color: '#64748b', fontWeight: 600 }}>
            <div style={{ fontSize: '36px', marginBottom: '14px' }}>⏳</div>
            جارٍ تحميل بيانات التصريح من السحابة...
          </div>
        ) : (
          <div>
            {/* Generated Link Prominent Banner */}
            {generatedLink && (
              <div className="admin-generated-box">
                <div className="admin-generated-header">
                  <div className="admin-generated-title">
                    <span style={{ fontSize: '22px' }}>⚡</span>
                    <span>تم إنشاء رابط التحقق المخصص بنجاح!</span>
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
                  <span>
                    ✓ مرتبط مباشرة بسحابة Firebase ومحمي
                  </span>
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
                <span>تعديل بيانات التصريح</span>
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

            {/* TAB 1: Streamlined Form */}
            {activeTab === 'form' && (
              <form onSubmit={handleSave}>
                {/* 1. Status Picker Card */}
                <section className="admin-card">
                  <div className="admin-card-header">
                    <h2>
                      <span className="admin-card-header-icon">🛡️</span>
                      حالة التصريح
                    </h2>
                  </div>
                  <div className="admin-card-body">
                    <label className="admin-label">
                      <span>حدد حالة التصريح (تظهر بشكل بارز في التقرير)</span>
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

                {/* Bottom Primary Action */}
                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
                  <button
                    type="submit"
                    disabled={saving || loading}
                    className="admin-btn admin-btn-primary"
                    style={{ minWidth: '320px', padding: '14px 28px', fontSize: '16px', borderRadius: '12px' }}
                  >
                    {saving ? <span>جارٍ الحفظ في Firebase...</span> : <span>حفظ التعديلات وإنشاء رابط جديد ⚡</span>}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: Links History */}
            {activeTab === 'history' && (
              <section className="admin-card">
                <div className="admin-card-header">
                  <h2>
                    <span className="admin-card-header-icon">🔗</span>
                    سجل الروابط المنشأة سحابياً ({historyList.length})
                  </h2>
                </div>
                <div className="admin-card-body">
                  <p style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '16px', fontWeight: 500 }}>
                    كل تعديل تقوم بحفظه يتم تخزينه سحابياً في Firebase مع توليد رابط مخصص له. يمكنك نسخ أي رابط أو فتحه مباشرة:
                  </p>
                  {historyList.length === 0 ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '12px' }}>
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
                      لا توجد روابط منشأة بعد. قم بتعديل بيانات التصريح واضغط "حفظ وإنشاء رابط جديد" لإنشاء أول رابط.
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
                            <th>وقت الإنشاء</th>
                            <th>الإجراءات السريعة</th>
                          </tr>
                        </thead>
                        <tbody>
                          {historyList.map((item, idx) => {
                            const origin = typeof window !== 'undefined' ? window.location.origin : '';
                            const itemUrl = item.url || `${origin}/notice-verification/${item.token}`;
                            const isValid = item.isValid !== false && item.statusText?.includes('ساري');

                            return (
                              <tr key={item.token || idx}>
                                <td><strong>{item.noticeNumber || '-'}</strong></td>
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
                                    {item.statusText || (isValid ? 'ساري' : 'ملغي')}
                                  </span>
                                </td>
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
          </div>
        )}
      </main>
    </div>
  );
}
