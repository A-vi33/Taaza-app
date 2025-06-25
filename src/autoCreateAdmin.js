// Auto-create admin account script
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, fetchSignInMethodsForEmail } from 'firebase/auth';

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

export const autoCreateAdmin = async () => {
  const adminPassword = 'Admin@2025'; // Fixed: password as string
  
  try {
    console.log('Checking if admin exists...');
    
    // Check if admin already exists
    const methods = await fetchSignInMethodsForEmail(auth, 'admin@taaza.com');
    
    if (methods.length > 0) {
      console.log('✅ Admin already exists');
      return { success: true, message: 'Admin already exists' };
    }
    
    // Create admin account
    console.log('Creating admin account...');
    const userCredential = await createUserWithEmailAndPassword(auth, 'admin@taaza.com', adminPassword);
    
    console.log('✅ Admin created successfully!');
    console.log('Email: admin@taaza.com');
    console.log('Password:', adminPassword);
    console.log('UID:', userCredential.user.uid);
    
    return { 
      success: true, 
      message: 'Admin created successfully',
      credentials: {
        email: 'admin@taaza.com',
        password: adminPassword
      }
    };
    
  } catch (error) {
    console.error('❌ Failed to create admin:', error);
    return { success: false, error: error.message };
  }
};

// Usage example:
// autoCreateAdmin(); 