import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAUaWvRvNMWM3-MotAcCfGvHU3-KC6ucZQ",
  authDomain: "ahffk-7d4ef.firebaseapp.com",
  databaseURL: "https://ahffk-7d4ef-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ahffk-7d4ef",
  storageBucket: "ahffk-7d4ef.firebasestorage.app",
  messagingSenderId: "873644535490",
  appId: "1:873644535490:web:f1ed0eca4489de14b5555b"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);