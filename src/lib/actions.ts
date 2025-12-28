"use server";

import { revalidatePath } from "next/cache";
import { db } from "./firebase";
import { parshiot } from "./parshiot";
import type { Insight, Parsha } from "./types";
import { collection, getDocs, addDoc, doc, getDoc, updateDoc, deleteDoc, query, where, orderBy, limit, Timestamp } from "firebase/firestore";

// Simulate network delay
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export async function getParshiot() {
  await delay(500);
  return parshiot;
}

export async function getParshiotWithChumash() {
  await delay(500);

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
  await delay(200);
  return parshiot.find((p) => p.slug === slug) || null;
}

export async function getInsightsForParsha(parshaSlug: string) {
    const insightsCol = collection(db, "insights");
    const q = query(insightsCol, where("parshaSlug", "==", parshaSlug), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const insights = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
        } as Insight;
    });
    return insights;
}

export async function getLatestInsightForParsha(parshaSlug: string) {
    const insightsCol = collection(db, "insights");
    const q = query(insightsCol, where("parshaSlug", "==", parshaSlug), orderBy("createdAt", "desc"), limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
    } as Insight;
}


export async function getInsightById(id: string) {
    const docRef = doc(db, "insights", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
        return null;
    }

    const data = docSnap.data();
    return {
        id: docSnap.id,
        ...data,
        createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
    } as Insight;
}

export async function getCurrentParsha() {
    // This is a simplified mock. A real implementation would use a library like hebcal
    // to determine the current parsha based on the Hebrew date. For now, it's Vayechi.
    await delay(100);
    const vayechi = parshiot.find(p => p.slug === 'vayechi');
    return vayechi || parshiot[11]; // Fallback to index if slug is wrong
}


export async function addInsight(data: Omit<Insight, "id" | "createdAt">) {
  try {
    const insightsCol = collection(db, "insights");
    await addDoc(insightsCol, {
        ...data,
        createdAt: new Date(),
    });
    revalidatePath("/");
    revalidatePath(`/parshiot/${data.parshaSlug}`);
    return { success: true, message: "דבר התורה נוסף בהצלחה!" };
  } catch (e) {
    console.error("Error adding document: ", e);
    return { success: false, message: "שגיאה בהוספת דבר התורה." };
  }
}

export async function editInsight(id: string, data: Partial<Omit<Insight, "id" | "createdAt" | "parshaSlug">>) {
    try {
        const docRef = doc(db, "insights", id);
        await updateDoc(docRef, data);
        
        const updatedDoc = await getDoc(docRef);
        const parshaSlug = updatedDoc.data()?.parshaSlug;

        revalidatePath("/");
        if (parshaSlug) {
            revalidatePath(`/parshiot/${parshaSlug}`);
        }
        return { success: true, message: "דבר התורה עודכן בהצלחה!" };
    } catch (e) {
        console.error("Error updating document: ", e);
        return { success: false, message: "שגיאה בעדכון דבר התורה." };
    }
}

export async function deleteInsight(id: string) {
    try {
        const docRef = doc(db, "insights", id);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
             return { success: false, message: "דבר התורה לא נמצא." };
        }

        const parshaSlug = docSnap.data().parshaSlug;
        await deleteDoc(docRef);

        revalidatePath("/");
        if (parshaSlug) {
            revalidatePath(`/parshiot/${parshaSlug}`);
        }
        return { success: true, message: "דבר התורה נמחק בהצלחה!" };
    } catch(e) {
        console.error("Error deleting document: ", e);
        return { success: false, message: "שגיאה במחיקת דבר התורה." };
    }
}
