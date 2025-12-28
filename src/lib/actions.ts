"use server";

import { revalidatePath } from "next/cache";
import { parshiot } from "./parshiot";
import type { Insight, Parsha } from "./types";
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, orderBy, limit } from "firebase/firestore";
import { getFirestoreInstance } from "@/firebase/server";
import { HDate, Sedra } from 'hebcal';

const firestore = getFirestoreInstance();

export async function getParshiot() {
  return parshiot;
}

export async function getParshiotWithChumash() {
  const chumashim: { name: string; parshiot: Parsha[] }[] = [
    { name: 'בראשית', parshiot: parshiot.slice(0, 12) },
    { name: 'שמות', parshiot: parshiot.slice(12, 23) },
    { name: 'ויקרא', parshiot: parshiot.slice(23, 33) },
    { name: 'במדבר', parshiot: parshiot.slice(33, 43) },
    { name: 'דברים', parshiot: parshiot.slice(43) },
  ];

  return chumashim;
}

export async function getParshaBySlug(slug: string) {
  return parshiot.find((p) => p.slug === slug) || null;
}

export async function getInsightsForParsha(parshaSlug: string): Promise<Insight[]> {
  try {
    const insightsCollection = collection(firestore, `parshiot/${parshaSlug}/torahInsights`);
    const q = query(insightsCollection, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, parshaSlug, ...doc.data() } as Insight));
  } catch (e) {
    console.error(`Error fetching insights for ${parshaSlug}: `, e);
    return [];
  }
}

export async function getLatestInsightForParsha(parshaSlug: string): Promise<Insight | null> {
    try {
        const insightsCollection = collection(firestore, `parshiot/${parshaSlug}/torahInsights`);
        const q = query(insightsCollection, orderBy("createdAt", "desc"), limit(1));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return null;
        }

        const doc = snapshot.docs[0];
        return { id: doc.id, parshaSlug, ...doc.data() } as Insight;
    } catch (e) {
        console.error(`Error fetching latest insight for ${parshaSlug}: `, e);
        return null;
    }
}

export async function getInsightById(parshaSlug: string, id: string): Promise<Insight | null> {
    try {
        const docRef = doc(firestore, `parshiot/${parshaSlug}/torahInsights`, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, parshaSlug, ...docSnap.data() } as Insight;
        }
        return null;
    } catch (e) {
        console.error(`Error fetching insight ${id} for ${parshaSlug}: `, e);
        return null;
    }
}

export async function getCurrentParsha(): Promise<Parsha> {
    try {
        const today = new HDate();
        const sedra = new Sedra(today.getFullYear(), false);
        const parshaName = sedra.get(today);

        if (parshaName) {
             // Hebcal returns an array for combined parshiot
            const parshaKey = Array.isArray(parshaName) ? parshaName[0] : parshaName;
            const parshaInfo = parshiot.find(p => p.name === parshaKey);
            if (parshaInfo) {
                return parshaInfo;
            }
        }
    } catch (e) {
        console.error("Could not determine current parsha from Hebcal:", e);
    }
    
    // Fallback to a default if API fails or parsha not found
    const vayechi = parshiot.find(p => p.slug === 'vayechi');
    return vayechi || parshiot[11];
}

export async function addInsight(data: Omit<Insight, "id" | "createdAt">) {
  try {
    const insightsCollection = collection(firestore, `parshiot/${data.parshaSlug}/torahInsights`);
    await addDoc(insightsCollection, {
        title: data.title,
        author: data.author,
        content: data.content,
        createdAt: new Date().toISOString(),
    });
    
    revalidatePath("/");
    revalidatePath(`/parshiot/${data.parshaSlug}`);
    return { success: true, message: "דבר התורה נוסף בהצלחה!" };
  } catch (e) {
    console.error("Error adding insight: ", e);
    const errorMessage = e instanceof Error ? e.message : "שגיאה לא ידועה";
    return { success: false, message: `שגיאה בהוספת דבר התורה: ${errorMessage}` };
  }
}

export async function editInsight(parshaSlug: string, id: string, data: Partial<Omit<Insight, "id" | "createdAt" | "parshaSlug">>) {
    try {
        const docRef = doc(firestore, `parshiot/${parshaSlug}/torahInsights`, id);
        await updateDoc(docRef, data);

        revalidatePath("/");
        revalidatePath(`/parshiot/${parshaSlug}`);
        
        return { success: true, message: "דבר התורה עודכן בהצלחה!" };
    } catch (e) {
        console.error("Error updating insight: ", e);
        const errorMessage = e instanceof Error ? e.message : "שגיאה לא ידועה";
        return { success: false, message: `שגיאה בעדכון דבר התורה: ${errorMessage}` };
    }
}

export async function deleteInsight(parshaSlug: string, id: string) {
    try {
        const docRef = doc(firestore, `parshiot/${parshaSlug}/torahInsights`, id);
        await deleteDoc(docRef);

        revalidatePath("/");
        revalidatePath(`/parshiot/${parshaSlug}`);

        return { success: true, message: "דבר התורה נמחק בהצלחה!" };
    } catch(e) {
        console.error("Error deleting insight: ", e);
        const errorMessage = e instanceof Error ? e.message : "שגיאה לא ידועה";
        return { success: false, message: `שגיאה במחיקת דבר התורה: ${errorMessage}` };
    }
}
