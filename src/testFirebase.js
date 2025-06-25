// Test Firebase Connection
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBfRYv1lP4IZqwE1GNHKn282lVZbcdh29c",
  authDomain: "taaza-5c5cd.firebaseapp.com",
  projectId: "taaza-5c5cd",
  storageBucket: "taaza-5c5cd.firebasestorage.app",
  messagingSenderId: "419986863629",
  appId: "1:419986863629:web:4bc1bd7e11082fda59c744",
  measurementId: "G-DWNQL265JV"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Test functions
export const testFirebaseConnection = async () => {
  try {
    console.log('Testing Firebase connection...');
    console.log('Project ID:', firebaseConfig.projectId);
    
    // Test 1: Check if we can read from Firestore
    console.log('Testing Firestore read...');
    const testCollection = collection(db, 'test');
    const snapshot = await getDocs(testCollection);
    console.log('✅ Firestore read test passed');
    
    // Test 2: Check if we can write to Firestore
    console.log('Testing Firestore write...');
    const testDoc = await addDoc(collection(db, 'test'), {
      message: 'Firebase connection test',
      timestamp: new Date(),
      testId: Math.random().toString(36).substr(2, 9)
    });
    console.log('✅ Firestore write test passed, doc ID:', testDoc.id);
    
    return true;
  } catch (error) {
    console.error('❌ Firebase test failed:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    
    // Provide specific guidance based on error
    if (error.code === 'permission-denied') {
      console.error('💡 SOLUTION: Update Firestore rules to allow read/write access');
      console.error('💡 Go to Firebase Console → Firestore Database → Rules');
      console.error('💡 Set rules to: allow read, write: if true; (for development)');
    }
    
    return false;
  }
};

export const testAuth = async (email, password) => {
  try {
    console.log('Testing Firebase Auth...');
    
    // Try to create a test user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('✅ Auth test passed, user created:', userCredential.user.uid);
    
    return userCredential.user;
  } catch (error) {
    console.error('❌ Auth test failed:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    return null;
  }
}; 