import { getParshiotWithChumash } from '@/lib/actions';
import Link from 'next/link';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';

export const metadata = {
  title: 'כל הפרשות | מאיר בפרשה',
};

export default async function ParshiotPage() {
  const chumashim = await getParshiotWithChumash();

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="text-center mb-12">
        <h1 className="font-headline text-4xl md:text-5xl text-primary">כל הפרשות</h1>
        <p className="mt-2 text-md md:text-lg text-muted-foreground">בחר פרשה כדי לקרוא את דברי התורה עליה</p>
      </div>

      <div className="space-y-12">
        {chumashim.map((chumash) => (
          <div key={chumash.name}>
            <h2 className="font-headline text-3xl md:text-4xl text-primary/80 mb-6 pb-2 border-b-2 border-accent/50">{chumash.name}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {chumash.parshiot.map((parsha) => (
                <Link href={`/parshiot/${parsha.slug}`} key={parsha.slug} className="group">
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
