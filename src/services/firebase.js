// src/services/firebase.js - Firebase, Firestore, Authentication 초기화
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyB7JGgRkWIbWCXuyQaNwVwwlJKXddEkj5o",
  authDomain: "hamba-web.firebaseapp.com",
  projectId: "hamba-web",
  storageBucket: "hamba-web.firebasestorage.app",
  messagingSenderId: "730468564664",
  appId: "1:730468564664:web:0f381257e838c08ccc7e4d",
  measurementId: "G-Z3082R859W"
};

// Firebase 앱 인스턴스 초기화
export const app = initializeApp(firebaseConfig);

// Cloud Firestore 인스턴스 초기화
export const db = getFirestore(app);

// Authentication & Google Provider 초기화
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
