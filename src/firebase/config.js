import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB6Sk8knJ7WDmikY7K_ktFMVRGyZ-mN9Zw",
  authDomain: "new-horizon-information-system.firebaseapp.com",
  projectId: "new-horizon-information-system",
  storageBucket: "new-horizon-information-system.firebasestorage.app",
  messagingSenderId: "401281266165",
  appId: "1:401281266165:web:ae169a578f67e64e6970bc",
  measurementId: "G-3X9ZWKQ7MQ"
};

const app = initializeApp(firebaseConfig);

const analytics = getAnalytics(app);

export const db = getFirestore(app);
export const auth = getAuth(app);

export { app };