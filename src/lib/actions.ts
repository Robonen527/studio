
"use server";

import { revalidatePath } from "next/cache";
import type { Chumash, Insight, Parsha } from "./types";
import { HDate, Sedra } from 'hebcal';
import { initializeAdminApp } from "@/firebase/server";
import { doc, getDoc, collection, getDocs, orderBy, query as adminQuery } from "firebase-admin/firestore";
import { getStaticParshiotData } from "./static-data";

export async function getParshiot(): Promise<Parsha[]> {
  try {
    const { firestore } = await initializeAdminApp();
    const parshiotRef = collection(firestore, 'parshiot');
    const snapshot = await getDocs(parshiotRef);

    if (snapshot.empty) {
        console.log("Parshiot collection is empty. Returning static data. Admin can seed from the admin page.");
        return getStaticParshiotData().parshiot;
    }
    
    const parshiot: Parsha[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Parsha));
    
    const chumashim = await getChumashim();
    const chumashOrderMap = new Map(chumashim.map(c => [c.id, c.order]));

    // Static sort data from getStaticParshiotData to ensure correct order
    const staticParshiot = getStaticParshiotData().parshiot;
    const staticOrderMap = new Map(staticParshiot.map((p, i) => [p.id, i]));

    parshiot.sort((a, b) => {
        const orderA = staticOrderMap.get(a.id) ?? 999;
        const orderB = staticOrderMap.get(b.id) ?? 999;
        return orderA - orderB;
    });

    return parshiot;

  } catch (e) {
    console.error("Error in getParshiot, falling back to static data:", e);
    return getStaticParshiotData().parshiot;
  }
}


export async function getChumashim(): Promise<Chumash[]> {
    try {
        const { firestore } = await initializeAdminApp();
        const chumashimRef = collection(firestore, 'chumashim');
        const q = adminQuery(chumashimRef, orderBy('order'));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            console.warn("Chumashim collection is empty. Returning static data. Admin can seed from the admin page.");
            return getStaticParshiotData().chumashim;
        }
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chumash));
    } catch(e) {
        console.error("Error in getChumashim, falling back to static data:", e);
        return getStaticParshiotData().chumashim;
    }
}

export async function getParshiotWithChumash() {
  const parshiot = await getParshiot();
  const chumashim = await getChumashim();

  const parshiotByChumashId = parshiot.reduce((acc, parsha) => {
    if (!acc[parsha.chumashId]) {
      acc[parsha.chumashId] = [];
    }
    acc[parsha.chumashId].push(parsha);
    return acc;
  }, {} as Record<string, Parsha[]>);
  
  const sortedChumashim = [...chumashim].sort((a, b) => a.order - b.order);

  return sortedChumashim.map(chumash => ({
    ...chumash,
    parshiot: parshiotByChumashId[chumash.id] || []
  }));
}

export async function getParshaBySlug(slug: string): Promise<Parsha | null> {
  try {
      const { firestore } = await initializeAdminApp();
      const docRef = doc(firestore, 'parshiot', slug);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
          console.warn(`Parsha with slug ${slug} not found in DB, falling back to static.`);
          return getStaticParshiotData().parshiot.find(p => p.id === slug) || null;
      }
      return { id: docSnap.id, ...docSnap.data() } as Parsha;
  } catch(e) {
     console.error(`Error getting parsha ${slug} from DB, falling back to static data`, e);
     return getStaticParshiotData().parshiot.find(p => p.id === slug) || null;
  }
}


export async function getCurrentParsha(): Promise<Parsha | null> {
    const parshiot = await getParshiot();
    if (!parshiot || parshiot.length === 0) return null;
    
    try {
        const { firestore } = await initializeAdminApp();
        const settingsRef = doc(firestore, 'settings', 'currentParsha');
        const settingsDoc = await getDoc(settingsRef);

        if (settingsDoc.exists()) {
            const slug = settingsDoc.data().slug;
            const manualParsha = await getParshaBySlug(slug);
            if (manualParsha) {
                return manualParsha;
            }
        }
    } catch (e) {
        console.error("Could not fetch manual parsha override from server:", e);
    }
    
    try {
        const today = new HDate();
        const sedra = new Sedra(today.getFullYear(), false);
        const parshaName = sedra.get(today);

        if (parshaName) {
            const parshaKey = Array.isArray(parshaName) ? parshaName[0] : parshaName;
            const parshaInfo = parshiot.find(p => p.name === parshaKey);
            if (parshaInfo) {
                return parshaInfo;
            }
        }
    } catch (e) {
        console.error("Could not determine current parsha from Hebcal:", e);
    }
    
    // Fallback to Bereshit or first parsha
    return parshiot.find(p => p.id === 'bereshit') || parshiot[0];
}


export async function revalidateInsightPaths(parshaSlug?: string) {
  revalidatePath("/");
  if(parshaSlug) {
    revalidatePath(`/parshiot/${parshaSlug}`);
  }
  revalidatePath("/parshiot");
  revalidatePath("/admin/parshiot");
}

export async function seedParshiotAndChumashim(): Promise<void> {
  try {
    // This server action will just revalidate paths after client-side seeding.
    // The actual seeding logic is now initiated from the client.
    console.log('Revalidating paths after client-side seeding request.');
    await revalidateInsightPaths();
  } catch (e) {
    console.error("Server-side revalidation failed:", e);
    // We throw here because if revalidation fails, the client won't see the new data.
    throw new Error('Could not revalidate paths after seeding.');
  }
}
