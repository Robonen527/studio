"use server";
import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// IMPORTANT: You need to download your service account key file from the
// Firebase console and place it in your project.
// Update the path to your service account key file.
// DO NOT check this file into source control.
let serviceAccount: any;
try {
  serviceAccount = require('../../serviceAccountKey.json');
} catch (e) {
  console.log('Could not find service account key. Firestore server features will not work.');
}

const app = getApps().length
  ? getApp()
  : initializeApp({
      credential: cert(serviceAccount),
    });

const firestore = getFirestore(app);

export function getFirestoreInstance() {
  return firestore;
}
