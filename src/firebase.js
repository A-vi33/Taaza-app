// Firebase initialization for Tazza Chicken
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBfRYv1lP4IZqwE1GNHKn282lVZbcdh29c",
  authDomain: "taaza-5c5cd.firebaseapp.com",
  projectId: "taaza-5c5cd",
  storageBucket: "taaza-5c5cd.appspot.com",
  messagingSenderId: "419986863629",
  appId: "1:419986863629:web:4bc1bd7e11082fda59c744",
  measurementId: "G-DWNQL265JV"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };

// const storageRef = ref(storage, 'products/' + fileName);

// uploadBytes(storageRef, file).then((snapshot) => {
//   getDownloadURL(snapshot.ref).then((downloadURL) => {
//     // Use this downloadURL in your app
//     console.log('File available at', downloadURL);
//   });
// }); 