
"use client";
import { useState, useEffect } from 'react';
import { getParshaBySlug } from "@/lib/actions";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { AddInsightButton } from "@/components/add-insight-button";
import { EditInsightButton } from "@/components/edit-insight-button";
import { DeleteInsightButton } from "@/components/delete-insight-button";
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Insight, Parsha } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

type ParshaDetailPageProps = {
  params: {
    slug: string;
  };
};

export default function ParshaDetailPage({ params }: ParshaDetailPageProps) {
  const [parsha, setParsha] = useState<Parsha | null>(null);
  const [isLoadingParsha, setIsLoadingParsha] = useState(true);
  const firestore = useFirestore();

  useEffect(() => {
    const slug = params.slug;
    if (!slug) return;
    
    async function fetchParsha() {
      setIsLoadingParsha(true);
      try {
        const p = await getParshaBySlug(slug);
        if (!p) {
          notFound();
        } else {
          setParsha(p);
          document.title = `פרשת ${p.name} | מאיר בפרשה`;
        }
      } catch (error) {
        console.error("Failed to fetch parsha", error);
        notFound();
      } finally {
        setIsLoadingParsha(false);
      }
    }
    
    fetchParsha();
  }, [params]);

  const insightsQuery = useMemoFirebase(() => 
    parsha ? query(
      collection(firestore, `parshiot/${parsha.id}/torahInsights`),
      orderBy("createdAt", "desc")
    ) : null,
  [firestore, parsha]);

  const { data: insights, isLoading: isLoadingInsights } = useCollection<Insight>(insightsQuery);
  
  if (isLoadingParsha || !parsha) {
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
    </div>
  );
}

