// Script to seed all products and images to Firestore and Storage
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Firebase config (from src/firebase.js)
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
const db = getFirestore(app);
const storage = getStorage(app);

// Import images (relative to this file)
import breast from './assets/breast.png';
import chickenThighs from './assets/chickenThighs.png';
import wholeChicken from './assets/wholeChicken.png';
import chickenWings from './assets/chickenWings.png';
import chickenDrumsticks from './assets/chickenDrumsticks.png';
import chickenMince from './assets/chickenMince.png';
import chickenLiver from './assets/chickenLiver.png';
import freshFishRohu from './assets/freshFishRohu.png';
import pomfretFish from './assets/pomfretFish.png';
import salmonFillet from './assets/salmonFillet.png';
import tunaSteak from './assets/tunaSteak.png';
import catlaFish from './assets/catlaFish.png';
import mackerelFish from './assets/mackerelFish.png';
import muttonCurryCut from './assets/muttonCurryCut.png';
import muttonChops from './assets/muttonChops.png';
import muttonBiryaniCut from './assets/muttonBiryaniCut.png';
import muttonKeema from './assets/muttonKeema.png';
import muttonRibs from './assets/muttonRibs.png';
import goatMeat from './assets/goatMeat.png';
import goatCurryCut from './assets/goatCurryCut.png';
import duckMeat from './assets/duckMeat.png';
import quailMeat from './assets/quailMeat.png';

const products = [
  { name: 'Fresh Chicken Breast', price: 180, image: breast, category: 'chicken', description: 'Premium quality chicken breast, perfect for grilling' },
  { name: 'Chicken Thighs', price: 160, image: chickenThighs, category: 'chicken', description: 'Juicy chicken thighs, great for curries' },
  { name: 'Whole Chicken', price: 350, image: wholeChicken, category: 'chicken', description: 'Fresh whole chicken, ready to cook' },
  { name: 'Chicken Wings', price: 140, image: chickenWings, category: 'chicken', description: 'Crispy chicken wings, perfect for snacks' },
  { name: 'Chicken Drumsticks', price: 150, image: chickenDrumsticks, category: 'chicken', description: 'Tender drumsticks, ideal for roasting' },
  { name: 'Chicken Mince', price: 170, image: chickenMince, category: 'chicken', description: 'Fresh minced chicken for kebabs and patties' },
  { name: 'Chicken Liver', price: 120, image: chickenLiver, category: 'chicken', description: 'Nutritious chicken liver, rich in iron' },
  { name: 'Fresh Fish - Rohu', price: 220, image: freshFishRohu, category: 'fish', description: 'Fresh water fish, perfect for traditional dishes' },
  { name: 'Pomfret Fish', price: 280, image: pomfretFish, category: 'fish', description: 'Premium sea fish, excellent taste' },
  { name: 'Salmon Fillet', price: 450, image: salmonFillet, category: 'fish', description: 'Imported salmon, rich in omega-3' },
  { name: 'Tuna Steak', price: 380, image: tunaSteak, category: 'fish', description: 'Fresh tuna steak, perfect for grilling' },
  { name: 'Catla Fish', price: 200, image: catlaFish, category: 'fish', description: 'Fresh water fish, great for curries' },
  { name: 'Mackerel Fish', price: 180, image: mackerelFish, category: 'fish', description: 'Oily fish rich in omega-3 fatty acids' },
  { name: 'Mutton Curry Cut', price: 380, image: muttonCurryCut, category: 'mutton', description: 'Tender mutton pieces, ideal for curries' },
  { name: 'Mutton Chops', price: 420, image: muttonChops, category: 'mutton', description: 'Premium mutton chops, perfect for grilling' },
  { name: 'Mutton Biryani Cut', price: 360, image: muttonBiryaniCut, category: 'mutton', description: 'Special cut for biryani preparation' },
  { name: 'Mutton Keema', price: 340, image: muttonKeema, category: 'mutton', description: 'Minced mutton for kebabs and curries' },
  { name: 'Mutton Ribs', price: 400, image: muttonRibs, category: 'mutton', description: 'Tender mutton ribs, great for slow cooking' },
  { name: 'Goat Meat', price: 350, image: goatMeat, category: 'goat', description: 'Fresh goat meat, lean and healthy' },
  { name: 'Goat Curry Cut', price: 330, image: goatCurryCut, category: 'goat', description: 'Goat meat pieces, perfect for traditional dishes' },
  { name: 'Duck Meat', price: 280, image: duckMeat, category: 'duck', description: 'Fresh duck meat, rich and flavorful' },
  { name: 'Quail Meat', price: 200, image: quailMeat, category: 'quail', description: 'Tender quail meat, delicacy for special occasions' },
];

async function uploadImageAndAddProduct(product) {
  // Fetch the image as a blob
  const response = await fetch(product.image);
  const blob = await response.blob();

  // Upload to Firebase Storage
  const storageRef = ref(storage, `products/${product.name.replace(/\s+/g, '_')}.png`);
  await uploadBytes(storageRef, blob);
  const imageUrl = await getDownloadURL(storageRef);

  // Add to Firestore
  await addDoc(collection(db, 'products'), {
    name: product.name,
    category: product.category,
    price: product.price,
    description: product.description,
    imageUrl,
  });
}

async function seedAll() {
  for (const product of products) {
    await uploadImageAndAddProduct(product);
    console.log(`Added: ${product.name}`);
  }
  console.log('All products seeded!');
}

seedAll(); 