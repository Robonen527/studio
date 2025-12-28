import { getParshaBySlug, getInsightsForParsha, deleteInsight } from "@/lib/actions";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AddInsightButton } from "@/components/add-insight-button";
import { EditInsightButton } from "@/components/edit-insight-button";
import { DeleteInsightButton } from "@/components/delete-insight-button";

type ParshaDetailPageProps = {
  params: {
    slug: string;
  };
};

export async function generateMetadata({ params }: ParshaDetailPageProps) {
    const parsha = await getParshaBySlug(params.slug);
    if (!parsha) {
        return { title: "הפרשה לא נמצאה" };
    }
    return { title: `פרשת ${parsha.name} | פניני תורה` };
}

export default async function ParshaDetailPage({ params }: ParshaDetailPageProps) {
  const parsha = await getParshaBySlug(params.slug);
  if (!parsha) {
    notFound();
  }

  const insights = await getInsightsForParsha(params.slug);

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div className="mb-4 md:mb-0">
          <h1 className="font-headline text-4xl md:text-5xl text-primary">פרשת {parsha.name}</h1>
          <Link href="/parshiot" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            &larr; חזרה לכל הפרשות
          </Link>
        </div>
        <AddInsightButton parshaSlug={parsha.slug} />
      </div>

      {insights.length > 0 ? (
        <div className="space-y-6">
          {insights.map((insight) => (
            <Card key={insight.id} className="shadow-md transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="font-headline text-2xl text-accent-foreground">{insight.title}</CardTitle>
                        <CardDescription>מאת {insight.author} | {new Date(insight.createdAt).toLocaleDateString('he-IL')}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <EditInsightButton insight={insight} />
                        <DeleteInsightButton insightId={insight.id} />
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
            <AddInsightButton parshaSlug={parsha.slug} isPrimary={true} />
          </div>
        </div>
      )}
    </div>
  );
}
