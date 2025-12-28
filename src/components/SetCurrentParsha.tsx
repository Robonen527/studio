
"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useUser, useFirestore, setDocumentNonBlocking } from "@/firebase";
import { parshiot } from "@/lib/parshiot";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { doc } from "firebase/firestore";
import { revalidateInsightPaths } from "@/lib/actions";

type SetCurrentParshaProps = {
  currentParshaSlug: string;
}

export function SetCurrentParsha({ currentParshaSlug }: SetCurrentParshaProps) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState(currentParshaSlug);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  
  const isAdmin = !!user;

  if (isUserLoading || !isAdmin) {
    return null;
  }

  const handleSave = () => {
    if (!firestore) return;

    startTransition(() => {
      try {
        const settingsRef = doc(firestore, 'settings', 'currentParsha');
        setDocumentNonBlocking(settingsRef, { slug: selectedSlug }, { merge: false });
        
        // Optimistically revalidate and close
        revalidateInsightPaths(selectedSlug).then(() => {
            toast({
              title: "הצלחה",
              description: "פרשת השבוע עודכנה. השינוי יתעדכן בדף בעוד מספר רגעים.",
            });
            setIsOpen(false);
            // Optional: force a reload if revalidation is not immediate enough
            window.location.reload();
        });

      } catch (e) {
         toast({
          variant: "destructive",
          title: "שגיאה",
          description: "אירעה שגיאה בעדכון פרשת השבוע.",
        });
      }
    });
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="ghost" size="icon">
        <Edit className="h-4 w-4" />
        <span className="sr-only">שנה את פרשת השבוע</span>
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl">שינוי פרשת השבוע</DialogTitle>
            <DialogDescription>
              בחר את פרשת השבוע שתוצג כפרשה הנוכחית בדף הבית.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select dir="rtl" value={selectedSlug} onValueChange={setSelectedSlug}>
                <SelectTrigger>
                    <SelectValue placeholder="בחר פרשה..." />
                </SelectTrigger>
                <SelectContent>
                    {parshiot.map(parsha => (
                        <SelectItem key={parsha.slug} value={parsha.slug}>
                            {parsha.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>ביטול</Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              שמור שינויים
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
