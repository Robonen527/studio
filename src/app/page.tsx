import { getLatestInsightForParsha, getCurrentParsha } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { AddInsightButton } from "@/components/add-insight-button";

export default async function Home() {
  const currentParsha = await getCurrentParsha();
  const latestInsight = await getLatestInsightForParsha(currentParsha.slug);

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="flex flex-col items-center text-center mb-12">
        <h1 className="font-headline text-4xl md:text-6xl text-primary tracking-tight">פרשה מאיר-ה</h1>
        <p className="mt-2 text-lg text-muted-foreground">מחשבות והארות על פרשת השבוע</p>
      </div>

      <Card className="w-full max-w-4xl mx-auto shadow-lg border-2 border-accent/50">
        <CardHeader>
          <CardTitle className="font-headline text-3xl md:text-4xl text-primary flex items-center justify-between">
            <span>פרשת השבוע: {currentParsha.name}</span>
            <AddInsightButton parshaSlug={currentParsha.slug} />
          </CardTitle>
          <CardDescription>
            {latestInsight ? `מאת ${latestInsight.author} | ${new Date(latestInsight.createdAt).toLocaleDateString('he-IL')}` : "עדיין לא נוספו דברי תורה לפרשה זו"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {latestInsight ? (
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
              <p className="text-muted-foreground">שתף את דבר התורה הראשון לפרשה זו!</p>
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
