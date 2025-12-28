"use server";

import { revalidatePath } from "next/cache";
import { parshiot } from "./parshiot";
import type { Insight, Parsha } from "./types";

// Simulate network delay
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

// In-memory store for insights
let insightsStore: Insight[] = [
    {
        id: "1",
        parshaSlug: "vayechi",
        title: "ברכת יעקב לבניו",
        author: "הרב יונתן זקס",
        content: "פרשת ויחי מסיימת את ספר בראשית ואת סיפור חייהם של האבות. יעקב, על ערש דווי, אוסף את בניו כדי לברך אותם. ברכותיו אינן רק איחולים לעתיד, אלא גם נבואות ותוכחות המעצבות את זהותם של שבטי ישראל. כל ברכה מותאמת לאופיו ולמעשיו של כל בן, ומכאן אנו למדים על חשיבות ההכרה בייחודיותו של כל אדם ועל האחריות הנלווית לכך.",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: "2",
        parshaSlug: "bereshit",
        title: "בריאת העולם והאור הראשון",
        author: "הרב קוק",
        content: "בראשית ברא אלוהים את השמים ואת הארץ. הפסוק הפותח את התורה הוא גם המסד לכל האמונה. מעשה הבריאה מלמד אותנו על כוחו האינסופי של הבורא ועל הסדר המופתי שהטביע בעולם. האור הראשון שנברא לא היה אור פיזי, אלא אור רוחני עליון, 'אור הגנוז', שממנו יכולים צדיקים ליהנות. תפקידנו בעולם הוא לחשוף את אותו אור גנוז במעשינו.",
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    }
];

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
    await delay(300);
    const filteredInsights = insightsStore.filter(i => i.parshaSlug === parshaSlug);
    return filteredInsights.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getLatestInsightForParsha(parshaSlug: string) {
    await delay(300);
    const insights = await getInsightsForParsha(parshaSlug);
    return insights[0] || null;
}

export async function getInsightById(id: string) {
    await delay(200);
    return insightsStore.find(i => i.id === id) || null;
}

export async function getCurrentParsha() {
    await delay(100);
    const vayechi = parshiot.find(p => p.slug === 'vayechi');
    return vayechi || parshiot[11];
}

export async function addInsight(data: Omit<Insight, "id" | "createdAt">) {
  try {
    const newInsight: Insight = {
        ...data,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
    };
    insightsStore.unshift(newInsight); // Add to the beginning of the array
    revalidatePath("/");
    revalidatePath(`/parshiot/${data.parshaSlug}`);
    return { success: true, message: "דבר התורה נוסף בהצלחה!" };
  } catch (e) {
    console.error("Error adding insight: ", e);
    return { success: false, message: "שגיאה בהוספת דבר התורה." };
  }
}

export async function editInsight(id: string, data: Partial<Omit<Insight, "id" | "createdAt" | "parshaSlug">>) {
    try {
        const insightIndex = insightsStore.findIndex(i => i.id === id);
        if (insightIndex === -1) {
            return { success: false, message: "דבר התורה לא נמצא." };
        }
        
        const parshaSlug = insightsStore[insightIndex].parshaSlug;
        insightsStore[insightIndex] = { ...insightsStore[insightIndex], ...data };

        revalidatePath("/");
        if (parshaSlug) {
            revalidatePath(`/parshiot/${parshaSlug}`);
        }
        return { success: true, message: "דבר התורה עודכן בהצלחה!" };
    } catch (e) {
        console.error("Error updating insight: ", e);
        return { success: false, message: "שגיאה בעדכון דבר התורה." };
    }
}

export async function deleteInsight(id: string) {
    try {
        const insightIndex = insightsStore.findIndex(i => i.id === id);
        if (insightIndex === -1) {
            return { success: false, message: "דבר התורה לא נמצא." };
        }

        const parshaSlug = insightsStore[insightIndex].parshaSlug;
        insightsStore.splice(insightIndex, 1);

        revalidatePath("/");
        if (parshaSlug) {
            revalidatePath(`/parshiot/${parshaSlug}`);
        }
        return { success: true, message: "דבר התורה נמחק בהצלחה!" };
    } catch(e) {
        console.error("Error deleting insight: ", e);
        return { success: false, message: "שגיאה במחיקת דבר התורה." };
    }
}
