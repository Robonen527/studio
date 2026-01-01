
"use client";

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, getDocs } from 'firebase/firestore';
import { getParshiot } from '@/lib/actions';
import type { Insight, Parsha } from '@/lib/types';


export function DownloadInsightsButton() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  
  const isAdmin = !!user;

  const handleDownload = () => {
    if (!firestore) {
        toast({
            variant: "destructive",
            title: "שגיאה",
            description: "שירות מסד הנתונים אינו זמין. נסה לרענן את הדף.",
        });
        return;
    }
    startTransition(async () => {
      try {
        let fullText = `כל דברי התורה מאתר "מאיר בפרשה"\n`;
        fullText += `תאריך הפקה: ${new Date().toLocaleDateString('he-IL')}\n`;
        fullText += '============================================\n\n';

        const allParshiot = await getParshiot();

        for (const parsha of allParshiot) {
          const insightsRef = collection(firestore, `parshiot/${parsha.slug}/torahInsights`);
          const insightsSnapshot = await getDocs(insightsRef);

          if (!insightsSnapshot.empty) {
            fullText += `פרשת ${parsha.name}\n`;
            fullText += '--------------------------\n\n';

            insightsSnapshot.forEach(doc => {
              const insight = doc.data() as Insight;
              fullText += `כותרת: ${insight.title}\n\n`;
              fullText += `${insight.content}\n\n`;
              fullText += '--------------------------\n\n';
            });
          }
        }
        
        const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const formattedDate = new Date().toISOString().split('T')[0];
        link.download = `divrei-torah-${formattedDate}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast({
            title: "ההורדה החלה",
            description: "הקובץ עם כל דברי התורה נוצר בהצלחה.",
        });

      } catch (error) {
        console.error("Failed to download insights:", error);
        toast({
            variant: "destructive",
            title: "שגיאה",
            description: "אירעה שגיאה בעת יצירת קובץ ההורדה.",
        });
      }
    });
  };

  if (isUserLoading || !isAdmin) {
    return null;
  }

  return (
    <div className="flex justify-center">
        <Button onClick={handleDownload} variant="secondary" disabled={isPending}>
        {isPending ? (
            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
        ) : (
            <Download className="ml-2 h-4 w-4" />
        )}
        הורד את כל דברי התורה
        </Button>
    </div>
  );
}
