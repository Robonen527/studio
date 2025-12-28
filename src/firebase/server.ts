
'use server';

import { getApp, getApps, initializeApp, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { firebaseConfig } from './config';
import path from 'path';
import fs from 'fs';

// IMPORTANT: Download your service account key JSON file from the Firebase console
// and place it in the root of your project directory.
// DO NOT commit this file to version control.
let serviceAccount: any;
try {
  // Construct an absolute path to the service account key file.
  // process.cwd() gives the root directory where the Next.js process was started.
  const serviceAccountPath = path.join(process.cwd(), 'src', 'serviceAccountKey.json');
  const serviceAccountFile = fs.readFileSync(serviceAccountPath, 'utf8');
  serviceAccount = JSON.parse(serviceAccountFile);
} catch (e) {
  console.log('Could not find or parse service account key. Server-side Firebase features may not work.', e);
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
  
  if (!serviceAccount) {
    throw new Error("Service account key is not available. Cannot initialize Firebase Admin SDK.");
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
