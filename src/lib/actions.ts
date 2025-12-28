"use server";

import { revalidatePath } from "next/cache";
import { parshiot } from "./parshiot";
import type { Parsha } from "./types";
import { HDate, Sedra } from 'hebcal';

export async function getParshiot() {
  // In a real app, you might fetch this from a database
  // For now, we'll simulate that by creating Parsha documents if they don't exist.
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

// This function will revalidate paths, but the actual data mutation will happen client-side.
export async function revalidateInsightPaths(parshaSlug: string) {
  revalidatePath("/");
  revalidatePath(`/parshiot/${parshaSlug}`);
}
