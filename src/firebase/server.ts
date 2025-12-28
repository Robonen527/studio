
'use server';

import { getApp, getApps, initializeApp, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { firebaseConfig } from './config';

// IMPORTANT: Download your service account key JSON file from the Firebase console
// and place it in the root of your project directory.
// DO NOT commit this file to version control.
let serviceAccount: any;
try {
  // This is a dynamic import, which is why we use require.
  // It's not a standard ES module import.
  // The path is relative to the root of the project where `next` is run.
  serviceAccount = require('../serviceAccountKey.json');
} catch (e) {
  console.log('Could not find service account key. Server-side Firebase features may not work.');
  // We can proceed without it for client-side only apps.
}

interface AdminFirebaseServices {
  app: App;
  firestore: Firestore;
  auth: Auth;
}

export async function initializeAdminApp(): Promise<AdminFirebaseServices> {
  const appName = 'firebase-admin-app';
  // Check if the app is already initialized
  const existingApp = getApps().find(app => app.name === appName);

  if (existingApp) {
    return {
      app: existingApp,
      firestore: getFirestore(existingApp),
      auth: getAuth(existingApp),
    };
  }

  // Initialize the admin app if it doesn't exist
  const adminApp = initializeApp({
    credential: cert(serviceAccount),
    // The databaseURL is required for the Realtime Database, but it's good practice
    // to include it for Firestore as well, especially in complex setups.
    databaseURL: `https://${firebaseConfig.projectId}.firebaseio.com`
  }, appName);

  return {
    app: adminApp,
    firestore: getFirestore(adminApp),
    auth: getAuth(adminApp),
  };
}
