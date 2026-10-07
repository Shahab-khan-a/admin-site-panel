import fs from 'fs';
import path from 'path';

export const DEFAULT_NOTICE_DATA = {
  // Status & Verification
  statusText: "ساري / فعال",
  isValid: true,
  verificationMessage: "تم التحقق من التصريح بنجاح",

  // Notice Details (بيانات التصريح)
  noticeNumber: "TW0586633",
  noticeType: "تصريح إعارة أجير",
  startDate: "2026-09-27",
  endDate: "2026-10-27",

  // Worker Details (بيانات العامل)
  workerName: "SYED ADIL JAN SYED KHALID JAN",
  iqamaNumber: "2573771900",
  nationality: "باكستاني",
  occupation: "أخصائي صحة وسلامة مهنية",
  gender: "ذكر",
  birthDate: "-",

  // Facility Details (بيانات المنشأة)
  facilityNumber: "14-4016821",
  facilityName: "مؤسسة الجسور الممدودة"
};

const dataDir = path.join(process.cwd(), 'data');
const dataFilePath = path.join(dataDir, 'notice.json');

export function getNoticeData() {
  try {
    if (fs.existsSync(dataFilePath)) {
      const fileData = fs.readFileSync(dataFilePath, 'utf8');
      const parsed = JSON.parse(fileData);
      return { ...DEFAULT_NOTICE_DATA, ...parsed };
    }
  } catch (err) {
    console.error('Error reading notice data from storage:', err);
  }
  return { ...DEFAULT_NOTICE_DATA };
}

export function saveNoticeData(newData) {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const cleanData = {
      ...DEFAULT_NOTICE_DATA,
      ...newData
    };
    fs.writeFileSync(dataFilePath, JSON.stringify(cleanData, null, 2), 'utf8');
    return cleanData;
  } catch (err) {
    console.error('Error saving notice data to storage:', err);
    throw err;
  }
}

export function resetNoticeData() {
  try {
    if (fs.existsSync(dataFilePath)) {
      fs.unlinkSync(dataFilePath);
    }
    return { ...DEFAULT_NOTICE_DATA };
  } catch (err) {
    console.error('Error resetting notice data:', err);
    return { ...DEFAULT_NOTICE_DATA };
  }
}
