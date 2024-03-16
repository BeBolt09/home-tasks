import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from 'firebase/auth';
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyC90cNbRB1t15fsuwt4Dqv1QO-h7yeDGh0",
    authDomain: "home-tasks-8c5a3.firebaseapp.com",
    projectId: "home-tasks-8c5a3",
    storageBucket: "home-tasks-8c5a3.appspot.com",
    messagingSenderId: "771613441556",
    appId: "1:771613441556:web:4cd75f6a36a0712c707101",
    measurementId: "G-T0PCD1LNL5"
  };
//INITIALIZE FIREBASE  
export const FIREBASE_APP = initializeApp(firebaseConfig);
export const FIREBASE_AUTH = getAuth(FIREBASE_APP);
export const FIREBASE_DB = getFirestore(FIREBASE_APP);
export const FIREBASE_ST = getStorage(FIREBASE_APP);