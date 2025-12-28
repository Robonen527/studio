
"use client";

import { useState, useEffect } from 'react';
import { getCurrentParsha as getParshaByDate, getParshaBySlug } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { AddInsightButton } from "@/components/add-insight-button";
import { useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, limit, doc } from 'firebase/firestore';
import type { Insight, Parsha } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { SetCurrentParsha } from '@/components/SetCurrentParsha';

export default function Home() {
  const [currentParsha, setCurrentParsha] = useState<Parsha | null>(null);
  const firestore = useFirestore();
  
  // 1. Fetch the manually set parsha from Firestore
  const settingsDocRef = useMemoFirebase(() => doc(firestore, 'settings/currentParsha'), [firestore]);
  const { data: manualParshaSetting, isLoading: isLoadingManualParsha } = useDoc<{ slug: string }>(settingsDocRef);

  // 2. Fetch the date-based parsha as a fallback
  const [dateBasedParsha, setDateBasedParsha] = useState<Parsha | null>(null);
  useEffect(() => {
    async function fetchParshaByDate() {
      const parsha = await getParshaByDate();
      setDateBasedParsha(parsha);
    }
    fetchParshaByDate();
  }, []);

  // 3. Determine the definitive current parsha
  useEffect(() => {
    async function determineParsha() {
      if (isLoadingManualParsha) return; // Wait until we know if there's a manual setting

      if (manualParshaSetting?.slug) {
        const parsha = await getParshaBySlug(manualParshaSetting.slug);
        setCurrentParsha(parsha);
      } else {
        setCurrentParsha(dateBasedParsha);
      }
    }
    determineParsha();
  }, [manualParshaSetting, dateBasedParsha, isLoadingManualParsha]);


  const insightsQuery = useMemoFirebase(() => 
    currentParsha ? query(
      collection(firestore, `parshiot/${currentParsha.slug}/torahInsights`),
      orderBy("createdAt", "desc"),
      limit(1)
    ) : null,
    [firestore, currentParsha]
  );

  const { data: insights, isLoading: isLoadingInsights } = useCollection<Insight>(insightsQuery);
  const latestInsight = insights?.[0];

  const isLoading = !currentParsha;

  if (isLoading) {
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
            {isLoadingInsights ? <Skeleton className="h-5 w-48" /> : (
              latestInsight 
                ? `מאת ${latestInsight.author} | ${new Date(latestInsight.createdAt).toLocaleDateString('he-IL')}` 
                : `פרשת ${currentParsha.name}`
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingInsights ? (
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
