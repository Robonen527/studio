
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Chumash, Parsha } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function ParshiotPage() {
  const firestore = useFirestore();

  const chumashimQuery = useMemoFirebase(() => query(collection(firestore, 'chumashim'), orderBy('order')), [firestore]);
  const { data: chumashim, isLoading: isLoadingChumashim } = useCollection<Chumash>(chumashimQuery);

  const parshiotQuery = useMemoFirebase(() => collection(firestore, 'parshiot'), [firestore]);
  const { data: parshiot, isLoading: isLoadingParshiot } = useCollection<Parsha>(parshiotQuery);

  const parshiotByChumashId = useMemo(() => {
    if (!parshiot) return {};
    return parshiot.reduce((acc, parsha) => {
        if (!acc[parsha.chumashId]) {
            acc[parsha.chumashId] = [];
        }
        acc[parsha.chumashId].push(parsha);
        return acc;
    }, {} as Record<string, Parsha[]>);
  }, [parshiot]);

  const isLoading = isLoadingChumashim || isLoadingParshiot;

  useEffect(() => {
    document.title = 'כל הפרשות | מאיר בפרשה';
  }, []);

  if (isLoading) {
      return (
          <div className="container mx-auto px-4 py-8 md:py-12">
            <div className="text-center mb-12">
              <Skeleton className="h-12 w-1/2 mx-auto" />
              <Skeleton className="h-6 w-3/4 mx-auto mt-2" />
            </div>
            <div className="space-y-12">
                {[...Array(2)].map(i => (
                    <div key={i}>
                        <Skeleton className="h-10 w-1/4 mb-6" />
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                            {[...Array(4)].map(j => <Skeleton key={j} className="h-20" />)}
                        </div>
                    </div>
                ))}
            </div>
          </div>
      )
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="text-center mb-12">
        <h1 className="font-headline text-4xl md:text-5xl text-primary">כל הפרשות</h1>
        <p className="mt-2 text-md md:text-lg text-muted-foreground">בחר פרשה כדי לקרוא את דברי התורה עליה</p>
      </div>

      <div className="space-y-12">
        {chumashim?.map((chumash) => (
          <div key={chumash.id}>
            <h2 className="font-headline text-3xl md:text-4xl text-primary/80 mb-6 pb-2 border-b-2 border-accent/50">{chumash.name}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {(parshiotByChumashId[chumash.id] || []).map((parsha) => (
                <Link href={`/parshiot/${parsha.id}`} key={parsha.id} className="group">
                  <Card className="h-full transition-all duration-300 ease-in-out group-hover:shadow-lg group-hover:border-accent group-hover:-translate-y-1">
                    <CardHeader className="flex-row items-center gap-3 space-y-0 p-4">
                      <div className="bg-primary/10 p-2 rounded-lg">
                          <Lightbulb className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="font-headline text-lg md:text-xl text-card-foreground group-hover:text-primary">
                        {parsha.name}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
