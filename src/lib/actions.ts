
"use server";

import { revalidatePath } from "next/cache";
import type { Chumash, Insight, Parsha } from "./types";
import { HDate, Sedra } from 'hebcal';
import { initializeAdminApp } from "@/firebase/server";
import { doc, getDoc, collection, getDocs, orderBy, query as adminQuery } from "firebase-admin/firestore";

async function isFirestoreEmpty(collectionName: string) {
    const { firestore } = await initializeAdminApp();
    const collectionRef = collection(firestore, collectionName);
    const snapshot = await getDocs(collectionRef);
    return snapshot.empty;
}

export async function getParshiot(): Promise<Parsha[]> {
  try {
    const { firestore } = await initializeAdminApp();
    
    // This check might fail in dev, but it's a good first step
    if (await isFirestoreEmpty('parshiot')) {
        await seedParshiotAndChumashim();
    }

    const parshiotRef = collection(firestore, 'parshiot');
    const snapshot = await getDocs(parshiotRef);
    if (snapshot.empty) {
        // If still empty after trying to seed, something is wrong with access.
        // Fallback to static data for now.
        console.log("Firestore is empty or inaccessible, falling back to static data.");
        const staticData = getStaticParshiotData();
        return staticData.parshiot;
    }
    
    const parshiot: Parsha[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Parsha));
    
    const chumashim = await getChumashim();
    const chumashOrderMap = new Map(chumashim.map(c => [c.id, c.order]));

    parshiot.sort((a, b) => {
      const orderA = chumashOrderMap.get(a.chumashId) ?? 99;
      const orderB = chumashOrderMap.get(b.chumashId) ?? 99;
      // This is a simplified sort, a more robust one would go by book and then internal order
      return orderA - orderB;
    });

    return parshiot;

  } catch (e) {
    console.error("Error in getParshiot, falling back to static data:", e);
    // If there's any error, fall back to the static list.
    const staticData = getStaticParshiotData();
    return staticData.parshiot;
  }
}


