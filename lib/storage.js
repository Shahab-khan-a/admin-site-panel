import fs from 'fs';
import path from 'path';
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { DEFAULT_NOTICE_DATA } from './defaultData';
import { generateNoticeToken } from './tokenGenerator';

export { DEFAULT_NOTICE_DATA };

const dataDir = path.join(process.cwd(), 'data');
const dataFilePath = path.join(dataDir, 'notice.json');
const historyFilePath = path.join(dataDir, 'history.json');

// Local helpers
function readLocal(file = dataFilePath) {
  try {
    if (fs.existsSync(file)) {
      const fileData = fs.readFileSync(file, 'utf8');
      return JSON.parse(fileData);
    }
  } catch (e) {}
  return null;
}

function writeLocal(data, file = dataFilePath) {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {}
}

export async function getNoticeData(tokenId = 'current') {
  const targetId = tokenId || 'current';

  try {
    // 1. First attempt to load target doc from Firebase Firestore
    const docRef = doc(db, 'notices', targetId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const firestoreData = docSnap.data();
      writeLocal(firestoreData);
      return { ...DEFAULT_NOTICE_DATA, ...firestoreData };
    }
  } catch (err) {
    console.warn(`Firestore fetch [${targetId}] warning:`, err.message);
  }

  // 2. If specific token not found, attempt to fallback to 'current' in Firestore
  if (targetId !== 'current') {
    try {
      const currentRef = doc(db, 'notices', 'current');
      const currentSnap = await getDoc(currentRef);
      if (currentSnap.exists()) {
        const firestoreData = currentSnap.data();
        return { ...DEFAULT_NOTICE_DATA, ...firestoreData };
      }
    } catch (e) {}
  }

  // 3. Fallback to local storage
  const local = readLocal();
  if (local) {
    return { ...DEFAULT_NOTICE_DATA, ...local };
  }

  return { ...DEFAULT_NOTICE_DATA };
}

export async function saveNoticeData(newData, customToken = null) {
  const token = customToken || generateNoticeToken(newData);
  const now = new Date().toISOString();

  const cleanData = {
    ...DEFAULT_NOTICE_DATA,
    ...newData,
    token,
    updatedAt: now,
  };

  // 1. Save locally for instant offline reliability
  writeLocal(cleanData);

  // 2. Save directly to Firebase Firestore
  try {
    // A. Save individual permalink document for this specific token
    const tokenDocRef = doc(db, 'notices', token);
    await setDoc(tokenDocRef, cleanData);

    // B. Save current document for the root page (/)
    const currentDocRef = doc(db, 'notices', 'current');
    await setDoc(currentDocRef, cleanData);

    // C. Update history document in Firestore
    const historyItem = {
      token,
      noticeNumber: cleanData.noticeNumber,
      workerName: cleanData.workerName,
      facilityName: cleanData.facilityName,
      statusText: cleanData.statusText,
      createdAt: now,
    };

    try {
      const histDocRef = doc(db, 'notices_meta', 'history');
      const histSnap = await getDoc(histDocRef);
      let list = [];
      if (histSnap.exists() && Array.isArray(histSnap.data().items)) {
        list = histSnap.data().items;
      }
      // Put newest at the front, keep up to 50
      const updatedList = [historyItem, ...list.filter((x) => x.token !== token)].slice(0, 50);
      await setDoc(histDocRef, { items: updatedList, lastUpdated: now });
      writeLocal(updatedList, historyFilePath);
    } catch (histErr) {
      console.warn('History save warning:', histErr.message);
    }
  } catch (err) {
    console.warn('Firestore save notice warning (persisted locally):', err.message);
  }

  return cleanData;
}

export async function getLinksHistory() {
  try {
    const histDocRef = doc(db, 'notices_meta', 'history');
    const histSnap = await getDoc(histDocRef);
    if (histSnap.exists() && Array.isArray(histSnap.data().items)) {
      return histSnap.data().items;
    }
  } catch (err) {}

  const localHist = readLocal(historyFilePath);
  if (Array.isArray(localHist)) return localHist;
  return [];
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
