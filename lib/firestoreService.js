import { db } from './firebase';
import { doc, getDoc, setDoc, deleteDoc, onSnapshot, collection, getDocs } from 'firebase/firestore';
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
      const docData = snap.data();
      if (targetId !== NOTICE_DOC_ID) {
        try {
          const currentRef = doc(db, 'notices', NOTICE_DOC_ID);
          const currentSnap = await getDoc(currentRef);
          if (currentSnap.exists()) {
            return { ...DEFAULT_NOTICE_DATA, ...currentSnap.data(), ...docData };
          }
        } catch (e) {}
      }
      return { ...DEFAULT_NOTICE_DATA, ...docData };
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
 * Creates or updates a specific permalink token document AND updates 'current'
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
    // 1. Save specific token permalink document in notices collection
    const tokenDocRef = doc(db, 'notices', token);
    await setDoc(tokenDocRef, cleanData);

    // 2. Also update 'current' for root page (/)
    const currentDocRef = doc(db, 'notices', NOTICE_DOC_ID);
    await setDoc(currentDocRef, cleanData);

    // 3. Update history list in Firestore with complete item data
    try {
      const histRef = doc(db, 'notices_meta', 'history');
      const histSnap = await getDoc(histRef);
      let items = [];
      if (histSnap.exists() && Array.isArray(histSnap.data().items)) {
        items = histSnap.data().items;
      }

      const newItem = {
        token,
        noticeNumber: cleanData.noticeNumber || '',
        workerName: cleanData.workerName || '',
        facilityName: cleanData.facilityName || '',
        statusText: cleanData.statusText || '',
        isValid: cleanData.isValid !== false,
        noticeType: cleanData.noticeType || '',
        startDate: cleanData.startDate || '',
        endDate: cleanData.endDate || '',
        iqamaNumber: cleanData.iqamaNumber || '',
        nationality: cleanData.nationality || '',
        occupation: cleanData.occupation || '',
        gender: cleanData.gender || '',
        birthDate: cleanData.birthDate || '',
        facilityNumber: cleanData.facilityNumber || '',
        createdAt: now,
      };

      // Put newest at the front, replace if token already exists
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
 * Delete a specific notice document directly from Firebase Firestore
 */
export async function deleteNoticeFromFirestore(token) {
  if (!token) return { success: false, error: 'Token is required' };

  try {
    // 1. Delete document from notices collection in Firestore
    const tokenDocRef = doc(db, 'notices', token);
    await deleteDoc(tokenDocRef);

    // 2. Remove from notices_meta/history
    try {
      const histRef = doc(db, 'notices_meta', 'history');
      const histSnap = await getDoc(histRef);
      if (histSnap.exists() && Array.isArray(histSnap.data().items)) {
        const filtered = histSnap.data().items.filter((item) => item.token !== token);
        await setDoc(histRef, { items: filtered, lastUpdated: new Date().toISOString() });
      }
    } catch (histError) {
      console.warn('Firestore history delete warning:', histError.message);
    }

    // 3. Sync local backup API
    try {
      await fetch('/api/notice?token=' + encodeURIComponent(token), { method: 'DELETE' });
    } catch (e) {}

    return { success: true };
  } catch (error) {
    console.error('Firestore delete error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetch list of all saved notices from Firebase Firestore
 */
export async function fetchLinksHistory() {
  try {
    const histRef = doc(db, 'notices_meta', 'history');
    const snap = await getDoc(histRef);
    if (snap.exists() && Array.isArray(snap.data().items) && snap.data().items.length > 0) {
      return snap.data().items;
    }
  } catch (e) {
    console.warn('Failed to fetch history document:', e.message);
  }

  // Fallback: Scan notices collection directly from Firestore
  try {
    const noticesCol = collection(db, 'notices');
    const querySnap = await getDocs(noticesCol);
    const items = [];
    querySnap.forEach((docSnap) => {
      if (docSnap.id !== 'current') {
        const d = docSnap.data();
        items.push({
          token: docSnap.id,
          noticeNumber: d.noticeNumber || '',
          workerName: d.workerName || '',
          facilityName: d.facilityName || '',
          statusText: d.statusText || (d.isValid ? 'ساري / فعال' : 'منتهي / ملغي'),
          isValid: d.isValid !== false,
          noticeType: d.noticeType || '',
          startDate: d.startDate || '',
          endDate: d.endDate || '',
          iqamaNumber: d.iqamaNumber || '',
          nationality: d.nationality || '',
          occupation: d.occupation || '',
          gender: d.gender || '',
          birthDate: d.birthDate || '',
          facilityNumber: d.facilityNumber || '',
          createdAt: d.updatedAt || d.createdAt || new Date().toISOString(),
        });
      }
    });

    if (items.length > 0) {
      try {
        const histRef = doc(db, 'notices_meta', 'history');
        await setDoc(histRef, { items, lastUpdated: new Date().toISOString() });
      } catch (err) {}
      return items;
    }
  } catch (err) {
    console.warn('Failed to scan notices collection:', err.message);
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
        // Silently recover if network reconnects or changes
      }
    );
  } catch (err) {
    return () => {};
  }
}
