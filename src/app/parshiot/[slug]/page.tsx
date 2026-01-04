
"use client";
import { useState, useEffect } from 'react';
import { getParshaBySlug, getParshiot } from "@/lib/actions";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AddInsightButton } from "@/components/add-insight-button";
import { EditInsightButton } from "@/components/edit-insight-button";
import { DeleteInsightButton } from "@/components/delete-insight-button";
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Insight, Parsha } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, ArrowRight } from 'lucide-react';

type ParshaDetailPageProps = {
  params: {
    slug: string;
  };
};

export default function ParshaDetailPage({ params }: ParshaDetailPageProps) {
  const { slug } = params;
  const [parsha, setParsha] = useState<Parsha | null>(null);
  const firestore = useFirestore();
  const [parshiot, setParshiot] = useState<Parsha[]>([]);
  const [parshaIndex, setParshaIndex] = useState(-1);

  useEffect(() => {
    async function loadParshiot() {
        const p = await getParshiot();
        setParshiot(p);
    }
    loadParshiot();
  }, []);

  useEffect(() => {
    if (!slug) return;
    async function fetchParsha() {
      const p = await getParshaBySlug(slug);
      if (!p) {
        notFound();
      }
      setParsha(p);
      if(p) {
        document.title = `פרשת ${p.name} | מאיר בפרשה`;
        if (parshiot.length > 0) {
            const currentIndex = parshiot.findIndex(parsha => parsha.id === p.id);
            setParshaIndex(currentIndex);
        }
      }
    }
    fetchParsha();
  }, [slug, parshiot]);

  const insightsQuery = useMemoFirebase(() => 
    parsha ? query(
      collection(firestore, `parshiot/${parsha.id}/torahInsights`),
      orderBy("createdAt", "desc")
    ) : null,
  [firestore, parsha]);

  const { data: insights, isLoading } = useCollection<Insight>(insightsQuery);

  const prevParsha = parshaIndex > 0 ? parshiot[parshaIndex - 1] : null;
  const nextParsha = parshaIndex !== -1 && parshaIndex < parshiot.length - 1 ? parshiot[parshaIndex + 1] : null;

  if (!parsha) {
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

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">

      <div className="flex justify-between items-center mb-4">
        {prevParsha ? (
           <Button asChild variant="outline">
            <Link href={`/parshiot/${prevParsha.id}`}>
              <ArrowRight className="ml-2 h-4 w-4" />
               <span className="hidden md:inline">לפרשה הקודמת: {prevParsha.name}</span>
               <span className="md:hidden">הקודם</span>
            </Link>
          </Button>
        ) : <div />}
        {nextParsha ? (
          <Button asChild variant="outline">
            <Link href={`/parshiot/${nextParsha.id}`}>
              <span className="hidden md:inline">לפרשה הבאה: {nextParsha.name}</span>
              <span className="md:hidden">הבא</span>
              <ArrowLeft className="mr-2 h-4 w-4" />
            </Link>
          </Button>
        ) : <div />}
      </div>


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

      {isLoading ? (
        <div className="space-y-6">
          <Card className="shadow-md"><CardHeader><Skeleton className="h-8 w-1/2" /><Skeleton className="h-4 w-1/3 mt-2" /></CardHeader><CardContent><Skeleton className="h-20 w-full" /></CardContent></Card>
          <Card className="shadow-md"><CardHeader><Skeleton className="h-8 w-1/2" /><Skeleton className="h-4 w-1/3 mt-2" /></CardHeader><CardContent><Skeleton className="h-20 w-full" /></CardContent></Card>
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
    </div>
  );
}
