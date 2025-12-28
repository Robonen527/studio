import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

if (!admin.apps.length) {
  try {
    const serviceAccountString = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!serviceAccountString) {
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS environment variable is not set.');
    }
    const serviceAccount = JSON.parse(serviceAccountString);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    // In a development environment without credentials, you might want to avoid throwing an error
    // and instead use a mock/dummy implementation or simply log the issue.
    // For now, we will let it fail loudly if credentials are not there or invalid.
  }
}

const db = getFirestore();

export { db };
