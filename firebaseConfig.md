// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB6Sk8knJ7WDmikY7K_ktFMVRGyZ-mN9Zw",
  authDomain: "new-horizon-information-system.firebaseapp.com",
  projectId: "new-horizon-information-system",
  storageBucket: "new-horizon-information-system.firebasestorage.app",
  messagingSenderId: "401281266165",
  appId: "1:401281266165:web:ae169a578f67e64e6970bc",
  measurementId: "G-3X9ZWKQ7MQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);