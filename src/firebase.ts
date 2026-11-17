import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDv1vvqstH3U4nuVx-xLnj_vRPOjE6sFEY",
  authDomain: "seee123-212eb.firebaseapp.com",
  databaseURL: "https://seee123-212eb-default-rtdb.firebaseio.com",
  projectId: "seee123-212eb",
  storageBucket: "seee123-212eb.firebasestorage.app",
  messagingSenderId: "932667837129",
  appId: "1:932667837129:web:749c63196302136334db18",
  measurementId: "G-77CEMEZ3HL"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);