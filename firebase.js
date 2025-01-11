import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDwQPv_7gqDuQyHzIrwhO7J1bGUpTMhVeU",
  authDomain: "bookmydev.firebaseapp.com",
  projectId: "bookmydev",
  storageBucket: "bookmydev.firebasestorage.app",
  messagingSenderId: "675267390725",
  appId: "1:675267390725:web:5dd6d89f3027962645db6c",
  measurementId: "G-4751T0WEQ1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);