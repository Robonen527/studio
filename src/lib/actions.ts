
"use server";

import { revalidatePath } from "next/cache";
import type { Chumash, Insight, Parsha } from "./types";
import { HDate, Sedra } from 'hebcal';
import { initializeAdminApp } from "@/firebase/server";
import { doc, getDoc, collection, getDocs, orderBy, query as adminQuery } from "firebase-admin/firestore";

async function isFirestoreEmpty() {
    const { firestore } = await initializeAdminApp();
    const parshiotRef = collection(firestore, 'parshiot');
    const snapshot = await getDocs(parshiotRef);
    return snapshot.empty;
}

export async function getParshiot(): Promise<Parsha[]> {
  try {
    // Check if seeding is needed first
    const empty = await isFirestoreEmpty();
    if (empty) {
        console.log('No parshiot found in Firestore. Seeding now.');
        await seedParshiotAndChumashim();
    }
  } catch(e) {
    console.error("Error checking or seeding Firestore:", e);
    // If seeding fails, we probably can't continue.
    // Return empty array to avoid further errors down the line.
    return [];
  }
    
  try {
    const { firestore } = await initializeAdminApp();
    const parshiotRef = collection(firestore, 'parshiot');
    const snapshot = await getDocs(parshiotRef);
    const parshiot: Parsha[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Parsha));
    
    const chumashim = await getChumashim();
    const chumashOrderMap = new Map(chumashim.map(c => [c.id, c.order]));

    parshiot.sort((a, b) => {
      const orderA = chumashOrderMap.get(a.chumashId) ?? 99;
      const orderB = chumashOrderMap.get(b.chumashId) ?? 99;
      return orderA - orderB;
    });

    return parshiot;

  } catch (e) {
    console.error("Error in getParshiot after attempting to seed:", e);
    return []; // Return empty array on failure
  }
}

export async function getChumashim(): Promise<Chumash[]> {
    const { firestore } = await initializeAdminApp();
    const chumashimRef = collection(firestore, 'chumashim');
    const q = adminQuery(chumashimRef, orderBy('order'));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chumash));
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

  return chumashim.map(chumash => ({
    ...chumash,
    parshiot: parshiotByChumashId[chumash.id] || []
  }));
}

export async function getParshaBySlug(slug: string): Promise<Parsha | null> {
  const { firestore } = await initializeAdminApp();
  const docRef = doc(firestore, 'parshiot', slug);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    return null;
  }
  return { id: docSnap.id, ...docSnap.data() } as Parsha;
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