export async function getChumashim(): Promise<Chumash[]> {
    try {
        const { firestore } = await initializeAdminApp();
        const chumashimRef = collection(firestore, 'chumashim');
        const q = adminQuery(chumashimRef, orderBy('order'));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
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
  
  // Sort chumashim by order
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
          // Fallback to static data if not found in DB
          const staticParshiot = getStaticParshiotData().parshiot;
          return staticParshiot.find(p => p.id === slug) || null;
      }
      return { id: docSnap.id, ...docSnap.data() } as Parsha;
  } catch(e) {
     console.error(`Error getting parsha ${slug} from DB, falling back to static data`, e);
     const staticParshiot = getStaticParshiotData().parshiot;
     return staticParshiot.find(p => p.id === slug) || null;
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

function getStaticParshiotData() {
    const chumashim: Chumash[] = [
        { id: 'genesis', name: 'בראשית', order: 1 },
        { id: 'exodus', name: 'שמות', order: 2 },
        { id: 'leviticus', name: 'ויקרא', order: 3 },
        { id: 'numbers', name: 'במדבר', order: 4 },
        { id: 'deuteronomy', name: 'דברים', order: 5 },
    ];

    const parshiot: Parsha[] = [
      { id: 'bereshit', name: 'בראשית', chumashId: 'genesis' },
      { id: 'noach', name: 'נח', chumashId: 'genesis' },
      { id: 'lech-lecha', name: 'לך-לך', chumashId: 'genesis' },
      { id: 'vayeira', name: 'וירא', chumashId: 'genesis' },
      { id: 'chayei-sarah', name: 'חיי שרה', chumashId: 'genesis' },
      { id: 'toldot', name: 'תולדות', chumashId: 'genesis' },
      { id: 'vayetzei', name: 'ויצא', chumashId: 'genesis' },
      { id: 'vayishlach', name: 'וישלח', chumashId: 'genesis' },
      { id: 'vayeshev', name: 'וישב', chumashId: 'genesis' },
      { id: 'miketz', name: 'מקץ', chumashId: 'genesis' },
      { id: 'vayigash', name: 'ויגש', chumashId: 'genesis' },
      { id: 'vayechi', name: 'ויחי', chumashId: 'genesis' },
      { id: 'shemot', name: 'שמות', chumashId: 'exodus' },
      { id: 'vaera', name: 'וארא', chumashId: 'exodus' },
      { id: 'bo', name: 'בא', chumashId: 'exodus' },
      { id: 'beshalach', name: 'בשלח', chumashId: 'exodus' },
      { id: 'yitro', name: 'יתרו', chumashId: 'exodus' },
      { id: 'mishpatim', name: 'משפטים', chumashId: 'exodus' },
      { id: 'terumah', name: 'תרומה', chumashId: 'exodus' },
      { id: 'tetzaveh', name: 'תצוה', chumashId: 'exodus' },
      { id: 'ki-tisa', name: 'כי תשא', chumashId: 'exodus' },
      { id: 'vayakhel', name: 'ויקהל', chumashId: 'exodus' },
      { id: 'pekudei', name: 'פקודי', chumashId: 'exodus' },
      { id: 'vayikra', name: 'ויקרא', chumashId: 'leviticus' },
      { id: 'tzav', name: 'צו', chumashId: 'leviticus' },
      { id: 'shmini', name: 'שמיני', chumashId: 'leviticus' },
      { id: 'tazria', name: 'תזריע', chumashId: 'leviticus' },
      { id: 'metzora', name: 'מצורע', chumashId: 'leviticus' },
      { id: 'acharei-mot', name: 'אחרי מות', chumashId: 'leviticus' },
      { id: 'kedoshim', name: 'קדושים', chumashId: 'leviticus' },
      { id: 'emor', name: 'אמור', chumashId: 'leviticus' },
      { id: 'behar', name: 'בהר', chumashId: 'leviticus' },
      { id: 'bechukotai', name: 'בחוקותי', chumashId: 'leviticus' },
      { id: 'bamidbar', name: 'במדבר', chumashId: 'numbers' },
      { id: 'naso', name: 'נשא', chumashId: 'numbers' },
      { id: 'behaalotcha', name: 'בהעלותך', chumashId: 'numbers' },
      { id: 'shlach', name: 'שלח', chumashId: 'numbers' },
      { id: 'korach', name: 'קרח', chumashId: 'numbers' },
      { id: 'chukat', name: 'חקת', chumashId: 'numbers' },
      { id: 'balak', name: 'בלק', chumashId: 'numbers' },
      { id: 'pinchas', name: 'פינחס', chumashId: 'numbers' },
      { id: 'matot', name: 'מטות', chumashId: 'numbers' },
      { id: 'masei', name: 'מסעי', chumashId: 'numbers' },
      { id: 'devarim', name: 'דברים', chumashId: 'deuteronomy' },
      { id: 'vaetchanan', name: 'ואתחנן', chumashId: 'deuteronomy' },
      { id: 'eikev', name: 'עקב', chumashId: 'deuteronomy' },
      { id: 'reeh', name: 'ראה', chumashId: 'deuteronomy' },
      { id: 'shoftim', name: 'שופטים', chumashId: 'deuteronomy' },
      { id: 'ki-tetzei', name: 'כי תצא', chumashId: 'deuteronomy' },
      { id: 'ki-tavo', name: 'כי תבוא', chumashId: 'deuteronomy' },
      { id: 'nitzavim', name: 'ניצבים', chumashId: 'deuteronomy' },
      { id: 'vayelech', name: 'וילך', chumashId: 'deuteronomy' },
      { id: 'haazinu', name: 'האזינו', chumashId: 'deuteronomy' },
      { id: 'vezot-haberakhah', name: 'וזאת הברכה', chumashId: 'deuteronomy' },
    ];
    return { chumashim, parshiot };
}

async function seedParshiotAndChumashim(): Promise<void> {
    console.log("Attempting to seed Chumashim and Parshiot...");
    const { firestore } = await initializeAdminApp();
    const batch = firestore.batch();

    const { chumashim, parshiot } = getStaticParshiotData();
    
    chumashim.forEach(chumash => {
        const chumashRef = doc(firestore, 'chumashim', chumash.id);
        batch.set(chumashRef, chumash);
    });

    parshiot.forEach(parsha => {
        const parshaRef = doc(firestore, 'parshiot', parsha.id);
        batch.set(parshaRef, parsha);
    });

    await batch.commit();
    console.log('Successfully seeded Chumashim and Parshiot.');
}

    