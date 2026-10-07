import { db } from './firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { DEFAULT_NOTICE_DATA } from './defaultData';

const NOTICE_DOC_ID = 'current';

/**
 * Fetch notice data directly from Firebase Firestore
 */
export async function fetchNoticeFromFirestore() {
  try {
    const docRef = doc(db, 'notices', NOTICE_DOC_ID);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { ...DEFAULT_NOTICE_DATA, ...snap.data() };
    }
  } catch (error) {
    console.warn('Firestore fetch warning:', error.message);
  }
  return null;
}

/**
 * Save notice data directly to Firebase Firestore
 */
export async function saveNoticeToFirestore(data) {
  const cleanData = {
    ...DEFAULT_NOTICE_DATA,
    ...data,
    updatedAt: new Date().toISOString()
  };

  try {
    const docRef = doc(db, 'notices', NOTICE_DOC_ID);
    await setDoc(docRef, cleanData);
    return { success: true, data: cleanData };
  } catch (error) {
    console.error('Firestore save error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Real-time listener for live updates across all connected clients
 */
export function subscribeToNotice(callback) {
  try {
    const docRef = doc(db, 'notices', NOTICE_DOC_ID);
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          callback({ ...DEFAULT_NOTICE_DATA, ...snap.data() });
        }
      },
      (error) => {
        console.warn('Firestore subscription warning:', error.message);
      }
    );
  } catch (err) {
    console.warn('Firestore subscribe error:', err.message);
    return () => {};
  }
}
