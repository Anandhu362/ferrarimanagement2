// frontend/src/config/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || 'https://ferrari-foods-cash-management-default-rtdb.europe-west1.firebasedatabase.app'
};

let app, auth, db, rtdb;

try {
  // Check if the API key is completely missing
  if (!firebaseConfig.apiKey) {
    console.warn("🚨 WARNING: Firebase API Key is missing. Did you save your .env file?");
  } 
  // Check if you are still using the dummy text I provided earlier
  else if (firebaseConfig.apiKey.includes("xxxx") || firebaseConfig.apiKey.includes("YourActualKey")) {
    console.warn("🚨 WARNING: You are using a fake API Key! Replace it with your real key from the Firebase Console.");
  }

  // Attempt to initialize
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  rtdb = getDatabase(app);
  
  console.log("✅ Firebase initialized successfully.");
} catch (error) {
  console.error("🚨 CRITICAL FIREBASE CRASH:", error.message);
  console.error("The app will still load, but Login/Database features will not work until the .env keys are fixed.");
}

export { auth, db, rtdb };