async function seedParshiotAndChumashim(): Promise<Parsha[]> {
    const { firestore } = await initializeAdminApp();
    const batch = firestore.batch();

    const chumashimData: Omit<Chumash, 'id'>[] = [
        { name: 'בראשית', order: 1 },
        { name: 'שמות', order: 2 },
        { name: 'ויקרא', order: 3 },
        { name: 'במדבר', order: 4 },
        { name: 'דברים', order: 5 },
    ];

    const chumashIds = ['genesis', 'exodus', 'leviticus', 'numbers', 'deuteronomy'];

    chumashimData.forEach((chumash, index) => {
        const chumashId = chumashIds[index];
        const chumashRef = doc(firestore, 'chumashim', chumashId);
        batch.set(chumashRef, chumash);
    });

    const parshiotData: { slug: string; name: string, chumashIndex: number }[] = [
      { slug: 'bereshit', name: 'בראשית', chumashIndex: 0 },
      { slug: 'noach', name: 'נח', chumashIndex: 0 },
      { slug: 'lech-lecha', name: 'לך-לך', chumashIndex: 0 },
      { slug: 'vayeira', name: 'וירא', chumashIndex: 0 },
      { slug: 'chayei-sarah', name: 'חיי שרה', chumashIndex: 0 },
      { slug: 'toldot', name: 'תולדות', chumashIndex: 0 },
      { slug: 'vayetzei', name: 'ויצא', chumashIndex: 0 },
      { slug: 'vayishlach', name: 'וישלח', chumashIndex: 0 },
      { slug: 'vayeshev', name: 'וישב', chumashIndex: 0 },
      { slug: 'miketz', name: 'מקץ', chumashIndex: 0 },
      { slug: 'vayigash', name: 'ויגש', chumashIndex: 0 },
      { slug: 'vayechi', name: 'ויחי', chumashIndex: 0 },
      { slug: 'shemot', name: 'שמות', chumashIndex: 1 },
      { slug: 'vaera', name: 'וארא', chumashIndex: 1 },
      { slug: 'bo', name: 'בא', chumashIndex: 1 },
      { slug: 'beshalach', name: 'בשלח', chumashIndex: 1 },
      { slug: 'yitro', name: 'יתרו', chumashIndex: 1 },
      { slug: 'mishpatim', name: 'משפטים', chumashIndex: 1 },
      { slug: 'terumah', name: 'תרומה', chumashIndex: 1 },
      { slug: 'tetzaveh', name: 'תצוה', chumashIndex: 1 },
      { slug: 'ki-tisa', name: 'כי תשא', chumashIndex: 1 },
      { slug: 'vayakhel', name: 'ויקהל', chumashIndex: 1 },
      { slug: 'pekudei', name: 'פקודי', chumashIndex: 1 },
      { slug: 'vayikra', name: 'ויקרא', chumashIndex: 2 },
      { slug: 'tzav', name: 'צו', chumashIndex: 2 },
      { slug: 'shmini', name: 'שמיני', chumashIndex: 2 },
      { slug: 'tazria', name: 'תזריע', chumashIndex: 2 },
      { slug: 'metzora', name: 'מצורע', chumashIndex: 2 },
      { slug: 'acharei-mot', name: 'אחרי מות', chumashIndex: 2 },
      { slug: 'kedoshim', name: 'קדושים', chumashIndex: 2 },
      { slug: 'emor', name: 'אמור', chumashIndex: 2 },
      { slug: 'behar', name: 'בהר', chumashIndex: 2 },
      { slug: 'bechukotai', name: 'בחוקותי', chumashIndex: 2 },
      { slug: 'bamidbar', name: 'במדבר', chumashIndex: 3 },
      { slug: 'naso', name: 'נשא', chumashIndex: 3 },
      { slug: 'behaalotcha', name: 'בהעלותך', chumashIndex: 3 },
      { slug: 'shlach', name: 'שלח', chumashIndex: 3 },
      { slug: 'korach', name: 'קרח', chumashIndex: 3 },
      { slug: 'chukat', name: 'חקת', chumashIndex: 3 },
      { slug: 'balak', name: 'בלק', chumashIndex: 3 },
      { slug: 'pinchas', name: 'פינחס', chumashIndex: 3 },
      { slug: 'matot', name: 'מטות', chumashIndex: 3 },
      { slug: 'masei', name: 'מסעי', chumashIndex: 3 },
      { slug: 'devarim', name: 'דברים', chumashIndex: 4 },
      { slug: 'vaetchanan', name: 'ואתחנן', chumashIndex: 4 },
      { slug: 'eikev', name: 'עקב', chumashIndex: 4 },
      { slug: 'reeh', name: 'ראה', chumashIndex: 4 },
      { slug: 'shoftim', name: 'שופטים', chumashIndex: 4 },
      { slug: 'ki-tetzei', name: 'כי תצא', chumashIndex: 4 },
      { slug: 'ki-tavo', name: 'כי תבוא', chumashIndex: 4 },
      { slug: 'nitzavim', name: 'ניצבים', chumashIndex: 4 },
      { slug: 'vayelech', name: 'וילך', chumashIndex: 4 },
      { slug: 'haazinu', name: 'האזינו', chumashIndex: 4 },
      { slug: 'vezot-haberakhah', name: 'וזאת הברכה', chumashIndex: 4 },
    ];
    
    const finalParshiot: Parsha[] = parshiotData.map(p => {
        const parshaRef = doc(firestore, 'parshiot', p.slug);
        const parshaDoc = { name: p.name, chumashId: chumashIds[p.chumashIndex] };
        batch.set(parshaRef, parshaDoc);
        return { id: p.slug, ...parshaDoc };
    });

    await batch.commit();
    console.log('Successfully seeded Chumashim and Parshiot.');
    // Re-fetch after seeding to ensure sorting
    const { firestore: fs2 } = await initializeAdminApp();
    const parshiotRef = collection(fs2, 'parshiot');
    const snapshot = await getDocs(parshiotRef);
    return snapshot.docs.map(d => ({id: d.id, ...d.data()}) as Parsha);
}

    