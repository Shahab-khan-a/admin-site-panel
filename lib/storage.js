import fs from 'fs';
import path from 'path';
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

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

// Local file helper
function readLocal() {
  try {
    if (fs.existsSync(dataFilePath)) {
      const fileData = fs.readFileSync(dataFilePath, 'utf8');
      return JSON.parse(fileData);
    }
  } catch (e) {}
  return null;
}

function writeLocal(data) {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {}
}

export async function getNoticeData() {
  try {
    // Attempt to load from Firebase Firestore
    const docRef = doc(db, 'notices', 'current');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const firestoreData = docSnap.data();
      writeLocal(firestoreData);
      return { ...DEFAULT_NOTICE_DATA, ...firestoreData };
    }
  } catch (err) {
    // Firestore might be unavailable or rules not deployed yet
    console.warn('Firestore fetch notice warning (using local fallback):', err.message);
  }

  // Fallback to local storage if Firestore isn't reached
  const local = readLocal();
  if (local) {
    return { ...DEFAULT_NOTICE_DATA, ...local };
  }

  return { ...DEFAULT_NOTICE_DATA };
}

export async function saveNoticeData(newData) {
  const cleanData = {
    ...DEFAULT_NOTICE_DATA,
    ...newData
  };

  // 1. Save locally for instant offline reliability
  writeLocal(cleanData);

  // 2. Save to Firebase Firestore
  try {
    const docRef = doc(db, 'notices', 'current');
    await setDoc(docRef, cleanData);
  } catch (err) {
    console.warn('Firestore save notice warning (persisted locally):', err.message);
  }

  return cleanData;
}

export async function resetNoticeData() {
  writeLocal(DEFAULT_NOTICE_DATA);

  try {
    const docRef = doc(db, 'notices', 'current');
    await setDoc(docRef, DEFAULT_NOTICE_DATA);
  } catch (err) {
    console.warn('Firestore reset notice warning:', err.message);
  }

  return { ...DEFAULT_NOTICE_DATA };
}
