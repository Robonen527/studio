"use server";

import { revalidatePath } from "next/cache";
import { insights } from "./data";
import { parshiot } from "./parshiot";
import type { Insight, Parsha } from "./types";

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
  await delay(500);
  return insights
    .filter((insight) => insight.parshaSlug === parshaSlug)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getLatestInsightForParsha(parshaSlug: string) {
  await delay(200);
  const parshaInsights = insights
    .filter((insight) => insight.parshaSlug === parshaSlug)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return parshaInsights[0] || null;
}

export async function getInsightById(id: number) {
  await delay(200);
  return insights.find((insight) => insight.id === id) || null;
}

export async function getCurrentParsha() {
    // This is a simplified mock. A real implementation would use a library like hebcal
    // to determine the current parsha based on the Hebrew date.
    await delay(100);
    return parshiot[0]; // Returning 'Bereshit' as the current parsha
}


export async function addInsight(data: Omit<Insight, "id" | "createdAt">) {
  await delay(1000);
  const newId = insights.length > 0 ? Math.max(...insights.map(i => i.id)) + 1 : 1;
  const newInsight: Insight = {
    ...data,
    id: newId,
    createdAt: new Date().toISOString(),
  };
  insights.unshift(newInsight);
  revalidatePath("/");
  revalidatePath(`/parshiot/${data.parshaSlug}`);
  return { success: true, message: "דבר התורה נוסף בהצלחה!" };
}

export async function editInsight(id: number, data: Partial<Omit<Insight, "id" | "createdAt" | "parshaSlug">>) {
    await delay(1000);
    const index = insights.findIndex(i => i.id === id);
    if (index === -1) {
        return { success: false, message: "דבר התורה לא נמצא." };
    }
    const originalInsight = insights[index];
    insights[index] = { ...originalInsight, ...data };
    
    revalidatePath("/");
    revalidatePath(`/parshiot/${originalInsight.parshaSlug}`);
    return { success: true, message: "דבר התורה עודכן בהצלחה!" };
}

export async function deleteInsight(id: number) {
    await delay(1000);
    const index = insights.findIndex(i => i.id === id);
    if (index === -1) {
        return { success: false, message: "דבר התורה לא נמצא." };
    }
    const parshaSlug = insights[index].parshaSlug;
    insights.splice(index, 1);

    revalidatePath("/");
    revalidatePath(`/parshiot/${parshaSlug}`);
    return { success: true, message: "דבר התורה נמחק בהצלחה!" };
}
