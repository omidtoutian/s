import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCu51_y5tM0KLY3rI1vOlIJr5mH1x50NEs",
  authDomain: "twitter-clone-18cc5.firebaseapp.com",
  projectId: "twitter-clone-18cc5",
  storageBucket: "twitter-clone-18cc5.appspot.com",
  messagingSenderId: "1038356710626",
  appId: "1:1038356710626:web:9404a5d273a24c6b614abb",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
