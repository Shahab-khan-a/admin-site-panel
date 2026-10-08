import { db } from './firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { DEFAULT_NOTICE_DATA } from './defaultData';
import { generateNoticeToken } from './tokenGenerator';

const NOTICE_DOC_ID = 'current';

/**
 * Fetch notice data directly from Firebase Firestore by tokenId or 'current'
 */
export async function fetchNoticeFromFirestore(tokenId = NOTICE_DOC_ID) {
  const targetId = tokenId || NOTICE_DOC_ID;

  try {
    const docRef = doc(db, 'notices', targetId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { ...DEFAULT_NOTICE_DATA, ...snap.data() };
    }
  } catch (error) {
    console.warn(`Firestore fetch [${targetId}] warning:`, error.message);
  }

  // Fallback to 'current' if specific token document was not found
  if (targetId !== NOTICE_DOC_ID) {
    try {
      const currentRef = doc(db, 'notices', NOTICE_DOC_ID);
      const snap = await getDoc(currentRef);
      if (snap.exists()) {
        return { ...DEFAULT_NOTICE_DATA, ...snap.data() };
      }
    } catch (e) {}
  }

  return null;
}

/**
 * Save notice data directly to Firebase Firestore
 * Creates a unique permalink token document AND updates 'current'
 */
export async function saveNoticeToFirestore(data, customToken = null) {
  const token = customToken || generateNoticeToken(data);
  const now = new Date().toISOString();

  const cleanData = {
    ...DEFAULT_NOTICE_DATA,
    ...data,
    token,
    updatedAt: now,
  };

  try {
    // 1. Save specific token permalink document
    const tokenDocRef = doc(db, 'notices', token);
    await setDoc(tokenDocRef, cleanData);

    // 2. Also update 'current' for root page (/)
    const currentDocRef = doc(db, 'notices', NOTICE_DOC_ID);
    await setDoc(currentDocRef, cleanData);

    // 3. Update history list in Firestore
    try {
      const histRef = doc(db, 'notices_meta', 'history');
      const histSnap = await getDoc(histRef);
      let items = [];
      if (histSnap.exists() && Array.isArray(histSnap.data().items)) {
        items = histSnap.data().items;
      }
      const newItem = {
        token,
        noticeNumber: cleanData.noticeNumber,
        workerName: cleanData.workerName,
        facilityName: cleanData.facilityName,
        statusText: cleanData.statusText,
        createdAt: now,
      };
      const updatedItems = [newItem, ...items.filter((i) => i.token !== token)].slice(0, 50);
      await setDoc(histRef, { items: updatedItems, lastUpdated: now });
    } catch (histError) {
      console.warn('Firestore history update warning:', histError.message);
    }

    return { success: true, token, data: cleanData };
  } catch (error) {
    console.error('Firestore save error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetch list of previously generated links
 */
export async function fetchLinksHistory() {
  try {
    const histRef = doc(db, 'notices_meta', 'history');
    const snap = await getDoc(histRef);
    if (snap.exists() && Array.isArray(snap.data().items)) {
      return snap.data().items;
    }
  } catch (e) {
    console.warn('Failed to fetch history:', e.message);
  }
  return [];
}

/**
 * Real-time listener for live updates across all connected clients
 */
export function subscribeToNotice(callback, tokenId = NOTICE_DOC_ID) {
  const targetId = tokenId || NOTICE_DOC_ID;

  try {
    const docRef = doc(db, 'notices', targetId);
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          callback({ ...DEFAULT_NOTICE_DATA, ...snap.data() });
        }
      },
      (error) => {
        console.warn(`Firestore subscription [${targetId}] warning:`, error.message);
      }
    );
  } catch (err) {
    console.warn('Firestore subscribe error:', err.message);
    return () => {};
  }
}
