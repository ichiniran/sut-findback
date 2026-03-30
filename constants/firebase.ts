// Import the functions you need from the SDKs you need
import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAJIbOyH4F5OBYqm310sdeH-3mLnp_1T_w",
  authDomain: "sut-find-back.firebaseapp.com",
  projectId: "sut-find-back",
  storageBucket: "sut-find-back.firebasestorage.app",
  messagingSenderId: "467431856109",
  appId: "1:467431856109:web:b2a136ea6e7c7e3c6179e4",
  measurementId: "G-8YEFP5Z6QF"
};

// Initialize Firebase
const app = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApps()[0];

const auth = getAuth(app);
// const analytics = getAnalytics(app); // analytics ใช้กับ web เท่านั้น

export { app, auth };

