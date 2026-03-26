import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
};

export const IS_FIREBASE_ENABLED = !!firebaseConfig.apiKey;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let app, auth: any, db: any, storage: any;

if (IS_FIREBASE_ENABLED) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
}

// --- Mock Global State ---
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockCurrentUser: any = null;
const MOCK_STORAGE_KEY = 'vyk_mock_db';
const MOCK_AUTH_KEY = 'vyk_mock_auth';

function getMockDB() {
  const data = localStorage.getItem(MOCK_STORAGE_KEY);
  return data ? JSON.parse(data) : { cards: [], users: [] };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function saveMockDB(db: any) {
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(db));
}

// Check initial auth state
try {
  const savedUser = localStorage.getItem(MOCK_AUTH_KEY);
  if (savedUser) mockCurrentUser = JSON.parse(savedUser);
} catch { /* ignore */ }

// --- Auth API ---
export const authService = {
  async login(email: string, pass: string) {
    if (IS_FIREBASE_ENABLED) {
      return signInWithEmailAndPassword(auth, email, pass);
    }
    mockCurrentUser = { uid: 'mock_uid_1', email, displayName: email.split('@')[0] };
    localStorage.setItem(MOCK_AUTH_KEY, JSON.stringify(mockCurrentUser));
    return { user: mockCurrentUser };
  },
  async register(email: string, pass: string, name: string) {
    if (IS_FIREBASE_ENABLED) {
      return createUserWithEmailAndPassword(auth, email, pass);
    }
    mockCurrentUser = { uid: 'mock_uid_1', email, displayName: name };
    localStorage.setItem(MOCK_AUTH_KEY, JSON.stringify(mockCurrentUser));
    return { user: mockCurrentUser };
  },
  async loginGoogle() {
    if (IS_FIREBASE_ENABLED) {
      const provider = new GoogleAuthProvider();
      return signInWithPopup(auth, provider);
    }
    mockCurrentUser = { uid: 'mock_uid_1', email: 'guest@mock.com', displayName: 'Guest User' };
    localStorage.setItem(MOCK_AUTH_KEY, JSON.stringify(mockCurrentUser));
    return { user: mockCurrentUser };
  },
  async logout() {
    if (IS_FIREBASE_ENABLED) {
      return signOut(auth);
    }
    mockCurrentUser = null;
    localStorage.removeItem(MOCK_AUTH_KEY);
  },
  onAuthStateChanged(callback: (user: any) => void) { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (IS_FIREBASE_ENABLED) {
      return onAuthStateChanged(auth, callback);
    }
    callback(mockCurrentUser);
    return () => {};
  },
  getCurrentUser() {
    if (IS_FIREBASE_ENABLED) return auth.currentUser;
    return mockCurrentUser;
  }
};

// --- Database API ---
export interface CardData {
  id?: string;
  userId: string;
  occasion: string;
  message: string;
  audioUrl?: string;
  createdAt: number;
}

export const dbService = {
  async saveCard(cardData: CardData) {
    if (IS_FIREBASE_ENABLED) {
      const docRef = await addDoc(collection(db, 'cards'), cardData);
      return docRef.id;
    }
    const mdb = getMockDB();
    const id = uuidv4();
    const newCard = { ...cardData, id };
    mdb.cards.push(newCard);
    saveMockDB(mdb);
    return id;
  },
  async getUserCards(userId: string) {
    if (IS_FIREBASE_ENABLED) {
      const q = query(collection(db, 'cards'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CardData));
    }
    const mdb = getMockDB();
    return mdb.cards.filter((c: any) => c.userId === userId || c.userId === 'mock_uid_1'); // eslint-disable-line @typescript-eslint/no-explicit-any
  }
};

// --- Storage API ---
export const storageService = {
  async uploadAudio(blob: Blob, path: string): Promise<string> {
    if (IS_FIREBASE_ENABLED) {
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, blob);
      return await getDownloadURL(storageRef);
    }
    // Mock local representation as object URL
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string); // Save as base64 string in local setup
      };
      reader.readAsDataURL(blob);
    });
  }
};
