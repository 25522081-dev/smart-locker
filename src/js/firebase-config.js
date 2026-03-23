
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
  // Import the 2 services from firebase 

  import { getAuth } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
  import { getFirestore } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";
  const firebaseConfig = {
    apiKey: "AIzaSyAnRztFJC3tzyjxPbg_Zyq44f3mSC5tzok",
    authDomain: "parcel-box-management.firebaseapp.com",
    projectId: "parcel-box-management",
    storageBucket: "parcel-box-management.firebasestorage.app",
    messagingSenderId: "594896198657",
    appId: "1:594896198657:web:a54bdfbdbeabab8bd57400"
  };

  //declare the functions
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  //export the functions to be used in other files
    export { auth, db };
    