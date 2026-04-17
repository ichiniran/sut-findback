import { getApps, initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
const firebaseConfig = {
  apiKey: "AIzaSyAJIbOyH4F5OBYqm310sdeH-3mLnp_1T_w",
  authDomain: "sut-find-back.firebaseapp.com",
  projectId: "sut-find-back",
  storageBucket: "sut-find-back.firebasestorage.app",
  messagingSenderId: "467431856109",
  appId: "1:467431856109:web:b2a136ea6e7c7e3c6179e4",
  measurementId: "G-8YEFP5Z6QF"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
export const auth = getAuth(app);

