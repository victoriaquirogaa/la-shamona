import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD9ryjgpCTKwcWNCNU-wIzOnoY6PgL9Y8g",
  authDomain: "la-shamona-back.firebaseapp.com",
  projectId: "la-shamona-back",
  storageBucket: "la-shamona-back.firebasestorage.app",
  messagingSenderId: "930301862044",
  appId: "1:930301862044:web:1296896bb025c176a5cd59"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);