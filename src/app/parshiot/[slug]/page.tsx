
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { AddInsightButton } from "@/components/add-insight-button";
import { EditInsightButton } from "@/components/edit-insight-button";
import { DeleteInsightButton } from "@/components/delete-insight-button";
import { useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import type { Insight, Parsha } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { getParshiot } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type ParshaDetailPageProps = {
  params: {
    slug: string;
  };
};

function ParshaNavigation({ allParshiot, currentSlug }: { allParshiot: Parsha[], currentSlug: string }) {
  const currentIndex = useMemo(() => 
    allParshiot.findIndex(p => p.id === currentSlug),
    [allParshiot, currentSlug]
  );

  if (currentIndex === -1) return null;

  const prevParsha = currentIndex > 0 ? allParshiot[currentIndex - 1] : null;
  const nextParsha = currentIndex < allParshiot.length - 1 ? allParshiot[currentIndex + 1] : null;

  return (
    <>
      {prevParsha && (
        <Button asChild className="fixed bottom-6 right-4 z-40 shadow-lg animate-in fade-in slide-in-from-right">
          <Link href={`/parshiot/${prevParsha.id}`}>
             <span className="hidden md:inline">לפרשה הקודמת: {prevParsha.name}</span>
             <ArrowRight className="md:mr-2" />
          </Link>
        </Button>
      )}
      {nextParsha && (
        <Button asChild className="fixed bottom-6 left-4 z-40 shadow-lg animate-in fade-in slide-in-from-left">
          <Link href={`/parshiot/${nextParsha.id}`}>
            <ArrowLeft className="md:ml-2" />
            <span className="hidden md:inline">לפרשה הבאה: {nextParsha.name}</span>
          </Link>
        </Button>
      )}
    </>
  );
}


export default function ParshaDetailPage({ params }: ParshaDetailPageProps) {
  const firestore = useFirestore();
  const [allParshiot, setAllParshiot] = useState<Parsha[]>([]);

  // Fetch all parshiot for navigation
  useEffect(() => {
    async function loadParshiot() {
      const p = await getParshiot();
      setAllParshiot(p);
    }
    loadParshiot();
  }, []);

  // Use useDoc to fetch the parsha data in real-time
  const parshaDocRef = useMemoFirebase(() => {
    if (!firestore || !params.slug) return null;
    return doc(firestore, 'parshiot', params.slug);
  }, [firestore, params.slug]);

  const { data: parsha, isLoading: isLoadingParsha, error: parshaError } = useDoc<Parsha>(parshaDocRef);

  useEffect(() => {
    if (parsha) {
        document.title = `פרשת ${parsha.name} | מאיר בפרשה`;
    }
  }, [parsha]);


  const insightsQuery = useMemoFirebase(() => 
    parsha ? query(
      collection(firestore, `parshiot/${parsha.id}/torahInsights`),
      orderBy("createdAt", "desc")
    ) : null,
  [firestore, parsha]);

  const { data: insights, isLoading: isLoadingInsights } = useCollection<Insight>(insightsQuery);
  
  const isLoading = isLoadingParsha || allParshiot.length === 0;

  if (isLoading) {
    return (
       <div className="container mx-auto px-4 py-8 md:py-12">
        <Skeleton className="h-12 w-1/3 mb-8" />
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    )
  }

  if (!parsha) {
    return (
      <div className="container mx-auto px-4 py-8 md:py-12 text-center">
        <h1 className="font-headline text-3xl md:text-5xl text-destructive">הפרשה לא נמצאה</h1>
        <p className="mt-4 text-lg text-muted-foreground">יתכן שהקישור שגוי או שהפרשה נמחקה.</p>
        <Link href="/parshiot" className="mt-6 inline-block bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 transition-colors">
            חזרה לכל הפרשות
          </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 pb-24">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div className="mb-4 md:mb-0 text-center md:text-right w-full">
          <h1 className="font-headline text-3xl md:text-5xl text-primary">פרשת {parsha.name}</h1>
          <Link href="/parshiot" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            &larr; חזרה לכל הפרשות
          </Link>
        </div>
        <div className="mt-4 md:mt-0 flex-shrink-0">
          <AddInsightButton parsha={parsha} />
        </div>
      </div>

      {isLoadingInsights ? (
        <div className="space-y-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : insights && insights.length > 0 ? (
        <div className="space-y-6">
          {insights.map((insight) => (
            <Card key={insight.id} className="shadow-md transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="font-headline text-xl md:text-2xl text-accent-foreground">{insight.title}</CardTitle>
                        <CardDescription>מאת {insight.author} | {new Date(insight.createdAt).toLocaleDateString('he-IL')}</CardDescription>
                    </div>
                    <div className="flex gap-1 md:gap-2">
                        <EditInsightButton insight={insight} />
                        <DeleteInsightButton parshaSlug={parsha.id} insightId={insight.id} />
                    </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-base/relaxed whitespace-pre-wrap">{insight.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <h2 className="text-xl font-semibold text-muted-foreground">עדיין אין דברי תורה לפרשה זו</h2>
          <p className="mt-2 text-muted-foreground">היה הראשון להוסיף דבר תורה!</p>
          <div className="mt-6">
            <AddInsightButton parsha={parsha} isPrimary={true} />
          </div>
        </div>
      )}

      <ParshaNavigation allParshiot={allParshiot} currentSlug={params.slug} />
    </div>
  );
}

    