
"use server";

import { revalidatePath } from "next/cache";
import { parshiot } from "./parshiot";
import type { Parsha } from "./types";
import { HDate, Sedra } from 'hebcal';
import { initializeAdminApp } from "@/firebase/server";
import { doc, getDoc } from "firebase-admin/firestore";


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

export async function getCurrentParsha(): Promise<Parsha> {
    // This function will now primarily be for date-based calculation,
    // as the manual override is handled client-side on the homepage.
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
    
    // Fallback to Hebcal if no manual override is set or found
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
    
    // Fallback to a default if all else fails
    return parshiot.find(p => p.slug === 'bereshit') || parshiot[0];
}

export async function revalidateInsightPaths(parshaSlug: string) {
  revalidatePath("/");
  revalidatePath(`/parshiot/${parshaSlug}`);
  revalidatePath("/parshiot");
}
