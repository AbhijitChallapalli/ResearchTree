const firebaseConfig = {
  apiKey: "AIzaSyB9STIxE0Rrl2rbmOMax-m4QbbhQOdAL-Q",
  authDomain: "researchtree-71ce7.firebaseapp.com",
  projectId: "researchtree-71ce7",
  storageBucket: "researchtree-71ce7.firebasestorage.app",
  messagingSenderId: "1014630331035",
  appId: "1:1014630331035:web:547095925142a63739cc3e",
  measurementId: "G-VHE936GYL2"
};

// Initialize Firebase using compat-style
firebase.initializeApp(firebaseConfig);

// Use Firebase Auth and Firestore
const auth = firebase.auth();
const db = firebase.firestore();
