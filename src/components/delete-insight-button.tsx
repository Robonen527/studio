
"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, deleteDocumentNonBlocking } from "@/firebase";
import { doc } from "firebase/firestore";
import { revalidateInsightPaths } from "@/lib/actions";

type DeleteInsightButtonProps = {
  parshaSlug: string;
  insightId: string;
};

export function DeleteInsightButton({ parshaSlug, insightId }: DeleteInsightButtonProps) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        const docRef = doc(firestore, `parshiot/${parshaSlug}/torahInsights`, insightId);
        deleteDocumentNonBlocking(docRef);
        
        await revalidateInsightPaths(parshaSlug);

        toast({
          title: "הצלחה",
          description: "דבר התורה נמחק בהצלחה.",
        });
      } catch (error) {
         toast({
          variant: "destructive",
          title: "שגיאה",
          description: "אירעה שגיאה במחיקת דבר התורה.",
        });
      }
    });
  };

  const isAdmin = !!user;
  if (isUserLoading || !isAdmin) {
    return null;
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">מחק דבר תורה</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
          <AlertDialogDescription>
            פעולה זו תמחק את דבר התורה לצמיתות. לא ניתן לבטל פעולה זו.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>ביטול</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isPending} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'מחק'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
