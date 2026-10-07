import React from 'react';

export default function VerificationView({ tokenData }) {
  const data = {
    noticeNumber: tokenData?.noticeNumber || "TW0586633",
    noticeType: tokenData?.noticeType || "تصريح إعارة أجير",
    startDate: tokenData?.startDate || "2026-09-27",
    endDate: tokenData?.endDate || "2026-10-27",
    workerName: tokenData?.workerName || "SYED ADIL JAN SYED KHALID JAN",
    iqamaNumber: tokenData?.iqamaNumber || "2573771900",
    nationality: tokenData?.nationality || "باكستاني",
    occupation: tokenData?.occupation || "أخصائي صحة وسلامة مهنية",
    gender: tokenData?.gender || "ذكر",
    birthDate: tokenData?.birthDate || "-",
    facilityNumber: tokenData?.facilityNumber || "14-4016821",
    facilityName: tokenData?.facilityName || "مؤسسة الجسور الممدودة",
    statusText: tokenData?.statusText || "ساري / فعال",
    verificationMessage: tokenData?.verificationMessage || "تم التحقق من التصريح بنجاح",
    isValid: tokenData?.isValid !== false
  };

  return (
    <div className="qiwa-ajeer-app" suppressHydrationWarning>
      <header className="mainHeader">
        <div className="mainHeader__top">
          <div className="container-fluid">
            <div className="mainHeader__logoContainer">
              <a href="/">
                <img src="/dist/img/ajeer-logo.png" alt="Qiwa Ajeer" />
              </a>
            </div>
            <div className="mainHeader__logoContainer mainHeader__logoContainer--right">
              <a href="https://mlsd.gov.sa/">
                <img src="/dist/img/mlsd-logo.png" alt="MLSD" />
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="appBody">
        <div className="content" id="content">
          <div>
            <main className="verification-page">
              <div className="verification-document" id="verification-content">
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
                            data.isValid ? 'verification-result--valid' : 'verification-result--invalid'
                          }`}
                        >
                          {data.statusText}
                        </strong>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="verification-copy">
                  <p>{data.verificationMessage || "تم التحقق من التصريح بنجاح"}</p>
                </div>

                <table className="verification-table" dir="rtl">
                  <tbody>
                    <tr className="verification-table__section">
                      <th colSpan="4">بيانات التصريح</th>
                    </tr>
                    <tr>
                      <th className="verification-table__label">رقم التصريح</th>
                      <td className="verification-table__value">{data.noticeNumber}</td>
                      <th className="verification-table__label">نوع التصريح</th>
                      <td className="verification-table__value">{data.noticeType}</td>
                    </tr>
                    <tr>
                      <th className="verification-table__label">تاريخ بداية التصريح</th>
                      <td className="verification-table__value">{data.startDate}</td>
                      <th className="verification-table__label">تاريخ نهاية التصريح</th>
                      <td className="verification-table__value">{data.endDate}</td>
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
                      <td className="verification-table__value">{data.workerName}</td>
                      <th className="verification-table__label">رقم الهوية / الإقامة</th>
                      <td className="verification-table__value">{data.iqamaNumber}</td>
                    </tr>
                    <tr>
                      <th className="verification-table__label">الجنسية</th>
                      <td className="verification-table__value">{data.nationality}</td>
                      <th className="verification-table__label">المهنة</th>
                      <td className="verification-table__value">{data.occupation}</td>
                    </tr>
                    <tr>
                      <th className="verification-table__label">الجنس</th>
                      <td className="verification-table__value">{data.gender}</td>
                      <th className="verification-table__label">تاريخ الميلاد</th>
                      <td className="verification-table__value">{data.birthDate}</td>
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
                      <td className="verification-table__value">{data.facilityNumber}</td>
                      <th className="verification-table__label">اسم المنشأة</th>
                      <td className="verification-table__value">{data.facilityName}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </main>
          </div>
        </div>
      </div>

      <footer className="mainFooter ">
        <div className="mainFooter__top">
          <div className="container-fluid">
            <div className="row">
              <div className="col-12 col-md-12 col-lg-6 px-5 px-lg-0 footer-nav-col">
                <div className="row footer-nav-row">
                  <div className="col-md-3">
                    <div className="mainFooter__topNavTitle mt-5 mt-sm-5 mt-md-0 mt-lg-0 mt-xl-0">
                      أجير
                    </div>
                    <p>
                      <a href="/about" className="mainFooter__topNavLink">
                        عن أجير
                      </a>
                    </p>
                    <p>
                      <a href="/about_notices" className="mainFooter__topNavLink">
                        خدمات أجير
                      </a>
                    </p>
                  </div>
                  <div className="col-md-3">
                    <div className="mainFooter__topNavTitle mt-5 mt-sm-5 mt-md-0 mt-lg-0 mt-xl-0">
                      الدعم
                    </div>
                    <p>
                      <a href="/support" className="mainFooter__topNavLink">
                        الدعم و المساعدة
                      </a>
                    </p>
                    <p>
                      <a href="/faq" className="mainFooter__topNavLink">
                        الأسئلة الشائعة
                      </a>
                    </p>
                  </div>
                  <div className="col-md-3">
                    <div className="mainFooter__topNavTitle mt-5 mt-sm-5 mt-md-0 mt-lg-0 mt-xl-0">
                      الشروط و الخصوصية
                    </div>
                    <p>
                      <a href="/terms" className="mainFooter__topNavLink">
                        الشروط والأحكام
                      </a>
                    </p>
                    <p>
                      <a href="/privacy_policy" className="mainFooter__topNavLink">
                        سياسة الخصوصية
                      </a>
                    </p>
                  </div>
                  <div className="col-md-3">
                    <div className="mainFooter__topNavTitle mt-5 mt-sm-5 mt-md-0 mt-lg-0 mt-xl-0">
                      تواصل معنا
                    </div>
                    <p>
                      <a
                        href="https://twitter.com/AjeerSA"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mainFooter__socialsLink d-inline-block px-2"
                      >
                        <img
                          src="/dist/img/x-twitter.svg"
                          alt="X"
                          className="footer-x-icon"
                        />
                      </a>
                      <a
                        href="mailto:support@ajeer.com.sa"
                        aria-label="تواصل معنا عبر البريد الإلكتروني support@ajeer.com.sa"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mainFooter__socialsLink d-inline-block px-2"
                      >
                        <i className="icon-send footer-send-icon"></i>
                      </a>
                      <a
                        href="tel:920011040"
                        aria-label="تواصل معنا عبر الهاتف 920011040"
                        className="mainFooter__socialsLink d-inline-block px-2"
                      >
                        <i className="icon-phone footer-phone-icon"></i>
                      </a>
                    </p>
                  </div>
                  <hr className="hr d-block d-md-none mt-5" />
                </div>
              </div>

              <div className="col-12 col-md-12 col-lg-6">
                <div>
                  <div className="d-none d-md-block">
                    <div className="d-flex flex-row align-items-center">
                      <div className="p-2">
                        <div className="mainFooter__topNavLogo px-3">
                          <a href="https://mlsd.gov.sa/" target="_blank" rel="noopener noreferrer">
                            <img src="/dist/img/mlsd-logo.png" alt="MLSD" height="50" />
                          </a>
                        </div>
                      </div>
                      <div className="p-2">
                        <div className="mainFooter__topNavLogo px-3">
                          <a href="https://takamolholding.com/" target="_blank" rel="noopener noreferrer">
                            <img src="/dist/img/takamol-logo.png" alt="Takamol" height="50" />
                          </a>
                        </div>
                      </div>
                      <div className="p-2 footer-border-desktop">
                        <div className="mainFooter__topNavLogo px-3">
                          <a href="https://tamkeentech.sa/" target="_blank" rel="noopener noreferrer">
                            <img src="/dist/img/tamkeen-logo-1.svg" alt="Tamkeen" height="50" />
                          </a>
                        </div>
                      </div>
                      <div className="p-2">
                        <div className="mainFooter__topNavLogo px-1">
                          <a
                            href="https://raqmi.dga.gov.sa/platforms/DigitalStamp/ShowCertificate/441"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <img
                              src="/dist/img/digital-govt-auth-logo.svg"
                              alt="Tamkeen"
                              className="footer-stamp-logo"
                            />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* For mobile */}
                  <div className="d-block d-md-none">
                    <div className="d-flex flex-row justify-content-center align-items-center">
                      <div className="p-2 footer-border-mobile">
                        <div className="mainFooter__topNavLogo px-3">
                          <a href="https://mlsd.gov.sa/" target="_blank" rel="noopener noreferrer">
                            <img src="/dist/img/mlsd-logo.png" alt="MLSD" height="50" />
                          </a>
                        </div>
                        <div className="mainFooter__topNavLogo px-3">
                          <a href="https://takamolholding.com/" target="_blank" rel="noopener noreferrer">
                            <img src="/dist/img/takamol-logo.png" alt="Takamol" height="50" />
                          </a>
                        </div>
                        <div className="mainFooter__topNavLogo px-3">
                          <a href="https://tamkeentech.sa/" target="_blank" rel="noopener noreferrer">
                            <img src="/dist/img/tamkeen-logo-1.svg" alt="Tamkeen" height="50" />
                          </a>
                        </div>
                      </div>
                      <div className="w-50">
                        <div className="p-2">
                          <div className="mainFooter__topNavLogo px-1">
                            <a
                              href="https://raqmi.dga.gov.sa/platforms/DigitalStamp/ShowCertificate/441"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <img
                                src="/dist/img/digital-govt-auth-logo.svg"
                                alt="Tamkeen"
                                className="footer-stamp-logo"
                              />
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
