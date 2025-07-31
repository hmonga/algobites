// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBqa9NJqR0GR1NtkhTkbH238g5ZeIdsEg0",
  authDomain: "algobi-14f1f.firebaseapp.com",
  projectId: "algobi-14f1f",
  storageBucket: "algobi-14f1f.appspot.com", // ✅ corrected from .firebasestorage.app
  messagingSenderId: "868732304",
  appId: "1:868732304:web:72c5247cf97875b70ef715",
  measurementId: "G-TFV7R94GTM"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);

export { auth, db };
