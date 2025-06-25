const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAfEPMI_VMM_fIQdF9Q4Y2xVljycIj46R0",
  authDomain: "tazza-b7bdb.firebaseapp.com",
  projectId: "tazza-b7bdb",
  storageBucket: "tazza-b7bdb.appspot.com",
  messagingSenderId: "916270635130",
  appId: "1:916270635130:web:f5bbf7b3ad4cdf0b5043c3",
  measurementId: "G-YNZJMSDV9D"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const products = [
  { name: 'Mutton Chops', price: 420, image: 'muttonChops.jpg', category: 'mutton', description: 'Premium mutton chops, perfect for grilling' }
];

function getMimeType(filename) {
  if (filename.endsWith('.png')) return 'image/png';
  if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) return 'image/jpeg';
  if (filename.endsWith('.svg')) return 'image/svg+xml';
  return 'application/octet-stream';
}

async function addProduct(product) {
  const imagePath = path.join(__dirname, 'src', 'assets', product.image);
  let dataUrl = '';
  try {
    const imageBuffer = fs.readFileSync(imagePath);
    const base64 = imageBuffer.toString('base64');
    const mimeType = getMimeType(product.image);
    dataUrl = `data:${mimeType};base64,${base64}`;
  } catch (err) {
    console.error(`Image file not found for product: ${product.name} at path: ${imagePath}`);
    return;
  }

  try {
    await addDoc(collection(db, 'products'), {
      ...product,
      image: dataUrl
    });
    console.log(`Added: ${product.name}`);
  } catch (err) {
    console.error(`Error adding product: ${product.name}`);
    console.error(err);
  }
}

async function seedAll() {
  for (const product of products) {
    await addProduct(product);
  }
  console.log('All products attempted!');
}

seedAll(); 