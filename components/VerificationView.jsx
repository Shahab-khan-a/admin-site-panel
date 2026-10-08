'use client';

import React, { useState, useEffect } from 'react';
import { subscribeToNotice } from '../lib/firestoreService';
import { DEFAULT_NOTICE_DATA } from '../lib/defaultData';

export default function VerificationView({ tokenData, tokenId }) {
  const [data, setData] = useState({
    ...DEFAULT_NOTICE_DATA,
    ...tokenData
  });

  // Dynamically update document title from Firebase
  useEffect(() => {
    if (data.pageTitle && typeof document !== 'undefined') {
      document.title = data.pageTitle;
    }
  }, [data.pageTitle]);

  // Real-time synchronization with Firebase Firestore
  // 100% of all static text & dynamic data loads directly from Firestore!
  useEffect(() => {
    const targetDocId = tokenId || 'current';
    const unsubscribe = subscribeToNotice((firestoreData) => {
      if (firestoreData) {
        setData((prev) => ({
          ...prev,
          ...firestoreData
        }));
      }
    }, targetDocId);

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [tokenId]);

  return (
    <div className="qiwa-ajeer-app" suppressHydrationWarning>
      <header className="mainHeader">
        <div className="mainHeader__top">
          <div className="container-fluid">
            <div className="mainHeader__logoContainer">
              <a href="/">
                <img
                  src="/dist/img/ajeer-logo.png"
                  alt={data.headerLogoAjeerAlt || "أجير"}
                />
              </a>
            </div>
            <div className="mainHeader__logoContainer mainHeader__logoContainer--right">
              <a href={data.footerMlsdUrl || "https://mlsd.gov.sa/"}>
                <img
                  src="/dist/img/mlsd-logo.png"
                  alt={data.headerLogoMlsdAlt || "وزارة الموارد البشرية والتنمية الاجتماعية"}
                />
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
                          alt={data.headerLogoAjeerAlt || "أجير"}
                        />
                        <img
                          className="verification-logo verification-logo--hrsd"
                          src="/dist/img/mlsd-logo.png"
                          alt={data.headerLogoMlsdAlt || "وزارة الموارد البشرية والتنمية الاجتماعية"}
                        />
                      </td>
                      <td className="verification-header__title">
                        <h1 className="verification-title">{data.headerTitle}</h1>
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
                  <p>{data.verificationMessage}</p>
                </div>

                {/* Table 1: Notice Details */}
                <table className="verification-table" dir="rtl">
                  <tbody>
                    <tr className="verification-table__section">
                      <th colSpan="4">{data.section1Title}</th>
                    </tr>
                    <tr>
                      <th className="verification-table__label">{data.noticeNumberLabel}</th>
                      <td className="verification-table__value">{data.noticeNumber}</td>
                      <th className="verification-table__label">{data.noticeTypeLabel}</th>
                      <td className="verification-table__value">{data.noticeType}</td>
                    </tr>
                    <tr>
                      <th className="verification-table__label">{data.startDateLabel}</th>
                      <td className="verification-table__value">{data.startDate}</td>
                      <th className="verification-table__label">{data.endDateLabel}</th>
                      <td className="verification-table__value">{data.endDate}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Table 2: Worker Details */}
                <table className="verification-table" dir="rtl">
                  <tbody>
                    <tr className="verification-table__section">
                      <th colSpan="4">{data.section2Title}</th>
                    </tr>
                    <tr>
                      <th className="verification-table__label">{data.workerNameLabel}</th>
                      <td className="verification-table__value">{data.workerName}</td>
                      <th className="verification-table__label">{data.iqamaNumberLabel}</th>
                      <td className="verification-table__value">{data.iqamaNumber}</td>
                    </tr>
                    <tr>
                      <th className="verification-table__label">{data.nationalityLabel}</th>
                      <td className="verification-table__value">{data.nationality}</td>
                      <th className="verification-table__label">{data.occupationLabel}</th>
                      <td className="verification-table__value">{data.occupation}</td>
                    </tr>
                    <tr>
                      <th className="verification-table__label">{data.genderLabel}</th>
                      <td className="verification-table__value">{data.gender}</td>
                      <th className="verification-table__label">{data.birthDateLabel}</th>
                      <td className="verification-table__value">{data.birthDate}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Table 3: Facility Details */}
                <table className="verification-table" dir="rtl">
                  <tbody>
                    <tr className="verification-table__section">
                      <th colSpan="4">{data.section3Title}</th>
                    </tr>
                    <tr>
                      <th className="verification-table__label">{data.facilityNumberLabel}</th>
                      <td className="verification-table__value">{data.facilityNumber}</td>
                      <th className="verification-table__label">{data.facilityNameLabel}</th>
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
                  {/* Footer Col 1 */}
                  <div className="col-md-3">
                    <div className="mainFooter__topNavTitle mt-5 mt-sm-5 mt-md-0 mt-lg-0 mt-xl-0">
                      {data.footerCol1Title}
                    </div>
                    <p>
                      <a href={data.footerLink1Url} className="mainFooter__topNavLink">
                        {data.footerLink1Text}
                      </a>
                    </p>
                    <p>
                      <a href={data.footerLink2Url} className="mainFooter__topNavLink">
                        {data.footerLink2Text}
                      </a>
                    </p>
                  </div>

                  {/* Footer Col 2 */}
                  <div className="col-md-3">
                    <div className="mainFooter__topNavTitle mt-5 mt-sm-5 mt-md-0 mt-lg-0 mt-xl-0">
                      {data.footerCol2Title}
                    </div>
                    <p>
                      <a href={data.footerLink3Url} className="mainFooter__topNavLink">
                        {data.footerLink3Text}
                      </a>
                    </p>
                    <p>
                      <a href={data.footerLink4Url} className="mainFooter__topNavLink">
                        {data.footerLink4Text}
                      </a>
                    </p>
                  </div>

                  {/* Footer Col 3 */}
                  <div className="col-md-3">
                    <div className="mainFooter__topNavTitle mt-5 mt-sm-5 mt-md-0 mt-lg-0 mt-xl-0">
                      {data.footerCol3Title}
                    </div>
                    <p>
                      <a href={data.footerLink5Url} className="mainFooter__topNavLink">
                        {data.footerLink5Text}
                      </a>
                    </p>
                    <p>
                      <a href={data.footerLink6Url} className="mainFooter__topNavLink">
                        {data.footerLink6Text}
                      </a>
                    </p>
                  </div>

                  {/* Footer Col 4 */}
                  <div className="col-md-3">
                    <div className="mainFooter__topNavTitle mt-5 mt-sm-5 mt-md-0 mt-lg-0 mt-xl-0">
                      {data.footerCol4Title}
                    </div>
                    <p>
                      <a
                        href={data.footerTwitterUrl}
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
                        href={`mailto:${data.footerSupportEmail}`}
                        aria-label={`تواصل معنا عبر البريد الإلكتروني ${data.footerSupportEmail}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mainFooter__socialsLink d-inline-block px-2"
                      >
                        <i className="icon-send footer-send-icon"></i>
                      </a>
                      <a
                        href={`tel:${data.footerSupportPhone}`}
                        aria-label={`تواصل معنا عبر الهاتف ${data.footerSupportPhone}`}
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
                          <a href={data.footerMlsdUrl || "https://mlsd.gov.sa/"} target="_blank" rel="noopener noreferrer">
                            <img src="/dist/img/mlsd-logo.png" alt="MLSD" height="50" />
                          </a>
                        </div>
                      </div>
                      <div className="p-2">
                        <div className="mainFooter__topNavLogo px-3">
                          <a href={data.footerTakamolUrl || "https://takamolholding.com/"} target="_blank" rel="noopener noreferrer">
                            <img src="/dist/img/takamol-logo.png" alt="Takamol" height="50" />
                          </a>
                        </div>
                      </div>
                      <div className="p-2 footer-border-desktop">
                        <div className="mainFooter__topNavLogo px-3">
                          <a href={data.footerTamkeenUrl || "https://tamkeentech.sa/"} target="_blank" rel="noopener noreferrer">
                            <img src="/dist/img/tamkeen-logo-1.svg" alt="Tamkeen" height="50" />
                          </a>
                        </div>
                      </div>
                      <div className="p-2">
                        <div className="mainFooter__topNavLogo px-1">
                          <a
                            href={data.footerDigitalStampUrl || "https://raqmi.dga.gov.sa/platforms/DigitalStamp/ShowCertificate/441"}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <img
                              src="/dist/img/digital-govt-auth-logo.svg"
                              alt="Digital Stamp"
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
                          <a href={data.footerMlsdUrl || "https://mlsd.gov.sa/"} target="_blank" rel="noopener noreferrer">
                            <img src="/dist/img/mlsd-logo.png" alt="MLSD" height="50" />
                          </a>
                        </div>
                        <div className="mainFooter__topNavLogo px-3">
                          <a href={data.footerTakamolUrl || "https://takamolholding.com/"} target="_blank" rel="noopener noreferrer">
                            <img src="/dist/img/takamol-logo.png" alt="Takamol" height="50" />
                          </a>
                        </div>
                        <div className="mainFooter__topNavLogo px-3">
                          <a href={data.footerTamkeenUrl || "https://tamkeentech.sa/"} target="_blank" rel="noopener noreferrer">
                            <img src="/dist/img/tamkeen-logo-1.svg" alt="Tamkeen" height="50" />
                          </a>
                        </div>
                      </div>
                      <div className="w-50">
                        <div className="p-2">
                          <div className="mainFooter__topNavLogo px-1">
                            <a
                              href={data.footerDigitalStampUrl || "https://raqmi.dga.gov.sa/platforms/DigitalStamp/ShowCertificate/441"}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <img
                                src="/dist/img/digital-govt-auth-logo.svg"
                                alt="Digital Stamp"
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
