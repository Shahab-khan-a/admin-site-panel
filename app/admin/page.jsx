'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { saveNoticeToFirestore, fetchNoticeFromFirestore } from '../../lib/firestoreService';
import '../../public/dist/css/admin.css';

export default function AdminPage() {
  const [formData, setFormData] = useState({
    // Status & Verification
    statusText: 'ساري / فعال',
    isValid: true,
    verificationMessage: 'تم التحقق من التصريح بنجاح',

    // Notice Details
    noticeNumber: 'TW0586633',
    noticeType: 'تصريح إعارة أجير',
    startDate: '2026-09-27',
    endDate: '2026-10-27',

    // Worker Details
    workerName: 'SYED ADIL JAN SYED KHALID JAN',
    iqamaNumber: '2573771900',
    nationality: 'باكستاني',
    occupation: 'أخصائي صحة وسلامة مهنية',
    gender: 'ذكر',
    birthDate: '-',

    // Facility Details
    facilityNumber: '14-4016821',
    facilityName: 'مؤسسة الجسور الممدودة',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [showPreview, setShowPreview] = useState(true);
  const [firebaseStatus, setFirebaseStatus] = useState('checking'); // 'connected' | 'needs-rules' | 'offline'

  // Fetch initial data on load (first Firestore, then server API fallback)
  useEffect(() => {
    async function loadData() {
      try {
        // 1. Try fetching directly from Firebase Firestore
        const firestoreData = await fetchNoticeFromFirestore();
        if (firestoreData) {
          setFormData(firestoreData);
          setFirebaseStatus('connected');
          setLoading(false);
          return;
        }

        // 2. Fallback to API route
        const res = await fetch('/api/notice');
        const json = await res.json();
        if (json.success && json.data) {
          setFormData(json.data);
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

    try {
      // Step 1: Save directly to Firebase Firestore
      const firestoreResult = await saveNoticeToFirestore(formData);

      // Step 2: Also save to Next.js API / Local storage
      const res = await fetch('/api/notice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const json = await res.json();

      if (firestoreResult.success) {
        setFirebaseStatus('connected');
        showToast('✓ تم حفظ التعديلات في Firebase بنجاح! سيظهر التحديث لجميع المستخدمين عبر الرابط فوراً.', 'success');
      } else {
        // Firebase gave permission-denied
        setFirebaseStatus('needs-rules');
        showToast('تم الحفظ محلياً. تنبيه: يرجى تفعيل Rules في Firebase Console ليتم الحفظ سحابياً.', 'warning');
      }
    } catch (err) {
      showToast('حدث خطأ أثناء حفظ التعديلات: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('هل أنت متأكد من استعادة البيانات الأصلية للتصريح؟')) {
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/notice', { method: 'DELETE' });
      const json = await res.json();
      if (json.success && json.data) {
        setFormData(json.data);
        await saveNoticeToFirestore(json.data);
        showToast('↺ تمت استعادة البيانات الأصلية وحفظها في Firebase بنجاح!', 'success');
      }
    } catch (err) {
      showToast('حدث خطأ أثناء استعادة البيانات', 'error');
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
              <h1>لوحة التحكم | إدارة تصريح أجير (Firebase)</h1>
              <p>مشروع Firebase: site-panel-b86c8 | حفظ تلقائي سحابي ومباشر</p>
            </div>
          </div>

          <div className="admin-nav-actions">
            <Link href="/" target="_blank" className="admin-btn admin-btn-outline">
              <span>معاينة الرابط الرئيسي ↗</span>
            </Link>
            <button
              type="button"
              onClick={handleReset}
              disabled={saving || loading}
              className="admin-btn admin-btn-danger"
            >
              <span>استعادة الأصلية ↺</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading}
              className="admin-btn admin-btn-primary"
            >
              {saving ? <span>جارٍ الحفظ في Firebase...</span> : <span>حفظ التعديلات ✓</span>}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Form */}
      <main className="admin-container">
        {/* Firebase Status Badge */}
        {firebaseStatus === 'needs-rules' && (
          <div
            style={{
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: '10px',
              padding: '14px 18px',
              marginBottom: '20px',
              color: '#92400e',
              fontSize: '14px',
              lineHeight: '1.6',
            }}
          >
            <strong>تنبيه إعداد قواعد Firebase (Firestore Rules):</strong>
            <p style={{ margin: '4px 0 0' }}>
              لكي يتم حفظ البيانات في السحابة لجميع المستخدمين، يرجى الدخول إلى <strong>Firebase Console &gt; Firestore Database &gt; Rules</strong> وتعيين القواعد للسماح بالقراءة والكتابة:
              <br />
              <code style={{ background: '#fef3c7', padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginTop: '4px' }}>
                allow read, write: if true;
              </code>
            </p>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', fontSize: '18px', color: '#64748b' }}>
            جارٍ الاتصال بـ Firebase وتحميل بيانات التصريح...
          </div>
        ) : (
          <form onSubmit={handleSave}>
            <div className="admin-grid">
              {/* 1. Status Card */}
              <section className="admin-card">
                <div className="admin-card-header">
                  <h2>
                    <span className="admin-card-header-icon">🛡️</span>
                    حالة التصريح والتحقق
                  </h2>
                </div>
                <div className="admin-card-body">
                  <div className="admin-form-row">
                    <div>
                      <label className="admin-label">نوع حالة التصريح</label>
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
                          <span style={{ color: '#9f2f23' }}>منتهي / غير ساري (أحمر)</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="admin-label">نص شارة الحالة (كما تظهر أعلى الصفحة)</label>
                      <input
                        type="text"
                        name="statusText"
                        value={formData.statusText}
                        onChange={handleChange}
                        className="admin-input"
                        placeholder="ساري / فعال"
                        required
                      />
                    </div>
                  </div>

                  <div className="admin-form-row" style={{ marginTop: '16px' }}>
                    <div className="admin-form-col-full">
                      <label className="admin-label">رسالة تأكيد التحقق</label>
                      <input
                        type="text"
                        name="verificationMessage"
                        value={formData.verificationMessage}
                        onChange={handleChange}
                        className="admin-input"
                        placeholder="تم التحقق من التصريح بنجاح"
                        required
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* 2. Notice Details Card */}
              <section className="admin-card">
                <div className="admin-card-header">
                  <h2>
                    <span className="admin-card-header-icon">📋</span>
                    بيانات التصريح (Table 1)
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
                        placeholder="TW0586633"
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
                        placeholder="تصريح إعارة أجير"
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
                        placeholder="YYYY-MM-DD"
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
                        placeholder="YYYY-MM-DD"
                        required
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* 3. Worker Details Card */}
              <section className="admin-card">
                <div className="admin-card-header">
                  <h2>
                    <span className="admin-card-header-icon">👤</span>
                    بيانات العامل (Table 2)
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
                        placeholder="اسم العامل الكامل"
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
                        placeholder="2573771900"
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
                        placeholder="باكستاني"
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
                        placeholder="المهنة المسجلة"
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
                        placeholder="-"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* 4. Facility Details Card */}
              <section className="admin-card">
                <div className="admin-card-header">
                  <h2>
                    <span className="admin-card-header-icon">🏢</span>
                    بيانات المنشأة (Table 3)
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
                        placeholder="14-4016821"
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
                        placeholder="اسم المنشأة"
                        required
                      />
                    </div>
                  </div>
                </div>
              </section>

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
                              <h1 className="verification-title">التحقق من تصريح أجير</h1>
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
                            <th colSpan="4">بيانات التصريح</th>
                          </tr>
                          <tr>
                            <th className="verification-table__label">رقم التصريح</th>
                            <td className="verification-table__value">{formData.noticeNumber}</td>
                            <th className="verification-table__label">نوع التصريح</th>
                            <td className="verification-table__value">{formData.noticeType}</td>
                          </tr>
                          <tr>
                            <th className="verification-table__label">تاريخ بداية التصريح</th>
                            <td className="verification-table__value">{formData.startDate}</td>
                            <th className="verification-table__label">تاريخ نهاية التصريح</th>
                            <td className="verification-table__value">{formData.endDate}</td>
                          </tr>
                        </tbody>
                      </table>

                      <table className="verification-table" dir="rtl">
                        <tbody>
                          <tr className="verification-table__section">
                            <th colSpan="4">بيانات العامل</th>
                          </tr>
                          <tr>
                            <th className="verification-table__label">اسم العامل</th>
                            <td className="verification-table__value">{formData.workerName}</td>
                            <th className="verification-table__label">رقم الهوية / الإقامة</th>
                            <td className="verification-table__value">{formData.iqamaNumber}</td>
                          </tr>
                          <tr>
                            <th className="verification-table__label">الجنسية</th>
                            <td className="verification-table__value">{formData.nationality}</td>
                            <th className="verification-table__label">المهنة</th>
                            <td className="verification-table__value">{formData.occupation}</td>
                          </tr>
                          <tr>
                            <th className="verification-table__label">الجنس</th>
                            <td className="verification-table__value">{formData.gender}</td>
                            <th className="verification-table__label">تاريخ الميلاد</th>
                            <td className="verification-table__value">{formData.birthDate}</td>
                          </tr>
                        </tbody>
                      </table>

                      <table className="verification-table" dir="rtl">
                        <tbody>
                          <tr className="verification-table__section">
                            <th colSpan="4">بيانات المنشأة</th>
                          </tr>
                          <tr>
                            <th className="verification-table__label">رقم المنشأة</th>
                            <td className="verification-table__value">{formData.facilityNumber}</td>
                            <th className="verification-table__label">اسم المنشأة</th>
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
                    يتم تخزين التعديلات في Firebase Firestore سحابياً وتنعكس فوراً على أي مستخدم يفتح الرابط.
                  </span>
                </div>
                <div className="admin-nav-actions">
                  <Link href="/" target="_blank" className="admin-btn admin-btn-outline">
                    <span>فتح الرابط الرئيسي ↗</span>
                  </Link>
                  <button
                    type="submit"
                    disabled={saving || loading}
                    className="admin-btn admin-btn-primary"
                    style={{ minWidth: '170px' }}
                  >
                    {saving ? <span>جارٍ الحفظ في Firebase...</span> : <span>حفظ التعديلات ✓</span>}
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
