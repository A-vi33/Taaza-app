#!/usr/bin/env node

/**
 * Firebase Functions Deployment Script
 * This script helps deploy Firebase functions and fix CORS issues
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Firebase Functions Deployment Script');
console.log('=====================================\n');

// Check if Firebase CLI is installed
try {
  execSync('firebase --version', { stdio: 'pipe' });
  console.log('✅ Firebase CLI is installed');
} catch (error) {
  console.log('❌ Firebase CLI is not installed');
  console.log('Please install it first: npm install -g firebase-tools');
  console.log('Then run: firebase login');
  process.exit(1);
}

// Check if user is logged in
try {
  execSync('firebase projects:list', { stdio: 'pipe' });
  console.log('✅ Firebase CLI is logged in');
} catch (error) {
  console.log('❌ Firebase CLI is not logged in');
  console.log('Please run: firebase login');
  process.exit(1);
}

// Deploy functions
console.log('\n📦 Deploying Firebase Functions...');
try {
  execSync('firebase deploy --only functions', { stdio: 'inherit' });
  console.log('✅ Functions deployed successfully');
} catch (error) {
  console.log('❌ Functions deployment failed');
  console.log('Error:', error.message);
}

// Deploy storage rules
console.log('\n📁 Deploying Storage Rules...');
try {
  execSync('firebase deploy --only storage', { stdio: 'inherit' });
  console.log('✅ Storage rules deployed successfully');
} catch (error) {
  console.log('❌ Storage rules deployment failed');
  console.log('Error:', error.message);
}

// Apply CORS configuration
console.log('\n🌐 Applying CORS Configuration...');
try {
  execSync('gsutil cors set cors.json gs://taaza-5c5cd.appspot.com', { stdio: 'inherit' });
  console.log('✅ CORS configuration applied successfully');
} catch (error) {
  console.log('❌ CORS configuration failed');
  console.log('Error:', error.message);
  console.log('You may need to install Google Cloud SDK: https://cloud.google.com/sdk/docs/install');
}

// Deploy Firestore indexes
console.log('\n📊 Deploying Firestore Indexes...');
try {
  execSync('firebase deploy --only firestore:indexes', { stdio: 'inherit' });
  console.log('✅ Firestore indexes deployed successfully');
} catch (error) {
  console.log('❌ Firestore indexes deployment failed');
  console.log('Error:', error.message);
}

console.log('\n🎉 Deployment completed!');
console.log('\n📋 Next Steps:');
console.log('1. Test the SMS function: https://us-central1-taaza-5c5cd.cloudfunctions.net/sendSMS');
console.log('2. Check if CORS errors are resolved');
console.log('3. Test order creation and bill generation');
console.log('\n💡 Note: The app has fallback mechanisms for SMS and PDF generation');
console.log('   - SMS: Will log to console if cloud function fails');
console.log('   - PDF: Uses blob URLs as fallback if Firebase Storage fails'); 