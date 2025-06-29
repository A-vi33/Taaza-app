// Firebase Storage CORS Setup Script
// This script helps you set up CORS for Firebase Storage

console.log(`
🔥 Firebase Storage CORS Setup Instructions 🔥

To fix the CORS error with PDF downloads, you need to configure Firebase Storage CORS.

STEP 1: Install Google Cloud SDK (if not already installed)
- Download from: https://cloud.google.com/sdk/docs/install
- Or use: npm install -g @google-cloud/storage

STEP 2: Login to Google Cloud
Run: gcloud auth login

STEP 3: Set your project
Run: gcloud config set project taaza-5c5cd

STEP 4: Apply CORS configuration
Run: gsutil cors set cors.json gs://taaza-5c5cd.appspot.com

STEP 5: Deploy Storage Rules
Run: firebase deploy --only storage

ALTERNATIVE SOLUTION (Already implemented):
The app now uses blob URLs as fallback when Firebase Storage fails.
This avoids CORS issues completely.

If you still want to use Firebase Storage:
1. Make sure you're logged into Firebase CLI
2. Run: firebase login
3. Then run the commands above

The current implementation will work without Firebase Storage CORS setup.
`);

// You can also run this directly with Node.js
if (require.main === module) {
  console.log('CORS setup instructions displayed above.');
}

const { Storage } = require('@google-cloud/storage');

// Initialize Firebase Storage
const storage = new Storage({
  projectId: 'taaza-5c5cd',
  keyFilename: './service-account-key.json' // You'll need to download this from Firebase Console
});

const bucketName = 'taaza-5c5cd.appspot.com';

async function setCorsConfiguration() {
  try {
    const [bucket] = await storage.bucket(bucketName).get();
    
    const corsConfiguration = [
      {
        origin: ['*'],
        method: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS'],
        maxAgeSeconds: 3600,
        responseHeader: [
          'Content-Type',
          'Access-Control-Allow-Origin',
          'Access-Control-Allow-Methods',
          'Access-Control-Allow-Headers',
          'Access-Control-Max-Age'
        ]
      }
    ];

    await bucket.setCorsConfiguration(corsConfiguration);
    console.log(`CORS configuration set for bucket: ${bucketName}`);
  } catch (error) {
    console.error('Error setting CORS configuration:', error);
  }
}

setCorsConfiguration(); 