// src/services/firebase.js - Firebase 및 Cloud Firestore 초기화
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB7JGgRkWIbWCXuyQaNwVwwlJKXddEkj5o",
  authDomain: "hamba-web.firebaseapp.com",
  projectId: "hamba-web",
  storageBucket: "hamba-web.firebasestorage.app",
  messagingSenderId: "730468564664",
  appId: "1:730468564664:web:0f381257e838c08ccc7e4d",
  measurementId: "G-Z3082R859W"
};

// Firebase 앱 및 Firestore 인스턴스 초기화
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
