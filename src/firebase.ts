import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCoR7mMu5v7upOXfL4C9_pSR27mMzUE-x0",
  authDomain: "jeeto-bgmi-8c5db.firebaseapp.com",
  projectId: "jeeto-bgmi-8c5db",
  storageBucket: "jeeto-bgmi-8c5db.firebasestorage.app",
  messagingSenderId: "305560253751",
  appId: "1:305560253751:web:f7124237a69571443f96b2"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Firestore collection references
export const matchesCollection = collection(db, 'matches');
export const usersCollection = collection(db, 'users');
export const withdrawalsCollection = collection(db, 'withdrawals');
export const addCashCollection = collection(db, 'addCashRequests');

// Get document references
export const getMatchDoc = (id: string) => doc(db, 'matches', id);
export const getUserDoc = (id: string) => doc(db, 'users', id);
export const getWithdrawalDoc = (id: string) => doc(db, 'withdrawals', id);
export const getAddCashDoc = (id: string) => doc(db, 'addCashRequests', id);

// Export Firestore methods
export { setDoc, updateDoc, deleteDoc, onSnapshot, getDoc, collection, doc };

// Export Auth methods
export { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged };

// NOTE: Firebase Storage is NOT used.
// All screenshots go directly to Telegram — saves storage quota!
