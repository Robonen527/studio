
"use client";

import { useState, useEffect } from 'react';
import { getCurrentParsha } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { AddInsightButton } from "@/components/add-insight-button";
import { useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, limit, doc } from 'firebase/firestore';
import type { Insight, Parsha } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { SetCurrentParsha } from '@/components/SetCurrentParsha';

// --- Debug Component ---
function CurrentParshaDebug() {
  const firestore = useFirestore();
  const settingsDocRef = useMemoFirebase(() => doc(firestore, 'settings/currentParsha'), [firestore]);
  const { data: setting, isLoading } = useDoc<{ slug: string }>(settingsDocRef);

  return (
    <div className="my-4 p-4 border-2 border-dashed border-red-500 bg-red-50 text-center">
      <h3 className="font-bold text-red-800">בדיקת מצב DB (זמני)</h3>
      {isLoading && <p>טוען הגדרה מה-DB...</p>}
      {setting && <p>הערך השמור ב-DB הוא: <strong className="font-mono">{setting.slug}</strong></p>}
      {!isLoading && !setting && <p>לא נמצאה הגדרה ידנית ב-DB.</p>}
    </div>
  );
}
// --- End Debug Component ---


export default function Home() {
  const [currentParsha, setCurrentParsha] = useState<Parsha | null>(null);
  const firestore = useFirestore();

  useEffect(() => {
    async function fetchCurrentParsha() {
      const parsha = await getCurrentParsha();
      setCurrentParsha(parsha);
    }
    fetchCurrentParsha();
  }, []);

  const insightsQuery = useMemoFirebase(() => 
    currentParsha ? query(
      collection(firestore, `parshiot/${currentParsha.slug}/torahInsights`),
      orderBy("createdAt", "desc"),
      limit(1)
    ) : null,
    [firestore, currentParsha]
  );

  const { data: insights, isLoading } = useCollection<Insight>(insightsQuery);
  const latestInsight = insights?.[0];

  if (!currentParsha) {
    return (
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col items-center text-center mb-12">
          <Skeleton className="h-12 w-64 mb-2" />
          <Skeleton className="h-6 w-80" />
        </div>
        <Card className="w-full max-w-4xl mx-auto shadow-lg border-2 border-accent/50">
          <CardHeader><Skeleton className="h-10 w-full" /></CardHeader>
          <CardContent><Skeleton className="h-40 w-full" /></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="flex flex-col items-center text-center mb-12">
        <h1 className="font-headline text-4xl md:text-6xl text-primary tracking-tight">מאיר בפרשה</h1>
        <p className="mt-2 text-lg text-muted-foreground">מחשבות והארות על פרשת השבוע</p>
      </div>

      <CurrentParshaDebug />

      <Card className="w-full max-w-4xl mx-auto shadow-lg border-2 border-accent/50">
        <CardHeader>
          <CardTitle className="font-headline text-3xl md:text-4xl text-primary flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>פרשת השבוע: {currentParsha.name}</span>
              <SetCurrentParsha currentParshaSlug={currentParsha.slug} />
            </div>
            <AddInsightButton parshaSlug={currentParsha.slug} />
          </CardTitle>
          <CardDescription>
            {isLoading ? <Skeleton className="h-5 w-48" /> : (
              latestInsight 
                ? `מאת ${latestInsight.author} | ${new Date(latestInsight.createdAt).toLocaleDateString('he-IL')}` 
                : `פרשת ${currentParsha.name}`
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : latestInsight ? (
            <div className="space-y-4">
              <h3 className="font-headline text-2xl text-accent-foreground">{latestInsight.title}</h3>
              <p className="text-lg/relaxed whitespace-pre-wrap">{latestInsight.content}</p>
              <div className="flex justify-center pt-4">
                <Button asChild variant="outline">
                  <Link href={`/parshiot/${currentParsha.slug}`}>לכל דברי התורה על פרשת {currentParsha.name}</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">עדיין לא נוספו דברי תורה לפרשה זו. שתף את דבר התורה הראשון!</p>
              <div className="mt-4">
                <AddInsightButton parshaSlug={currentParsha.slug} isPrimary={true}/>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-12 text-center">
        <Button asChild size="lg">
          <Link href="/parshiot">לכל הפרשות</Link>
        </Button>
      </div>
    </div>
  );
}
