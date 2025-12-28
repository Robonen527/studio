import { initializeApp, getApps, getApp, ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccount: ServiceAccount = JSON.parse(
  process.env.GOOGLE_APPLICATION_CREDENTIALS || "{}"
);

const app = !getApps().length
  ? initializeApp({
      credential: {
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key,
      },
    })
  : getApp();


const db = getFirestore(app);

export { db };
